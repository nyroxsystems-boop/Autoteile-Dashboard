import React from 'react';
import { cn } from './utils';

type CardVariant = 'default' | 'glass' | 'elevated';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  variant?: CardVariant;
  hover?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-card border border-border/50 shadow-card',
  glass: 'bg-card/80 backdrop-blur-md border border-border/30',
  elevated: 'bg-card border border-border/50 shadow-lg hover:shadow-xl',
};

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  children,
  className,
  padded = true,
  variant = 'default',
  hover = true,
  ...rest
}) => {
  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-200',
        variantStyles[variant],
        hover && 'hover:border-primary/20 hover:shadow-card-hover hover:-translate-y-0.5',
        padded && 'p-5',
        className
      )}
      {...rest}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            {title && (
              <h3 className="font-semibold text-foreground leading-none tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card;

