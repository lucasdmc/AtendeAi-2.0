const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const logger = require('../utils/logger');

class ClinicServiceClient {
    constructor() {
        this.baseURL = process.env.CLINIC_SERVICE_URL || 'http://localhost:3002';
        this.timeout = 10000;
    }

    /**
     * Busca o contexto completo de uma clínica incluindo JSON ESADI
     * @param {string} clinicId - ID da clínica
     * @returns {Object} Contexto completo da clínica
     */
    async getClinicContext(clinicId) {
        try {
            logger.info('🔍 Buscando contexto da clínica', { clinicId });
            
            // Busca dados básicos da clínica
            const clinicResponse = await this.makeRequest('GET', `/api/clinics/${clinicId}`);
            
            if (!clinicResponse || !clinicResponse.data) {
                logger.error('❌ Clínica não encontrada', { clinicId });
                return null;
            }

            const clinic = clinicResponse.data;
            
            // Busca contextualização JSON ESADI
            const contextResponse = await this.makeRequest('GET', `/api/clinics/${clinicId}/contextualization`);
            const contextData = contextResponse?.data || {};
            
            // A contextualização pode estar em diferentes níveis dependendo da resposta
            const contextualization = contextData.contextualization || contextData;

            logger.info('✅ Contexto da clínica obtido com sucesso', { 
                clinicId, 
                hasContextualization: !!contextualization,
                contextKeys: Object.keys(contextualization),
                hasClinicaInfo: !!contextualization.clinica,
                hasAgenteIA: !!contextualization.agente_ia
            });

            // Processa estrutura JSON ESADI
            let processedContext = {
                id: clinic.id,
                name: clinic.name,
                specialties: [clinic.specialty].filter(Boolean),
                description: clinic.description,
                mission: clinic.mission,
                values: clinic.values || [],
                differentials: clinic.differentials || [],
                location: `${clinic.city}, ${clinic.state}`,
                address: clinic.address,
                phone: clinic.phone,
                whatsapp: clinic.whatsapp_phone,
                email: clinic.email,
                website: clinic.website,
                working_hours: clinic.working_hours || {},
                ai_personality: clinic.ai_personality || {},
                ai_behavior: clinic.ai_behavior || {},
                services: [],
                professionals: [],
                appointment_policies: clinic.appointment_policies || {}
            };

            // Se tem contextualização JSON ESADI, processa ela
            if (contextualization && Object.keys(contextualization).length > 0) {
                // Informações básicas da clínica
                if (contextualization.clinica?.informacoes_basicas) {
                    const info = contextualization.clinica.informacoes_basicas;
                    processedContext.name = info.nome || processedContext.name;
                    processedContext.specialties = info.especialidades_secundarias || processedContext.specialties;
                    processedContext.description = info.descricao || processedContext.description;
                    processedContext.mission = info.missao || processedContext.mission;
                    processedContext.values = info.valores || processedContext.values;
                    processedContext.differentials = info.diferenciais || processedContext.differentials;
                }

                // Localização
                if (contextualization.clinica?.localizacao?.endereco_principal) {
                    const end = contextualization.clinica.localizacao.endereco_principal;
                    processedContext.location = `${end.cidade}, ${end.estado}`;
                    processedContext.address = `${end.logradouro}, ${end.numero}${end.complemento ? ' ' + end.complemento : ''} - ${end.bairro}, ${end.cidade}/${end.estado}`;
                }

                // Contatos
                if (contextualization.clinica?.contatos) {
                    const contatos = contextualization.clinica.contatos;
                    processedContext.phone = contatos.telefone_principal || processedContext.phone;
                    processedContext.whatsapp = contatos.whatsapp || processedContext.whatsapp;
                    processedContext.email = contatos.email_principal || processedContext.email;
                    processedContext.website = contatos.website || processedContext.website;
                }

                // Horários
                if (contextualization.clinica?.horario_funcionamento) {
                    processedContext.working_hours = contextualization.clinica.horario_funcionamento;
                }

                // Personalidade da IA
                if (contextualization.agente_ia?.configuracao) {
                    const config = contextualization.agente_ia.configuracao;
                    processedContext.ai_personality = {
                        name: config.nome,
                        personality: config.personalidade,
                        tone: config.tom_comunicacao,
                        formality: config.nivel_formalidade,
                        greeting: config.saudacao_inicial,
                        farewell: config.mensagem_despedida,
                        out_of_hours: config.mensagem_fora_horario
                    };
                }

                // Comportamento da IA
                if (contextualization.agente_ia?.comportamento) {
                    processedContext.ai_behavior = contextualization.agente_ia.comportamento;
                }

                // Serviços
                if (contextualization.servicos) {
                    processedContext.services = [
                        ...(contextualization.servicos.consultas || []),
                        ...(contextualization.servicos.exames || [])
                    ];
                }

                // Profissionais
                if (contextualization.profissionais) {
                    processedContext.professionals = contextualization.profissionais;
                }

                // Convênios
                if (contextualization.convenios) {
                    processedContext.insurance_plans = contextualization.convenios;
                }

                // Políticas
                if (contextualization.politicas) {
                    processedContext.appointment_policies = contextualization.politicas;
                }
            }

            return processedContext;
        } catch (error) {
            logger.error('❌ Erro ao buscar contexto da clínica:', error);
            throw error;
        }
    }

    /**
     * Busca configuração do WhatsApp para a clínica
     * @param {string} clinicId - ID da clínica
     * @returns {Object} Configuração do WhatsApp
     */
    async getWhatsAppConfig(clinicId) {
        try {
            const response = await this.makeRequest('GET', `/api/clinics/${clinicId}/whatsapp-config`);
            
            return {
                phoneNumber: response.data.phone_number,
                autoReplyEnabled: response.data.auto_reply_enabled,
                businessHours: response.data.business_hours,
                outOfHoursMessage: response.data.out_of_hours_message,
                escalationSettings: response.data.escalation_settings
            };
        } catch (error) {
            logger.error('Erro ao buscar configuração do WhatsApp:', error);
            return null;
        }
    }

    /**
     * Faz uma requisição HTTP para o Clinic Service
     * @private
     */
    async makeRequest(method, endpoint, body = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CLINIC_SERVICE_TOKEN || 'internal-service-token'}`
            },
            timeout: this.timeout
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            logger.error(`Clinic Service error:`, {
                error: error.message,
                url,
                method
            });
            throw new Error(`Clinic Service error: ${error.message}`);
        }
    }
}

module.exports = ClinicServiceClient;