import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BillingTab } from '../app/views/settings/BillingTab';
import { I18nProvider } from '../i18n';

describe('BillingTab', () => {
    it('renders billing placeholder', () => {
        render(<I18nProvider><BillingTab /></I18nProvider>);
        expect(screen.getByText('Abrechnung')).toBeInTheDocument();
        expect(screen.getByText('Abrechnungsdetails')).toBeInTheDocument();
        expect(screen.getByText(/support@partsunion\.de/i)).toBeInTheDocument();
    });
});
