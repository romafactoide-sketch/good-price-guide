import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/info-tooltip";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneStyles: Record<Tone, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success-soft text-primary-dark",
  warning: "bg-warning-soft text-warning-foreground",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tooltip?: string;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  tooltip,
  icon: Icon,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift",
        className,
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          {tooltip ? <InfoTooltip content={tooltip} /> : null}
        </div>
        {Icon ? (
          <span
            className={cn("grid size-9 shrink-0 place-items-center rounded-xl", toneStyles[tone])}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
