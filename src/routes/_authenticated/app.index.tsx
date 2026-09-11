import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  HeartPulse,
  Package,
  Percent,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import {
  brl,
  demoDashboard,
  demoMonthlySeries,
  demoProducts,
  demoUser,
  pct,
  type HealthStatus,
} from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Painel — PreçoSadio" },
      {
        name: "description",
        content: "Acompanhe saúde do negócio, margem média, ponto de equilíbrio e metas.",
      },
      { property: "og:title", content: "Painel — PreçoSadio" },
      { property: "og:description", content: "Visão geral das margens do seu negócio." },
    ],
  }),
  component: DashboardPage,
});

const statusMap: Record<HealthStatus, { label: string; variant: "success" | "warning" | "danger" }> =
  {
    saudavel: { label: "Saudável", variant: "success" },
    atencao: { label: "Atenção", variant: "warning" },
    critico: { label: "Crítico", variant: "danger" },
  };

const columns: Column<(typeof demoProducts)[number]>[] = [
  {
    key: "name",
    header: "Produto",
    cell: (row) => <span className="font-semibold">{row.name}</span>,
  },
  { key: "price", header: "Preço", align: "right", cell: (row) => brl(row.price) },
  { key: "cost", header: "Custo", align: "right", cell: (row) => brl(row.cost) },
  {
    key: "margin",
    header: "Margem",
    align: "right",
    cell: (row) => <span className="font-semibold">{pct(row.margin)}</span>,
  },
  {
    key: "status",
    header: "Situação",
    align: "right",
    cell: (row) => <Badge variant={statusMap[row.status].variant}>{statusMap[row.status].label}</Badge>,
  },
];

function DashboardPage() {
  const goalProgress = (demoDashboard.breakEven / demoDashboard.goal) * 100;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`Olá, ${demoUser.name}`}
        description={`Este é o panorama de ${demoUser.business} neste mês. Dados demonstrativos.`}
        actions={
          <>
            <Button variant="subtle">Ver relatório</Button>
            <Button variant="hero">
              Novo produto
              <ArrowUpRight />
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-dark">
                  <HeartPulse className="size-4" />
                </span>
                <p className="truncate text-sm font-semibold text-foreground">Saúde do negócio</p>
              </div>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tabular-nums text-foreground">
                  {demoDashboard.healthScore}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </p>
            </div>
            <Badge variant="success" className="shrink-0">
              Boa
            </Badge>
          </div>
          <ProgressBar value={demoDashboard.healthScore} className="mt-5" />
          <p className="mt-3 text-sm text-muted-foreground">
            Sua média está saudável, mas 2 produtos estão vendendo abaixo do preço mínimo.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Produtos"
            value={String(demoDashboard.products)}
            icon={Package}
            hint="No catálogo atual"
          />
          <StatCard
            label="Saudáveis"
            value={String(demoDashboard.healthy)}
            icon={TrendingUp}
            tone="success"
            hint="Margem acima da meta"
          />
          <StatCard
            label="Atenção"
            value={String(demoDashboard.warning)}
            icon={AlertTriangle}
            tone="warning"
            hint="Margem apertada"
          />
          <StatCard
            label="Críticos"
            value={String(demoDashboard.critical)}
            icon={XCircle}
            tone="danger"
            hint="Abaixo do preço mínimo"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ponto de equilíbrio"
          value={brl(demoDashboard.breakEven)}
          icon={Activity}
          tooltip="Quanto você precisa faturar no mês para cobrir todos os custos e despesas."
          hint="Faturamento mínimo do mês"
        />
        <StatCard
          label="Meta do mês"
          value={brl(demoDashboard.goal)}
          icon={Target}
          tone="info"
          hint={`${Math.round(goalProgress)}% já garantidos`}
        />
        <StatCard
          label="Margem média"
          value={pct(demoDashboard.averageMargin)}
          icon={Percent}
          tone="success"
          tooltip="Média da margem de lucro de todos os produtos cadastrados."
        />
        <StatCard
          label="Lucro projetado"
          value={brl(demoDashboard.projectedProfit)}
          icon={TrendingUp}
          tone="success"
          hint="Se a meta for atingida"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-foreground">
                Faturamento x custos
              </h2>
              <p className="text-sm text-muted-foreground">Últimos 7 meses (demonstrativo)</p>
            </div>
            <Badge variant="neutral" className="shrink-0">
              Demo
            </Badge>
          </div>

          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demoMonthlySeries} margin={{ left: -18, right: 6, top: 6 }}>
                <defs>
                  <linearGradient id="fatur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="custos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="mes"
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(value: number) => `${value / 1000}k`}
                />
                <ChartTooltip
                  formatter={(value: number) => brl(value)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  name="Faturamento"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#fatur)"
                />
                <Area
                  type="monotone"
                  dataKey="custos"
                  name="Custos"
                  stroke="var(--color-chart-3)"
                  strokeWidth={2.5}
                  fill="url(#custos)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-bold text-foreground">Progresso da meta</h2>
          <p className="text-sm text-muted-foreground">
            Falta {brl(demoDashboard.goal - demoDashboard.breakEven)} para bater a meta do mês.
          </p>
          <div className="mt-6 grid gap-5">
            <ProgressBar
              value={goalProgress}
              label="Faturamento garantido"
              caption={`${brl(demoDashboard.breakEven)} de ${brl(demoDashboard.goal)}`}
            />
            <ProgressBar value={62} label="Margem média" caption="24,8% de 40%" tone="info" />
            <ProgressBar value={22} label="Itens críticos" caption="2 de 18 produtos" tone="danger" />
          </div>
        </div>
      </div>

      <section className="grid gap-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="truncate text-base font-bold text-foreground">Produtos por margem</h2>
          <Button variant="ghost" size="sm" className="shrink-0">
            Ver todos
          </Button>
        </div>
        <DataTable columns={columns} rows={demoProducts} />
      </section>
    </div>
  );
}
