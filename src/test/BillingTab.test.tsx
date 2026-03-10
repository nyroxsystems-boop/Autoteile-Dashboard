import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BillingTab } from '../app/views/settings/BillingTab';

describe('BillingTab', () => {
    it('renders billing placeholder', () => {
        render(<BillingTab />);
        expect(screen.getByText('Abrechnung')).toBeInTheDocument();
        expect(screen.getByText('Abrechnungsdetails')).toBeInTheDocument();
        expect(screen.getByText(/support@partsunion\.de/i)).toBeInTheDocument();
    });
});
