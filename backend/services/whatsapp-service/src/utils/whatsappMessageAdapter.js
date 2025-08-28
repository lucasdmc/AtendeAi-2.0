class WhatsAppMessageAdapter {
    constructor() {
        this.metaAPI = null;
    }

    adaptIncomingMessage(metaPayload) {
        try {
            const entry = metaPayload.entry[0];
            const change = entry.changes[0];
            const message = change.value.messages[0];
            const contact = change.value.contacts[0];

            return {
                id: message.id,
                fromPhone: message.from,
                toPhone: change.value.metadata.display_phone_number,
                messageType: this.detectMessageType(message),
                content: this.extractContent(message),
                timestamp: new Date(parseInt(message.timestamp) * 1000),
                customerName: contact.profile.name,
                metadata: {
                    phoneNumberId: change.value.metadata.phone_number_id,
                    businessAccountId: entry.id
                }
            };
        } catch (error) {
            throw new Error(`Failed to adapt Meta payload: ${error.message}`);
        }
    }

    adaptOutgoingMessage(internalMessage) {
        return {
            messaging_product: 'whatsapp',
            to: internalMessage.toPhone,
            type: internalMessage.messageType,
            [internalMessage.messageType]: this.formatContent(internalMessage)
        };
    }

    detectMessageType(message) {
        if (message.text) return 'text';
        if (message.image) return 'image';
        if (message.audio) return 'audio';
        if (message.video) return 'video';
        if (message.document) return 'document';
        if (message.location) return 'location';
        return 'text';
    }

    extractContent(message) {
        switch (this.detectMessageType(message)) {
            case 'text':
                return { body: message.text.body };
            case 'image':
                return { id: message.image.id, caption: message.image.caption };
            case 'audio':
                return { id: message.audio.id };
            case 'video':
                return { id: message.video.id, caption: message.video.caption };
            case 'document':
                return { id: message.document.id, filename: message.document.filename };
            case 'location':
                return {
                    latitude: message.location.latitude,
                    longitude: message.location.longitude
                };
            default:
                return { body: 'Mensagem não suportada' };
        }
    }

    formatContent(internalMessage) {
        switch (internalMessage.messageType) {
            case 'text':
                return { body: internalMessage.content };
            case 'image':
                return { 
                    id: internalMessage.content.id, 
                    caption: internalMessage.content.caption 
                };
            case 'audio':
                return { id: internalMessage.content.id };
            case 'video':
                return { 
                    id: internalMessage.content.id, 
                    caption: internalMessage.content.caption 
                };
            case 'document':
                return { 
                    id: internalMessage.content.id, 
                    filename: internalMessage.content.filename 
                };
            case 'location':
                return {
                    latitude: internalMessage.content.latitude,
                    longitude: internalMessage.content.longitude
                };
            default:
                return { body: internalMessage.content };
        }
    }
}

module.exports = WhatsAppMessageAdapter;
