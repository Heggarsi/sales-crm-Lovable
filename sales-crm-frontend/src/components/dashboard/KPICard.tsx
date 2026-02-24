import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  changeLabel?: string;
  variant?: "default" | "primary" | "success" | "warning" | "info";
}

const variantStyles = {
  default: "before:bg-muted-foreground",
  primary: "before:bg-primary",
  success: "before:bg-success",
  warning: "before:bg-warning",
  info: "before:bg-info",
};

export function KPICard({
  title,
  value,
  icon,
  change,
  changeLabel,
  variant = "default",
}: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className={cn("kpi-card animate-slide-up", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold font-display tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {isPositive && (
                <span className="flex items-center text-sm text-success font-medium">
                  <TrendingUp className="w-4 h-4 mr-0.5" />+{change}%
                </span>
              )}
              {isNegative && (
                <span className="flex items-center text-sm text-destructive font-medium">
                  <TrendingDown className="w-4 h-4 mr-0.5" />
                  {change}%
                </span>
              )}
              {changeLabel && (
                <span className="text-sm text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-muted/50">{icon}</div>
      </div>
    </div>
  );
}
