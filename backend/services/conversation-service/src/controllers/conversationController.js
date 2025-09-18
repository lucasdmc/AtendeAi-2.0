const Conversation = require('../models/conversation');
const Message = require('../models/message');
const LLMOrchestrator = require('../services/llmOrchestrator');
const ConversationalMemory = require('../services/conversationalMemory');
const logger = require('../utils/logger');
const config = require('../config');

class ConversationController {
  constructor() {
    this.llmOrchestrator = new LLMOrchestrator();
    this.memory = new ConversationalMemory();
  }

  // =====================================================
  // PROCESSAMENTO DE MENSAGENS
  // =====================================================

  async processWhatsAppMessage(req, res) {
    try {
      const { 
        clinic_id, 
        patient_phone, 
        patient_name, 
        message_content, 
        message_type = 'text',
        metadata = {}
      } = req.body;

      if (!clinic_id || !patient_phone || !message_content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone, message_content'
        });
      }

      logger.info('Processing WhatsApp message', { 
        clinic_id, 
        patient_phone, 
        message_length: message_content.length 
      });

      let conversation = await Conversation.findByPhone(clinic_id, patient_phone);
      
      if (!conversation) {
        conversation = await Conversation.create({
          clinic_id,
          patient_phone,
          patient_name: patient_name || 'Usuário',
          status: 'active'
        });
        
        logger.info('New conversation created', { 
          conversation_id: conversation.id, 
          clinic_id, 
          patient_phone 
        });
      }

      const message = await Message.create({
        conversation_id: conversation.id,
        clinic_id,
        patient_phone,
        content: message_content,
        type: message_type,
        direction: 'inbound',
        metadata
      });

      await this.memory.addMessageToContext(clinic_id, patient_phone, message);
      await Conversation.updateLastMessage(conversation.id, message_content);

      const clinicContext = await this.getClinicContext(clinic_id);
      const processingResult = await this.llmOrchestrator.processMessage(
        message_content, 
        clinic_id, 
        patient_phone, 
        clinicContext
      );

      let response;
      if (processingResult.type === 'routed') {
        response = await this.handleServiceRouting(processingResult, conversation, message);
      } else if (processingResult.type === 'response') {
        response = await this.handleAIResponse(processingResult, conversation, message);
      } else {
        response = await this.handleError(processingResult, conversation, message);
      }

      await this.memory.updateUserProfile(clinic_id, patient_phone, {
        last_interaction: new Date().toISOString(),
        message_count: (await this.memory.getUserProfile(clinic_id, patient_phone))?.message_count + 1 || 1
      });

