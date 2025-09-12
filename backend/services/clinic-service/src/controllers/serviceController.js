const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// GET /api/clinics/:clinicId/services
const getServices = async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    logger.info('Getting services for clinic', { clinicId });
    
    // Mock data for now
    const services = [
      {
        id: '1',
        name: 'Consulta de Cardiologia',
        description: 'Consulta médica especializada em cardiologia',
        duration: 30,
        price: 150.00,
        clinic_id: clinicId,
        status: 'active'
      },
      {
        id: '2',
        name: 'Consulta de Dermatologia', 
        description: 'Consulta médica especializada em dermatologia',
        duration: 45,
        price: 120.00,
        clinic_id: clinicId,
        status: 'active'
      }
    ];

    res.json({
      success: true,
      data: services
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
    
    // Mock data for now
    const service = {
      id: id,
      name: 'Consulta de Cardiologia',
      description: 'Consulta médica especializada em cardiologia',
      duration: 30,
      price: 150.00,
      clinic_id: clinicId,
      status: 'active'
    };

    res.json({
      success: true,
      data: service
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
