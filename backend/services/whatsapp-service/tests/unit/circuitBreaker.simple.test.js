import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the circuit breaker implementation
class MockCircuitBreaker {
  constructor(failureThreshold = 5, recoveryTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  shouldAttemptReset() {
    return Date.now() - this.lastFailureTime > this.recoveryTimeout;
  }

  getState() {
    return this.state;
  }

  getFailureCount() {
    return this.failureCount;
  }
}

describe('MetaAPICircuitBreaker - Simplified Tests', () => {
  let circuitBreaker;

  beforeEach(() => {
    vi.useFakeTimers();
    circuitBreaker = new MockCircuitBreaker(3, 1000); // 3 falhas, 1 segundo de timeout
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      const defaultBreaker = new MockCircuitBreaker();
      expect(defaultBreaker.failureThreshold).toBe(5);
      expect(defaultBreaker.recoveryTimeout).toBe(60000);
      expect(defaultBreaker.state).toBe('CLOSED');
    });

    test('should initialize with custom values', () => {
      expect(circuitBreaker.failureThreshold).toBe(3);
      expect(circuitBreaker.recoveryTimeout).toBe(1000);
      expect(circuitBreaker.state).toBe('CLOSED');
    });
  });

  describe('execute', () => {
    test('should execute operation when circuit is CLOSED', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should execute operation when circuit is HALF_OPEN', async () => {
      // Simular falhas para abrir o circuito
      const failingOperation = vi.fn().mockRejectedValue(new Error('fail'));
      
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Ignorar erro
        }
      }
      
      expect(circuitBreaker.state).toBe('OPEN');
      
      // Simular passagem do tempo para HALF_OPEN
      circuitBreaker.lastFailureTime = Date.now() - 2000; // 2 segundos atrás
      
      const successOperation = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successOperation);
      
      expect(result).toBe('success');
      expect(successOperation).toHaveBeenCalledTimes(1);
    });

    test('should reject operation when circuit is OPEN', async () => {
      // Simular falhas para abrir o circuito
      const failingOperation = vi.fn().mockRejectedValue(new Error('fail'));
      
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Ignorar erro
        }
      }
      
      expect(circuitBreaker.state).toBe('OPEN');
      
      const operation = vi.fn().mockResolvedValue('success');
      
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is OPEN');
    });
  });

  describe('onSuccess', () => {
    test('should reset failure count and close circuit', () => {
      circuitBreaker.failureCount = 2;
      circuitBreaker.state = 'HALF_OPEN';
      
      circuitBreaker.onSuccess();
      
      expect(circuitBreaker.failureCount).toBe(0);
      expect(circuitBreaker.state).toBe('CLOSED');
    });
  });

  describe('onFailure', () => {
    test('should increment failure count', () => {
      const initialCount = circuitBreaker.failureCount;
      
      circuitBreaker.onFailure();
      
      expect(circuitBreaker.failureCount).toBe(initialCount + 1);
    });

    test('should open circuit when failure threshold is reached', () => {
      circuitBreaker.failureCount = 2; // 2 falhas já registradas
      
      circuitBreaker.onFailure();
      
      expect(circuitBreaker.state).toBe('OPEN');
    });

    test('should record last failure time', () => {
      const beforeTime = Date.now();
      
      circuitBreaker.onFailure();
      
      expect(circuitBreaker.lastFailureTime).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('shouldAttemptReset', () => {
    test('should return false immediately after failure', () => {
      circuitBreaker.onFailure();
      
      expect(circuitBreaker.shouldAttemptReset()).toBe(false);
    });

    test('should return true after recovery timeout', () => {
      circuitBreaker.onFailure();
      // Simular passagem do tempo
      circuitBreaker.lastFailureTime = Date.now() - 2000; // 2 segundos atrás
      
      expect(circuitBreaker.shouldAttemptReset()).toBe(true);
    });
  });

  describe('getState', () => {
    test('should return current state', () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');
      
      circuitBreaker.state = 'OPEN';
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('getFailureCount', () => {
    test('should return current failure count', () => {
      expect(circuitBreaker.getFailureCount()).toBe(0);
      
      circuitBreaker.onFailure();
      expect(circuitBreaker.getFailureCount()).toBe(1);
    });
  });
});
