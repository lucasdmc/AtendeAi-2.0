const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');
const ConversationalMemory = require('./conversationalMemory');

class LLMOrchestrator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    this.memory = new ConversationalMemory();
    this.intentPatterns = this.initializeIntentPatterns();
  }

  initializeIntentPatterns() {
    return {
      appointment: {
        patterns: [
          'agendar', 'marcar', 'consulta', 'exame', 'procedimento', 'horário', 'data',
          'marcação', 'agendamento', 'disponibilidade', 'slot', 'tempo'
        ],
        keywords: ['quando', 'que dia', 'que hora', 'disponível', 'livre']
      },
      reschedule: {
        patterns: [
          'reagendar', 'mudar', 'alterar', 'trocar', 'modificar', 'adiar', 'antecipar',
          'outro horário', 'outra data', 'diferente'
        ],
        keywords: ['mudança', 'alteração', 'modificação']
      },
      cancel: {
        patterns: [
          'cancelar', 'desmarcar', 'anular', 'remover', 'deletar', 'excluir',
          'não quero mais', 'desistir', 'adiar indefinidamente'
        ],
        keywords: ['cancelamento', 'desmarcação']
      },
      information: {
        patterns: [
          'informação', 'dúvida', 'pergunta', 'como', 'o que', 'quando', 'onde',
          'quanto', 'qual', 'por que', 'explicar', 'entender'
        ],
        keywords: ['dúvida', 'pergunta', 'informação']
      },
      greeting: {
        patterns: [
          'oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'oi tudo bem',
          'olá como vai', 'bom dia como está'
        ],
        keywords: ['saudação', 'cumprimento']
      },
      farewell: {
        patterns: [
          'tchau', 'até logo', 'até mais', 'obrigado', 'valeu', 'até a próxima',
          'até breve', 'até mais tarde'
        ],
        keywords: ['despedida', 'agradecimento']
      },
      emergency: {
        patterns: [
          'emergência', 'urgente', 'grave', 'crítico', 'socorro', 'ajuda',
          'muito mal', 'muito ruim', 'sintoma grave'
        ],
        keywords: ['emergência', 'urgente', 'crítico']
      },
      human_support: {
        patterns: [
          'atendente', 'humano', 'pessoa', 'operador', 'falar com alguém',
          'atendimento humano', 'pessoa real', 'operador humano'
        ],
        keywords: ['atendente', 'humano', 'operador']
      }
    };
  }

  async detectIntent(message, clinic_id, patient_phone) {
    try {
      const lowerMessage = message.toLowerCase();
      let detectedIntent = null;
      let confidence = 0;
      let metadata = {};

      for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
        let intentScore = 0;
        let matchedPatterns = [];

        for (const pattern of patterns.patterns) {
          if (lowerMessage.includes(pattern)) {
            intentScore += 2;
            matchedPatterns.push(pattern);
          }
        }

        for (const keyword of patterns.keywords) {
          if (lowerMessage.includes(keyword)) {
            intentScore += 1;
            matchedPatterns.push(keyword);
          }
        }

        if (intentScore > confidence) {
          confidence = intentScore;
          detectedIntent = intent;
          metadata = { matched_patterns: matchedPatterns, score: intentScore };
        }
      }

      if (detectedIntent) {
        await this.memory.addIntentToHistory(clinic_id, patient_phone, detectedIntent, confidence, metadata);
        logger.info('Intent detected', { 
          intent: detectedIntent, 
          confidence, 
          message: message.substring(0, 50),
          clinic_id,
          patient_phone
        });
      }

      return {
        intent: detectedIntent || 'unknown',
        confidence: confidence / 10,
        metadata,
        fallback: confidence === 0
      };
    } catch (error) {
      logger.error('Error detecting intent', { error: error.message, message });
      return {
        intent: 'unknown',
        confidence: 0,
        metadata: {},
        fallback: true
      };
    }
  }

  async generateResponse(message, intent, clinic_id, patient_phone, clinicContext) {
    try {
      const userProfile = await this.memory.getUserProfile(clinic_id, patient_phone);
      const conversationContext = await this.memory.getConversationContext(clinic_id, patient_phone, 5);
      const sessionData = await this.memory.getSessionData(clinic_id, patient_phone);

      const systemPrompt = this.buildSystemPrompt(clinicContext, userProfile, sessionData);
      const userPrompt = this.buildUserPrompt(message, intent, conversationContext);

      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: this.calculateTemperature(intent, userProfile),
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const response = completion.choices[0].message.content;
      
      await this.memory.updateSessionData(clinic_id, patient_phone, {
        last_intent: intent,
        last_response: response,
        response_count: (sessionData.response_count || 0) + 1
      });

      logger.info('Response generated', { 
        intent, 
        response_length: response.length,
        clinic_id,
        patient_phone
      });

      return {
        content: response,
        intent,
        confidence: 0.9,
        metadata: {
          model: config.openai.model,
          tokens_used: completion.usage.total_tokens,
          temperature: this.calculateTemperature(intent, userProfile)
        }
      };
    } catch (error) {
      logger.error('Error generating response', { error: error.message, intent, clinic_id, patient_phone });
      return this.generateFallbackResponse(intent, clinicContext);
    }
  }

  buildSystemPrompt(clinicContext, userProfile, sessionData) {
    const clinicName = clinicContext?.name || 'clínica';
    const clinicPersonality = clinicContext?.ai_personality || 'profissional e atencioso';
    const clinicFormality = clinicContext?.formality_level || 'formal';
    
    let prompt = `Você é um assistente virtual inteligente da ${clinicName}. `;
    prompt += `Sua personalidade é ${clinicPersonality} e seu nível de formalidade é ${clinicFormality}. `;
    
    if (userProfile?.name) {
      prompt += `O usuário se chama ${userProfile.name}. Use o nome dele de forma natural. `;
    }
    
    if (userProfile?.preferences) {
      prompt += `Preferências do usuário: ${JSON.stringify(userProfile.preferences)}. `;
    }
    
    prompt += `\n\nRegras importantes:
    1. Sempre seja ${clinicPersonality}
    2. Use o nível de formalidade ${clinicFormality}
    3. Seja conciso mas completo
    4. Use emojis apropriados para WhatsApp
    5. Formate respostas para WhatsApp (negrito, itálico quando apropriado)
    6. Mantenha o contexto da conversa
    7. Se não souber algo, sugira falar com um atendente humano`;
    
    return prompt;
  }

  buildUserPrompt(message, intent, conversationContext) {
    let prompt = `Mensagem do usuário: "${message}"\n`;
    prompt += `Intenção detectada: ${intent}\n`;
    
    if (conversationContext.length > 0) {
      prompt += `\nContexto da conversa (últimas mensagens):\n`;
      conversationContext.forEach((msg, index) => {
        prompt += `${index + 1}. ${msg.direction === 'inbound' ? 'Usuário' : 'Assistente'}: ${msg.content}\n`;
      });
    }
    
    prompt += `\nGere uma resposta apropriada baseada na intenção "${intent}" e no contexto da conversa.`;
    
    return prompt;
  }

  calculateTemperature(intent, userProfile) {
    let baseTemp = 0.7;
    
    if (intent === 'emergency') {
      baseTemp = 0.3;
    } else if (intent === 'greeting' || intent === 'farewell') {
      baseTemp = 0.8;
    } else if (intent === 'information') {
      baseTemp = 0.6;
    }
    
    if (userProfile?.emotional_state === 'anxious') {
      baseTemp = Math.min(baseTemp + 0.1, 0.9);
    } else if (userProfile?.emotional_state === 'calm') {
      baseTemp = Math.max(baseTemp - 0.1, 0.3);
    }
    
    return baseTemp;
  }

  generateFallbackResponse(intent, clinicContext) {
    const fallbackResponses = {
      appointment: 'Desculpe, não consegui processar sua solicitação de agendamento. Por favor, tente novamente ou entre em contato com um atendente humano.',
      reschedule: 'Não consegui entender sua solicitação de reagendamento. Pode reformular ou falar com um atendente humano?',
      cancel: 'Não consegui processar o cancelamento. Entre em contato com um atendente humano para ajudá-lo.',
      information: 'Desculpe, não consegui processar sua pergunta. Pode reformular ou falar com um atendente humano?',
      greeting: 'Olá! Como posso ajudá-lo hoje?',
      farewell: 'Até logo! Tenha um ótimo dia!',
      emergency: '⚠️ ATENÇÃO: Se esta é uma emergência médica, procure atendimento imediato ou ligue para emergências (192).',
      human_support: 'Vou transferir você para um atendente humano. Aguarde um momento...',
      unknown: 'Desculpe, não entendi sua mensagem. Pode reformular ou falar com um atendente humano?'
    };
    
    return {
      content: fallbackResponses[intent] || fallbackResponses.unknown,
      intent,
      confidence: 0.1,
      metadata: { fallback: true, reason: 'LLM service unavailable' }
    };
  }

  async routeToService(intent, clinic_id, patient_phone, message) {
    try {
      const routingMap = {
        appointment: 'appointment-service',
        reschedule: 'appointment-service',
        cancel: 'appointment-service',
        information: 'clinic-service',
        emergency: 'emergency-service',
        human_support: 'human-support-service'
      };
      
      const targetService = routingMap[intent];
      
      if (targetService) {
        await this.memory.updateSessionData(clinic_id, patient_phone, {
          routed_to: targetService,
          routing_timestamp: new Date().toISOString(),
          routing_intent: intent
        });
        
        logger.info('Message routed to service', { 
          intent, 
          target_service: targetService,
          clinic_id,
          patient_phone
        });
        
        return {
          routed: true,
          target_service: targetService,
          intent,
          message
        };
      }
      
      return { routed: false, reason: 'No service mapping for intent' };
    } catch (error) {
      logger.error('Error routing to service', { error: error.message, intent, clinic_id, patient_phone });
      return { routed: false, reason: 'Routing error' };
    }
  }

  async processMessage(message, clinic_id, patient_phone, clinicContext) {
    try {
      const intent = await this.detectIntent(message, clinic_id, patient_phone);
      
      if (intent.fallback) {
        logger.warn('Using fallback intent detection', { message: message.substring(0, 50) });
      }
      
      const routing = await this.routeToService(intent.intent, clinic_id, patient_phone, message);
      
      if (routing.routed) {
        return {
          type: 'routed',
          routing,
          intent: intent.intent,
          confidence: intent.confidence
        };
      }
      
      const response = await this.generateResponse(
        message, 
        intent.intent, 
        clinic_id, 
        patient_phone, 
        clinicContext
      );
      
      return {
        type: 'response',
        response,
        intent: intent.intent,
        confidence: intent.confidence,
        metadata: intent.metadata
      };
    } catch (error) {
      logger.error('Error processing message', { error: error.message, message, clinic_id, patient_phone });
      return {
        type: 'error',
        error: error.message,
        fallback_response: this.generateFallbackResponse('unknown', clinicContext)
      };
    }
  }
}

module.exports = LLMOrchestrator;
