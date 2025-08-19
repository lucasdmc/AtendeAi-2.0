const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class Professional {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.clinic_id = data.clinic_id;
    this.name = data.name;
    this.crm = data.crm;
    this.specialties = data.specialties || [];
    this.experience_years = data.experience_years;
    this.bio = data.bio;
    this.photo_url = data.photo_url;
    this.accepts_new_patients = data.accepts_new_patients !== false;
    this.default_appointment_duration = data.default_appointment_duration || 30;
    this.working_hours = data.working_hours;
    this.status = data.status || 'active';
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(professionalData) {
    try {
      const professional = new Professional(professionalData);
      
      const query = `
        INSERT INTO professionals (
          id, clinic_id, name, crm, specialties, experience_years, bio,
          photo_url, accepts_new_patients, default_appointment_duration,
          working_hours, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const values = [
        professional.id, professional.clinic_id, professional.name, professional.crm,
        professional.specialties, professional.experience_years, professional.bio,
        professional.photo_url, professional.accepts_new_patients,
        professional.default_appointment_duration, professional.working_hours,
        professional.status, professional.created_at, professional.updated_at
      ];
      
      const result = await db.query(query, values);
      logger.info('Professional created successfully', { 
        professionalId: professional.id,
        clinicId: professional.clinic_id
      });
      
      return new Professional(result.rows[0]);
    } catch (error) {
      logger.error('Error creating professional:', error);
      throw error;
    }
  }

  static async findById(id, clinicId) {
    try {
      const query = `
        SELECT * FROM professionals 
        WHERE id = $1 AND clinic_id = $2 AND status != 'deleted'
      `;
      const result = await db.query(query, [id, clinicId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Professional(result.rows[0]);
    } catch (error) {
      logger.error('Error finding professional by ID:', error);
      throw error;
    }
  }

  static async findByClinic(clinicId, limit = 100, offset = 0) {
    try {
      const query = `
        SELECT * FROM professionals 
        WHERE clinic_id = $1 AND status != 'deleted'
        ORDER BY name ASC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await db.query(query, [clinicId, limit, offset]);
      return result.rows.map(row => new Professional(row));
    } catch (error) {
      logger.error('Error finding professionals by clinic:', error);
      throw error;
    }
  }

  static async findBySpecialty(clinicId, specialty, limit = 100, offset = 0) {
    try {
      const query = `
        SELECT * FROM professionals 
        WHERE clinic_id = $1 AND $2 = ANY(specialties) AND status = 'active'
        ORDER BY name ASC 
        LIMIT $3 OFFSET $4
      `;
      
      const result = await db.query(query, [clinicId, specialty, limit, offset]);
      return result.rows.map(row => new Professional(row));
    } catch (error) {
      logger.error('Error finding professionals by specialty:', error);
      throw error;
    }
  }

  static async update(id, clinicId, updateData) {
    try {
      updateData.updated_at = new Date();
      
      const fields = Object.keys(updateData).filter(key => !['id', 'clinic_id'].includes(key));
      const values = Object.values(updateData);
      const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');
      
      const query = `
        UPDATE professionals 
        SET ${setClause}, updated_at = $${fields.length + 3}
        WHERE id = $1 AND clinic_id = $2 AND status != 'deleted'
        RETURNING *
      `;
      
      const result = await db.query(query, [id, clinicId, ...values, updateData.updated_at]);
      
      if (result.rows.length === 0) {
        throw new Error('Professional not found or deleted');
      }
      
      logger.info('Professional updated successfully', { 
        professionalId: id,
        clinicId: clinicId
      });
      return new Professional(result.rows[0]);
    } catch (error) {
      logger.error('Error updating professional:', error);
      throw error;
    }
  }

  static async delete(id, clinicId) {
    try {
      const query = `
        UPDATE professionals 
        SET status = 'deleted', updated_at = $3
        WHERE id = $1 AND clinic_id = $2 AND status != 'deleted'
        RETURNING *
      `;
      
      const result = await db.query(query, [id, clinicId, new Date()]);
      
      if (result.rows.length === 0) {
        throw new Error('Professional not found or already deleted');
      }
      
      logger.info('Professional deleted successfully', { 
        professionalId: id,
        clinicId: clinicId
      });
      return new Professional(result.rows[0]);
    } catch (error) {
      logger.error('Error deleting professional:', error);
      throw error;
    }
  }

  static async getAvailableProfessionals(clinicId, specialty = null) {
    try {
      let query = `
        SELECT * FROM professionals 
        WHERE clinic_id = $1 AND status = 'active' AND accepts_new_patients = true
      `;
      let values = [clinicId];
      
      if (specialty) {
        query += ' AND $2 = ANY(specialties)';
        values.push(specialty);
      }
      
      query += ' ORDER BY name ASC';
      
      const result = await db.query(query, values);
      return result.rows.map(row => new Professional(row));
    } catch (error) {
      logger.error('Error getting available professionals:', error);
      throw error;
    }
  }

  static async getWorkingHours(professionalId, clinicId) {
    try {
      const query = `
        SELECT working_hours FROM professionals 
        WHERE id = $1 AND clinic_id = $2 AND status = 'active'
      `;
      const result = await db.query(query, [professionalId, clinicId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0].working_hours;
    } catch (error) {
      logger.error('Error getting professional working hours:', error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      clinic_id: this.clinic_id,
      name: this.name,
      crm: this.crm,
      specialties: this.specialties,
      experience_years: this.experience_years,
      bio: this.bio,
      photo_url: this.photo_url,
      accepts_new_patients: this.accepts_new_patients,
      default_appointment_duration: this.default_appointment_duration,
      working_hours: this.working_hours,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Professional;
