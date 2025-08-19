const redis = require('../config/redis');
const logger = require('../utils/logger');

class ConversationalMemory {
  constructor() {
    this.defaultTTL = 24 * 60 * 60; // 24 horas
  }

  async getUserProfile(clinic_id, patient_phone) {
    const key = `user_profile:${clinic_id}:${patient_phone}`;
    
    try {
      const profile = await redis.get(key);
      return profile || null;
    } catch (error) {
      logger.error('Error getting user profile from memory', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return null;
    }
  }

  async setUserProfile(clinic_id, patient_phone, profile) {
    const key = `user_profile:${clinic_id}:${patient_phone}`;
    
    try {
      await redis.set(key, profile, this.defaultTTL);
      logger.info('User profile saved to memory', { 
        clinic_id, 
        patient_phone, 
        profile_keys: Object.keys(profile) 
      });
      return true;
    } catch (error) {
      logger.error('Error saving user profile to memory', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return false;
    }
  }

  async updateUserProfile(clinic_id, patient_phone, updates) {
    try {
      const currentProfile = await this.getUserProfile(clinic_id, patient_phone) || {};
      const updatedProfile = { ...currentProfile, ...updates, updated_at: new Date().toISOString() };
      
      await this.setUserProfile(clinic_id, patient_phone, updatedProfile);
      return updatedProfile;
    } catch (error) {
      logger.error('Error updating user profile in memory', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return null;
    }
  }

  async getConversationContext(clinic_id, patient_phone, messageCount = 10) {
    const key = `conversation_context:${clinic_id}:${patient_phone}`;
    
    try {
      const context = await redis.get(key);
      return context || [];
    } catch (error) {
      logger.error('Error getting conversation context from memory', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return [];
    }
  }

  async addMessageToContext(clinic_id, patient_phone, message) {
    const key = `conversation_context:${clinic_id}:${patient_phone}`;
    
    try {
      const context = await this.getConversationContext(clinic_id, patient_phone);
      
      const messageData = {
        id: message.id,
        content: message.content,
        direction: message.direction,
        timestamp: message.timestamp,
        type: message.type
      };
      
      context.push(messageData);
      
      if (context.length > 20) {
        context.shift();
      }
      
      await redis.set(key, context, this.defaultTTL);
      
      logger.info('Message added to conversation context', { 
        clinic_id, 
        patient_phone, 
        context_length: context.length 
      });
      
      return true;
    } catch (error) {
      logger.error('Error adding message to conversation context', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return false;
    }
  }

  async getIntentHistory(clinic_id, patient_phone) {
    const key = `intent_history:${clinic_id}:${patient_phone}`;
    
    try {
      const history = await redis.get(key);
      return history || [];
    } catch (error) {
      logger.error('Error getting intent history from memory', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return [];
    }
  }

  async addIntentToHistory(clinic_id, patient_phone, intent, confidence, metadata = {}) {
    const key = `intent_history:${clinic_id}:${patient_phone}`;
    
    try {
      const history = await this.getIntentHistory(clinic_id, patient_phone);
      
      const intentData = {
        intent,
        confidence,
        metadata,
        timestamp: new Date().toISOString()
      };
      
      history.push(intentData);
      
      if (history.length > 50) {
        history.shift();
      }
      
      await redis.set(key, history, this.defaultTTL);
      
      logger.info('Intent added to history', { 
        clinic_id, 
        patient_phone, 
        intent, 
        confidence 
      });
      
      return true;
    } catch (error) {
      logger.error('Error adding intent to history', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return false;
    }
  }

  async getSessionData(clinic_id, patient_phone) {
    const key = `session_data:${clinic_id}:${patient_phone}`;
    
    try {
      const sessionData = await redis.get(key);
      return sessionData || {};
    } catch (error) {
      logger.error('Error getting session data from memory', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return {};
    }
  }

  async setSessionData(clinic_id, patient_phone, data) {
    const key = `session_data:${clinic_id}:${patient_phone}`;
    
    try {
      await redis.set(key, data, this.defaultTTL);
      logger.info('Session data saved to memory', { 
        clinic_id, 
        patient_phone, 
        data_keys: Object.keys(data) 
      });
      return true;
    } catch (error) {
      logger.error('Error saving session data to memory', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return false;
    }
  }

  async updateSessionData(clinic_id, patient_phone, updates) {
    try {
      const currentData = await this.getSessionData(clinic_id, patient_phone);
      const updatedData = { ...currentData, ...updates, updated_at: new Date().toISOString() };
      
      await this.setSessionData(clinic_id, patient_phone, updatedData);
      return updatedData;
    } catch (error) {
      logger.error('Error updating session data in memory', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return null;
    }
  }

  async clearUserMemory(clinic_id, patient_phone) {
    const keys = [
      `user_profile:${clinic_id}:${patient_phone}`,
      `conversation_context:${clinic_id}:${patient_phone}`,
      `intent_history:${clinic_id}:${patient_phone}`,
      `session_data:${clinic_id}:${patient_phone}`
    ];
    
    try {
      for (const key of keys) {
        await redis.del(key);
      }
      
      logger.info('User memory cleared', { clinic_id, patient_phone });
      return true;
    } catch (error) {
      logger.error('Error clearing user memory', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return false;
    }
  }

  async getMemoryStats(clinic_id, patient_phone) {
    try {
      const profile = await this.getUserProfile(clinic_id, patient_phone);
      const context = await this.getConversationContext(clinic_id, patient_phone);
      const intentHistory = await this.getIntentHistory(clinic_id, patient_phone);
      const sessionData = await this.getSessionData(clinic_id, patient_phone);
      
      return {
        has_profile: !!profile,
        profile_keys: profile ? Object.keys(profile) : [],
        context_length: context.length,
        intent_history_length: intentHistory.length,
        session_data_keys: Object.keys(sessionData),
        last_updated: profile?.updated_at || sessionData?.updated_at || null
      };
    } catch (error) {
      logger.error('Error getting memory stats', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      return null;
    }
  }
}

module.exports = ConversationalMemory;
