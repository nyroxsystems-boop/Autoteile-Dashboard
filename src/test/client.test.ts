import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, getAuthToken, getTenantId, getDeviceId, apiFetch } from '../app/api/client';

describe('API Client', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    describe('getAuthToken', () => {
        it('returns null when no token stored', () => {
            expect(getAuthToken()).toBeNull();
        });

        it('returns token from auth_access_token', () => {
            localStorage.setItem('auth_access_token', 'test-token-123');
            expect(getAuthToken()).toBe('test-token-123');
        });
    });

    describe('getTenantId', () => {
        it('returns null when no tenant stored', () => {
            expect(getTenantId()).toBeNull();
        });

        it('returns stored tenant ID', () => {
            localStorage.setItem('selectedTenantId', '42');
            expect(getTenantId()).toBe('42');
        });
    });

    describe('getDeviceId', () => {
        it('generates and persists a device ID', () => {
            const id = getDeviceId();
            expect(id).toMatch(/^dev_/);
            expect(localStorage.getItem('deviceId')).toBe(id);
        });

        it('returns same ID on subsequent calls', () => {
            const id1 = getDeviceId();
            const id2 = getDeviceId();
            expect(id1).toBe(id2);
        });
    });

    describe('ApiError', () => {
        it('creates error with message and status', () => {
            const err = new ApiError('Not found', 404);
            expect(err.message).toBe('Not found');
            expect(err.status).toBe(404);
            expect(err.name).toBe('ApiError');
            expect(err instanceof Error).toBe(true);
        });
    });

    describe('apiFetch', () => {
        it('includes auth headers when token exists', async () => {
            localStorage.setItem('auth_access_token', 'my-token');
            localStorage.setItem('selectedTenantId', '5');

            const mockResponse = { ok: true, status: 200, json: () => Promise.resolve({ data: 'test' }), headers: new Headers() };
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

            await apiFetch('/api/test');

            expect(fetchSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/test'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Token my-token',
                        'X-Tenant-ID': '5',
                        'Content-Type': 'application/json',
                    }),
                    credentials: 'include',
                })
            );
        });

        it('throws ApiError on non-ok response', async () => {
            const mockResponse = {
                ok: false,
                status: 403,
                json: () => Promise.resolve({ detail: 'Forbidden' }),
                headers: new Headers(),
            };
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

            await expect(apiFetch('/api/test')).rejects.toThrow(ApiError);
            await expect(apiFetch('/api/test')).rejects.toThrow('Forbidden');
        });

        it('handles 204 No Content', async () => {
            const mockResponse = { ok: true, status: 204, json: () => Promise.resolve({}), headers: new Headers() };
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

            const result = await apiFetch('/api/test');
            expect(result).toEqual({});
        });
    });
});
