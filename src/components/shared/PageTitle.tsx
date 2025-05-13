
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {actions && <div className="mt-4 md:mt-0">{actions}</div>}
      </div>
      {subtitle && (
        typeof subtitle === 'string' ? (
          <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
        ) : (
          <div className="mt-2 text-lg text-muted-foreground">{subtitle}</div>
        )
      )}
    </div>
  );
}
