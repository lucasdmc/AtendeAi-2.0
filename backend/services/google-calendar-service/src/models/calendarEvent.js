const db = require('../config/database');
const logger = require('../utils/logger');

class CalendarEvent {
  static async create(eventData) {
    const { 
      clinic_id, 
      appointment_id,
      google_event_id,
      title,
      description,
      start_time,
      end_time,
      timezone,
      attendees,
      location,
      status,
      metadata = {}
    } = eventData;

    const query = `
      INSERT INTO google_calendar_events (
        clinic_id, appointment_id, google_event_id, title, description,
        start_time, end_time, timezone, attendees, location, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        clinic_id, appointment_id, google_event_id, title, description,
        start_time, end_time, timezone, JSON.stringify(attendees), location, status, JSON.stringify(metadata)
      ]);
      
      logger.info('Google Calendar event created', { 
        event_id: result.rows[0].id,
        clinic_id,
        google_event_id,
        title,
        start_time
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating Google Calendar event', { error: error.message, eventData });
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM google_calendar_events WHERE id = $1';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding Google Calendar event by id', { error: error.message, id });
      throw error;
    }
  }

  static async findByGoogleEventId(google_event_id) {
    const query = 'SELECT * FROM google_calendar_events WHERE google_event_id = $1';

    try {
      const result = await db.query(query, [google_event_id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding Google Calendar event by Google Event ID', { error: error.message, google_event_id });
      throw error;
    }
  }

  static async findByAppointment(appointment_id) {
    const query = 'SELECT * FROM google_calendar_events WHERE appointment_id = $1';

    try {
      const result = await db.query(query, [appointment_id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding Google Calendar event by appointment', { error: error.message, appointment_id });
      throw error;
    }
  }

  static async findByClinic(clinic_id, start_date = null, end_date = null, limit = 100, offset = 0) {
    let query = 'SELECT * FROM google_calendar_events WHERE clinic_id = $1';
    const params = [clinic_id];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND start_time >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND end_time <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY start_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error finding Google Calendar events by clinic', { error: error.message, clinic_id, start_date, end_date });
      throw error;
    }
  }

  static async findUpcoming(clinic_id, hours = 24) {
    const query = `
      SELECT * FROM google_calendar_events 
      WHERE clinic_id = $1 
      AND start_time >= NOW() 
      AND start_time <= NOW() + INTERVAL '1 hour' * $2
      ORDER BY start_time ASC
    `;

    try {
      const result = await db.query(query, [clinic_id, hours]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding upcoming Google Calendar events', { error: error.message, clinic_id, hours });
      throw error;
    }
  }

  static async update(id, updateData) {
    const { 
      title, 
      description, 
      start_time, 
      end_time, 
      timezone,
      attendees,
      location,
      status,
      metadata 
    } = updateData;

    const query = `
      UPDATE google_calendar_events 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        start_time = COALESCE($3, start_time),
        end_time = COALESCE($4, end_time),
        timezone = COALESCE($5, timezone),
        attendees = COALESCE($6, attendees),
        location = COALESCE($7, location),
        status = COALESCE($8, status),
        metadata = COALESCE($9, metadata),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        title, 
        description, 
        start_time, 
        end_time, 
        timezone,
        attendees ? JSON.stringify(attendees) : null,
        location,
        status,
        metadata ? JSON.stringify(metadata) : null,
        id
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('Google Calendar event not found');
      }
      
      logger.info('Google Calendar event updated', { 
        event_id: id, 
        update_fields: Object.keys(updateData).filter(key => updateData[key] !== undefined)
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating Google Calendar event', { error: error.message, id, updateData });
      throw error;
    }
  }

  static async updateStatus(id, new_status, metadata = {}) {
    const query = `
      UPDATE google_calendar_events 
      SET status = $1, metadata = metadata || $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await db.query(query, [new_status, JSON.stringify(metadata), id]);
      
      if (result.rows.length === 0) {
        throw new Error('Google Calendar event not found');
      }
      
      logger.info('Google Calendar event status updated', { 
        event_id: id, 
        old_status: result.rows[0].status, 
        new_status 
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating Google Calendar event status', { error: error.message, id, new_status });
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM google_calendar_events WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Google Calendar event not found');
      }
      
      logger.info('Google Calendar event deleted', { event_id: id });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting Google Calendar event', { error: error.message, id });
      throw error;
    }
  }

  static async syncStatus(id, sync_result = {}) {
    const query = `
      UPDATE google_calendar_events 
      SET 
        sync_status = 'synced', 
        last_sync_at = NOW(),
        metadata = metadata || $1, 
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await db.query(query, [JSON.stringify(sync_result), id]);
      
      if (result.rows.length === 0) {
        throw new Error('Google Calendar event not found');
      }
      
      logger.info('Google Calendar event sync status updated', { event_id: id });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating Google Calendar event sync status', { error: error.message, id });
      throw error;
    }
  }

  static async getEventStats(clinic_id, start_date, end_date) {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM google_calendar_events
      WHERE clinic_id = $1 
      AND start_time >= $2 
      AND start_time <= $3
      GROUP BY status
      ORDER BY count DESC
    `;

    try {
      const result = await db.query(query, [clinic_id, start_date, end_date]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting Google Calendar event stats', { error: error.message, clinic_id, start_date, end_date });
      throw error;
    }
  }

  static async getConflicts(clinic_id, start_time, end_time, exclude_event_id = null) {
    let query = `
      SELECT * FROM google_calendar_events 
      WHERE clinic_id = $1 
      AND (
        (start_time < $2 AND end_time > $2) OR
        (start_time < $3 AND end_time > $3) OR
        (start_time >= $2 AND end_time <= $3)
      )
    `;
    
    const params = [clinic_id, start_time, end_time];
    
    if (exclude_event_id) {
      query += ' AND id != $4';
      params.push(exclude_event_id);
    }

    query += ' ORDER BY start_time ASC';

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error finding Google Calendar event conflicts', { error: error.message, clinic_id, start_time, end_time });
      throw error;
    }
  }

  static async getAvailableSlots(clinic_id, date, duration_minutes = 30) {
    const query = `
      SELECT 
        generate_series(
          $2::date + '08:00'::time,
          $2::date + '18:00'::time,
          interval '30 minutes'
        ) as slot_start,
        generate_series(
          $2::date + '08:00'::time + interval '30 minutes',
          $2::date + '18:00'::time + interval '30 minutes',
          interval '30 minutes'
        ) as slot_end
      EXCEPT
      SELECT 
        start_time,
        end_time
      FROM google_calendar_events
      WHERE clinic_id = $1 
      AND DATE(start_time) = $2
      AND status != 'cancelled'
    `;

    try {
      const result = await db.query(query, [clinic_id, date]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting available slots', { error: error.message, clinic_id, date });
      throw error;
    }
  }

  static async cleanupOldEvents(days_old = 365) {
    const query = `
      DELETE FROM google_calendar_events 
      WHERE start_time < CURRENT_DATE - INTERVAL '1 day' * $1
      AND status IN ('cancelled', 'completed')
      RETURNING id
    `;

    try {
      const result = await db.query(query, [days_old]);
      
      logger.info('Old Google Calendar events cleaned up', { 
        deleted_count: result.rows.length,
        days_old 
      });
      
      return result.rows.length;
    } catch (error) {
      logger.error('Error cleaning up old Google Calendar events', { error: error.message, days_old });
      throw error;
    }
  }
}

module.exports = CalendarEvent;
