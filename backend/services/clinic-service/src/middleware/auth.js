const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        logger.warn('Invalid token provided', { 
          error: err.message,
          requestId: req.id 
        });
        
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      req.user = decoded;
      req.clinicId = decoded.clinic_id;
      
      logger.debug('Token authenticated successfully', { 
        userId: decoded.user_id,
        clinicId: decoded.clinic_id,
        requestId: req.id 
      });
      
      next();
    });
    
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(userRole)) {
        logger.warn('Insufficient permissions', { 
          userId: req.user.user_id,
          userRole: userRole,
          requiredRoles: allowedRoles,
          requestId: req.id 
        });
        
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
      
      logger.debug('Role check passed', { 
        userId: req.user.user_id,
        userRole: userRole,
        requiredRoles: allowedRoles,
        requestId: req.id 
      });
      
      next();
      
    } catch (error) {
      logger.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

const requireClinicAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userClinicId = req.user.clinic_id;
    const requestedClinicId = req.params.clinicId || req.params.id;
    
    if (!userClinicId || !requestedClinicId) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID required'
      });
    }
    
    if (userClinicId !== requestedClinicId) {
      logger.warn('Clinic access denied', { 
        userId: req.user.user_id,
        userClinicId: userClinicId,
        requestedClinicId: requestedClinicId,
        requestId: req.id 
      });
      
      return res.status(403).json({
        success: false,
        message: 'Access denied to this clinic'
      });
    }
    
    logger.debug('Clinic access granted', { 
      userId: req.user.user_id,
      clinicId: userClinicId,
      requestId: req.id 
    });
    
    next();
    
  } catch (error) {
    logger.error('Clinic access middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      jwt.verify(token, config.jwt.secret, (err, decoded) => {
        if (!err) {
          req.user = decoded;
          req.clinicId = decoded.clinic_id;
          logger.debug('Optional authentication successful', { 
            userId: decoded.user_id,
            clinicId: decoded.clinic_id,
            requestId: req.id 
          });
        }
        next();
      });
    } else {
      next();
    }
    
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireClinicAccess,
  optionalAuth
};
