// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO - AUTH SERVICE
// ATENDEAI 2.0 - ENTREGÁVEL 1
// =====================================================

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO JWT
# =====================================================
const authenticateJWT = (req, res, next) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('Authentication failed: No authorization header', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      
      return res.status(401).json({
        success: false,
        error: 'No authorization header',
      });
    }

    // Verificar formato do header
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Authentication failed: Invalid authorization header format', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        header: authHeader,
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization header format',
      });
    }

    const token = parts[1];

    // Verificar se o token não está vazio
    if (!token) {
      logger.warn('Authentication failed: Empty token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      
      return res.status(401).json({
        success: false,
        error: 'Empty token',
      });
    }

    // Verificar JWT
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'atendeai',
        audience: 'atendeai-users',
      });
    } catch (jwtError) {
      logger.warn('Authentication failed: JWT verification failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        error: jwtError.message,
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        details: jwtError.message,
      });
    }

    // Verificar se é um access token
    if (decoded.type !== 'access') {
      logger.warn('Authentication failed: Wrong token type', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        tokenType: decoded.type,
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid token type',
      });
    }

    // Verificar se o token não expirou
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      logger.warn('Authentication failed: Token expired', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        userId: decoded.sub,
      });
      
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }

    // Verificar se o token não foi emitido no futuro
    if (decoded.iat && Date.now() < decoded.iat * 1000) {
      logger.warn('Authentication failed: Token issued in future', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        userId: decoded.sub,
        issuedAt: new Date(decoded.iat * 1000),
      });
      
      return res.status(401).json({
        success: false,
        error: 'Token issued in future',
      });
    }

    // Verificar se o token não foi emitido antes do tempo permitido
    const maxAge = 24 * 60 * 60; // 24 horas
    if (decoded.iat && Date.now() - decoded.iat * 1000 > maxAge * 1000) {
      logger.warn('Authentication failed: Token too old', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        userId: decoded.sub,
        issuedAt: new Date(decoded.iat * 1000),
        age: Math.floor((Date.now() - decoded.iat * 1000) / 1000 / 60),
      });
      
      return res.status(401).json({
        success: false,
        error: 'Token too old',
      });
    }

    // Verificar se o usuário tem ID válido
    if (!decoded.sub || typeof decoded.sub !== 'string') {
      logger.warn('Authentication failed: Invalid user ID in token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        userId: decoded.sub,
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid user ID in token',
      });
    }

    // Verificar se o usuário tem email válido
    if (!decoded.email || typeof decoded.email !== 'string') {
      logger.warn('Authentication failed: Invalid email in token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        userId: decoded.sub,
        email: decoded.email,
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid email in token',
      });
    }

    // Verificar se o usuário tem clinicId válido
    if (!decoded.clinicId || typeof decoded.clinicId !== 'string') {
      logger.warn('Authentication failed: Invalid clinic ID in token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        userId: decoded.sub,
        clinicId: decoded.clinicId,
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid clinic ID in token',
      });
    }

    // Verificar se o usuário tem roles válidos
    if (!Array.isArray(decoded.roles)) {
      logger.warn('Authentication failed: Invalid roles in token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        userId: decoded.sub,
        roles: decoded.roles,
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid roles in token',
      });
    }

    // Adicionar informações do usuário ao request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      clinicId: decoded.clinicId,
      roles: decoded.roles,
      jti: decoded.jti, // JWT ID para tracking
      iat: decoded.iat, // Issued at
      exp: decoded.exp, // Expiration
    };

    // Log de autenticação bem-sucedida
    logger.info('Authentication successful', {
      userId: decoded.sub,
      email: decoded.email,
      clinicId: decoded.clinicId,
      roles: decoded.roles,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
    });

    next();

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// =====================================================
// MIDDLEWARE DE VERIFICAÇÃO DE PERMISSÕES
# =====================================================
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Verificar se o usuário tem a permissão necessária
      // Esta verificação será feita no banco de dados na rota de validação
      // Por enquanto, apenas verificamos se o usuário está autenticado
      
      logger.debug('Permission check', {
        userId: req.user.id,
        email: req.user.email,
        clinicId: req.user.clinicId,
        requiredPermission: permission,
        path: req.path,
        method: req.method,
      });

      next();

    } catch (error) {
      logger.error('Permission middleware error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

// =====================================================
// MIDDLEWARE DE VERIFICAÇÃO DE ROLES
# =====================================================
const requireRole = (role) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Verificar se o usuário tem o role necessário
      if (!req.user.roles.includes(role)) {
        logger.warn('Role check failed', {
          userId: req.user.id,
          email: req.user.email,
          clinicId: req.user.clinicId,
          userRoles: req.user.roles,
          requiredRole: role,
          path: req.path,
          method: req.method,
        });
        
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          details: `Role '${role}' required`,
        });
      }

      logger.debug('Role check passed', {
        userId: req.user.id,
        email: req.user.email,
        clinicId: req.user.clinicId,
        userRoles: req.user.roles,
        requiredRole: role,
        path: req.path,
        method: req.method,
      });

      next();

    } catch (error) {
      logger.error('Role middleware error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

// =====================================================
// MIDDLEWARE DE VERIFICAÇÃO DE CLÍNICA
# =====================================================
const requireClinicAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Verificar se o usuário está tentando acessar sua própria clínica
    const requestClinicId = req.params.clinicId || req.body.clinicId || req.query.clinicId;
    
    if (requestClinicId && requestClinicId !== req.user.clinicId) {
      logger.warn('Clinic access check failed', {
        userId: req.user.id,
        email: req.user.email,
        userClinicId: req.user.clinicId,
        requestClinicId: requestClinicId,
        path: req.path,
        method: req.method,
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access denied to clinic',
        details: 'You can only access your own clinic',
      });
    }

    logger.debug('Clinic access check passed', {
      userId: req.user.id,
      email: req.user.email,
      clinicId: req.user.clinicId,
      path: req.path,
      method: req.method,
    });

    next();

  } catch (error) {
    logger.error('Clinic access middleware error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// =====================================================
// MIDDLEWARE DE RATE LIMITING ESPECÍFICO
# =====================================================
const rateLimitByUser = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next();
      }

      const key = `rate_limit:${req.user.id}:${req.user.clinicId}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Limpar requests antigos
      if (requests.has(key)) {
        requests.set(key, requests.get(key).filter(timestamp => timestamp > windowStart));
      } else {
        requests.set(key, []);
      }

      const userRequests = requests.get(key);

      // Verificar se o usuário excedeu o limite
      if (userRequests.length >= max) {
        logger.warn('Rate limit exceeded by user', {
          userId: req.user.id,
          email: req.user.email,
          clinicId: req.user.clinicId,
          path: req.path,
          method: req.method,
          limit: max,
          windowMs: windowMs / 1000 / 60,
        });
        
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          details: `Maximum ${max} requests per ${windowMs / 1000 / 60} minutes`,
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      // Adicionar request atual
      userRequests.push(now);
      requests.set(key, userRequests);

      next();

    } catch (error) {
      logger.error('Rate limiting middleware error:', error);
      next();
    }
  };
};

// =====================================================
// MIDDLEWARE DE LOGGING DE REQUESTS AUTENTICADOS
# =====================================================
const logAuthenticatedRequest = (req, res, next) => {
  try {
    if (req.user) {
      logger.info('Authenticated request', {
        userId: req.user.id,
        email: req.user.email,
        clinicId: req.user.clinicId,
        roles: req.user.roles,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });
    }
    
    next();
  } catch (error) {
    logger.error('Logging middleware error:', error);
    next();
  }
};

// =====================================================
// EXPORTAR
# =====================================================
module.exports = {
  authenticateJWT,
  requirePermission,
  requireRole,
  requireClinicAccess,
  rateLimitByUser,
  logAuthenticatedRequest,
};
