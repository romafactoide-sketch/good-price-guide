import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { BreakEvenMeter } from "@/components/app/break-even-meter";
import { PremiumLock, usePlan } from "@/components/app/paywall";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePricingData } from "@/hooks/use-pricing-data";
import { currencyTextToCents, formatBRLFromCents } from "@/lib/money";
import { parseDecimal } from "@/lib/units";
import {
  PricingError,
  calculateDiscountImpact,
  calculateGoalPlan,
  calculateMaxHealthyDiscount,
  calculatePriceScenario,
  calculateWeightedContributionMargin,
  channelFees as feesOf,
  comparePriceScenarios,
} from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/app/simuladores")({
  head: () => ({
    meta: [
      { title: "Simuladores — PreçoSadio" },
      { name: "description", content: "Teste preços, descontos e metas antes de anunciar." },
      { property: "og:title", content: "Simuladores — PreçoSadio" },
      {
        property: "og:description",
        content: "E se eu vender por...? Posso dar desconto? Quanto preciso vender?",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimulatorsPage,
});

const NO_DATA = "—";
const pct = (value: number) =>
  `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const num = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const messageOf = (error: unknown, fallback: string) =>
  error instanceof PricingError ? error.message : fallback;

function SimulatorsPage() {
  const { canUse } = usePlan();
  const { loading, products, channels, fixedCostsCents, proLaboreCents, monthlyGoalCents } =
    usePricingData();

  if (!canUse("simulators")) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Simuladores"
          description="Teste preços, descontos e metas antes de mudar a sua tabela."
        />
        <PremiumLock feature="simulators" />
      </div>
    );
  }

  const [productId, setProductId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [monthlySalesText, setMonthlySalesText] = useState("100");
  const [newPriceText, setNewPriceText] = useState("");
  const [discountText, setDiscountText] = useState("10");
  const [goalText, setGoalText] = useState("");

  const product = products.find((item) => item.id === productId) ?? products[0] ?? null;
  const channel = channels.find((item) => item.id === channelId) ?? channels[0] ?? null;
  const fees = channel ? feesOf(channel) : {};

  const monthlyCommitments = fixedCostsCents + proLaboreCents;
  const monthlySales = Math.max(0, Math.round(parseDecimal(monthlySalesText)));
  const costCents = product ? Number(product.adjusted_cost_cents) : 0;
  const currentPriceCents = product ? Number(product.current_price_cents) : 0;
  const targetMargin = product ? Number(product.target_margin) : 0;
  const newPriceCents = currencyTextToCents(newPriceText) || currentPriceCents;
  const goalProfitCents = currencyTextToCents(goalText);

  const weighted = useMemo(
    () =>
      calculateWeightedContributionMargin(
        products
          .filter((item) => Number(item.current_price_cents) > 0)
          .map((item) => ({
            priceCents: Number(item.current_price_cents),
            unitCostCents: Number(item.adjusted_cost_cents),
            fees,
            monthlySales: 1,
          })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, channel],
  );

  const scenario = useMemo(() => {
    if (!product || currentPriceCents <= 0) return null;
    try {
      return {
        data: comparePriceScenarios({
          currentPriceCents,
          newPriceCents,
          unitCostCents: costCents,
          fees,
          monthlySales,
          fixedCostsCents: monthlyCommitments,
        }),
        error: null as string | null,
      };
    } catch (error) {
      return { data: null, error: messageOf(error, "Revise o preço informado.") };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, channel, newPriceCents, monthlySales, monthlyCommitments]);

  const discount = useMemo(() => {
    if (!product || currentPriceCents <= 0) return null;
    try {
      return {
        impact: calculateDiscountImpact({
          priceCents: currentPriceCents,
          unitCostCents: costCents,
          fees,
          discountPercentage: parseDecimal(discountText),
        }),
        max: calculateMaxHealthyDiscount({
          priceCents: currentPriceCents,
          unitCostCents: costCents,
          fees,
          targetMarginPercentage: targetMargin,
        }),
        error: null as string | null,
      };
    } catch (error) {
      return { impact: null, max: null, error: messageOf(error, "Revise o desconto informado.") };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, channel, discountText]);

  const discountedScenario = useMemo(() => {
    if (!discount?.impact) return null;
    try {
      return calculatePriceScenario({
        priceCents: discount.impact.discountedPriceCents,
        unitCostCents: costCents,
        fees,
        monthlySales,
        fixedCostsCents: monthlyCommitments,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discount, monthlySales, monthlyCommitments, channel]);

  const averageTicketCents = useMemo(() => {
    const withPrice = products.filter((item) => Number(item.current_price_cents) > 0);
    if (!withPrice.length) return 0;
    return (
      withPrice.reduce((sum, item) => sum + Number(item.current_price_cents), 0) / withPrice.length
    );
  }, [products]);

  const goal = useMemo(() => {
    if (weighted.percentage === null) return null;
    try {
      return {
        plan: calculateGoalPlan({
          targetProfitCents: goalProfitCents,
          fixedCostsCents: monthlyCommitments,
          contributionMarginPercentage: weighted.percentage,
          averageTicketCents,
          expectedMonthlySales: monthlySales,
        }),
        error: null as string | null,
      };
    } catch (error) {
      return { plan: null, error: messageOf(error, "Revise os dados da meta.") };
    }
  }, [weighted.percentage, goalProfitCents, monthlyCommitments, averageTicketCents, monthlySales]);

  let breakEvenCents: number | null = null;
  if (goal?.plan) breakEvenCents = goal.plan.breakEvenRevenueCents;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-soft">
        Carregando simuladores...
      </div>
    );
  }

  const noProducts = products.length === 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Simuladores"
        description="Teste um preço novo, um desconto ou uma meta de lucro antes de decidir."
      />

      {noProducts ? (
        <EmptyState
          icon={SlidersHorizontal}
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
      ) : (
        <>
          <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label>Produto</Label>
              <Select value={product?.id ?? ""} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Canal de venda</Label>
              <Select value={channel?.id ?? ""} onValueChange={setChannelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem canal cadastrado" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <span className="flex items-center gap-1.5">
                <Label htmlFor="monthly-sales">Vendas por mês</Label>
                <InfoTooltip content="Quantas unidades deste produto você costuma vender no mês. Usamos esse volume nos resultados mensais." />
              </span>
              <Input
                id="monthly-sales"
                inputMode="numeric"
                value={monthlySalesText}
                onChange={(event) => setMonthlySalesText(event.target.value)}
              />
            </div>
          </div>

          {currentPriceCents <= 0 ? (
            <p className="rounded-2xl border border-warning/40 bg-warning-soft px-5 py-4 text-sm text-warning-foreground">
              Informe o preço atual de {product?.name} na ficha técnica para usar os simuladores de
              preço e desconto.
            </p>
          ) : null}

          <Tabs defaultValue="e-se">
            <TabsList className="flex-wrap">
              <TabsTrigger value="e-se">E se eu vender por...</TabsTrigger>
              <TabsTrigger value="desconto">Posso dar desconto?</TabsTrigger>
              <TabsTrigger value="meta">Quanto preciso vender?</TabsTrigger>
            </TabsList>

            {/* E se eu vender por... */}
            <TabsContent value="e-se" className="grid gap-4">
              <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Preço atual</Label>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {currentPriceCents > 0 ? formatBRLFromCents(currentPriceCents) : NO_DATA}
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="new-price">Novo preço</Label>
                  <CurrencyInput
                    id="new-price"
                    value={newPriceText}
                    onValueChange={setNewPriceText}
                  />
                </div>
              </div>

              {scenario?.error ? (
                <p className="text-sm text-danger">{scenario.error}</p>
              ) : scenario?.data ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      label="Margem"
                      value={
                        scenario.data.next.marginPercentage === null
                          ? NO_DATA
                          : pct(scenario.data.next.marginPercentage)
                      }
                      tone={
                        (scenario.data.next.marginPercentage ?? 0) >= targetMargin
                          ? "success"
                          : "warning"
                      }
                      hint={`Margem desejada ${pct(targetMargin)}`}
                    />
                    <StatCard
                      label="Margem de contribuição"
                      value={formatBRLFromCents(scenario.data.next.contributionCents)}
                      tooltip="Quanto sobra de cada venda depois do custo do produto e das taxas do canal."
                      hint="Por unidade"
                    />
                    <StatCard
                      label="Lucro unitário"
                      value={formatBRLFromCents(scenario.data.next.unitProfitCents)}
                      tone={scenario.data.next.unitProfitCents >= 0 ? "success" : "danger"}
                      hint={`Já com ${formatBRLFromCents(scenario.data.next.fixedCostPerUnitCents)} de custo fixo por unidade`}
                    />
                    <StatCard
                      label="Lucro mensal"
                      value={formatBRLFromCents(scenario.data.next.monthlyProfitCents)}
                      tone={scenario.data.next.monthlyProfitCents >= 0 ? "success" : "danger"}
                      hint={`${num(monthlySales)} vendas no mês`}
                    />
                  </div>
                  <div className="grid gap-2 rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <p className="text-sm text-muted-foreground">Impacto mensal</p>
                    <p
                      className={`text-3xl font-bold tabular-nums ${
                        scenario.data.monthlyImpactCents >= 0 ? "text-primary-dark" : "text-danger"
                      }`}
                    >
                      {scenario.data.monthlyImpactCents >= 0 ? "+" : "−"}
                      {formatBRLFromCents(Math.abs(scenario.data.monthlyImpactCents))}/mês
                    </p>
                    <p className="text-xs text-muted-foreground">
                      De {formatBRLFromCents(currentPriceCents)} para{" "}
                      {formatBRLFromCents(newPriceCents)}. Considerando o mesmo volume informado.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Informe o preço atual do produto para simular.
                </p>
              )}
            </TabsContent>

            {/* Posso dar desconto? */}
            <TabsContent value="desconto" className="grid gap-4">
              <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Preço atual</Label>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {currentPriceCents > 0 ? formatBRLFromCents(currentPriceCents) : NO_DATA}
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="discount">Desconto</Label>
                  <PercentageInput
                    id="discount"
                    value={discountText}
                    onValueChange={setDiscountText}
                  />
                </div>
              </div>

              {discount?.error ? (
                <p className="text-sm text-danger">{discount.error}</p>
              ) : discount?.impact ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      label="Novo preço"
                      value={formatBRLFromCents(discount.impact.discountedPriceCents)}
                    />
                    <StatCard
                      label="Margem resultante"
                      value={
                        discount.impact.discountedMarginPercentage === null
                          ? NO_DATA
                          : pct(discount.impact.discountedMarginPercentage)
                      }
                      tone={
                        discount.impact.isBelowCost
                          ? "danger"
                          : (discount.impact.discountedMarginPercentage ?? 0) >= targetMargin
                            ? "success"
                            : "warning"
                      }
                      hint={formatBRLFromCents(discount.impact.discountedMarginCents)}
                    />
                    <StatCard
                      label="Lucro unitário"
                      value={
                        discountedScenario === null
                          ? NO_DATA
                          : formatBRLFromCents(discountedScenario.unitProfitCents)
                      }
                      tone={(discountedScenario?.unitProfitCents ?? 0) >= 0 ? "success" : "danger"}
                      hint="Com o custo fixo por unidade"
                    />
                    <StatCard
                      label="Situação"
                      value={
                        discount.impact.isBelowCost
                          ? "Abaixo do custo"
                          : (discount.impact.discountedMarginPercentage ?? 0) >= targetMargin
                            ? "Saudável"
                            : "Abaixo da meta"
                      }
                      tone={
                        discount.impact.isBelowCost
                          ? "danger"
                          : (discount.impact.discountedMarginPercentage ?? 0) >= targetMargin
                            ? "success"
                            : "warning"
                      }
                      hint={`Você deixa de ganhar ${formatBRLFromCents(discount.impact.lossCents)} por unidade`}
                    />
                  </div>

                  <div className="grid gap-2 rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-muted-foreground">Desconto máximo saudável</p>
                      <Badge
                        variant={
                          (discount.max?.maxDiscountPercentage ?? 0) > 0 ? "success" : "danger"
                        }
                      >
                        {discount.max === null ? NO_DATA : pct(discount.max.maxDiscountPercentage)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Acima deste desconto, sua margem ficará abaixo da meta.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Informe o preço atual do produto para simular o desconto.
                </p>
              )}
            </TabsContent>

            {/* Quanto preciso vender? */}
            <TabsContent value="meta" className="grid gap-4">
              <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <span className="flex items-center gap-1.5">
                    <Label htmlFor="goal">Meta de lucro mensal</Label>
                    <InfoTooltip content="Quanto você quer que sobre no fim do mês, depois de pagar custos fixos e pró-labore." />
                  </span>
                  <CurrencyInput id="goal" value={goalText} onValueChange={setGoalText} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Compromissos do mês</Label>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {formatBRLFromCents(monthlyCommitments)}
                  </p>
                  <p className="text-xs text-muted-foreground">Custos fixos e pró-labore.</p>
                </div>
              </div>

              {goal?.error ? (
                <p className="rounded-2xl border border-danger/40 bg-danger-soft px-5 py-4 text-sm text-danger">
                  {goal.error}
                </p>
              ) : goal?.plan ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Faturamento necessário"
                    value={formatBRLFromCents(goal.plan.requiredRevenueCents)}
                    tone="success"
                    tooltip="(Custos fixos + meta de lucro) ÷ margem de contribuição média."
                  />
                  <StatCard
                    label="Vendas necessárias"
                    value={
                      goal.plan.requiredSales === null ? NO_DATA : num(goal.plan.requiredSales)
                    }
                    hint={`Ticket médio atual ${formatBRLFromCents(averageTicketCents)}`}
                  />
                  <StatCard
                    label="Vendas por dia"
                    value={
                      goal.plan.requiredSalesPerDay === null
                        ? NO_DATA
                        : num(goal.plan.requiredSalesPerDay)
                    }
                    hint="Considerando 30 dias no mês"
                  />
                  <StatCard
                    label="Ticket médio necessário"
                    value={
                      goal.plan.requiredTicketCents === null
                        ? NO_DATA
                        : formatBRLFromCents(goal.plan.requiredTicketCents)
                    }
                    hint={`Com ${num(monthlySales)} vendas no mês`}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Informe o preço atual dos seus produtos para calcularmos a margem de contribuição
                  média.
                </p>
              )}
            </TabsContent>
          </Tabs>

          <BreakEvenMeter
            fixedCostsCents={monthlyCommitments}
            contributionMarginPercentage={weighted.percentage}
            breakEvenCents={breakEvenCents}
            goalCents={goal?.plan ? goal.plan.requiredRevenueCents : monthlyGoalCents}
            note={
              goal?.plan
                ? "Meta: faturamento necessário para o lucro que você informou."
                : "Meta: faturamento desejado informado no cadastro do negócio."
            }
          />
        </>
      )}
    </div>
  );
}
