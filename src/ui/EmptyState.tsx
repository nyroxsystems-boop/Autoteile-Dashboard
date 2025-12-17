import React from 'react';
import Button from './Button';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div
      style={{
        border: '1px dashed var(--border)',
        borderRadius: 14,
        padding: 16,
        background: 'rgba(255,255,255,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >
      <div style={{ fontWeight: 800 }}>{title}</div>
      {description ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>{description}</div> : null}
      {actionLabel && onAction ? (
        <div>
          <Button type="button" variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default EmptyState;

