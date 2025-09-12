const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class Clinic {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.type = data.type;
    this.specialty = data.specialty;
    this.description = data.description;
    this.mission = data.mission;
    this.values = data.values;
    this.differentials = data.differentials;
    this.simulation_mode = data.simulation_mode || false;
    this.whatsapp_phone = data.whatsapp_phone;
    this.email = data.email;
    this.website = data.website;
    this.address = data.address;
    this.city = data.city;
    this.state = data.state;
    this.zip_code = data.zip_code;
    this.country = data.country || 'Brasil';
    this.phone = data.phone;
    this.working_hours = data.working_hours;
    this.timezone = data.timezone || 'America/Sao_Paulo';
    this.context_json = data.context_json || data.contextualization_json || {};
    this.ai_personality = data.ai_personality;
    this.ai_behavior = data.ai_behavior;
    this.appointment_policies = data.appointment_policies;
    this.calendar_mappings = data.calendar_mappings;
    this.status = data.status || 'active';
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(clinicData) {
    try {
      const clinic = new Clinic(clinicData);
      
      const query = `
        INSERT INTO clinics (
          id, name, type, specialty, description, mission, values, differentials,
          simulation_mode, whatsapp_phone, email, website, address, city, state,
          zip_code, country, phone, working_hours, timezone, contextualization_json,
          ai_personality, ai_behavior, appointment_policies, calendar_mappings,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                 $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        RETURNING *
      `;
      
      const values = [
        clinic.id, clinic.name, clinic.type, clinic.specialty, clinic.description,
        clinic.mission, clinic.values, clinic.differentials, clinic.simulation_mode,
        clinic.whatsapp_phone, clinic.email, clinic.website, clinic.address,
        clinic.city, clinic.state, clinic.zip_code, clinic.country, clinic.phone,
        clinic.working_hours, clinic.timezone, clinic.contextualization_json,
        clinic.ai_personality, clinic.ai_behavior, clinic.appointment_policies,
        clinic.calendar_mappings, clinic.status, clinic.created_at, clinic.updated_at
      ];
      
      const result = await db.query(query, values);
      logger.info('Clinic created successfully', { clinicId: clinic.id });
      
      return new Clinic(result.rows[0]);
    } catch (error) {
      logger.error('Error creating clinic:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM clinics WHERE id = $1 AND status != $2';
      const result = await db.query(query, [id, 'deleted']);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Clinic(result.rows[0]);
    } catch (error) {
      logger.error('Error finding clinic by ID:', error);
      throw error;
    }
  }

  static async findByWhatsAppPhone(phone) {
    try {
      const query = 'SELECT * FROM clinics WHERE whatsapp_phone = $1 AND status = $2';
      const result = await db.query(query, [phone, 'active']);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Clinic(result.rows[0]);
    } catch (error) {
      logger.error('Error finding clinic by WhatsApp phone:', error);
      throw error;
    }
  }

  static async findAll(limit = 100, offset = 0) {
    try {
      const query = `
        SELECT * FROM clinics 
        WHERE status != 'deleted' 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      
      const result = await db.query(query, [limit, offset]);
      return result.rows.map(row => new Clinic(row));
    } catch (error) {
      logger.error('Error finding all clinics:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      updateData.updated_at = new Date();
      
      const fields = Object.keys(updateData).filter(key => key !== 'id');
      const values = Object.values(updateData);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const query = `
        UPDATE clinics 
        SET ${setClause}, updated_at = $${fields.length + 2}
        WHERE id = $1 AND status != 'deleted'
        RETURNING *
      `;
      
      const result = await db.query(query, [id, ...values, updateData.updated_at]);
      
      if (result.rows.length === 0) {
        throw new Error('Clinic not found or deleted');
      }
      
      logger.info('Clinic updated successfully', { clinicId: id });
      return new Clinic(result.rows[0]);
    } catch (error) {
      logger.error('Error updating clinic:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = `
        UPDATE clinics 
        SET status = 'deleted', updated_at = $2
        WHERE id = $1 AND status != 'deleted'
        RETURNING *
      `;
      
      const result = await db.query(query, [id, new Date()]);
      
      if (result.rows.length === 0) {
        throw new Error('Clinic not found or already deleted');
      }
      
      logger.info('Clinic deleted successfully', { clinicId: id });
      return new Clinic(result.rows[0]);
    } catch (error) {
      logger.error('Error deleting clinic:', error);
      throw error;
    }
  }

  static async getContextualization(clinicId) {
    try {
      const query = 'SELECT contextualization_json FROM clinics WHERE id = $1 AND status = $2';
      const result = await db.query(query, [clinicId, 'active']);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0].contextualization_json;
    } catch (error) {
      logger.error('Error getting clinic contextualization:', error);
      throw error;
    }
  }

  static async updateContextualization(clinicId, contextualizationData) {
    try {
      const query = `
        UPDATE clinics 
        SET contextualization_json = $2, updated_at = $3
        WHERE id = $1 AND status = 'active'
        RETURNING contextualization_json
      `;
      
      const result = await db.query(query, [clinicId, contextualizationData, new Date()]);
      
      if (result.rows.length === 0) {
        throw new Error('Clinic not found or inactive');
      }
      
      logger.info('Clinic contextualization updated successfully', { clinicId });
      return result.rows[0].contextualization_json;
    } catch (error) {
      logger.error('Error updating clinic contextualization:', error);
      throw error;
    }
  }

  static async getWorkingHours(clinicId) {
    try {
      const query = 'SELECT working_hours, timezone FROM clinics WHERE id = $1 AND status = $2';
      const result = await db.query(query, [clinicId, 'active']);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return {
        working_hours: result.rows[0].working_hours,
        timezone: result.rows[0].timezone
      };
    } catch (error) {
      logger.error('Error getting clinic working hours:', error);
      throw error;
    }
  }

  static async getAppointmentPolicies(clinicId) {
    try {
      const query = 'SELECT appointment_policies FROM clinics WHERE id = $1 AND status = $2';
      const result = await db.query(query, [clinicId, 'active']);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0].appointment_policies;
    } catch (error) {
      logger.error('Error getting clinic appointment policies:', error);
      throw error;
    }
  }

  static async getCalendarMappings(clinicId) {
    try {
      const query = 'SELECT calendar_mappings FROM clinics WHERE id = $1 AND status = $2';
      const result = await db.query(query, [clinicId, 'active']);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0].calendar_mappings;
    } catch (error) {
      logger.error('Error getting clinic calendar mappings:', error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      specialty: this.specialty,
      description: this.description,
      mission: this.mission,
      values: this.values,
      differentials: this.differentials,
      simulation_mode: this.simulation_mode,
      whatsapp_phone: this.whatsapp_phone,
      email: this.email,
      website: this.website,
      address: this.address,
      city: this.city,
      state: this.state,
      zip_code: this.zip_code,
      country: this.country,
      phone: this.phone,
      working_hours: this.working_hours,
      timezone: this.timezone,
      context_json: this.context_json,
      ai_personality: this.ai_personality,
      ai_behavior: this.ai_behavior,
      appointment_policies: this.appointment_policies,
      calendar_mappings: this.calendar_mappings,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Clinic;
