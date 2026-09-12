import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatBRLFromCents } from "@/lib/money";

const NO_DATA = "—";

const pct = (value: number) =>
  `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

/**
 * Ponto de equilíbrio visual: custos fixos, margem média, ponto de equilíbrio
 * e meta, com uma barra de 0 até a maior das duas referências.
 */
export function BreakEvenMeter({
  fixedCostsCents,
  contributionMarginPercentage,
  breakEvenCents,
  goalCents,
  note,
}: {
  fixedCostsCents: number;
  contributionMarginPercentage: number | null;
  breakEvenCents: number | null;
  goalCents: number;
  note?: string;
}) {
  const scale = Math.max(breakEvenCents ?? 0, goalCents, 1);
  const breakEvenAt =
    breakEvenCents === null ? null : Math.min(100, (breakEvenCents / scale) * 100);
  const goalAt = goalCents > 0 ? Math.min(100, (goalCents / scale) * 100) : null;

  return (
    <section className="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div>
        <h2 className="flex items-center gap-1.5 text-base font-bold text-foreground">
          Ponto de equilíbrio
          <InfoTooltip content="Faturamento necessário no mês para cobrir custos fixos e pró-labore. Abaixo dele o mês fecha no prejuízo." />
        </h2>
        <p className="text-sm text-muted-foreground">
          {note ?? "Custos fixos ÷ margem de contribuição média."}
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Custos fixos</dt>
          <dd className="text-lg font-bold tabular-nums text-foreground">
            {formatBRLFromCents(fixedCostsCents)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Margem de contribuição média</dt>
          <dd className="text-lg font-bold tabular-nums text-foreground">
            {contributionMarginPercentage === null ? NO_DATA : pct(contributionMarginPercentage)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Ponto de equilíbrio</dt>
          <dd className="text-lg font-bold tabular-nums text-warning-foreground">
            {breakEvenCents === null ? NO_DATA : formatBRLFromCents(breakEvenCents)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Meta</dt>
          <dd className="text-lg font-bold tabular-nums text-primary-dark">
            {goalCents > 0 ? formatBRLFromCents(goalCents) : NO_DATA}
          </dd>
        </div>
      </dl>

      <div>
        <div className="relative h-3 w-full rounded-full bg-muted">
          {breakEvenAt !== null ? (
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-warning"
              style={{ width: `${breakEvenAt}%` }}
            />
          ) : null}
          {goalAt !== null && breakEvenAt !== null && goalAt > breakEvenAt ? (
            <div
              className="absolute inset-y-0 rounded-full bg-gradient-primary"
              style={{ left: `${breakEvenAt}%`, width: `${goalAt - breakEvenAt}%` }}
            />
          ) : null}
          {[breakEvenAt, goalAt].map((position, index) =>
            position === null ? null : (
              <span
                key={index}
                className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground"
                style={{ left: `${position}%` }}
              />
            ),
          )}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>
            Ponto de equilíbrio{" "}
            {breakEvenCents === null ? NO_DATA : formatBRLFromCents(breakEvenCents)}
          </span>
          <span>Meta {goalCents > 0 ? formatBRLFromCents(goalCents) : NO_DATA}</span>
        </div>
      </div>
    </section>
  );
}
