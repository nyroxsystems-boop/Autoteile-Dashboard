import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
};

const PageHeader = ({ title, subtitle, description, breadcrumb, actions }: PageHeaderProps) => {
  const sub = subtitle || description;

  return (
    <div className="mb-6 animate-fade-in">
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          {breadcrumb.map((item, idx) => (
            <span key={item} className="inline-flex items-center gap-1">
              <span className="hover:text-foreground transition-colors cursor-pointer">
                {item}
              </span>
              {idx < breadcrumb.length - 1 && (
                <ChevronRight className="h-3 w-3 opacity-50" />
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {sub && (
            <p className="text-muted-foreground text-sm">
              {sub}
            </p>
          )}
          {/* Gradient accent */}
          <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/50 rounded-full mt-2" />
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

