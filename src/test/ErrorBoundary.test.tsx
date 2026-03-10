import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../app/components/ErrorBoundary';

function BrokenChild() {
    throw new Error('Test crash');
}

function GoodChild() {
    return <div>OK</div>;
}

describe('ErrorBoundary', () => {
    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <GoodChild />
            </ErrorBoundary>
        );
        expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('renders fallback UI on crash', () => {
        // Suppress console.error for this test
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        render(
            <ErrorBoundary>
                <BrokenChild />
            </ErrorBoundary>
        );
        expect(screen.getByText(/Etwas ist schiefgelaufen/i)).toBeInTheDocument();
        expect(screen.getByText(/Erneut versuchen/i)).toBeInTheDocument();
        spy.mockRestore();
    });
});
