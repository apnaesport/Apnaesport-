
import type { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  subtitle?: string | ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageTitle({ title, subtitle, actions, className }: PageTitleProps) {
  return (
    <div className={`mb-6 md:mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {actions && <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">{actions}</div>}
      </div>
      {subtitle && (
        typeof subtitle === 'string' ? (
          <p className="mt-2 text-base sm:text-lg text-muted-foreground">{subtitle}</p>
        ) : (
          <div className="mt-2 text-base sm:text-lg text-muted-foreground">{subtitle}</div>
        )
      )}
    </div>
  );
}
