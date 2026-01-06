import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down';
}

const KPICard = ({ title, value, change, trend }: KPICardProps) => (
    <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>{title}</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
            {change && (
                <Badge variant={trend === 'up' ? 'success' : 'danger'}>
                    {trend === 'up' ? '↗' : '↘'} {change}
                </Badge>
            )}
        </div>
    </Card>
);

const OverviewPage = () => {
    const { timeframe } = useTimeframe();
    const [loading, setLoading] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Übersicht"
                subtitle={`Dashboard · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">Bericht erstellen</Button>
                        <Button variant="primary" size="sm">Daten exportieren</Button>
                    </>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <KPICard title="Bestellungen" value="—" change="+0%" trend="up" />
                <KPICard title="Umsatz" value="—" change="+0%" trend="up" />
                <KPICard title="Anfragen" value="—" change="+0%" trend="up" />
                <KPICard title="Konversionsrate" value="—%" change="+0%" trend="up" />
            </div>

            <Card title="Neueste Aktivitäten">
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Verbinde mit Backend, um Aktivitäten anzuzeigen...
                </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Card title="Top Produkte">
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>
                        Keine Daten verfügbar
                    </div>
                </Card>
                <Card title="Verkaufskanäle">
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>
                        Keine Daten verfügbar
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default OverviewPage;
