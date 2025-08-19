const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

const createRateLimiter = (windowMs, max, message = 'Too many requests') => {
  return rateLimit({
    windowMs: windowMs,
    max: max,
    message: {
      success: false,
      message: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id,
        limit: max,
        windowMs: windowMs
      });
      
      res.status(429).json({
        success: false,
        message: message,
        retryAfter: Math.ceil(windowMs / 1000),
        requestId: req.id
      });
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user ? req.user.user_id : req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path.startsWith('/health');
    }
  });
};

const rateLimiter = createRateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.max,
  'Too many requests from this IP/user'
);

const strictRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per 15 minutes
  'Too many requests, please try again later'
);

const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests per 15 minutes
  'Too many authentication attempts'
);

const contextualizationRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30, // 30 requests per minute
  'Too many contextualization requests'
);

const createDynamicRateLimiter = (baseLimit, multiplier = 1) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'anonymous';
    let limit = baseLimit;
    
    // Adjust limits based on user role
    switch (userRole) {
      case 'admin':
        limit = baseLimit * 3;
        break;
      case 'manager':
        limit = baseLimit * 2;
        break;
      case 'user':
        limit = baseLimit;
        break;
      default:
        limit = Math.floor(baseLimit * 0.5);
    }
    
    const limiter = createRateLimiter(
      config.rateLimit.windowMs,
      limit,
      `Rate limit exceeded for role: ${userRole}`
    );
    
    limiter(req, res, next);
  };
};

const dynamicRateLimiter = createDynamicRateLimiter(config.rateLimit.max);

module.exports = {
  rateLimiter,
  strictRateLimiter,
  authRateLimiter,
  contextualizationRateLimiter,
  dynamicRateLimiter,
  createRateLimiter
};
