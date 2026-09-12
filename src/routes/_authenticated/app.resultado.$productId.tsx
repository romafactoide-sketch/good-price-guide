import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Calculator, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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
import { usePricingData } from "@/hooks/use-pricing-data";
import { formatBRLFromCents } from "@/lib/money";
import { parseDecimal } from "@/lib/units";
import {
  PricingError,
  calculateContributionMargin,
  calculateContributionMarginPercentage,
  calculateMarkup,
  calculatePriceRange,
  calculateUnitProfit,
  calculateVariableFees,
  channelFees as feesOf,
  totalFeePercentage,
} from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/app/resultado/$productId")({
  head: () => ({
    meta: [
      { title: "Resultado da precificação — PreçoSadio" },
      {
        name: "description",
        content:
          "Preço mínimo, preço saudável e faixa de teste de um produto, com todos os indicadores explicados.",
      },
      { property: "og:title", content: "Resultado da precificação — PreçoSadio" },
      {
        property: "og:description",
        content: "Veja como chegamos ao preço recomendado do seu produto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultPage,
});

const NO_DATA = "—";
const pct = (value: number) =>
  `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

function ResultPage() {
  const { productId } = Route.useParams();
  const { loading, products, channels } = usePricingData();
  const [channelId, setChannelId] = useState("");
  const [strategicMin, setStrategicMin] = useState("5");
  const [strategicMax, setStrategicMax] = useState("15");

  const product = products.find((item) => item.id === productId) ?? null;
  const channel = channels.find((item) => item.id === channelId) ?? channels[0] ?? null;
  const fees = channel ? feesOf(channel) : {};

  const result = useMemo(() => {
    if (!product) return null;
    const costCents = Number(product.adjusted_cost_cents);
    const targetMargin = Number(product.target_margin);
    const currentPriceCents = Number(product.current_price_cents);
    try {
      const feeTotal = totalFeePercentage(fees);
      const range = calculatePriceRange({
        unitCostCents: costCents,
        fees,
        targetMarginPercentage: targetMargin,
        strategicRange: {
          minPercentage: parseDecimal(strategicMin),
          maxPercentage: parseDecimal(strategicMax),
        },
      });
      const referencePriceCents = currentPriceCents > 0 ? currentPriceCents : range.healthyPriceCents;
      const feesAtReference = calculateVariableFees(referencePriceCents, fees);
      return {
        ok: true as const,
        costCents,
        targetMargin,
        currentPriceCents,
        referencePriceCents,
        feeTotal,
        feesAtReference,
        ...range,
        contributionCents: calculateContributionMargin({
          priceCents: referencePriceCents,
          unitCostCents: costCents,
          fees,
        }),
        contributionPercentage: calculateContributionMarginPercentage({
          priceCents: referencePriceCents,
          unitCostCents: costCents,
          fees,
        }),
        unitProfitCents: calculateUnitProfit({
          priceCents: referencePriceCents,
          unitCostCents: costCents,
          fees,
        }).profitCents,
        markup: costCents > 0 ? calculateMarkup(referencePriceCents, costCents) : null,
      };
    } catch (error) {
      return {
        ok: false as const,
        error:
          error instanceof PricingError
            ? error.message
            : "Não foi possível calcular o preço deste produto.",
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, channel, strategicMin, strategicMax]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-soft">
        Carregando resultado...
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        icon={Calculator}
        title="Produto não encontrado"
        description="Este produto não existe mais ou não pertence ao seu negócio."
        action={
          <Button variant="hero" asChild>
            <Link to="/app/precificacao">Voltar para a precificação</Link>
          </Button>
        }
      />
    );
  }

  const status =
    result?.ok && result.currentPriceCents > 0
      ? result.currentPriceCents < result.minimumPriceCents
        ? { label: "Abaixo do mínimo", variant: "danger" as const }
        : result.currentPriceCents < result.healthyPriceCents
          ? { label: "Abaixo do saudável", variant: "warning" as const }
          : { label: "Saudável", variant: "success" as const }
      : { label: "Sem preço definido", variant: "neutral" as const };

  return (
    <div className="grid gap-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/app/precificacao">
          <ArrowLeft />
          Voltar para a precificação
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="size-20 shrink-0 rounded-2xl object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <PageHeader
            title="Resultado da precificação"
            description={product.name}
            actions={<Badge variant={status.variant}>{status.label}</Badge>}
          />
        </div>
      </div>

      {channels.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="Cadastre um canal de venda"
          description="As taxas do canal (impostos, cartão, marketplace, comissão, entrega) entram no cálculo do preço."
          action={
            <Button variant="hero" asChild>
              <Link to="/app/precificacao">Criar canal de venda</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label>Canal de venda</Label>
              <Select value={channel?.id ?? ""} onValueChange={setChannelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um canal" />
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
                <Label htmlFor="strategic-min">Faixa de teste (início)</Label>
                <InfoTooltip content="Percentual acima do preço saudável onde começa a faixa sugerida para teste." />
              </span>
              <PercentageInput
                id="strategic-min"
                value={strategicMin}
                onValueChange={setStrategicMin}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="strategic-max">Faixa de teste (fim)</Label>
              <PercentageInput
                id="strategic-max"
                value={strategicMax}
                onValueChange={setStrategicMax}
              />
            </div>
          </div>

          {!result || !result.ok ? (
            <p className="rounded-2xl border border-danger/40 bg-danger-soft px-5 py-4 text-sm text-danger">
              {result?.error ?? "Não foi possível calcular o preço deste produto."}
            </p>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <article className="rounded-2xl border border-warning/40 bg-warning-soft p-5 shadow-soft">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-warning-foreground">
                    Preço mínimo
                    <InfoTooltip content="Cobre exatamente o custo ajustado pelas perdas e as taxas do canal. Não inclui lucro nem custos fixos." />
                  </p>
                  <p className="mt-3 text-2xl font-bold tabular-nums text-warning-foreground">
                    {formatBRLFromCents(result.minimumPriceCents)}
                  </p>
                  <p className="mt-1 text-xs text-warning-foreground/80">Sem nenhum lucro.</p>
                </article>

                <article className="rounded-2xl border-2 border-primary bg-primary-soft p-6 shadow-lift lg:scale-[1.02]">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-primary-dark">Preço saudável</p>
                    <Badge variant="success">
                      <Sparkles className="mr-1 size-3" />
                      RECOMENDADO
                    </Badge>
                  </div>
                  <p className="mt-3 text-4xl font-bold tabular-nums text-primary-dark">
                    {formatBRLFromCents(result.healthyPriceCents)}
                  </p>
                  <p className="mt-1 text-xs text-primary-dark/80">
                    Cobre custo, taxas e entrega a margem desejada de {pct(result.targetMargin)}.
                  </p>
                </article>

                <article className="rounded-2xl border border-info/40 bg-info-soft p-5 shadow-soft">
                  <p className="text-sm font-semibold text-info">Preço estratégico</p>
                  <p className="mt-3 text-2xl font-bold tabular-nums text-info">
                    {formatBRLFromCents(result.strategicFromCents)} a{" "}
                    {formatBRLFromCents(result.strategicToCents)}
                  </p>
                  <p className="mt-1 text-xs text-info/80">Faixa sugerida para teste.</p>
                </article>
              </div>

              <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                <h2 className="text-base font-bold text-foreground">Indicadores</h2>
                <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Custo direto",
                      value: formatBRLFromCents(Number(product.direct_cost_cents)),
                      tip: "Insumos da ficha técnica mais os custos diretos adicionais.",
                    },
                    {
                      label: "Perdas",
                      value: `${formatBRLFromCents(Number(product.waste_cost_cents))} · ${pct(Number(product.waste_percentage))}`,
                      tip: "Quanto a perda de produção acrescenta ao custo.",
                    },
                    {
                      label: "Custo variável",
                      value: formatBRLFromCents(result.costCents),
                      tip: "Custo direto já ajustado pelas perdas: o custo real de cada unidade.",
                    },
                    {
                      label: "Taxas",
                      value: `${formatBRLFromCents(result.feesAtReference.totalCents)} · ${pct(result.feeTotal)}`,
                      tip: "Impostos, cartão, marketplace, comissão, entrega e outras taxas do canal.",
                    },
                    {
                      label: "Margem de contribuição",
                      value: `${formatBRLFromCents(result.contributionCents)} · ${pct(result.contributionPercentage)}`,
                      tip: "Quanto sobra de cada venda depois do custo e das taxas, antes dos custos fixos.",
                    },
                    {
                      label: "Margem desejada",
                      value: pct(result.targetMargin),
                      tip: "Margem definida na ficha técnica do produto.",
                    },
                    {
                      label: "Lucro unitário estimado",
                      value: formatBRLFromCents(result.unitProfitCents),
                      tip: "Margem de contribuição por unidade. Custos fixos só entram quando há base de vendas informada.",
                    },
                    {
                      label: "Markup",
                      value:
                        result.markup === null
                          ? NO_DATA
                          : `${result.markup.multiplier.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x · ${pct(result.markup.percentage)}`,
                      tip: "Markup é preço ÷ custo. Margem é calculada sobre o preço: markup 2x equivale a 50% de margem.",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {item.label}
                        <InfoTooltip content={item.tip} />
                      </dt>
                      <dd className="mt-1 text-lg font-bold tabular-nums text-foreground">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="text-xs text-muted-foreground">
                  Margem de contribuição, taxas e lucro unitário calculados sobre{" "}
                  {result.currentPriceCents > 0
                    ? `o preço atual (${formatBRLFromCents(result.currentPriceCents)})`
                    : "o preço saudável, porque este produto ainda não tem preço atual"}
                  .
                </p>
              </section>

              <section className="grid gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
                <h2 className="text-base font-bold text-foreground">
                  Como chegamos neste preço?
                </h2>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  <li>
                    Seu produto custa{" "}
                    <strong className="text-foreground">
                      {formatBRLFromCents(result.costCents)}
                    </strong>{" "}
                    para produzir, já contando as perdas.
                  </li>
                  <li>
                    As taxas de {channel?.name ?? "canal"} representam{" "}
                    <strong className="text-foreground">{pct(result.feeTotal)}</strong> da venda.
                  </li>
                  <li>
                    Sua margem desejada é{" "}
                    <strong className="text-foreground">{pct(result.targetMargin)}</strong>.
                  </li>
                  <li>
                    Por isso, seu preço recomendado é{" "}
                    <strong className="text-primary-dark">
                      {formatBRLFromCents(result.healthyPriceCents)}
                    </strong>{" "}
                    — o valor que cobre o custo, paga as taxas e ainda deixa a margem que você
                    quer.
                  </li>
                  <li>
                    Vendendo por menos de{" "}
                    <strong className="text-foreground">
                      {formatBRLFromCents(result.minimumPriceCents)}
                    </strong>{" "}
                    você perde dinheiro em cada unidade.
                  </li>
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Button variant="soft" size="sm" asChild>
                    <Link to="/app/simuladores">Simular outro preço</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/app/produtos">Editar produto</Link>
                  </Button>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
