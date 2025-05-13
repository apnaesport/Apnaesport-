
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatItem, LucideIconName } from "@/lib/types";
import { cn } from "@/lib/utils";
import { icons, type LucideProps } from "lucide-react";
import type React from "react";

interface StatsCardProps {
  item: StatItem;
  className?: string;
}

// Helper to get Lucide icon component by name
const getIconComponent = (iconName?: LucideIconName): React.ComponentType<LucideProps> | null => {
  if (!iconName) return null;
  const IconComponent = icons[iconName];
  return IconComponent || null;
};


export function StatsCard({ item, className }: StatsCardProps) {
  const IconComponent = getIconComponent(item.icon);
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
            {item.change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
