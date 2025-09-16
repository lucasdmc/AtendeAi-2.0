const User = require('../models/user');
const logger = require('../utils/logger');

class UserController {
  async createUser(req, res) {
    try {
      const userData = req.body;
      
      // Validações básicas
      if (!userData.name || !userData.login || !userData.role || !userData.clinic_id) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, login, role, clinic_id'
        });
      }

      // Verificar se o login já existe
      const existingUser = await User.findByLogin(userData.login);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this login already exists'
        });
      }

      const user = await User.create(userData);
      
      logger.info('User created successfully', { 
        userId: user.id,
        userName: user.name,
        userRole: user.role
      });
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user.toJSON()
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message
      });
    }
  }

  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      logger.error('Error getting user:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting user',
        error: error.message
      });
    }
  }

  async getUsersByClinic(req, res) {
    try {
      const { clinicId } = req.params;
      const users = await User.findByClinicId(clinicId);
      
      res.status(200).json({
        success: true,
        data: users.map(user => user.toJSON())
      });
    } catch (error) {
      logger.error('Error getting users by clinic:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting users by clinic',
        error: error.message
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await User.getAll();
      
      res.status(200).json({
        success: true,
        data: users.map(user => user.toJSON())
      });
    } catch (error) {
      logger.error('Error getting all users:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting all users',
        error: error.message
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Remover campos que não devem ser atualizados diretamente
      delete updateData.id;
      delete updateData.created_at;
      
      const user = await User.update(id, updateData);
      
      logger.info('User updated successfully', { 
        userId: id,
        updatedFields: Object.keys(updateData)
      });
      
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user.toJSON()
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.delete(id);
      
      logger.info('User deleted successfully', { 
        userId: id,
        deletedBy: req.user?.id || 'system'
      });
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: user.toJSON()
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
