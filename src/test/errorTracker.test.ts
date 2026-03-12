import { describe, it, expect, beforeEach } from 'vitest';

// We test the error tracker's storage logic directly
describe('ErrorTracker', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('stores and retrieves errors from localStorage', async () => {
        // Dynamically import to get fresh instance behavior
        const { errorTracker } = await import('../app/services/errorTracker');

        errorTracker.capture(new Error('Test error 1'));
        errorTracker.capture(new Error('Test error 2'));

        const errors = errorTracker.getStoredErrors();
        expect(errors.length).toBe(2);
        expect(errors[0].message).toBe('Test error 2'); // Most recent first
        expect(errors[1].message).toBe('Test error 1');
    });

    it('stores error with correct fields', async () => {
        const { errorTracker } = await import('../app/services/errorTracker');

        const testError = new Error('Field test');
        errorTracker.capture(testError, { component: 'TestComponent' });

        const errors = errorTracker.getStoredErrors();
        const entry = errors[0];
        expect(entry.message).toBe('Field test');
        expect(entry.stack).toBeDefined();
        expect(entry.timestamp).toBeDefined();
        expect(entry.url).toBeDefined();
        expect(entry.extra).toEqual({ component: 'TestComponent' });
    });

    it('clears errors', async () => {
        const { errorTracker } = await import('../app/services/errorTracker');

        errorTracker.capture(new Error('Will be cleared'));
        expect(errorTracker.getErrorCount()).toBeGreaterThan(0);

        errorTracker.clearErrors();
        expect(errorTracker.getErrorCount()).toBe(0);
    });

    it('limits stored errors to MAX_STORED_ERRORS', async () => {
        const { errorTracker } = await import('../app/services/errorTracker');
        errorTracker.clearErrors();

        // Store 55 errors (limit is 50)
        for (let i = 0; i < 55; i++) {
            errorTracker.capture(new Error(`Error ${i}`));
        }

        const errors = errorTracker.getStoredErrors();
        expect(errors.length).toBeLessThanOrEqual(50);
    });
});
