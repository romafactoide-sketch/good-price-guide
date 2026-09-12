import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, HeartPulse, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { useBusinessHealth } from "@/hooks/use-business-health";
import { formatBRLFromCents } from "@/lib/money";
import { healthLabels, scoreBand, scoreMessages, type HealthStatus } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/app/saude")({
  head: () => ({
    meta: [
      { title: "Saúde dos produtos — PreçoSadio" },
      {
        name: "description",
        content:
          "Veja quais produtos estão saudáveis, em atenção ou críticos comparando a margem atual com a margem alvo.",
      },
      { property: "og:title", content: "Saúde dos produtos — PreçoSadio" },
      {
        property: "og:description",
        content: "Score do negócio e classificação de cada produto pela margem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HealthPage,
});

const NO_DATA = "—";
const pct = (value: number | null) =>
  value === null
    ? NO_DATA
    : `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

const statusTone: Record<HealthStatus, "success" | "warning" | "danger" | "secondary"> = {
  healthy: "success",
  attention: "warning",
  critical: "danger",
  unknown: "secondary",
};

const barTone = { high: "primary", medium: "warning", low: "danger" } as const;

function HealthPage() {
  const {
    loading,
    rows,
    counts,
    score,
    averageMarginPercentage,
    breakEvenCents,
    criticalMarginPercentage,
  } = useBusinessHealth();

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-soft">
        Carregando a saúde dos seus produtos...
      </div>
    );
  }

  const band = scoreBand(score.score);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Saúde dos produtos"
        description="Compare a margem atual com a margem alvo de cada produto e veja onde agir primeiro."
      />

      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary-dark">
              <Activity className="size-4" />
            </span>
            <p className="text-sm font-medium text-muted-foreground">Score do negócio</p>
            <InfoTooltip content="Indicador operacional de 0 a 100: produtos saudáveis (40), margem média (25), faturamento sobre o ponto de equilíbrio (20) e dados preenchidos (15). Não é uma medida contábil." />
          </div>
          <p className="mt-3 text-5xl font-extrabold tabular-nums text-foreground">{score.score}</p>
          <p className="mt-2 text-sm text-muted-foreground">{scoreMessages[band]}</p>
          <div className="mt-5 grid gap-3">
            {score.parts.map((part) => (
              <ProgressBar
                key={part.label}
                value={Math.max(0, Math.min(1, part.value)) * 100}
                label={part.label}
                caption={`peso ${part.weight}`}
                tone={barTone[band]}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Produtos saudáveis"
            value={String(counts.healthy)}
            hint={`de ${rows.length} produtos`}
            tone="success"
            icon={HeartPulse}
          />
          <StatCard label="Em atenção" value={String(counts.attention)} tone="warning" />
          <StatCard
            label="Críticos"
            value={String(counts.critical)}
            hint={`margem até ${pct(criticalMarginPercentage)}`}
            tone="danger"
          />
          <StatCard
            label="Margem média atual"
            value={pct(averageMarginPercentage)}
            hint={
              breakEvenCents === null
                ? "Sem ponto de equilíbrio calculável"
                : `Ponto de equilíbrio: ${formatBRLFromCents(breakEvenCents)}/mês`
            }
            tone="info"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3 text-right">Preço atual</th>
                  <th className="px-5 py-3 text-right">Preço saudável</th>
                  <th className="px-5 py-3 text-right">Margem atual</th>
                  <th className="px-5 py-3 text-right">Margem alvo</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.product.id} className="border-b border-border/70 last:border-0">
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {row.product.name}
                      {row.error ? (
                        <span className="block text-xs font-normal text-danger">{row.error}</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {row.currentPriceCents > 0
                        ? formatBRLFromCents(row.currentPriceCents)
                        : NO_DATA}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {row.healthyPriceCents === null
                        ? NO_DATA
                        : formatBRLFromCents(row.healthyPriceCents)}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {pct(row.currentMarginPercentage)}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-muted-foreground">
                      {pct(row.targetMarginPercentage)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusTone[row.status]}>{healthLabels[row.status]}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <Button asChild variant="subtle" size="sm">
                          <Link
                            to="/app/resultado/$productId"
                            params={{ productId: row.product.id }}
                          >
                            Ajustar preço
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Package}
              title="Nenhum produto cadastrado"
              description="Cadastre seu primeiro produto para ver se o preço atual cobre custos e lucro."
              action={
                <Button asChild variant="hero">
                  <Link to="/app/produtos" search={{ novo: true }}>
                    Cadastrar produto
                  </Link>
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
