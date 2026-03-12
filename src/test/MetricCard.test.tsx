import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../app/components/MetricCard';

describe('MetricCard', () => {
    it('renders label and value', () => {
        render(<MetricCard label="Revenue" value="€12,340" />);
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('€12,340')).toBeInTheDocument();
    });

    it('renders numeric value', () => {
        render(<MetricCard label="Orders" value={42} />);
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
        render(<MetricCard label="Test" value="5" icon={<span data-testid="icon">★</span>} />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders positive change with TrendingUp', () => {
        render(<MetricCard label="Test" value="5" change={12} />);
        expect(screen.getByText('+12%')).toBeInTheDocument();
    });

    it('renders negative change with TrendingDown', () => {
        render(<MetricCard label="Test" value="5" change={-5} />);
        expect(screen.getByText('-5%')).toBeInTheDocument();
    });

    it('renders zero change with Minus', () => {
        render(<MetricCard label="Test" value="5" change={0} />);
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('renders changeLabel', () => {
        render(<MetricCard label="Test" value="5" changeLabel="vs. last month" />);
        expect(screen.getByText('vs. last month')).toBeInTheDocument();
    });

    it('applies hover-lift class', () => {
        const { container } = render(<MetricCard label="Test" value="5" />);
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('hover-lift');
    });

    it('applies variant styles', () => {
        const { container } = render(<MetricCard label="Test" value="5" variant="success" />);
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('success');
    });

    it('applies size styles', () => {
        const { container: sm } = render(<MetricCard label="T" value="5" size="sm" />);
        const { container: lg } = render(<MetricCard label="T" value="5" size="lg" />);
        expect((sm.firstChild as HTMLElement).className).toContain('p-5');
        expect((lg.firstChild as HTMLElement).className).toContain('p-7');
    });
});
