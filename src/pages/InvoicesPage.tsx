import { useEffect, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const InvoicesPage = () => {
    const { timeframe } = useTimeframe();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Rechnungen (Legacy)"
                subtitle={`Rechnungsübersicht · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">Filter</Button>
                        <Button variant="primary" size="sm">Neue Rechnung</Button>
                    </>
                }
            />

            <Card>
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                        ℹ️ Hinweis: Legacy Route
                    </div>
                    <div style={{ color: 'var(--muted)', marginBottom: 16 }}>
                        Diese Seite ist eine Fallback-Route. Rechnungen werden jetzt über Bestellungen verwaltet.
                    </div>
                    <Button as="a" href="/orders">
                        Zu Bestellungen wechseln
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default InvoicesPage;
