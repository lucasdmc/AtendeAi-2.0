const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const database = require('../config/database');

// GET /api/clinics/:clinicId/professionals
const getProfessionals = async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    logger.info('Getting professionals for clinic', { clinicId });
    
    // Buscar profissionais reais do banco de dados
    const query = `
      SELECT id, name, specialty, clinic_id, status, created_at, updated_at
      FROM atendeai.professionals 
      WHERE clinic_id = $1 AND status = 'active'
      ORDER BY name
    `;
    
    const result = await database.query(query, [clinicId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error getting professionals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// GET /api/clinics/:clinicId/professionals/:id
const getProfessional = async (req, res) => {
  try {
    const { clinicId, id } = req.params;
    
    logger.info('Getting professional', { clinicId, id });
    
    // Buscar profissional específico do banco de dados
    const query = `
      SELECT id, name, specialty, clinic_id, status, created_at, updated_at
      FROM atendeai.professionals 
      WHERE id = $1 AND clinic_id = $2 AND status = 'active'
    `;
    
    const result = await database.query(query, [id, clinicId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error getting professional:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getProfessionals,
  getProfessional
};
