const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class Service {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.clinic_id = data.clinic_id;
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.specialty = data.specialty;
    this.duration = data.duration;
    this.price = data.price;
    this.currency = data.currency || 'BRL';
    this.accepts_insurance = data.accepts_insurance || false;
    this.insurance_providers = data.insurance_providers || [];
    this.requires_referral = data.requires_referral || false;
    this.status = data.status || 'active';
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(serviceData) {
    try {
      const service = new Service(serviceData);
      
      const query = `
        INSERT INTO services (
          id, clinic_id, name, description, category, specialty, duration,
          price, currency, accepts_insurance, insurance_providers,
          requires_referral, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;
      
      const values = [
        service.id, service.clinic_id, service.name, service.description,
        service.category, service.specialty, service.duration, service.price,
        service.currency, service.accepts_insurance, service.insurance_providers,
        service.requires_referral, service.status, service.created_at, service.updated_at
      ];
      
      const result = await db.query(query, values);
      logger.info('Service created successfully', { 
        serviceId: service.id,
        clinicId: service.clinic_id
      });
      
      return new Service(result.rows[0]);
    } catch (error) {
      logger.error('Error creating service:', error);
      throw error;
    }
  }

  static async findById(id, clinicId) {
    try {
      const query = `
        SELECT * FROM services 
        WHERE id = $1 AND clinic_id = $2 AND status != 'deleted'
      `;
      const result = await db.query(query, [id, clinicId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Service(result.rows[0]);
    } catch (error) {
      logger.error('Error finding service by ID:', error);
      throw error;
    }
  }

  static async findByClinic(clinicId, limit = 100, offset = 0) {
    try {
      const query = `
        SELECT * FROM services 
        WHERE clinic_id = $1 AND status != 'deleted'
        ORDER BY category ASC, name ASC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await db.query(query, [clinicId, limit, offset]);
      return result.rows.map(row => new Service(row));
    } catch (error) {
      logger.error('Error finding services by clinic:', error);
      throw error;
    }
  }

  static async findByCategory(clinicId, category, limit = 100, offset = 0) {
    try {
      const query = `
        SELECT * FROM services 
        WHERE clinic_id = $1 AND category = $2 AND status = 'active'
        ORDER BY name ASC 
        LIMIT $3 OFFSET $4
      `;
      
      const result = await db.query(query, [clinicId, category, limit, offset]);
      return result.rows.map(row => new Service(row));
    } catch (error) {
      logger.error('Error finding services by category:', error);
      throw error;
    }
  }

  static async findBySpecialty(clinicId, specialty, limit = 100, offset = 0) {
    try {
      const query = `
        SELECT * FROM services 
        WHERE clinic_id = $1 AND specialty = $2 AND status = 'active'
        ORDER BY name ASC 
        LIMIT $3 OFFSET $4
      `;
      
      const result = await db.query(query, [clinicId, specialty, limit, offset]);
      return result.rows.map(row => new Service(row));
    } catch (error) {
      logger.error('Error finding services by specialty:', error);
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
        UPDATE services 
        SET ${setClause}, updated_at = $${fields.length + 3}
        WHERE id = $1 AND clinic_id = $2 AND status != 'deleted'
        RETURNING *
      `;
      
      const result = await db.query(query, [id, clinicId, ...values, updateData.updated_at]);
      
      if (result.rows.length === 0) {
        throw new Error('Service not found or deleted');
      }
      
      logger.info('Service updated successfully', { 
        serviceId: id,
        clinicId: clinicId
      });
      return new Service(result.rows[0]);
    } catch (error) {
      logger.error('Error updating service:', error);
      throw error;
    }
  }

  static async delete(id, clinicId) {
    try {
      const query = `
        UPDATE services 
        SET status = 'deleted', updated_at = $3
        WHERE id = $1 AND clinic_id = $2 AND status != 'deleted'
        RETURNING *
      `;
      
      const result = await db.query(query, [id, clinicId, new Date()]);
      
      if (result.rows.length === 0) {
        throw new Error('Service not found or already deleted');
      }
      
      logger.info('Service deleted successfully', { 
        serviceId: id,
        clinicId: clinicId
      });
      return new Service(result.rows[0]);
    } catch (error) {
      logger.error('Error deleting service:', error);
      throw error;
    }
  }

  static async getCategories(clinicId) {
    try {
      const query = `
        SELECT DISTINCT category 
        FROM services 
        WHERE clinic_id = $1 AND status = 'active'
        ORDER BY category ASC
      `;
      
      const result = await db.query(query, [clinicId]);
      return result.rows.map(row => row.category);
    } catch (error) {
      logger.error('Error getting service categories:', error);
      throw error;
    }
  }

  static async getSpecialties(clinicId) {
    try {
      const query = `
        SELECT DISTINCT specialty 
        FROM services 
        WHERE clinic_id = $1 AND status = 'active' AND specialty IS NOT NULL
        ORDER BY specialty ASC
      `;
      
      const result = await db.query(query, [clinicId]);
      return result.rows.map(row => row.specialty);
    } catch (error) {
      logger.error('Error getting service specialties:', error);
      throw error;
    }
  }

  static async getServicesByDuration(clinicId, minDuration, maxDuration) {
    try {
      const query = `
        SELECT * FROM services 
        WHERE clinic_id = $1 AND status = 'active' 
        AND duration >= $2 AND duration <= $3
        ORDER BY duration ASC, name ASC
      `;
      
      const result = await db.query(query, [clinicId, minDuration, maxDuration]);
      return result.rows.map(row => new Service(row));
    } catch (error) {
      logger.error('Error getting services by duration:', error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      clinic_id: this.clinic_id,
      name: this.name,
      description: this.description,
      category: this.category,
      specialty: this.specialty,
      duration: this.duration,
      price: this.price,
      currency: this.currency,
      accepts_insurance: this.accepts_insurance,
      insurance_providers: this.insurance_providers,
      requires_referral: this.requires_referral,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Service;
