import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { formatBRLFromCents } from "@/lib/money";
import { workspaceQuery } from "@/lib/workspace";
import { supabase } from "@/integrations/supabase/client";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

type HealthStatus = "saudavel" | "atencao" | "critico";

const statusMap: Record<HealthStatus, { label: string; variant: "success" | "warning" | "danger" }> =
  {
    saudavel: { label: "Saudável", variant: "success" },
    atencao: { label: "Atenção", variant: "warning" },
    critico: { label: "Crítico", variant: "danger" },
  };

type ProductRow = {
  id: string;
  name: string;
  priceCents: number;
  costCents: number;
  margin: number | null;
  status: HealthStatus;
};

const NO_DATA = "—";

const pct = (value: number) =>
  `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

const columns: Column<ProductRow>[] = [
  {
    key: "name",
    header: "Produto",
    cell: (row) => <span className="font-semibold">{row.name}</span>,
  },
  { key: "price", header: "Preço", align: "right", cell: (row) => formatBRLFromCents(row.priceCents) },
  { key: "cost", header: "Custo", align: "right", cell: (row) => formatBRLFromCents(row.costCents) },
  {
    key: "margin",
    header: "Margem",
    align: "right",
    cell: (row) => (
      <span className="font-semibold">{row.margin === null ? NO_DATA : pct(row.margin)}</span>
    ),
  },
  {
    key: "status",
    header: "Situação",
    align: "right",
    cell: (row) => (
      <Badge variant={statusMap[row.status].variant}>{statusMap[row.status].label}</Badge>
    ),
  },
];

function ChartPlaceholder() {
  return (
    <div className="mt-6 grid h-64 place-items-center rounded-2xl border border-dashed border-border bg-background px-6 text-center text-sm text-muted-foreground">
      Ainda não há dados suficientes para este gráfico.
    </div>
  );
}

function DashboardPage() {
  const { data: workspace } = useQuery(workspaceQuery);
  const businessId = workspace?.business?.id;

  const { data: fixedCosts = [] } = useQuery({
    queryKey: ["fixed-costs", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fixed_costs")
        .select("amount_cents")
        .eq("business_id", businessId ?? "");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["dashboard-products", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,current_price_cents,adjusted_cost_cents,target_margin")
        .eq("business_id", businessId ?? "")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const monthlyCommitments =
    fixedCosts.reduce((sum, cost) => sum + Number(cost.amount_cents), 0) +
    (workspace?.business?.pro_labore_cents ?? 0);

  const rows: ProductRow[] = products.map((product) => {
    const priceCents = Number(product.current_price_cents);
    const costCents = Number(product.adjusted_cost_cents);
    const margin = priceCents > 0 ? ((priceCents - costCents) / priceCents) * 100 : null;
    const target = Number(product.target_margin);
    let status: HealthStatus = "atencao";
    if (margin === null || margin <= 0) status = "critico";
    else if (target > 0 ? margin >= target : margin >= 20) status = "saudavel";

    return { id: product.id, name: product.name, priceCents, costCents, margin, status };
  });

  const rowsByMargin = [...rows].sort((a, b) => (b.margin ?? -Infinity) - (a.margin ?? -Infinity));
  const healthy = rows.filter((row) => row.status === "saudavel").length;
  const warning = rows.filter((row) => row.status === "atencao").length;
  const critical = rows.filter((row) => row.status === "critico").length;

  const withMargin = rows.filter((row) => row.margin !== null);
  const averageMargin = withMargin.length
    ? withMargin.reduce((sum, row) => sum + (row.margin ?? 0), 0) / withMargin.length
    : null;

  const healthScore = rows.length
    ? Math.round(((healthy + warning * 0.5) / rows.length) * 100)
    : null;

  const breakEvenCents =
    averageMargin !== null && averageMargin > 0 && monthlyCommitments > 0
      ? Math.round(monthlyCommitments / (averageMargin / 100))
      : null;

  const goalCents = workspace?.business?.monthly_revenue_cents ?? null;
  const goalProgress =
    goalCents && goalCents > 0 && breakEvenCents
      ? Math.min((breakEvenCents / goalCents) * 100, 100)
      : null;

  const chartData = rowsByMargin
    .filter((row) => row.priceCents > 0)
    .slice(0, 8)
    .map((row) => ({
      nome: row.name,
      preco: row.priceCents / 100,
      custo: row.costCents / 100,
    }));

  const firstName = workspace?.profile.name.split(" ")[0] || "Olá";
  const businessName = workspace?.business?.name || "seu negócio";
  const hasProducts = rows.length > 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`Olá, ${firstName}`}
        description={`Este é o panorama de ${businessName} neste mês.`}
        actions={
          <>
            <Button variant="subtle" asChild>
              <Link to="/app/relatorios">Ver relatório</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/app/produtos" search={{ novo: true }}>
                Novo produto
                <ArrowUpRight />
              </Link>
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
                  {healthScore === null ? NO_DATA : healthScore}
                </span>
                {healthScore === null ? null : (
                  <span className="text-sm text-muted-foreground">/100</span>
                )}
              </p>
            </div>
            {healthScore === null ? (
              <Badge variant="neutral" className="shrink-0">
                Sem dados
              </Badge>
            ) : (
              <Badge
                variant={healthScore >= 70 ? "success" : healthScore >= 40 ? "warning" : "danger"}
                className="shrink-0"
              >
                {healthScore >= 70 ? "Boa" : healthScore >= 40 ? "Atenção" : "Crítica"}
              </Badge>
            )}
          </div>
          <ProgressBar value={healthScore ?? 0} className="mt-5" />
          <p className="mt-3 text-sm text-muted-foreground">
            {healthScore === null
              ? "Cadastre seus produtos para calcularmos a saúde do seu negócio."
              : critical > 0
                ? `${critical} ${critical === 1 ? "produto está" : "produtos estão"} vendendo abaixo do custo.`
                : "Todos os seus produtos estão cobrindo os custos."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Produtos"
            value={String(rows.length)}
            icon={Package}
            hint="No catálogo atual"
          />
          <StatCard
            label="Saudáveis"
            value={String(healthy)}
            icon={TrendingUp}
            tone="success"
            hint="Margem acima da meta"
          />
          <StatCard
            label="Atenção"
            value={String(warning)}
            icon={AlertTriangle}
            tone="warning"
            hint="Margem apertada"
          />
          <StatCard
            label="Críticos"
            value={String(critical)}
            icon={XCircle}
            tone="danger"
            hint="Abaixo do custo"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Compromissos mensais"
          value={monthlyCommitments > 0 ? formatBRLFromCents(monthlyCommitments) : NO_DATA}
          icon={Activity}
          tooltip="Soma dos custos fixos e do pró-labore cadastrados."
          hint="Custos fixos + pró-labore"
        />
        <StatCard
          label="Ponto de equilíbrio"
          value={breakEvenCents === null ? NO_DATA : formatBRLFromCents(breakEvenCents)}
          icon={Activity}
          tooltip="Quanto você precisa faturar no mês para cobrir todos os custos e despesas."
          hint={
            breakEvenCents === null
              ? "Cadastre custos e produtos"
              : "Faturamento mínimo do mês"
          }
        />
        <StatCard
          label="Meta do mês"
          value={goalCents && goalCents > 0 ? formatBRLFromCents(goalCents) : NO_DATA}
          icon={Target}
          tone="info"
          hint={
            goalProgress === null
              ? "Informe seu faturamento desejado"
              : `${Math.round(goalProgress)}% já garantidos`
          }
        />
        <StatCard
          label="Margem média"
          value={averageMargin === null ? NO_DATA : pct(averageMargin)}
          icon={Percent}
          tone="success"
          tooltip="Média da margem de lucro de todos os produtos cadastrados."
          hint={averageMargin === null ? "Sem dados" : undefined}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-foreground">Preço x custo</h2>
              <p className="text-sm text-muted-foreground">
                Seus produtos cadastrados, do maior para o menor margem
              </p>
            </div>
            <Badge variant="neutral" className="shrink-0">
              {chartData.length ? "Dados reais" : "Sem dados"}
            </Badge>
          </div>

          {chartData.length < 2 ? (
            <ChartPlaceholder />
          ) : (
            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -18, right: 6, top: 6 }}>
                  <defs>
                    <linearGradient id="preco" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="custo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="nome"
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
                  />
                  <ChartTooltip
                    formatter={(value: number) => formatBRLFromCents(value * 100)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="preco"
                    name="Preço"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2.5}
                    fill="url(#preco)"
                  />
                  <Area
                    type="monotone"
                    dataKey="custo"
                    name="Custo"
                    stroke="var(--color-chart-3)"
                    strokeWidth={2.5}
                    fill="url(#custo)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-bold text-foreground">Progresso da meta</h2>
          <p className="text-sm text-muted-foreground">
            {goalCents && goalCents > 0 && breakEvenCents
              ? `Falta ${formatBRLFromCents(Math.max(goalCents - breakEvenCents, 0))} para bater a meta do mês.`
              : "Informe seu faturamento desejado e cadastre produtos para acompanhar a meta."}
          </p>
          <div className="mt-6 grid gap-5">
            <ProgressBar
              value={goalProgress ?? 0}
              label="Faturamento garantido"
              caption={
                goalProgress === null
                  ? "Sem dados"
                  : `${formatBRLFromCents(breakEvenCents ?? 0)} de ${formatBRLFromCents(goalCents ?? 0)}`
              }
            />
            <ProgressBar
              value={averageMargin === null ? 0 : Math.min(Math.max(averageMargin, 0), 100)}
              label="Margem média"
              caption={averageMargin === null ? "Sem dados" : pct(averageMargin)}
              tone="info"
            />
            <ProgressBar
              value={hasProducts ? (critical / rows.length) * 100 : 0}
              label="Itens críticos"
              caption={hasProducts ? `${critical} de ${rows.length} produtos` : "Sem dados"}
              tone="danger"
            />
          </div>
        </div>
      </div>

      <section className="grid gap-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="truncate text-base font-bold text-foreground">Produtos por margem</h2>
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <Link to="/app/produtos">Ver todos</Link>
          </Button>
        </div>
        {loadingProducts ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-soft">
            Carregando produtos...
          </div>
        ) : hasProducts ? (
          <DataTable columns={columns} rows={rowsByMargin} />
        ) : (
          <EmptyState
            icon={Package}
            title="Você ainda não cadastrou nenhum produto"
            description="Cadastre seu primeiro produto e descubra se está cobrando o preço certo."
            action={
              <Button variant="hero" asChild>
                <Link to="/app/produtos" search={{ novo: true }}>
                  Cadastrar produto
                </Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
