import * as React from "react";
import { cn } from "@/lib/utils";

export interface PercentageInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  value?: string;
  onValueChange?: (value: string) => void;
}

/** Visual percentage field. Formatting only — no financial logic. */
const PercentageInput = React.forwardRef<HTMLInputElement, PercentageInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const [internal, setInternal] = React.useState(value ?? "");
    const current = value ?? internal;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value.replace(/[^\d,]/g, "");
      setInternal(next);
      onValueChange?.(next);
    };

    return (
      <div
        className={cn(
          "flex h-10 items-center rounded-lg border border-input bg-card shadow-soft transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/25",
          className,
        )}
      >
        <input
          ref={ref}
          inputMode="decimal"
          placeholder="0,0"
          value={current}
          onChange={handleChange}
          className="h-full w-full rounded-l-lg bg-transparent px-3 text-sm tabular-nums outline-none placeholder:text-muted-foreground"
          {...props}
        />
        <span className="px-3 text-sm font-medium text-muted-foreground">%</span>
      </div>
    );
  },
);
PercentageInput.displayName = "PercentageInput";

export { PercentageInput };
