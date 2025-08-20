// =====================================================
// ROTAS DE AUTENTICAÇÃO - AUTH SERVICE
// ATENDEAI 2.0 - ENTREGÁVEL 1
// =====================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

const config = require('../config');
const database = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// =====================================================
// VALIDAÇÕES
// =====================================================

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('clinicId').isUUID(),
];

const validateRefresh = [
  body('refreshToken').notEmpty(),
  body('clinicId').isUUID(),
];

const validateLogout = [
  body('refreshToken').notEmpty(),
  body('clinicId').isUUID(),
];

// =====================================================
// ROTA DE LOGIN
// =====================================================
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Verificar validações
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { email, password, clinicId } = req.body;
    const startTime = Date.now();

    logger.info('Login attempt', { email, clinicId, ip: req.ip });

    // Verificar se a clínica existe e está ativa
    const clinicQuery = `
      SELECT id, name, status 
      FROM atendeai.clinics 
      WHERE id = $1 AND status = 'active'
    `;
    const clinicResult = await database.query(clinicQuery, [clinicId]);
    
    if (clinicResult.rows.length === 0) {
      logger.warn('Login failed: Invalid clinic', { email, clinicId });
      return res.status(401).json({
        success: false,
        error: 'Invalid clinic or clinic inactive',
      });
    }

    // Buscar usuário
    const userQuery = `
      SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.status,
             u.clinic_id, u.last_login_at,
             array_agg(r.name) as roles
      FROM atendeai.users u
      LEFT JOIN atendeai.user_roles ur ON u.id = ur.user_id
      LEFT JOIN atendeai.roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u.clinic_id = $2
      GROUP BY u.id, u.email, u.password_hash, u.first_name, u.last_name, u.status, u.clinic_id, u.last_login_at
    `;
    
    const userResult = await database.query(userQuery, [email, clinicId]);
    
    if (userResult.rows.length === 0) {
      logger.warn('Login failed: User not found', { email, clinicId });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const user = userResult.rows[0];

    // Verificar se usuário está ativo
    if (user.status !== 'active') {
      logger.warn('Login failed: User inactive', { email, clinicId, status: user.status });
      return res.status(401).json({
        success: false,
        error: 'User account is inactive',
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      logger.warn('Login failed: Invalid password', { email, clinicId });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Gerar tokens
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        clinicId: user.clinic_id,
        roles: user.roles.filter(r => r !== null),
        type: 'access',
      },
      config.jwt.secret,
      { 
        expiresIn: config.jwt.accessTokenExpiry,
        issuer: 'atendeai',
        audience: 'atendeai-users',
        jwtid: uuidv4(),
      }
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        clinicId: user.clinic_id,
        type: 'refresh',
      },
      config.jwt.secret,
      { 
        expiresIn: config.jwt.refreshTokenExpiry,
        issuer: 'atendeai',
        audience: 'atendeai-users',
        jwtid: uuidv4(),
      }
    );

    // Salvar refresh token no Redis
    const refreshTokenKey = `refresh_token:${user.id}:${clinicId}`;
    await redis.set(refreshTokenKey, refreshToken, 7 * 24 * 60 * 60); // 7 dias

    // Atualizar último login
    const updateLoginQuery = `
      UPDATE atendeai.users 
      SET last_login_at = NOW() 
      WHERE id = $1
    `;
    await database.query(updateLoginQuery, [user.id]);

    // Log de auditoria
    logger.info('Login successful', {
      userId: user.id,
      email: user.email,
      clinicId: user.clinic_id,
      roles: user.roles.filter(r => r !== null),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Log de auditoria no banco
    const auditQuery = `
      INSERT INTO atendeai.audit_logs (clinic_id, user_id, action, resource, details, ip_address, user_agent)
      VALUES ($1, $2, 'login', 'auth', $3, $4, $5)
    `;
    await database.query(auditQuery, [
      clinicId,
      user.id,
      JSON.stringify({ success: true, roles: user.roles.filter(r => r !== null) }),
      req.ip,
      req.get('User-Agent'),
    ]);

    const responseTime = Date.now() - startTime;
    logger.info('Login completed', { email, responseTime });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          roles: user.roles.filter(r => r !== null),
          clinicId: user.clinic_id,
        },
      },
      message: 'Login successful',
    });

  } catch (error) {
    logger.error('Login error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =====================================================
// ROTA DE REFRESH TOKEN
// =====================================================
router.post('/refresh', validateRefresh, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { refreshToken, clinicId } = req.body;

    // Verificar se o refresh token está no Redis
    const refreshTokenKey = `refresh_token:${clinicId}`;
    const storedToken = await redis.get(refreshTokenKey);
    
    if (!storedToken || storedToken !== refreshToken) {
      logger.warn('Refresh failed: Invalid token', { clinicId });
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    // Verificar JWT
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.secret);
    } catch (jwtError) {
      logger.warn('Refresh failed: JWT verification failed', { clinicId, error: jwtError.message });
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    // Verificar se é um refresh token
    if (decoded.type !== 'refresh') {
      logger.warn('Refresh failed: Wrong token type', { clinicId, type: decoded.type });
      return res.status(401).json({
        success: false,
        error: 'Invalid token type',
      });
    }

    // Verificar se a clínica corresponde
    if (decoded.clinicId !== clinicId) {
      logger.warn('Refresh failed: Clinic mismatch', { 
        tokenClinicId: decoded.clinicId, 
        requestClinicId: clinicId 
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid clinic',
      });
    }

    // Buscar usuário atualizado
    const userQuery = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.clinic_id,
             array_agg(r.name) as roles
      FROM atendeai.users u
      LEFT JOIN atendeai.user_roles ur ON u.id = ur.user_id
      LEFT JOIN atendeai.roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.clinic_id = $2 AND u.status = 'active'
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.status, u.clinic_id
    `;
    
    const userResult = await database.query(userQuery, [decoded.sub, clinicId]);
    
    if (userResult.rows.length === 0) {
      logger.warn('Refresh failed: User not found or inactive', { userId: decoded.sub, clinicId });
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    const user = userResult.rows[0];

    // Gerar novos tokens
    const newAccessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        clinicId: user.clinic_id,
        roles: user.roles.filter(r => r !== null),
        type: 'access',
      },
      config.jwt.secret,
      { 
        expiresIn: config.jwt.accessTokenExpiry,
        issuer: 'atendeai',
        audience: 'atendeai-users',
        jwtid: uuidv4(),
      }
    );

    const newRefreshToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        clinicId: user.clinic_id,
        type: 'refresh',
      },
      config.jwt.secret,
      { 
        expiresIn: config.jwt.refreshTokenExpiry,
        issuer: 'atendeai',
        audience: 'atendeai-users',
        jwtid: uuidv4(),
      }
    );

    // Atualizar refresh token no Redis
    await redis.set(refreshTokenKey, newRefreshToken, 7 * 24 * 60 * 60);

    // Log de auditoria
    logger.info('Token refreshed', {
      userId: user.id,
      email: user.email,
      clinicId: user.clinic_id,
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      message: 'Token refreshed successfully',
    });

  } catch (error) {
    logger.error('Refresh error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =====================================================
// ROTA DE LOGOUT
// =====================================================
router.post('/logout', validateLogout, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { refreshToken, clinicId } = req.body;

    // Verificar JWT para extrair informações
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.secret);
    } catch (jwtError) {
      // Mesmo com JWT inválido, consideramos logout bem-sucedido
      logger.info('Logout with invalid token', { clinicId });
      return res.json({
        success: true,
        message: 'Logout successful',
      });
    }

    // Remover refresh token do Redis
    const refreshTokenKey = `refresh_token:${decoded.sub}:${clinicId}`;
    await redis.del(refreshTokenKey);

    // Log de auditoria
    logger.info('Logout successful', {
      userId: decoded.sub,
      email: decoded.email,
      clinicId: decoded.clinicId,
      ip: req.ip,
    });

    // Log de auditoria no banco
    if (decoded.sub && decoded.clinicId) {
      const auditQuery = `
        INSERT INTO atendeai.audit_logs (clinic_id, user_id, action, resource, details, ip_address, user_agent)
        VALUES ($1, $2, 'logout', 'auth', $3, $4, $5)
      `;
      await database.query(auditQuery, [
        decoded.clinicId,
        decoded.sub,
        JSON.stringify({ success: true }),
        req.ip,
        req.get('User-Agent'),
      ]);
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });

  } catch (error) {
    logger.error('Logout error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =====================================================
// ROTA DE VALIDAÇÃO DE TOKEN
// =====================================================
router.get('/validate', authMiddleware.authenticateJWT, async (req, res) => {
  try {
    const { user } = req;

    // Buscar permissões do usuário
    const permissionsQuery = `
      SELECT DISTINCT p.name
      FROM atendeai.permissions p
      JOIN atendeai.role_permissions rp ON p.id = rp.permission_id
      JOIN atendeai.user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1 AND ur.clinic_id = $2
    `;
    
    const permissionsResult = await database.query(permissionsQuery, [user.id, user.clinicId]);
    const permissions = permissionsResult.rows.map(row => row.name);

    // Log de auditoria
    logger.info('Token validation', {
      userId: user.id,
      email: user.email,
      clinicId: user.clinicId,
      roles: user.roles,
    });

    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
          permissions,
        },
      },
      message: 'Token is valid',
    });

  } catch (error) {
    logger.error('Token validation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =====================================================
// ROTA DE VERIFICAÇÃO DE SAÚDE DA AUTENTICAÇÃO
// =====================================================
router.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Auth Service',
      version: '1.0.0',
      features: {
        login: 'enabled',
        refresh: 'enabled',
        logout: 'enabled',
        validation: 'enabled',
      },
      jwt: {
        algorithm: config.jwt.algorithm,
        accessTokenExpiry: config.jwt.accessTokenExpiry,
        refreshTokenExpiry: config.jwt.refreshTokenExpiry,
      },
      security: {
        bcryptRounds: config.security.bcryptRounds,
        rateLimitEnabled: true,
        corsEnabled: true,
      },
    };

    res.json(healthStatus);

  } catch (error) {
    logger.error('Auth health check error:', error);
    
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

module.exports = router;
