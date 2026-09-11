import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calculator, Pencil, Plus, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PercentageInput } from "@/components/ui/percentage-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/catalog";
import { formatBRLFromCents } from "@/lib/money";
import { parseDecimal } from "@/lib/units";
import { ensureWorkspace } from "@/lib/workspace";
import {
  PricingError,
  calculateBreakEvenRevenue,
  calculateContributionMargin,
  calculateContributionMarginPercentage,
  calculateDiscountImpact,
  calculateMarkup,
  calculateMonthlyProfit,
  calculatePriceRange,
  calculateWeightedContributionMargin,
  channelFees as feesOf,
  feeLabels,
  listSalesChannels,
  saveProductChannelPrices,
  totalFeePercentage,
  type SalesChannel,
} from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/app/precificacao")({
  head: () => ({
    meta: [
      { title: "Precificação — PreçoSadio" },
      {
        name: "description",
        content:
          "Descubra o preço mínimo, o preço saudável e a faixa de teste de cada produto em cada canal de venda.",
      },
      { property: "og:title", content: "Precificação — PreçoSadio" },
      {
        property: "og:description",
        content: "Preço saudável, margem de contribuição e ponto de equilíbrio do seu negócio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const NO_DATA = "—";
const pct = (value: number) =>
  `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

type FeeField = keyof typeof feeLabels;
const feeColumns: { field: FeeField; column: keyof SalesChannel }[] = [
  { field: "taxPercentage", column: "tax_percentage" },
  { field: "cardFeePercentage", column: "card_fee_percentage" },
  { field: "marketplaceFeePercentage", column: "marketplace_fee_percentage" },
  { field: "commissionPercentage", column: "commission_percentage" },
  { field: "deliveryFeePercentage", column: "delivery_fee_percentage" },
  { field: "otherFeePercentage", column: "other_fee_percentage" },
];

const emptyFeeForm = (): Record<FeeField, string> => ({
  taxPercentage: "",
  cardFeePercentage: "",
  marketplaceFeePercentage: "",
  commissionPercentage: "",
  deliveryFeePercentage: "",
  otherFeePercentage: "",
});

type Analysis = {
  product: Product;
  costCents: number;
  targetMargin: number;
  error: string | null;
  minimumPriceCents: number;
  healthyPriceCents: number;
  strategicFromCents: number;
  strategicToCents: number;
  currentPriceCents: number;
  contributionCents: number | null;
  contributionPercentage: number | null;
  markupMultiplier: number | null;
};

function PricingPage() {
  const [businessId, setBusinessId] = useState("");
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fixedCostsCents, setFixedCostsCents] = useState(0);
  const [proLaboreCents, setProLaboreCents] = useState(0);
  const [monthlyGoalCents, setMonthlyGoalCents] = useState(0);
  const [loading, setLoading] = useState(true);

  const [channelId, setChannelId] = useState("");
  const [fallbackMargin, setFallbackMargin] = useState("20");
  const [strategicMin, setStrategicMin] = useState("5");
  const [strategicMax, setStrategicMax] = useState("15");
  const [discountProductId, setDiscountProductId] = useState("");
  const [discount, setDiscount] = useState("10");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SalesChannel | null>(null);
  const [channelName, setChannelName] = useState("");
  const [feeForm, setFeeForm] = useState(emptyFeeForm());
  const [saving, setSaving] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);

  async function load() {
    const business = await ensureWorkspace();
    setBusinessId(business.id);
    setProLaboreCents(Number(business.pro_labore_cents));
    setMonthlyGoalCents(Number(business.monthly_revenue_cents ?? 0));
    const [channelsData, productsResult, costsResult] = await Promise.all([
      listSalesChannels(business.id),
      supabase.from("products").select("*").eq("business_id", business.id).order("name"),
      supabase.from("fixed_costs").select("amount_cents").eq("business_id", business.id),
    ]);
    setLoading(false);
    if (productsResult.error || costsResult.error) {
      toast.error("Não foi possível carregar seus dados.");
      return;
    }
    setChannels(channelsData);
    setProducts(productsResult.data);
    setFixedCostsCents(
      (costsResult.data ?? []).reduce((sum: number, cost: { amount_cents: number }) => sum + Number(cost.amount_cents), 0),
    );
    setChannelId((current) => current || (channelsData[0]?.id ?? ""));
  }

  useEffect(() => {
    load().catch(() => {
      setLoading(false);
      toast.error("Não foi possível carregar seus dados.");
    });
  }, []);

  const channel = channels.find((item) => item.id === channelId) ?? null;
  const fees = channel ? feesOf(channel) : {};

  const feeError = useMemo(() => {
    try {
      totalFeePercentage(fees);
      return null;
    } catch (error) {
      return error instanceof PricingError ? error.message : "Revise as taxas deste canal.";
    }
  }, [channelId, channels]); // eslint-disable-line react-hooks/exhaustive-deps

  const feeTotal = feeError ? null : totalFeePercentage(fees);

  const strategicRange = {
    minPercentage: parseDecimal(strategicMin),
    maxPercentage: parseDecimal(strategicMax),
  };

  const analyses: Analysis[] = useMemo(
    () =>
      products.map((product) => {
        const costCents = Number(product.adjusted_cost_cents);
        const declaredMargin = Number(product.target_margin);
        const targetMargin = declaredMargin > 0 ? declaredMargin : parseDecimal(fallbackMargin);
        const currentPriceCents = Number(product.current_price_cents);

        const base: Analysis = {
          product,
          costCents,
          targetMargin,
          error: null,
          minimumPriceCents: 0,
          healthyPriceCents: 0,
          strategicFromCents: 0,
          strategicToCents: 0,
          currentPriceCents,
          contributionCents: null,
          contributionPercentage: null,
          markupMultiplier: null,
        };

        try {
          const range = calculatePriceRange({
            unitCostCents: costCents,
            fees,
            targetMarginPercentage: targetMargin,
            strategicRange,
          });
          base.minimumPriceCents = range.minimumPriceCents;
          base.healthyPriceCents = range.healthyPriceCents;
          base.strategicFromCents = range.strategicFromCents;
          base.strategicToCents = range.strategicToCents;
        } catch (error) {
          base.error =
            error instanceof PricingError ? error.message : "Não foi possível calcular este preço.";
          return base;
        }

        if (currentPriceCents > 0) {
          try {
            base.contributionCents = calculateContributionMargin({
              priceCents: currentPriceCents,
              unitCostCents: costCents,
              fees,
            });
            base.contributionPercentage = calculateContributionMarginPercentage({
              priceCents: currentPriceCents,
              unitCostCents: costCents,
              fees,
            });
          } catch {
            base.contributionCents = null;
          }
          if (costCents > 0) {
            try {
              base.markupMultiplier = calculateMarkup(currentPriceCents, costCents).multiplier;
            } catch {
              base.markupMultiplier = null;
            }
          }
        }
        return base;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, channelId, channels, fallbackMargin, strategicMin, strategicMax],
  );

  const monthlyCommitments = fixedCostsCents + proLaboreCents;

  const weighted = useMemo(
    () =>
      calculateWeightedContributionMargin(
        analyses
          .filter((item) => item.currentPriceCents > 0 && !item.error)
          .map((item) => ({
            priceCents: item.currentPriceCents,
            unitCostCents: item.costCents,
            fees,
            monthlySales: 1,
          })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analyses],
  );

  let breakEvenCents: number | null = null;
  if (weighted.percentage !== null && monthlyCommitments > 0) {
    try {
      breakEvenCents = calculateBreakEvenRevenue(monthlyCommitments, weighted.percentage);
    } catch {
      breakEvenCents = null;
    }
  }

  const projectedProfit =
    weighted.percentage !== null && monthlyGoalCents > 0
      ? calculateMonthlyProfit({
          revenueCents: monthlyGoalCents,
          contributionMarginPercentage: weighted.percentage,
          fixedCostsCents: monthlyCommitments,
        })
      : null;

  const discountTarget = analyses.find((item) => item.product.id === discountProductId) ?? null;
  let discountImpact: ReturnType<typeof calculateDiscountImpact> | null = null;
  let discountError: string | null = null;
  if (discountTarget && discountTarget.currentPriceCents > 0) {
    try {
      discountImpact = calculateDiscountImpact({
        priceCents: discountTarget.currentPriceCents,
        unitCostCents: discountTarget.costCents,
        fees,
        discountPercentage: parseDecimal(discount),
      });
    } catch (error) {
      discountError =
        error instanceof PricingError ? error.message : "Revise o desconto informado.";
    }
  }

  function showChannelForm(item?: SalesChannel) {
    setEditing(item ?? null);
    setChannelName(item?.name ?? "");
    if (item) {
      const current = emptyFeeForm();
      for (const { field, column } of feeColumns) {
        const value = Number(item[column]);
        current[field] = value ? String(value).replace(".", ",") : "";
      }
      setFeeForm(current);
    } else {
      setFeeForm(emptyFeeForm());
    }
    setOpen(true);
  }

  async function saveChannel() {
    if (!channelName.trim()) {
      toast.error("Informe o nome do canal.");
      return;
    }
    const values = Object.fromEntries(
      feeColumns.map(({ field }) => [field, parseDecimal(feeForm[field])]),
    ) as Record<FeeField, number>;

    try {
      totalFeePercentage(values);
    } catch (error) {
      toast.error(
        error instanceof PricingError ? error.message : "Revise as taxas deste canal.",
      );
      return;
    }

    setSaving(true);
    const payload = {
      business_id: businessId,
      name: channelName.trim().slice(0, 120),
      tax_percentage: values.taxPercentage,
      card_fee_percentage: values.cardFeePercentage,
      marketplace_fee_percentage: values.marketplaceFeePercentage,
      commission_percentage: values.commissionPercentage,
      delivery_fee_percentage: values.deliveryFeePercentage,
      other_fee_percentage: values.otherFeePercentage,
    };
    const result = editing
      ? await supabase.from("sales_channels").update(payload).eq("id", editing.id)
      : await supabase.from("sales_channels").insert(payload);
    setSaving(false);
    if (result.error) {
      toast.error("Não foi possível salvar o canal.");
      return;
    }
    toast.success(editing ? "Canal atualizado." : "Canal criado.");
    setOpen(false);
    await load();
  }

  async function removeChannel(item: SalesChannel) {
    if (!window.confirm(`Excluir o canal ${item.name}? Os preços salvos nele serão removidos.`))
      return;
    const { error } = await supabase.from("sales_channels").delete().eq("id", item.id);
    if (error) {
      toast.error("Não foi possível excluir o canal.");
      return;
    }
    if (channelId === item.id) setChannelId("");
    toast.success("Canal excluído.");
    await load();
  }

  async function savePrices() {
    if (!channel) return;
    const rows = analyses
      .filter((item) => !item.error)
      .map((item) => ({
        product_id: item.product.id,
        sales_channel_id: channel.id,
        current_price_cents: Math.round(item.currentPriceCents),
        minimum_price_cents: Math.round(item.minimumPriceCents),
        healthy_price_cents: Math.round(item.healthyPriceCents),
        strategic_price_cents: Math.round(item.strategicFromCents),
      }));
    if (!rows.length) {
      toast.error("Não há preços válidos para salvar neste canal.");
      return;
    }
    setSavingPrices(true);
    try {
      await saveProductChannelPrices(rows);
      toast.success("Preços do canal salvos.");
    } catch {
      toast.error("Não foi possível salvar os preços deste canal.");
    }
    setSavingPrices(false);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-soft">
        Carregando precificação...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Precificação"
        description="Preço mínimo, preço saudável e faixa de teste de cada produto, canal por canal."
        actions={
          <Button variant="hero" onClick={() => showChannelForm()}>
            <Plus />
            Novo canal
          </Button>
        }
      />

      {channels.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Você ainda não cadastrou nenhum canal de venda"
          description="Um canal reúne as taxas que incidem sobre a venda: impostos, cartão, marketplace, comissão e entrega."
          action={
            <Button variant="hero" onClick={() => showChannelForm()}>
              <Plus />
              Criar canal de venda
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {channels.map((item) => {
              let total: number | null = null;
              try {
                total = totalFeePercentage(feesOf(item));
              } catch {
                total = null;
              }
              return (
                <article
                  key={item.id}
                  className={`grid gap-3 rounded-2xl border bg-card p-5 shadow-soft ${
                    item.id === channelId ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-foreground">{item.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {total === null ? "Taxas acima do permitido" : `${pct(total)} de taxas`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${item.name}`}
                        onClick={() => showChannelForm(item)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir ${item.name}`}
                        onClick={() => removeChannel(item)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <ul className="grid gap-1 text-xs text-muted-foreground">
                    {feeColumns.map(({ field, column }) => (
                      <li key={field} className="flex justify-between">
                        <span>{feeLabels[field]}</span>
                        <span className="tabular-nums">{pct(Number(item[column]))}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={item.id === channelId ? "soft" : "ghost"}
                    size="sm"
                    onClick={() => setChannelId(item.id)}
                  >
                    {item.id === channelId ? "Canal em análise" : "Analisar este canal"}
                  </Button>
                </article>
              );
            })}
          </div>

          <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:grid-cols-3">
            <div className="grid gap-1.5">
              <span className="flex items-center gap-1.5">
                <Label htmlFor="fallback-margin">Margem desejada padrão</Label>
                <InfoTooltip content="Usada nos produtos que ainda não têm margem própria definida na ficha técnica." />
              </span>
              <PercentageInput
                id="fallback-margin"
                value={fallbackMargin}
                onValueChange={setFallbackMargin}
              />
            </div>
            <div className="grid gap-1.5">
              <span className="flex items-center gap-1.5">
                <Label htmlFor="strategic-min">Faixa estratégica (início)</Label>
                <InfoTooltip content="Percentual acima do preço saudável onde começa a faixa sugerida para teste." />
              </span>
              <PercentageInput
                id="strategic-min"
                value={strategicMin}
                onValueChange={setStrategicMin}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="strategic-max">Faixa estratégica (fim)</Label>
              <PercentageInput
                id="strategic-max"
                value={strategicMax}
                onValueChange={setStrategicMax}
              />
            </div>
          </div>

          {feeError ? (
            <p className="rounded-2xl border border-danger/40 bg-danger-soft px-5 py-4 text-sm text-danger">
              {feeError}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Taxas do canal"
              value={feeTotal === null ? NO_DATA : pct(feeTotal)}
              tooltip="Soma dos percentuais que saem de cada venda neste canal: impostos, cartão, marketplace, comissão, entrega e outras taxas."
              hint={channel?.name ?? "Selecione um canal"}
            />
            <StatCard
              label="Margem de contribuição média"
              value={weighted.percentage === null ? NO_DATA : pct(weighted.percentage)}
              tone="success"
              tooltip="Média ponderada do que sobra de cada venda depois do custo do produto e das taxas do canal, antes dos custos fixos."
              hint={weighted.percentage === null ? "Sem preços cadastrados" : "Ponderada pelo mix"}
            />
            <StatCard
              label="Ponto de equilíbrio"
              value={breakEvenCents === null ? NO_DATA : formatBRLFromCents(breakEvenCents)}
              tooltip="Faturamento necessário no mês para cobrir custos fixos e pró-labore: compromissos ÷ margem de contribuição média."
              hint={
                monthlyCommitments > 0
                  ? `Compromissos: ${formatBRLFromCents(monthlyCommitments)}`
                  : "Cadastre seus custos fixos"
              }
            />
            <StatCard
              label="Lucro na meta do mês"
              value={
                projectedProfit === null ? NO_DATA : formatBRLFromCents(projectedProfit.profitCents)
              }
              tone={projectedProfit && projectedProfit.profitCents >= 0 ? "success" : "danger"}
              tooltip="Faturamento desejado × margem de contribuição média − custos fixos e pró-labore."
              hint={
                monthlyGoalCents > 0
                  ? `Meta: ${formatBRLFromCents(monthlyGoalCents)}`
                  : "Informe seu faturamento desejado"
              }
            />
          </div>

          <section className="grid gap-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-foreground">
                  Preços por produto {channel ? `— ${channel.name}` : ""}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cálculo sobre o custo ajustado pelas perdas e as taxas do canal.
                </p>
              </div>
              <Button
                variant="subtle"
                size="sm"
                className="shrink-0"
                disabled={savingPrices || !channel || !products.length}
                onClick={savePrices}
              >
                {savingPrices ? "Salvando..." : "Salvar preços do canal"}
              </Button>
            </div>

            {products.length === 0 ? (
              <EmptyState
                icon={Calculator}
                title="Você ainda não cadastrou nenhum produto"
                description="Cadastre um produto com a ficha técnica para calcularmos o preço saudável."
                action={
                  <Button variant="hero" asChild>
                    <Link to="/app/produtos" search={{ novo: true }}>
                      Cadastrar produto
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[52rem] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                        <th className="px-5 py-3">Produto</th>
                        <th className="px-5 py-3 text-right">Custo</th>
                        <th className="px-5 py-3 text-right">
                          <span className="inline-flex items-center gap-1.5">
                            Preço mínimo
                            <InfoTooltip content="Preço que cobre exatamente o custo ajustado pelas perdas e as taxas do canal, sem nenhum lucro e sem cobrir custos fixos." />
                          </span>
                        </th>
                        <th className="px-5 py-3 text-right">
                          <span className="inline-flex items-center gap-1.5">
                            Preço saudável
                            <InfoTooltip content="Preço recomendado: cobre custo, taxas do canal e entrega a margem desejada." />
                          </span>
                        </th>
                        <th className="px-5 py-3 text-right">
                          <span className="inline-flex items-center gap-1.5">
                            Faixa para teste
                            <InfoTooltip content="Faixa sugerida para teste, acima do preço saudável. Não é uma recomendação automática." />
                          </span>
                        </th>
                        <th className="px-5 py-3 text-right">Preço atual</th>
                        <th className="px-5 py-3 text-right">
                          <span className="inline-flex items-center gap-1.5">
                            MC
                            <InfoTooltip content="Margem de contribuição: quanto sobra de cada venda depois do custo do produto e das taxas, calculada sobre o preço." />
                          </span>
                        </th>
                        <th className="px-5 py-3 text-right">
                          <span className="inline-flex items-center gap-1.5">
                            Markup
                            <InfoTooltip content="Markup é preço ÷ custo (quantas vezes o custo). Margem é calculada sobre o preço. Markup 2x, por exemplo, equivale a 50% de margem." />
                          </span>
                        </th>
                        <th className="px-5 py-3 text-right">Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyses.map((item) => (
                        <tr key={item.product.id} className="border-b border-border/70 last:border-0">
                          <td className="px-5 py-4">
                            <span className="font-semibold">{item.product.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              Margem desejada {pct(item.targetMargin)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right tabular-nums">
                            {formatBRLFromCents(item.costCents)}
                          </td>
                          {item.error ? (
                            <td className="px-5 py-4 text-right text-danger" colSpan={7}>
                              {item.error}
                            </td>
                          ) : (
                            <>
                              <td className="px-5 py-4 text-right tabular-nums">
                                {formatBRLFromCents(item.minimumPriceCents)}
                              </td>
                              <td className="px-5 py-4 text-right font-semibold tabular-nums text-primary-dark">
                                {formatBRLFromCents(item.healthyPriceCents)}
                              </td>
                              <td className="px-5 py-4 text-right text-xs tabular-nums text-muted-foreground">
                                {formatBRLFromCents(item.strategicFromCents)} a{" "}
                                {formatBRLFromCents(item.strategicToCents)}
                              </td>
                              <td className="px-5 py-4 text-right tabular-nums">
                                {item.currentPriceCents > 0
                                  ? formatBRLFromCents(item.currentPriceCents)
                                  : NO_DATA}
                              </td>
                              <td className="px-5 py-4 text-right tabular-nums">
                                {item.contributionPercentage === null
                                  ? NO_DATA
                                  : `${pct(item.contributionPercentage)} · ${formatBRLFromCents(item.contributionCents ?? 0)}`}
                              </td>
                              <td className="px-5 py-4 text-right tabular-nums">
                                {item.markupMultiplier === null
                                  ? NO_DATA
                                  : `${item.markupMultiplier.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x`}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {item.currentPriceCents <= 0 ? (
                                  <Badge variant="neutral">Sem preço</Badge>
                                ) : item.currentPriceCents < item.minimumPriceCents ? (
                                  <Badge variant="danger">Abaixo do mínimo</Badge>
                                ) : item.currentPriceCents < item.healthyPriceCents ? (
                                  <Badge variant="warning">Abaixo do saudável</Badge>
                                ) : (
                                  <Badge variant="success">Saudável</Badge>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {products.length > 0 ? (
            <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div>
                <h2 className="text-base font-bold text-foreground">Impacto de um desconto</h2>
                <p className="text-sm text-muted-foreground">
                  Veja quanto some da sua margem antes de anunciar uma promoção.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Produto</Label>
                  <Select value={discountProductId} onValueChange={setDiscountProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="discount">Desconto</Label>
                  <PercentageInput id="discount" value={discount} onValueChange={setDiscount} />
                </div>
              </div>

              {discountError ? (
                <p className="text-sm text-danger">{discountError}</p>
              ) : !discountTarget ? (
                <p className="text-sm text-muted-foreground">
                  Escolha um produto para simular o desconto.
                </p>
              ) : discountTarget.currentPriceCents <= 0 ? (
                <p className="text-sm text-muted-foreground">
                  Informe o preço atual deste produto na ficha técnica para simular o desconto.
                </p>
              ) : discountImpact ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Preço com desconto"
                    value={formatBRLFromCents(discountImpact.discountedPriceCents)}
                  />
                  <StatCard
                    label="Margem de contribuição"
                    value={
                      discountImpact.discountedMarginPercentage === null
                        ? NO_DATA
                        : pct(discountImpact.discountedMarginPercentage)
                    }
                    tone={discountImpact.isBelowCost ? "danger" : "success"}
                    hint={formatBRLFromCents(discountImpact.discountedMarginCents)}
                  />
                  <StatCard
                    label="Você deixa de ganhar"
                    value={formatBRLFromCents(discountImpact.lossCents)}
                    tone="warning"
                    hint="Por unidade vendida"
                  />
                  <StatCard
                    label="Precisa vender"
                    value={
                      discountImpact.salesMultiplierToKeepProfit === null
                        ? NO_DATA
                        : `${discountImpact.salesMultiplierToKeepProfit.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x`
                    }
                    tooltip="Quantas vezes mais unidades você precisa vender para manter o mesmo ganho total."
                    hint={
                      discountImpact.isBelowCost
                        ? "Com esse desconto a venda fica abaixo do custo"
                        : "Para manter o mesmo ganho"
                    }
                  />
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar canal" : "Novo canal de venda"}</DialogTitle>
            <DialogDescription>
              Informe as taxas percentuais que incidem sobre cada venda neste canal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="channel-name">Nome do canal</Label>
              <Input
                id="channel-name"
                value={channelName}
                maxLength={120}
                onChange={(event) => setChannelName(event.target.value)}
                placeholder="Ex.: Loja física, iFood, WhatsApp"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {feeColumns.map(({ field }) => (
                <div key={field} className="grid gap-1.5">
                  <Label htmlFor={`fee-${field}`}>{feeLabels[field]}</Label>
                  <PercentageInput
                    id={`fee-${field}`}
                    value={feeForm[field]}
                    onValueChange={(value) =>
                      setFeeForm((current) => ({ ...current, [field]: value }))
                    }
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              A soma das taxas precisa ser menor que 100%, e cada taxa é aplicada sobre o preço de
              venda.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="hero" disabled={saving} onClick={saveChannel}>
              {saving ? "Salvando..." : "Salvar canal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
