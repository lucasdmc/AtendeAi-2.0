const db = require('../config/database');
const logger = require('../utils/logger');

class Professional {
  static async create(professionalData) {
    const { 
      clinic_id, 
      name, 
      crm = null,
      specialties = [],
      experience_years = 0,
      education = '',
      bio = '',
      accepts_new_patients = true,
      default_duration = 30,
      is_active = true
    } = professionalData;

    const query = `
      INSERT INTO professionals (
        clinic_id, name, crm, specialties, experience_years, 
        education, bio, accepts_new_patients, default_duration, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        clinic_id, name, crm, JSON.stringify(specialties), experience_years,
        education, bio, accepts_new_patients, default_duration, is_active
      ]);
      
      logger.info('Professional created', { 
        professional_id: result.rows[0].id,
        clinic_id,
        name,
        crm
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating professional', { error: error.message, professionalData });
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM professionals WHERE id = $1';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding professional by id', { error: error.message, id });
      throw error;
    }
  }

  static async findByClinic(clinic_id, is_active = true) {
    const query = `
      SELECT * FROM professionals 
      WHERE clinic_id = $1 AND is_active = $2
      ORDER BY name
    `;

    try {
      const result = await db.query(query, [clinic_id, is_active]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding professionals by clinic', { error: error.message, clinic_id });
      throw error;
    }
  }

  static async findBySpecialty(clinic_id, specialty) {
    const query = `
      SELECT * FROM professionals 
      WHERE clinic_id = $1 
      AND is_active = true
      AND specialties @> $2
      ORDER BY name
    `;

    try {
      const result = await db.query(query, [clinic_id, JSON.stringify([specialty])]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding professionals by specialty', { error: error.message, clinic_id, specialty });
      throw error;
    }
  }

  static async update(id, updateData) {
    const { 
      name, 
      crm, 
      specialties,
      experience_years, 
      education, 
      bio,
      accepts_new_patients, 
      default_duration, 
      is_active 
    } = updateData;

    const query = `
      UPDATE professionals 
      SET 
        name = COALESCE($1, name),
        crm = COALESCE($2, crm),
        specialties = COALESCE($3, specialties),
        experience_years = COALESCE($4, experience_years),
        education = COALESCE($5, education),
        bio = COALESCE($6, bio),
        accepts_new_patients = COALESCE($7, accepts_new_patients),
        default_duration = COALESCE($8, default_duration),
        is_active = COALESCE($9, is_active),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        name, crm, specialties ? JSON.stringify(specialties) : null, experience_years,
        education, bio, accepts_new_patients, default_duration, is_active, id
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('Professional not found');
      }
      
      logger.info('Professional updated', { 
        professional_id: id, 
        update_fields: Object.keys(updateData).filter(key => updateData[key] !== undefined)
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating professional', { error: error.message, id, updateData });
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM professionals WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Professional not found');
      }
      
      logger.info('Professional deleted', { professional_id: id });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting professional', { error: error.message, id });
      throw error;
    }
  }

  static async getSpecialties(clinic_id) {
    const query = `
      SELECT DISTINCT jsonb_array_elements_text(specialties) as specialty
      FROM professionals
      WHERE clinic_id = $1 AND is_active = true
      ORDER BY specialty
    `;

    try {
      const result = await db.query(query, [clinic_id]);
      return result.rows.map(row => row.specialty);
    } catch (error) {
      logger.error('Error getting professional specialties', { error: error.message, clinic_id });
      throw error;
    }
  }

  static async getProfessionalStats(clinic_id) {
    const query = `
      SELECT 
        COUNT(*) as total_professionals,
        COUNT(*) FILTER (WHERE is_active = true) as active_professionals,
        COUNT(*) FILTER (WHERE accepts_new_patients = true) as accepting_patients,
        AVG(experience_years) as avg_experience,
        AVG(default_duration) as avg_duration
      FROM professionals
      WHERE clinic_id = $1
    `;

    try {
      const result = await db.query(query, [clinic_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting professional stats', { error: error.message, clinic_id });
      throw error;
    }
  }

  static async searchProfessionals(clinic_id, searchTerm, limit = 20) {
    const query = `
      SELECT * FROM professionals 
      WHERE clinic_id = $1 
      AND is_active = true
      AND (
        name ILIKE $2 
        OR crm ILIKE $2 
        OR specialties::text ILIKE $2
        OR education ILIKE $2
      )
      ORDER BY 
        CASE 
          WHEN name ILIKE $2 THEN 1
          WHEN crm ILIKE $2 THEN 2
          ELSE 3
        END,
        name
      LIMIT $3
    `;

    try {
      const result = await db.query(query, [clinic_id, `%${searchTerm}%`, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error searching professionals', { error: error.message, clinic_id, searchTerm });
      throw error;
    }
  }

  static async getAvailableProfessionals(clinic_id, service_id, date, time) {
    const query = `
      SELECT p.*, s.name as service_name, s.duration as service_duration
      FROM professionals p
      JOIN services s ON s.clinic_id = p.clinic_id
      WHERE p.clinic_id = $1 
      AND s.id = $2
      AND p.is_active = true
      AND p.accepts_new_patients = true
      AND NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.professional_id = p.id
        AND a.scheduled_date = $3
        AND a.scheduled_time = $4
        AND a.status NOT IN ('cancelled', 'no_show')
      )
      ORDER BY p.name
    `;

    try {
      const result = await db.query(query, [clinic_id, service_id, date, time]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting available professionals', { error: error.message, clinic_id, service_id, date, time });
      throw error;
    }
  }

  static async getProfessionalSchedule(clinic_id, professional_id, start_date, end_date) {
    const query = `
      SELECT 
        a.scheduled_date,
        a.scheduled_time,
        a.duration,
        a.status,
        s.name as service_name,
        CONCAT(pa.patient_name, ' (', pa.patient_phone, ')') as patient_info
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN patients pa ON a.patient_phone = pa.phone
      WHERE a.clinic_id = $1 
      AND a.professional_id = $2
      AND a.scheduled_date >= $3
      AND a.scheduled_date <= $4
      ORDER BY a.scheduled_date, a.scheduled_time
    `;

    try {
      const result = await db.query(query, [clinic_id, professional_id, start_date, end_date]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting professional schedule', { error: error.message, clinic_id, professional_id, start_date, end_date });
      throw error;
    }
  }
}

module.exports = Professional;
