import { Activity, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

const prices = [
  {
    label: "Preço mínimo",
    value: "R$ 11,90",
    hint: "Cobre custos",
    tone: "warning" as const,
    icon: ShieldCheck,
  },
  {
    label: "Preço saudável",
    value: "R$ 15,40",
    hint: "Margem de 28%",
    tone: "success" as const,
    icon: TrendingUp,
  },
  {
    label: "Preço estratégico",
    value: "R$ 18,90",
    hint: "Margem de 38%",
    tone: "info" as const,
    icon: Target,
  },
];

const toneMap = {
  warning: "bg-warning-soft text-warning-foreground",
  success: "bg-success-soft text-primary-dark",
  info: "bg-info-soft text-info",
};

export function DashboardMockup() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-lift sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Brownie tradicional
          </p>
          <p className="truncate text-base font-bold text-foreground">Análise de preço</p>
        </div>
        <Badge variant="success" className="shrink-0">
          Saudável
        </Badge>
      </div>

      <div className="mt-5 grid gap-3">
        {prices.map((price) => (
          <div
            key={price.label}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3"
          >
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-xl ${toneMap[price.tone]}`}
            >
              <price.icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                {price.label}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{price.hint}</span>
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
              {price.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl bg-primary-soft/60 p-4">
        <ProgressBar value={72} label="Margem média" caption="24,8% de 34%" />
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-primary-dark">
            <Activity className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs text-primary-dark/80">Ponto de equilíbrio</span>
            <span className="block truncate text-sm font-bold text-primary-dark">
              R$ 18.420 por mês
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
