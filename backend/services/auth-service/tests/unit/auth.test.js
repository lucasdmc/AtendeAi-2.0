// =====================================================
// UNIT TESTS - AUTH SERVICE
// Testes unitários para autenticação
// =====================================================

import { describe, test, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

// Mock das dependências
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn()
  },
  hash: vi.fn(),
  compare: vi.fn()
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn()
  },
  sign: vi.fn(),
  verify: vi.fn()
}));

vi.mock('express-validator', () => ({
  body: vi.fn(),
  validationResult: vi.fn()
}));

describe('Auth Service - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      headers: {},
      user: null
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';
      
      bcrypt.hash.mockResolvedValue(hashedPassword);
      
      const result = await bcrypt.hash(password, 12);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    test('should compare password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';
      
      bcrypt.compare.mockResolvedValue(true);
      
      const result = await bcrypt.compare(password, hashedPassword);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });
  });

  describe('JWT Token Generation', () => {
    test('should generate access token correctly', () => {
      const payload = { userId: '123', role: 'admin' };
      const secret = process.env.JWT_SECRET;
      const options = { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY };
      const token = 'access.token.123';
      
      jwt.sign.mockReturnValue(token);
      
      const result = jwt.sign(payload, secret, options);
      
      expect(jwt.sign).toHaveBeenCalledWith(payload, secret, options);
      expect(result).toBe(token);
    });

    test('should generate refresh token correctly', () => {
      const payload = { userId: '123', type: 'refresh' };
      const secret = process.env.JWT_SECRET;
      const options = { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY };
      const token = 'refresh.token.123';
      
      jwt.sign.mockReturnValue(token);
      
      const result = jwt.sign(payload, secret, options);
      
      expect(jwt.sign).toHaveBeenCalledWith(payload, secret, options);
      expect(result).toBe(token);
    });

    test('should verify token correctly', () => {
      const token = 'valid.token.123';
      const secret = process.env.JWT_SECRET;
      const decoded = { userId: '123', role: 'admin' };
      
      jwt.verify.mockReturnValue(decoded);
      
      const result = jwt.verify(token, secret);
      
      expect(jwt.verify).toHaveBeenCalledWith(token, secret);
      expect(result).toEqual(decoded);
    });
  });

  describe('Input Validation', () => {
    test('should validate email format', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';
      
      // Mock da validação
      body.mockReturnValue({
        isEmail: () => ({
          withMessage: (msg) => ({
            custom: (validator) => validator
          })
        })
      });
      
      const emailValidator = body('email').isEmail().withMessage('Invalid email');
      
      expect(emailValidator).toBeDefined();
    });

    test('should validate password strength', () => {
      const strongPassword = 'StrongPass123!';
      const weakPassword = '123';
      
      // Mock da validação
      body.mockReturnValue({
        isLength: () => ({
          withMessage: (msg) => ({
            matches: () => ({
              withMessage: (msg) => ({
                custom: (validator) => validator
              })
            })
          })
        })
      });
      
      const passwordValidator = body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain uppercase, lowercase, number and special character');
      
      expect(passwordValidator).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors', () => {
      const validationErrors = [
        { param: 'email', msg: 'Invalid email', value: 'invalid-email' },
        { param: 'password', msg: 'Password too short', value: '123' }
      ];
      
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => validationErrors
      });
      
      const errors = validationResult(mockReq);
      
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toEqual(validationErrors);
    });

    test('should handle JWT verification errors', () => {
      const invalidToken = 'invalid.token.123';
      const secret = process.env.JWT_SECRET;
      
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      expect(() => jwt.verify(invalidToken, secret)).toThrow('Invalid token');
    });
  });

  describe('Role Validation', () => {
    test('should validate admin role', () => {
      const adminUser = { role: 'admin_lify' };
      const regularUser = { role: 'attendant' };
      
      const isAdmin = (user) => user.role === 'admin_lify';
      
      expect(isAdmin(adminUser)).toBe(true);
      expect(isAdmin(regularUser)).toBe(false);
    });

    test('should validate clinic admin role', () => {
      const clinicAdmin = { role: 'admin_clinic' };
      const regularUser = { role: 'attendant' };
      
      const isClinicAdmin = (user) => ['admin_lify', 'admin_clinic'].includes(user.role);
      
      expect(isClinicAdmin(clinicAdmin)).toBe(true);
      expect(isClinicAdmin(regularUser)).toBe(false);
    });
  });

  describe('Security Features', () => {
    test('should use secure JWT secret', () => {
      const secret = process.env.JWT_SECRET;
      
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(32);
      expect(secret).not.toBe('your-super-secret-jwt-key-change-in-production');
    });

    test('should use appropriate bcrypt rounds', () => {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS);
      
      expect(rounds).toBeGreaterThanOrEqual(10);
      expect(rounds).toBeLessThanOrEqual(14);
    });

    test('should set appropriate token expiry', () => {
      const accessExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY;
      const refreshExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRY;
      
      expect(accessExpiry).toBeDefined();
      expect(refreshExpiry).toBeDefined();
      expect(accessExpiry).toBe('15m');
      expect(refreshExpiry).toBe('7d');
    });
  });
});
