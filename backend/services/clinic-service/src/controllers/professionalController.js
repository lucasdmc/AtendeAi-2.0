const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// GET /api/clinics/:clinicId/professionals
const getProfessionals = async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    logger.info('Getting professionals for clinic', { clinicId });
    
    // Mock data for now
    const professionals = [
      {
        id: '1',
        name: 'Dr. João Silva',
        specialty: 'Cardiologia',
        clinic_id: clinicId,
        status: 'active'
      },
      {
        id: '2', 
        name: 'Dra. Maria Santos',
        specialty: 'Dermatologia',
        clinic_id: clinicId,
        status: 'active'
      }
    ];

    res.json({
      success: true,
      data: professionals
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
    
    // Mock data for now
    const professional = {
      id: id,
      name: 'Dr. João Silva',
      specialty: 'Cardiologia',
      clinic_id: clinicId,
      status: 'active'
    };

    res.json({
      success: true,
      data: professional
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
