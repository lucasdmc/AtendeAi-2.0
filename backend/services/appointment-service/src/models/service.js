const db = require('../config/database');
const logger = require('../utils/logger');

class Service {
  static async create(serviceData) {
    const { 
      clinic_id, 
      name, 
      description, 
      category,
      duration = 30, 
      price = 0, 
      accepts_insurance = false,
      insurance_providers = [],
      is_active = true
    } = serviceData;

    const query = `
      INSERT INTO services (
        clinic_id, name, description, category, duration, 
        price, accepts_insurance, insurance_providers, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        clinic_id, name, description, category, duration,
        price, accepts_insurance, JSON.stringify(insurance_providers), is_active
      ]);
      
      logger.info('Service created', { 
        service_id: result.rows[0].id,
        clinic_id,
        name,
        category
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating service', { error: error.message, serviceData });
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM services WHERE id = $1';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding service by id', { error: error.message, id });
      throw error;
    }
  }

  static async findByClinic(clinic_id, category = null, is_active = true) {
    let query = 'SELECT * FROM services WHERE clinic_id = $1';
    const params = [clinic_id];
    let paramIndex = 2;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (is_active !== null) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active);
    }

    query += ' ORDER BY category, name';

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error finding services by clinic', { error: error.message, clinic_id });
      throw error;
    }
  }

  static async findByCategory(clinic_id, category) {
    const query = `
      SELECT * FROM services 
      WHERE clinic_id = $1 AND category = $2 AND is_active = true
      ORDER BY name
    `;

    try {
      const result = await db.query(query, [clinic_id, category]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding services by category', { error: error.message, clinic_id, category });
      throw error;
    }
  }

  static async update(id, updateData) {
    const { 
      name, 
      description, 
      category,
      duration, 
      price, 
      accepts_insurance,
      insurance_providers, 
      is_active 
    } = updateData;

    const query = `
      UPDATE services 
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        duration = COALESCE($4, duration),
        price = COALESCE($5, price),
        accepts_insurance = COALESCE($6, accepts_insurance),
        insurance_providers = COALESCE($7, insurance_providers),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        name, description, category, duration, price,
        accepts_insurance, insurance_providers ? JSON.stringify(insurance_providers) : null, is_active, id
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('Service not found');
      }
      
      logger.info('Service updated', { 
        service_id: id, 
        update_fields: Object.keys(updateData).filter(key => updateData[key] !== undefined)
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating service', { error: error.message, id, updateData });
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM services WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Service not found');
      }
      
      logger.info('Service deleted', { service_id: id });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting service', { error: error.message, id });
      throw error;
    }
  }

  static async getCategories(clinic_id) {
    const query = `
      SELECT DISTINCT category 
      FROM services 
      WHERE clinic_id = $1 AND is_active = true
      ORDER BY category
    `;

    try {
      const result = await db.query(query, [clinic_id]);
      return result.rows.map(row => row.category);
    } catch (error) {
      logger.error('Error getting service categories', { error: error.message, clinic_id });
      throw error;
    }
  }

  static async getServiceStats(clinic_id) {
    const query = `
      SELECT 
        category,
        COUNT(*) as total_services,
        COUNT(*) FILTER (WHERE is_active = true) as active_services,
        AVG(duration) as avg_duration,
        AVG(price) as avg_price
      FROM services
      WHERE clinic_id = $1
      GROUP BY category
      ORDER BY category
    `;

    try {
      const result = await db.query(query, [clinic_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting service stats', { error: error.message, clinic_id });
      throw error;
    }
  }

  static async searchServices(clinic_id, searchTerm, limit = 20) {
    const query = `
      SELECT * FROM services 
      WHERE clinic_id = $1 
      AND is_active = true
      AND (
        name ILIKE $2 
        OR description ILIKE $2 
        OR category ILIKE $2
      )
      ORDER BY 
        CASE 
          WHEN name ILIKE $2 THEN 1
          WHEN category ILIKE $2 THEN 2
          ELSE 3
        END,
        name
      LIMIT $3
    `;

    try {
      const result = await db.query(query, [clinic_id, `%${searchTerm}%`, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error searching services', { error: error.message, clinic_id, searchTerm });
      throw error;
    }
  }

  static async getServicesForAppointment(clinic_id, date, time) {
    const query = `
      SELECT s.*, 
             COALESCE(p.name, 'Disponível') as professional_name,
             p.id as professional_id
      FROM services s
      LEFT JOIN professionals p ON s.clinic_id = p.clinic_id
      WHERE s.clinic_id = $1 
      AND s.is_active = true
      AND p.is_active = true
      ORDER BY s.category, s.name, p.name
    `;

    try {
      const result = await db.query(query, [clinic_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting services for appointment', { error: error.message, clinic_id, date, time });
      throw error;
    }
  }
}

module.exports = Service;
