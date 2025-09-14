import { describe, test, expect, beforeEach, vi } from 'vitest';
import MetaAPICircuitBreaker from '../../src/utils/circuitBreaker';

describe('MetaAPICircuitBreaker', () => {
    let circuitBreaker;

    beforeEach(() => {
        vi.useFakeTimers();
        circuitBreaker = new MetaAPICircuitBreaker(3, 1000); // 3 falhas, 1 segundo de timeout
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            const defaultBreaker = new MetaAPICircuitBreaker();
            expect(defaultBreaker.failureThreshold).toBe(5);
            expect(defaultBreaker.recoveryTimeout).toBe(60000);
            expect(defaultBreaker.state).toBe('CLOSED');
        });

        it('should initialize with custom values', () => {
            expect(circuitBreaker.failureThreshold).toBe(3);
            expect(circuitBreaker.recoveryTimeout).toBe(1000);
            expect(circuitBreaker.state).toBe('CLOSED');
        });
    });

    describe('execute', () => {
        it('should execute operation when circuit is CLOSED', async () => {
            const operation = vi.fn().mockResolvedValue('success');
            
            const result = await circuitBreaker.execute(operation);
            
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should execute operation when circuit is HALF_OPEN', async () => {
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
            
            // Aguardar timeout para HALF_OPEN
            vi.advanceTimersByTime(1000);
            
            // Verificar se o estado mudou para HALF_OPEN
            expect(circuitBreaker.shouldAttemptReset()).toBe(true);
            
            const successOperation = vi.fn().mockResolvedValue('success');
            const result = await circuitBreaker.execute(successOperation);
            
            expect(result).toBe('success');
            expect(circuitBreaker.state).toBe('CLOSED');
        });

        it('should reject operation when circuit is OPEN', async () => {
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
            expect(operation).not.toHaveBeenCalled();
        });
    });

    describe('onSuccess', () => {
        it('should reset failure count and close circuit', () => {
            circuitBreaker.failureCount = 2;
            circuitBreaker.state = 'HALF_OPEN';
            
            circuitBreaker.onSuccess();
            
            expect(circuitBreaker.failureCount).toBe(0);
            expect(circuitBreaker.state).toBe('CLOSED');
        });
    });

    describe('onFailure', () => {
        it('should increment failure count', () => {
            expect(circuitBreaker.failureCount).toBe(0);
            
            circuitBreaker.onFailure();
            
            expect(circuitBreaker.failureCount).toBe(1);
        });

        it('should open circuit when failure threshold is reached', () => {
            expect(circuitBreaker.state).toBe('CLOSED');
            
            for (let i = 0; i < 3; i++) {
                circuitBreaker.onFailure();
            }
            
            expect(circuitBreaker.state).toBe('OPEN');
        });

        it('should record last failure time', () => {
            const beforeTime = Date.now();
            circuitBreaker.onFailure();
            const afterTime = Date.now();
            
            expect(circuitBreaker.lastFailureTime).toBeGreaterThanOrEqual(beforeTime);
            expect(circuitBreaker.lastFailureTime).toBeLessThanOrEqual(afterTime);
        });
    });

    describe('shouldAttemptReset', () => {
        it('should return false immediately after failure', () => {
            circuitBreaker.onFailure();
            
            expect(circuitBreaker.shouldAttemptReset()).toBe(false);
        });

        it('should return true after recovery timeout', () => {
            circuitBreaker.onFailure();
            // Simular passagem do tempo
            circuitBreaker.lastFailureTime = Date.now() - 2000; // 2 segundos atrás
            
            expect(circuitBreaker.shouldAttemptReset()).toBe(true);
        });
    });

    describe('getState', () => {
        it('should return current state', () => {
            expect(circuitBreaker.getState()).toBe('CLOSED');
            
            circuitBreaker.state = 'OPEN';
            expect(circuitBreaker.getState()).toBe('OPEN');
        });
    });

    describe('getFailureCount', () => {
        it('should return current failure count', () => {
            expect(circuitBreaker.getFailureCount()).toBe(0);
            
            circuitBreaker.onFailure();
            expect(circuitBreaker.getFailureCount()).toBe(1);
        });
    });
});
