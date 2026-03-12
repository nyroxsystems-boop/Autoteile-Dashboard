import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../app/components/ErrorBoundary';

function BrokenChild(): React.ReactElement {
    throw new Error('Test crash');
}

function GoodChild() {
    return <div>Working fine</div>;
}

describe('ErrorBoundary', () => {
    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <GoodChild />
            </ErrorBoundary>
        );
        expect(screen.getByText('Working fine')).toBeInTheDocument();
    });

    it('renders fallback UI on crash', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary>
                <BrokenChild />
            </ErrorBoundary>
        );
        expect(screen.getByText(/Etwas ist schiefgelaufen/i)).toBeInTheDocument();
        expect(screen.getByText(/Erneut versuchen/i)).toBeInTheDocument();
        spy.mockRestore();
    });

    it('renders custom fallback when provided', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary fallback={<div>Custom Error UI</div>}>
                <BrokenChild />
            </ErrorBoundary>
        );
        expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
        spy.mockRestore();
    });

    it('shows error message in fallback', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary>
                <BrokenChild />
            </ErrorBoundary>
        );
        expect(screen.getByText('Test crash')).toBeInTheDocument();
        spy.mockRestore();
    });
});
