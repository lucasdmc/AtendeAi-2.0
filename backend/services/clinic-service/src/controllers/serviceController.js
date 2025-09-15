const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const database = require('../config/database');

// GET /api/clinics/:clinicId/services
const getServices = async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    logger.info('Getting services for clinic', { clinicId });
    
    // Buscar serviços reais do banco de dados
    const query = `
      SELECT id, name, description, duration, price, clinic_id, status, created_at, updated_at
      FROM atendeai.services 
      WHERE clinic_id = $1 AND status = 'active'
      ORDER BY name
    `;
    
    const result = await database.query(query, [clinicId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error getting services:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// GET /api/clinics/:clinicId/services/:id
const getService = async (req, res) => {
  try {
    const { clinicId, id } = req.params;
    
    logger.info('Getting service', { clinicId, id });
    
    // Buscar serviço específico do banco de dados
    const query = `
      SELECT id, name, description, duration, price, clinic_id, status, created_at, updated_at
      FROM atendeai.services 
      WHERE id = $1 AND clinic_id = $2 AND status = 'active'
    `;
    
    const result = await database.query(query, [id, clinicId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error getting service:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getServices,
  getService
};
