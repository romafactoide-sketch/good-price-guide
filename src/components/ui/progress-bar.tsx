import { cn } from "@/lib/utils";

type Tone = "primary" | "warning" | "danger" | "info";

const toneStyles: Record<Tone, string> = {
  primary: "bg-gradient-primary",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export function ProgressBar({
  value,
  label,
  caption,
  tone = "primary",
  className,
}: {
  value: number;
  label?: string;
  caption?: string;
  tone?: Tone;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full", className)}>
      {label || caption ? (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          {label ? <span className="text-sm font-medium text-foreground">{label}</span> : null}
          {caption ? (
            <span className="text-xs tabular-nums text-muted-foreground">{caption}</span>
          ) : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", toneStyles[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
