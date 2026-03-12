/**
 * Lightweight Error Tracking Service
 * 
 * Captures unhandled errors and promise rejections, stores them locally,
 * and optionally sends to a remote endpoint when configured.
 * 
 * This serves as a Sentry-lite until a proper error tracking service is set up.
 */

interface ErrorEntry {
    id: string;
    message: string;
    stack?: string;
    url: string;
    timestamp: string;
    userAgent: string;
    extra?: Record<string, unknown>;
}

const MAX_STORED_ERRORS = 50;
const STORAGE_KEY = 'error_log';

class ErrorTracker {
    private initialized = false;
    private remoteEndpoint: string | null = null;

    init(options?: { remoteEndpoint?: string }) {
        if (this.initialized) return;
        this.initialized = true;
        this.remoteEndpoint = options?.remoteEndpoint || null;

        // Global error handler
        window.addEventListener('error', (event) => {
            this.capture(event.error || new Error(event.message), {
                source: event.filename,
                line: event.lineno,
                col: event.colno,
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason instanceof Error
                ? event.reason
                : new Error(String(event.reason));
            this.capture(error, { type: 'unhandled_promise_rejection' });
        });

        console.debug('[ErrorTracker] Initialized');
    }

    capture(error: Error, extra?: Record<string, unknown>) {
        const entry: ErrorEntry = {
            id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
            message: error.message,
            stack: error.stack,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            extra,
        };

        // Store locally
        this.storeError(entry);

        // Log to console in dev
        if (import.meta.env.DEV) {
            console.error('[ErrorTracker]', entry);
        }

        // Send to remote if configured
        if (this.remoteEndpoint) {
            this.sendToRemote(entry).catch(() => {
                // Silent fail — we don't want error tracking to cause errors
            });
        }
    }

    private storeError(entry: ErrorEntry) {
        try {
            const errors = this.getStoredErrors();
            errors.unshift(entry);
            // Keep only last N errors
            const trimmed = errors.slice(0, MAX_STORED_ERRORS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch {
            // localStorage might be full or unavailable
        }
    }

    getStoredErrors(): ErrorEntry[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    clearErrors() {
        localStorage.removeItem(STORAGE_KEY);
    }

    getErrorCount(): number {
        return this.getStoredErrors().length;
    }

    private async sendToRemote(entry: ErrorEntry) {
        if (!this.remoteEndpoint) return;
        await fetch(this.remoteEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
    }
}

// Singleton instance
export const errorTracker = new ErrorTracker();
