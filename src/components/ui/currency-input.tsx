import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  value?: string;
  onValueChange?: (value: string) => void;
}

/** Visual currency field. Formatting only — no financial logic. */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const [internal, setInternal] = React.useState(value ?? "");
    const current = value ?? internal;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const digits = event.target.value.replace(/\D/g, "");
      const formatted = digits
        ? (Number(digits) / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "";
      setInternal(formatted);
      onValueChange?.(formatted);
    };

    return (
      <div
        className={cn(
          "flex h-10 items-center rounded-lg border border-input bg-card shadow-soft transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/25",
          className,
        )}
      >
        <span className="px-3 text-sm font-medium text-muted-foreground">R$</span>
        <input
          ref={ref}
          inputMode="decimal"
          placeholder="0,00"
          value={current}
          onChange={handleChange}
          className="h-full w-full rounded-r-lg bg-transparent pr-3 text-sm tabular-nums outline-none placeholder:text-muted-foreground"
          {...props}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
