import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useI18n } from '../../i18n';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title,
  description,
  onRetry 
}: ErrorStateProps) {
  const { t } = useI18n();
  
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-xl bg-[var(--status-error-bg)] border border-[var(--status-error-border)] flex items-center justify-center mb-5">
        <AlertTriangle className="w-8 h-8 text-[var(--status-error)]" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2.5">{title || t('error_backend_title')}</h3>
      <p className="text-muted-foreground max-w-md leading-relaxed mb-8">
        {description || t('error_backend_desc')}
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('error_retry')}
        </Button>
      )}
    </div>
  );
}
