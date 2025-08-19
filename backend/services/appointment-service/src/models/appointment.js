const db = require('../config/database');
const logger = require('../utils/logger');

class Appointment {
  static async create(appointmentData) {
    const { 
      clinic_id, 
      patient_name, 
      patient_phone, 
      patient_email,
      service_id, 
      professional_id, 
      scheduled_date, 
      scheduled_time,
      duration = 30,
      status = 'pending',
      notes = '',
      source = 'whatsapp'
    } = appointmentData;

    const query = `
      INSERT INTO appointments (
        clinic_id, patient_name, patient_phone, patient_email, 
        service_id, professional_id, scheduled_date, scheduled_time, 
        duration, status, notes, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        clinic_id, patient_name, patient_phone, patient_email,
        service_id, professional_id, scheduled_date, scheduled_time,
        duration, status, notes, source
      ]);
      
      logger.info('Appointment created', { 
        appointment_id: result.rows[0].id,
        clinic_id,
        patient_phone,
        scheduled_date,
        status
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating appointment', { error: error.message, appointmentData });
      throw error;
    }
  }

  static async findById(id) {
    const query = `
      SELECT a.*, s.name as service_name, p.name as professional_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN professionals p ON a.professional_id = p.id
      WHERE a.id = $1
    `;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding appointment by id', { error: error.message, id });
      throw error;
    }
  }

  static async findByClinic(clinic_id, limit = 50, offset = 0, status = null) {
    let query = `
      SELECT a.*, s.name as service_name, p.name as professional_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN professionals p ON a.professional_id = p.id
      WHERE a.clinic_id = $1
    `;
    
    const params = [clinic_id];
    let paramIndex = 2;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY a.scheduled_date DESC, a.scheduled_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error finding appointments by clinic', { error: error.message, clinic_id });
      throw error;
    }
  }

  static async findByPatient(clinic_id, patient_phone, limit = 50, offset = 0) {
    const query = `
      SELECT a.*, s.name as service_name, p.name as professional_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN professionals p ON a.professional_id = p.id
      WHERE a.clinic_id = $1 AND a.patient_phone = $2
      ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
      LIMIT $3 OFFSET $4
    `;

    try {
      const result = await db.query(query, [clinic_id, patient_phone, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding appointments by patient', { error: error.message, clinic_id, patient_phone });
      throw error;
    }
  }

  static async findByDateRange(clinic_id, start_date, end_date, status = null) {
    let query = `
      SELECT a.*, s.name as service_name, p.name as professional_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN professionals p ON a.professional_id = p.id
      WHERE a.clinic_id = $1 
      AND a.scheduled_date >= $2 
      AND a.scheduled_date <= $3
    `;
    
    const params = [clinic_id, start_date, end_date];
    let paramIndex = 4;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
    }

    query += ` ORDER BY a.scheduled_date ASC, a.scheduled_time ASC`;

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error finding appointments by date range', { error: error.message, clinic_id, start_date, end_date });
      throw error;
    }
  }

  static async updateStatus(id, new_status, notes = '') {
    const query = `
      UPDATE appointments 
      SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await db.query(query, [new_status, notes, id]);
      
      if (result.rows.length === 0) {
        throw new Error('Appointment not found');
      }
      
      logger.info('Appointment status updated', { 
        appointment_id: id, 
        old_status: result.rows[0].status, 
        new_status 
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating appointment status', { error: error.message, id, new_status });
      throw error;
    }
  }

  static async update(id, updateData) {
    const { 
      patient_name, 
      patient_phone, 
      patient_email,
      service_id, 
      professional_id, 
      scheduled_date, 
      scheduled_time,
      duration, 
      status, 
      notes 
    } = updateData;

    const query = `
      UPDATE appointments 
      SET 
        patient_name = COALESCE($1, patient_name),
        patient_phone = COALESCE($2, patient_phone),
        patient_email = COALESCE($3, patient_email),
        service_id = COALESCE($4, service_id),
        professional_id = COALESCE($5, professional_id),
        scheduled_date = COALESCE($6, scheduled_date),
        scheduled_time = COALESCE($7, scheduled_time),
        duration = COALESCE($8, duration),
        status = COALESCE($9, status),
        notes = COALESCE($10, notes),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        patient_name, patient_phone, patient_email,
        service_id, professional_id, scheduled_date, scheduled_time,
        duration, status, notes, id
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('Appointment not found');
      }
      
      logger.info('Appointment updated', { 
        appointment_id: id, 
        update_fields: Object.keys(updateData).filter(key => updateData[key] !== undefined)
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating appointment', { error: error.message, id, updateData });
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM appointments WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Appointment not found');
      }
      
      logger.info('Appointment deleted', { appointment_id: id });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting appointment', { error: error.message, id });
      throw error;
    }
  }

  static async getAvailableSlots(clinic_id, service_id, professional_id, date) {
    const query = `
      SELECT 
        generate_series(
          '08:00'::time, 
          '18:00'::time, 
          '30 minutes'::interval
        )::time as slot_time
      EXCEPT
      SELECT scheduled_time
      FROM appointments
      WHERE clinic_id = $1 
      AND service_id = $2 
      AND professional_id = $3 
      AND scheduled_date = $4
      AND status NOT IN ('cancelled', 'no_show')
      ORDER BY slot_time
    `;

    try {
      const result = await db.query(query, [clinic_id, service_id, professional_id, date]);
      return result.rows.map(row => row.slot_time);
    } catch (error) {
      logger.error('Error getting available slots', { error: error.message, clinic_id, service_id, professional_id, date });
      throw error;
    }
  }

  static async getDailyCount(clinic_id, date) {
    const query = `
      SELECT COUNT(*) as total_appointments
      FROM appointments
      WHERE clinic_id = $1 
      AND scheduled_date = $2
      AND status NOT IN ('cancelled', 'no_show')
    `;

    try {
      const result = await db.query(query, [clinic_id, date]);
      return parseInt(result.rows[0].total_appointments);
    } catch (error) {
      logger.error('Error getting daily appointment count', { error: error.message, clinic_id, date });
      throw error;
    }
  }

  static async getUpcomingAppointments(clinic_id, patient_phone, limit = 5) {
    const query = `
      SELECT a.*, s.name as service_name, p.name as professional_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN professionals p ON a.professional_id = p.id
      WHERE a.clinic_id = $1 
      AND a.patient_phone = $2
      AND a.scheduled_date >= CURRENT_DATE
      AND a.status NOT IN ('cancelled', 'no_show', 'completed')
      ORDER BY a.scheduled_date ASC, a.scheduled_time ASC
      LIMIT $3
    `;

    try {
      const result = await db.query(query, [clinic_id, patient_phone, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting upcoming appointments', { error: error.message, clinic_id, patient_phone });
      throw error;
    }
  }

  static async getAppointmentStats(clinic_id, start_date, end_date) {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM appointments
      WHERE clinic_id = $1 
      AND scheduled_date >= $2 
      AND scheduled_date <= $3
      GROUP BY status
      ORDER BY count DESC
    `;

    try {
      const result = await db.query(query, [clinic_id, start_date, end_date]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting appointment stats', { error: error.message, clinic_id, start_date, end_date });
      throw error;
    }
  }
}

module.exports = Appointment;
