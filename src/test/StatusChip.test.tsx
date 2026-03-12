import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChip } from '../app/components/StatusChip';

// Mock i18n
vi.mock('../i18n', () => ({
    useI18n: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                customers_new: 'Neu',
                customers_in_progress: 'In Bearbeitung',
                customers_quoted: 'Angeboten',
                status_order_confirmed: 'Bestätigt',
                customers_oem_pending: 'OEM Pending',
                status_done: 'Erledigt',
                cancel: 'Storniert',
            };
            return map[key] || key;
        },
    }),
}));

describe('StatusChip', () => {
    it('renders with correct label for known status', () => {
        render(<StatusChip status="new" />);
        expect(screen.getByText('Neu')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
        render(<StatusChip status="new" label="Custom Label" />);
        expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('renders dot by default', () => {
        const { container } = render(<StatusChip status="new" />);
        const dot = container.querySelector('.rounded-full');
        expect(dot).toBeTruthy();
    });

    it('hides dot when withDot=false', () => {
        const { container } = render(<StatusChip status="new" withDot={false} />);
        const dots = container.querySelectorAll('.w-1\\.5');
        expect(dots.length).toBe(0);
    });

    it('renders in_progress with processing animation', () => {
        const { container } = render(<StatusChip status="in_progress" />);
        expect(screen.getByText('In Bearbeitung')).toBeInTheDocument();
        const dot = container.querySelector('.animate-dot-pulse');
        expect(dot).toBeTruthy();
    });

    it('renders success variant correctly', () => {
        render(<StatusChip status="done" />);
        expect(screen.getByText('Erledigt')).toBeInTheDocument();
    });

    it('renders error variant for cancelled', () => {
        render(<StatusChip status="cancelled" />);
        expect(screen.getByText('Storniert')).toBeInTheDocument();
    });

    it('renders unknown status as-is', () => {
        render(<StatusChip status="unknown_status" />);
        expect(screen.getByText('unknown_status')).toBeInTheDocument();
    });

    it('applies small size classes', () => {
        const { container } = render(<StatusChip status="new" size="sm" />);
        const chip = container.firstChild as HTMLElement;
        expect(chip.className).toContain('text-xs');
    });
});
