class FallbackStrategy {
    constructor(clinicId) {
        this.clinicId = clinicId;
        this.fallbackMessages = this.getFallbackMessages();
    }

    async getResponse(messageType, context) {
        try {
            const aiResponse = await this.getAIResponse(context);
            return aiResponse;
        } catch (error) {
            return this.getFallbackMessage(messageType, context);
        }
    }

    async getAIResponse(context) {
        const ConversationServiceClient = require('../clients/conversationServiceClient');
        const conversationService = new ConversationServiceClient();
        
        return await conversationService.processMessage({
            clinicId: this.clinicId,
            message: context.message,
            customerPhone: context.customerPhone,
            messageType: context.messageType
        });
    }

    getFallbackMessage(messageType, context) {
        const fallback = this.fallbackMessages[messageType] || this.fallbackMessages.default;
        return {
            text: fallback.text,
            isFallback: true,
            error: context.error || 'AI service unavailable'
        };
    }

    getFallbackMessages() {
        return {
            greeting: {
                text: "Olá! Obrigado por entrar em contato. Nossa equipe está temporariamente indisponível, mas retornaremos em breve."
            },
            appointment: {
                text: "Para agendar um horário, por favor, tente novamente em alguns minutos ou entre em contato pelo telefone."
            },
            general: {
                text: "Estamos enfrentando dificuldades técnicas. Por favor, tente novamente em alguns minutos."
            },
            default: {
                text: "Obrigado por sua mensagem. Retornaremos em breve."
            }
        };
    }
}

module.exports = FallbackStrategy;
