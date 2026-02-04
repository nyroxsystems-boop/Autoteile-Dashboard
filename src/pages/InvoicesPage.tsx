import { Info, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const InvoicesPage = () => {
    const { timeframe } = useTimeframe();

    return (
        <div className="flex flex-col gap-5">
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

            <Card hover={false}>
                <div className="flex flex-col items-center text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                        <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-lg font-semibold text-foreground mb-2">
                        Legacy Route
                    </div>
                    <div className="text-muted-foreground mb-6 max-w-md">
                        Diese Seite ist eine Fallback-Route. Rechnungen werden jetzt über Bestellungen verwaltet.
                    </div>
                    <Button as="a" href="/orders" icon={<ArrowRight className="w-4 h-4" />}>
                        Zu Bestellungen wechseln
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default InvoicesPage;
