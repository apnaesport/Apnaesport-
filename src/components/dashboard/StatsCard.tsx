
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  item: StatItem;
  className?: string;
}

export function StatsCard({ item, className }: StatsCardProps) {
  const IconComponent = item.icon;
  return (
    <Card className={cn("shadow-md hover:shadow-lg transition-shadow duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {item.title}
        </CardTitle>
        {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{item.value}</div>
        {item.change && (
          <p className={cn(
            "text-xs text-muted-foreground mt-1",
            item.change.startsWith('+') ? 'text-green-500' : item.change.startsWith('-') ? 'text-red-500' : ''
          )}>
            {item.change} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
