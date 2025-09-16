const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.login = data.login;
    this.password = data.password;
    this.role = data.role;
    this.clinic_id = data.clinic_id;
    this.status = data.status || 'active';
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      login: this.login,
      role: this.role,
      clinic_id: this.clinic_id,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  static async create(userData) {
    try {
      const query = `
        INSERT INTO users (id, name, login, password, role, clinic_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        userData.id || uuidv4(),
        userData.name,
        userData.login,
        userData.password,
        userData.role,
        userData.clinic_id,
        userData.status || 'active',
        new Date(),
        new Date()
      ];
      
      const result = await db.query(query, values);
      
      logger.info('User created successfully', { 
        userId: result.rows[0].id,
        userName: result.rows[0].name,
        userRole: result.rows[0].role
      });
      
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE id = $1 AND status != 'deleted'
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async findByClinicId(clinicId) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE clinic_id = $1 AND status != 'deleted'
        ORDER BY created_at DESC
      `;
      
      const result = await db.query(query, [clinicId]);
      
      return result.rows.map(row => new User(row));
    } catch (error) {
      logger.error('Error finding users by clinic ID:', error);
      throw error;
    }
  }

  static async findByLogin(login) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE login = $1 AND status != 'deleted'
      `;
      
      const result = await db.query(query, [login]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error finding user by login:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      // Construir query dinamicamente baseado nos campos fornecidos
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      // Adicionar updated_at
      fields.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      // Adicionar WHERE clause
      values.push(id);

      const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount} AND status != 'deleted'
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found or already deleted');
      }
      
      logger.info('User updated successfully', { 
        userId: id,
        updatedFields: Object.keys(updateData)
      });
      
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = `
        UPDATE users 
        SET status = 'deleted', updated_at = $2
        WHERE id = $1 AND status != 'deleted'
        RETURNING *
      `;
      
      const result = await db.query(query, [id, new Date()]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found or already deleted');
      }
      
      logger.info('User deleted successfully', { userId: id });
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const query = `
        SELECT * FROM users 
        WHERE status != 'deleted'
        ORDER BY created_at DESC
      `;
      
      const result = await db.query(query);
      
      return result.rows.map(row => new User(row));
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }
}

module.exports = User;