      res.json({
        success: true,
        data: {
          conversation_id: conversation.id,
          message_id: message.id,
          response,
          processing_result: processingResult
        }
      });

    } catch (error) {
      logger.error('Error processing WhatsApp message', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error processing message',
        details: error.message
      });
    }
  }

  // =====================================================
  // TRANSIÇÃO CHATBOT/HUMANO
  // =====================================================

  async transitionToHuman(req, res) {
    try {
      const { conversation_id } = req.params;
      const { attendant_id, reason } = req.body;

      if (!conversation_id || !attendant_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: conversation_id, attendant_id'
        });
      }

      const conversation = await Conversation.findById(conversation_id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      // Verificar se a conversa já está com atendente humano
      if (conversation.status === 'human_attended') {
        return res.status(400).json({
          success: false,
          error: 'Conversation already being handled by human'
        });
      }

      // Atualizar status da conversa
      await Conversation.updateStatus(conversation_id, 'human_attended', {
        attendant_id,
        transition_reason: reason,
        transition_timestamp: new Date().toISOString()
      });

      // Registrar transição
      await this.recordTransition(conversation_id, 'bot_to_human', {
        attendant_id,
        reason,
        timestamp: new Date().toISOString()
      });

      // Enviar mensagem de transição para o paciente
      const transitionMessage = await Message.create({
        conversation_id,
        clinic_id: conversation.clinic_id,
        patient_phone: conversation.patient_phone,
        content: 'Sua conversa foi transferida para um atendente humano. Em breve você será atendido.',
        type: 'text',
        direction: 'outbound',
        metadata: { type: 'transition_notification' }
      });

      logger.info('Conversation transitioned to human', { 
        conversation_id, 
        attendant_id, 
        reason 
      });

      res.json({
        success: true,
        data: {
          conversation_id,
          status: 'human_attended',
          attendant_id,
          transition_message: transitionMessage
        },
        message: 'Conversation successfully transitioned to human attendant'
      });

    } catch (error) {
      logger.error('Error transitioning conversation to human', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error transitioning conversation',
        details: error.message
      });
    }
  }

  async transitionToBot(req, res) {
    try {
      const { conversation_id } = req.params;
      const { reason } = req.body;

      if (!conversation_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: conversation_id'
        });
      }

      const conversation = await Conversation.findById(conversation_id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      // Verificar se a conversa está com atendente humano
      if (conversation.status !== 'human_attended') {
        return res.status(400).json({
          success: false,
          error: 'Conversation is not currently being handled by human'
        });
      }

      // Atualizar status da conversa
      await Conversation.updateStatus(conversation_id, 'bot_handling', {
        transition_reason: reason,
        transition_timestamp: new Date().toISOString()
      });

      // Registrar transição
      await this.recordTransition(conversation_id, 'human_to_bot', {
        reason,
        timestamp: new Date().toISOString()
      });

      // Enviar mensagem de transição para o paciente
      const transitionMessage = await Message.create({
        conversation_id,
        clinic_id: conversation.clinic_id,
        patient_phone: conversation.patient_phone,
        content: 'Sua conversa foi retornada para o atendimento automatizado. Como posso ajudá-lo?',
        type: 'text',
        direction: 'outbound',
        metadata: { type: 'transition_notification' }
      });

      logger.info('Conversation transitioned back to bot', { 
        conversation_id, 
        reason 
      });

      res.json({
        success: true,
        data: {
          conversation_id,
          status: 'bot_handling',
          transition_message: transitionMessage
        },
        message: 'Conversation successfully transitioned back to bot'
      });

    } catch (error) {
      logger.error('Error transitioning conversation to bot', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error transitioning conversation',
        details: error.message
      });
    }
  }

  async getTransitionHistory(req, res) {
    try {
      const { conversation_id } = req.params;

      if (!conversation_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: conversation_id'
        });
      }

      const conversation = await Conversation.findById(conversation_id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      // Buscar histórico de transições
      const transitions = await Conversation.getTransitionHistory(conversation_id);

      res.json({
        success: true,
        data: {
          conversation_id,
          transitions,
          total_transitions: transitions.length
        }
      });

    } catch (error) {
      logger.error('Error getting transition history', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting transition history',
        details: error.message
      });
    }
  }

  // =====================================================
  // GESTÃO DE CONVERSAS
  // =====================================================

  async getConversationHistory(req, res) {
    try {
      const { clinic_id, patient_phone, limit = 50, offset = 0 } = req.query;

      if (!clinic_id || !patient_phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone'
        });
      }

      const messages = await Message.findByPhone(clinic_id, patient_phone, parseInt(limit), parseInt(offset));
      const total = await Message.countByPhone(clinic_id, patient_phone);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total
          }
        }
      });

    } catch (error) {
      logger.error('Error getting conversation history', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting conversation history',
        details: error.message
      });
    }
  }

  async getConversationsByClinic(req, res) {
    try {
      const { clinic_id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const conversations = await Conversation.findByClinic(clinic_id, parseInt(limit), parseInt(offset));
      const total = await Conversation.countByClinic(clinic_id);

      res.json({
        success: true,
        data: {
          conversations,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total
          }
        }
      });

    } catch (error) {
      logger.error('Error getting conversations by clinic', { error: error.message, params: req.params, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting conversations',
        details: error.message
      });
    }
  }

  async getActiveConversationsByClinic(req, res) {
    try {
      const { clinic_id } = req.params;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const conversations = await Conversation.findActiveByClinic(clinic_id);

      res.json({
        success: true,
        data: {
          conversations,
          total_active: conversations.length
        }
      });

    } catch (error) {
      logger.error('Error getting active conversations by clinic', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting active conversations',
        details: error.message
      });
    }
  }

  async getPendingHumanConversations(req, res) {
    try {
      const { clinic_id } = req.params;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const conversations = await Conversation.findPendingHumanByClinic(clinic_id);

      res.json({
        success: true,
        data: {
          conversations,
          total_pending: conversations.length
        }
      });

    } catch (error) {
      logger.error('Error getting pending human conversations', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting pending conversations',
        details: error.message
      });
    }
  }

  async getConversationById(req, res) {
    try {
      const { conversation_id } = req.params;

      if (!conversation_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: conversation_id'
        });
      }

      const conversation = await Conversation.findById(conversation_id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      // Buscar mensagens da conversa
      const messages = await Message.findByConversation(conversation_id);

      res.json({
        success: true,
        data: {
          conversation,
          messages,
          total_messages: messages.length
        }
      });

    } catch (error) {
      logger.error('Error getting conversation by ID', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting conversation',
        details: error.message
      });
    }
  }

  async closeConversation(req, res) {
    try {
      const { conversation_id } = req.params;
      const { reason } = req.body;

      if (!conversation_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: conversation_id'
        });
      }

      const conversation = await Conversation.findById(conversation_id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      // Atualizar status da conversa
      await Conversation.updateStatus(conversation_id, 'closed', {
        close_reason: reason,
        closed_at: new Date().toISOString()
      });

      logger.info('Conversation closed', { conversation_id, reason });

      res.json({
        success: true,
        data: {
          conversation_id,
          status: 'closed'
        },
        message: 'Conversation successfully closed'
      });

    } catch (error) {
      logger.error('Error closing conversation', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error closing conversation',
        details: error.message
      });
    }
  }

  async assignConversation(req, res) {
    try {
      const { conversation_id } = req.params;
      const { attendant_id } = req.body;

      if (!conversation_id || !attendant_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: conversation_id, attendant_id'
        });
      }

      const conversation = await Conversation.findById(conversation_id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      // Atribuir conversa para atendente
      await Conversation.assignToAttendant(conversation_id, attendant_id);

      logger.info('Conversation assigned to attendant', { conversation_id, attendant_id });

      res.json({
        success: true,
        data: {
          conversation_id,
          attendant_id
        },
        message: 'Conversation successfully assigned to attendant'
      });

    } catch (error) {
      logger.error('Error assigning conversation', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error assigning conversation',
        details: error.message
      });
    }
  }

  async setConversationPriority(req, res) {
    try {
      const { conversation_id } = req.params;
      const { priority } = req.body;

      if (!conversation_id || !priority) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: conversation_id, priority'
        });
      }

      const conversation = await Conversation.findById(conversation_id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      // Definir prioridade da conversa
      await Conversation.setPriority(conversation_id, priority);

      logger.info('Conversation priority set', { conversation_id, priority });

      res.json({
        success: true,
        data: {
          conversation_id,
          priority
        },
        message: 'Conversation priority successfully set'
      });

    } catch (error) {
      logger.error('Error setting conversation priority', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error setting priority',
        details: error.message
      });
    }
  }

  // =====================================================
  // GESTÃO DE MEMÓRIA
  // =====================================================

  async getMemoryStats(req, res) {
    try {
      const { clinic_id, patient_phone } = req.query;

      if (!clinic_id || !patient_phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone'
        });
      }

      const stats = await this.memory.getMemoryStats(clinic_id, patient_phone);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting memory stats', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting memory stats',
        details: error.message
      });
    }
  }

  async clearUserMemory(req, res) {
    try {
      const { clinic_id, patient_phone } = req.body;

      if (!clinic_id || !patient_phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone'
        });
      }

      await this.memory.clearUserMemory(clinic_id, patient_phone);

      logger.info('User memory cleared', { clinic_id, patient_phone });

      res.json({
        success: true,
        message: 'User memory successfully cleared'
      });

    } catch (error) {
      logger.error('Error clearing user memory', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error clearing memory',
        details: error.message
      });
    }
  }

  async getConversationMemory(req, res) {
    try {
      const { conversation_id } = req.params;

      if (!conversation_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: conversation_id'
        });
      }

      const conversation = await Conversation.findById(conversation_id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      const memory = await this.memory.getConversationMemory(conversation_id);

      res.json({
        success: true,
        data: {
          conversation_id,
          memory
        }
      });

    } catch (error) {
      logger.error('Error getting conversation memory', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting conversation memory',
        details: error.message
      });
    }
  }

  // =====================================================
  // ANÁLISE E ESTATÍSTICAS
  // =====================================================

  async getConversationAnalytics(req, res) {
    try {
      const { clinic_id } = req.params;
      const { start_date, end_date } = req.query;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const analytics = await Conversation.getAnalytics(clinic_id, start_date, end_date);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('Error getting conversation analytics', { error: error.message, params: req.params, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting analytics',
        details: error.message
      });
    }
  }

  async getAttendantAnalytics(req, res) {
    try {
      const { attendant_id } = req.params;
      const { start_date, end_date } = req.query;

      if (!attendant_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: attendant_id'
        });
      }

      const analytics = await Conversation.getAttendantAnalytics(attendant_id, start_date, end_date);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('Error getting attendant analytics', { error: error.message, params: req.params, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting attendant analytics',
        details: error.message
      });
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  async getClinicContext(clinic_id) {
    try {
      // Dados específicos da ESADI
      if (clinic_id === '9981f126-a9b9-4c7d-819a-3380b9ee61de') {
        return {
          name: 'ESADI',
          specialties: ['Gastroenterologia', 'Endoscopia Digestiva', 'Hepatologia', 'Colonoscopia', 'Diagnóstico por Imagem Digestiva'],
          description: 'Centro especializado em saúde do aparelho digestivo com tecnologia de ponta para Santa Catarina. Oferecemos exames de baixa, média e alta complexidade em ambiente diferenciado.',
          mission: 'Proporcionar diagnósticos precisos e tratamentos eficazes para patologias do aparelho digestivo com tecnologia avançada e atendimento humanizado.',
          values: ['Excelência em diagnóstico', 'Tecnologia de ponta', 'Atendimento humanizado', 'Segurança do paciente', 'Ética profissional'],
          differentials: ['Comunicação direta com Hospital Santa Isabel', 'Espaço diferenciado para acolhimento', 'Fluxo otimizado de pacientes', 'Equipamentos de última geração', 'Equipe de anestesiologia especializada'],
          location: 'Blumenau, SC',
          address: 'Rua Sete de Setembro, 777 - Centro, Blumenau, SC',
          phone: '(47) 3222-0432',
          whatsapp: '(47) 99963-3223',
          email: 'contato@esadi.com.br',
          website: 'https://www.esadi.com.br',
          working_hours: {
            segunda: { abertura: '07:00', fechamento: '18:00' },
            terca: { abertura: '07:00', fechamento: '18:00' },
            quarta: { abertura: '07:00', fechamento: '18:00' },
            quinta: { abertura: '07:00', fechamento: '18:00' },
            sexta: { abertura: '07:00', fechamento: '17:00' },
            sabado: { abertura: '07:00', fechamento: '12:00' },
            domingo: { abertura: null, fechamento: null }
          },
          ai_personality: {
            name: 'Jessica',
            personality: 'Profissional, acolhedora e especializada em gastroenterologia. Demonstra conhecimento técnico mas comunica de forma acessível.',
            tone: 'Formal mas acessível, com foco na tranquilização do paciente',
            formality: 'Médio-alto',
            greeting: 'Olá! Sou a Jessica, assistente virtual da ESADI. Estou aqui para ajudá-lo com agendamentos e orientações sobre exames. Como posso ajudá-lo hoje?',
            farewell: 'Obrigado por escolher a ESADI para cuidar da sua saúde digestiva. Até breve!',
            out_of_hours: 'No momento estamos fora do horário de atendimento. Para urgências gastroenterológicas, procure o pronto-socorro do Hospital Santa Isabel. Retornaremos seu contato no próximo horário comercial.'
          },
          ai_behavior: {
            proativo: true,
            oferece_sugestoes: true,
            solicita_feedback: true,
            escalacao_automatica: true,
            limite_tentativas: 3,
            contexto_conversa: true
          },
          services: [
            {
              id: 'cons_001',
              nome: 'Consulta Gastroenterológica',
              descricao: 'Avaliação completa do aparelho digestivo',
              duracao_minutos: 30,
              preco_particular: 280.00,
              aceita_convenio: true,
              convenios_aceitos: ['Unimed', 'Bradesco Saúde', 'SulAmérica']
            },
            {
              id: 'exam_001',
              nome: 'Endoscopia Digestiva Alta',
              descricao: 'Exame endoscópico do esôfago, estômago e duodeno',
              duracao_minutos: 30,
              preco_particular: 450.00,
              aceita_convenio: true,
              convenios_aceitos: ['Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil'],
              preparacao: {
                jejum_horas: 12,
                instrucoes_especiais: 'Jejum absoluto de 12 horas (sólidos e líquidos). Medicamentos de uso contínuo podem ser tomados com pouca água até 2 horas antes do exame.'
              },
              resultado_prazo_dias: 2
            },
            {
              id: 'exam_002',
              nome: 'Colonoscopia',
              descricao: 'Exame endoscópico do intestino grosso',
              duracao_minutos: 45,
              preco_particular: 650.00,
              aceita_convenio: true,
              convenios_aceitos: ['Unimed', 'Bradesco Saúde', 'SulAmérica'],
              preparacao: {
                jejum_horas: 12,
                instrucoes_especiais: 'Dieta específica 3 dias antes. Uso de laxante conforme orientação médica. Jejum absoluto de 12 horas.'
              },
              resultado_prazo_dias: 3
            },
            {
              id: 'exam_003',
              nome: 'Teste Respiratório para H. Pylori',
              descricao: 'Teste não invasivo para detecção da bactéria Helicobacter pylori',
              duracao_minutos: 60,
              preco_particular: 180.00,
              aceita_convenio: true,
              convenios_aceitos: ['Unimed', 'Bradesco Saúde', 'SulAmérica'],
              preparacao: {
                jejum_horas: 6,
                instrucoes_especiais: 'Suspender antibióticos por 4 semanas. Suspender omeprazol e similares por 2 semanas. Jejum de 6 horas.'
              },
              resultado_prazo_dias: 1
            }
          ],
          professionals: [
            {
              id: 'prof_001',
              nome_exibicao: 'Dr. Carlos Eduardo',
              especialidades: ['Gastroenterologia', 'Endoscopia Digestiva'],
              experiencia: 'Mais de 25 anos de experiência em gastroenterologia e endoscopia digestiva',
              aceita_novos_pacientes: true
            },
            {
              id: 'prof_002',
              nome_exibicao: 'Dr. João',
              especialidades: ['Endoscopia Digestiva', 'Colonoscopia', 'Diagnóstico por Imagem Digestiva'],
              experiencia: 'Mais de 10 anos de experiência em endoscopia digestiva, colonoscopia e hepatologia',
              aceita_novos_pacientes: true
            }
          ],
          insurance_plans: [
            { nome: 'Unimed', ativo: true, copagamento: false },
            { nome: 'Bradesco Saúde', ativo: true, copagamento: true, valor_copagamento: 25.00 },
            { nome: 'SulAmérica', ativo: true, copagamento: true, valor_copagamento: 30.00 }
          ],
          policies: {
            agendamento: {
              antecedencia_minima_horas: 24,
              antecedencia_maxima_dias: 90,
              reagendamento_permitido: true,
              cancelamento_antecedencia_horas: 24,
              confirmacao_necessaria: true
            },
            atendimento: {
              tolerancia_atraso_minutos: 15,
              acompanhante_permitido: true,
              documentos_obrigatorios: ['RG ou CNH', 'CPF', 'Carteirinha do convênio']
            }
          }
        };
      }
      
      // Buscar dados da clínica via API para outras clínicas
      const response = await fetch(`${process.env.CLINIC_SERVICE_URL || 'http://localhost:3001'}/api/clinics/${clinic_id}`, {
        headers: {
          'Authorization': 'Bearer test'
        }
      });
      
      if (!response.ok) {
        logger.warn('Failed to fetch clinic context', { clinic_id, status: response.status });
        return this.getDefaultClinicContext();
      }
      
      const clinicData = await response.json();
      const clinic = clinicData.data;
      
      // Extrair contexto da contextualização JSON
      let context = {
        name: clinic.name || 'Clínica',
        specialties: [],
        working_hours: '8h às 18h',
        location: 'Brasil',
        ai_personality: {},
        ai_behavior: {},
        services: [],
        professionals: []
      };
      
      if (clinic.contextualization_json) {
        const ctx = clinic.contextualization_json;
        
        // Informações básicas da clínica
        if (ctx.clinica?.informacoes_basicas) {
          context.name = ctx.clinica.informacoes_basicas.nome || clinic.name;
          context.specialties = ctx.clinica.informacoes_basicas.especialidades_secundarias || [];
          context.description = ctx.clinica.informacoes_basicas.descricao;
          context.mission = ctx.clinica.informacoes_basicas.missao;
          context.values = ctx.clinica.informacoes_basicas.valores;
          context.differentials = ctx.clinica.informacoes_basicas.diferenciais;
        }
        
        // Localização
        if (ctx.clinica?.localizacao?.endereco_principal) {
          const endereco = ctx.clinica.localizacao.endereco_principal;
          context.location = `${endereco.cidade}, ${endereco.estado}`;
          context.address = `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}`;
        }
        
        // Contatos
        if (ctx.clinica?.contatos) {
          context.phone = ctx.clinica.contatos.telefone_principal;
          context.whatsapp = ctx.clinica.contatos.whatsapp;
          context.email = ctx.clinica.contatos.email_principal;
          context.website = ctx.clinica.contatos.website;
        }
        
        // Horários de funcionamento
        if (ctx.clinica?.horario_funcionamento) {
          context.working_hours = ctx.clinica.horario_funcionamento;
        }
        
        // Personalidade da IA
        if (ctx.agente_ia?.configuracao) {
          context.ai_personality = {
            name: ctx.agente_ia.configuracao.nome,
            personality: ctx.agente_ia.configuracao.personalidade,
            tone: ctx.agente_ia.configuracao.tom_comunicacao,
            formality: ctx.agente_ia.configuracao.nivel_formalidade,
            greeting: ctx.agente_ia.configuracao.saudacao_inicial,
            farewell: ctx.agente_ia.configuracao.mensagem_despedida,
            out_of_hours: ctx.agente_ia.configuracao.mensagem_fora_horario
          };
        }
        
        // Comportamento da IA
        if (ctx.agente_ia?.comportamento) {
          context.ai_behavior = ctx.agente_ia.comportamento;
        }
        
        // Serviços
        if (ctx.servicos) {
          context.services = [
            ...(ctx.servicos.consultas || []),
            ...(ctx.servicos.exames || [])
          ];
        }
        
        // Profissionais
        if (ctx.profissionais) {
          context.professionals = ctx.profissionais;
        }
        
        // Convênios
        if (ctx.convenios) {
          context.insurance_plans = ctx.convenios;
        }
        
        // Políticas
        if (ctx.politicas) {
          context.policies = ctx.politicas;
        }
      }
      
      logger.info('Clinic context loaded successfully', { 
        clinic_id, 
        clinic_name: context.name,
        has_contextualization: !!clinic.contextualization_json
      });
      
      return context;
      
    } catch (error) {
      logger.error('Error fetching clinic context', { error: error.message, clinic_id });
      return this.getDefaultClinicContext();
    }
  }
  
  getDefaultClinicContext() {
    return {
      name: 'Clínica',
      specialties: [],
      working_hours: '8h às 18h',
      location: 'Brasil',
      ai_personality: {
        name: 'Assistente',
        personality: 'Profissional e atencioso',
        tone: 'Formal mas acessível',
        formality: 'Médio'
      },
      ai_behavior: {
        proativo: true,
        oferece_sugestoes: true
      },
      services: [],
      professionals: []
    };
  }

  async handleServiceRouting(processingResult, conversation, message) {
    // Implementar roteamento para serviços
    return {
      type: 'service_routing',
      service: processingResult.service,
      message: 'Sua solicitação foi encaminhada para o serviço apropriado.'
    };
  }

  async handleAIResponse(processingResult, conversation, message) {
    // Implementar resposta da IA
    return {
      type: 'ai_response',
      content: processingResult.response,
      confidence: processingResult.confidence
    };
  }

  async handleError(processingResult, conversation, message) {
    // Implementar tratamento de erro
    return {
      type: 'error',
      message: 'Desculpe, não consegui processar sua mensagem. Tente novamente.'
    };
  }

  async recordTransition(conversation_id, transition_type, metadata) {
    // Implementar registro de transição
    // Este método deve salvar as transições no banco de dados
    logger.info('Transition recorded', { conversation_id, transition_type, metadata });
  }

  // =====================================================
  // OPENAPI ENDPOINTS
  // =====================================================

  async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const { message, sender } = req.body;

      logger.info('Sending message to conversation', { conversation_id: id, sender, message_length: message.length });

      // Buscar conversa
      const conversation = await Conversation.findById(id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversa não encontrada'
        });
      }

      // Criar mensagem
      const newMessage = await Message.create({
        conversation_id: id,
        clinic_id: conversation.clinic_id,
        patient_phone: conversation.patient_phone,
        content: message,
        type: 'text',
        direction: sender === 'user' ? 'inbound' : 'outbound',
        metadata: { sender }
      });

      // Atualizar última mensagem da conversa
      await Conversation.updateLastMessage(id, message);

      logger.info('Message sent successfully', { 
        message_id: newMessage.id, 
        conversation_id: id 
      });

      res.status(200).json({
        success: true,
        data: {
          id: newMessage.id,
          conversation_id: id,
          message: message,
          sender: sender,
          timestamp: newMessage.timestamp
        }
      });

    } catch (error) {
      logger.error('Error sending message', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error sending message',
        details: error.message
      });
    }
  }

  async assignConversationOpenAPI(req, res) {
    try {
      const { id } = req.params;
      const { assigned_user_id, mode } = req.body;

      logger.info('Assigning conversation (OpenAPI)', { 
        conversation_id: id, 
        assigned_user_id, 
        mode 
      });

      // Buscar conversa
      const conversation = await Conversation.findById(id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversa não encontrada'
        });
      }

      // Atualizar conversa com atribuição
      const updatedConversation = await Conversation.update(id, {
        assigned_user_id: assigned_user_id,
        assignment_mode: mode,
        status: 'assigned'
      });

      logger.info('Conversation assigned successfully', { 
        conversation_id: id, 
        assigned_user_id, 
        mode 
      });

      res.status(200).json({
        success: true,
        data: {
          id: id,
          assigned_user_id: assigned_user_id,
          mode: mode,
          status: 'assigned',
          updated_at: updatedConversation.updated_at
        }
      });

    } catch (error) {
      logger.error('Error assigning conversation (OpenAPI)', { 
        error: error.message, 
        params: req.params, 
        body: req.body 
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error assigning conversation',
        details: error.message
      });
    }
  }
}

module.exports = ConversationController;
