/**
 * Motor financeiro do PreçoSadio — funções puras e testáveis.
 *
 * Convenções:
 * - Dinheiro sempre em centavos (número, frações preservadas).
 * - Percentuais sempre na escala 0–100 (10 = 10%).
 * - Nenhuma fórmula deve viver dentro de componentes React.
 */

import { toBaseQuantity, type PurchaseUnit } from "@/lib/units";

/** Erro de validação com mensagem amigável em português. */
export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

const finite = (value: number, label: string) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new PricingError(`${label} precisa ser um número válido.`);
  }
  return value;
};

const nonNegative = (value: number, label: string) => {
  finite(value, label);
  if (value < 0) throw new PricingError(`${label} não pode ser negativo.`);
  return value;
};

const percentage = (value: number, label: string) => {
  finite(value, label);
  if (value < 0) throw new PricingError(`${label} não pode ser negativo.`);
  if (value >= 100) throw new PricingError(`${label} precisa ser menor que 100%.`);
  return value;
};

export const roundCents = (cents: number) => Math.round(cents);
export const round4 = (value: number) => Math.round(value * 10000) / 10000;

/* ------------------------------------------------------------------ */
/* Custos                                                              */
/* ------------------------------------------------------------------ */

/** Custo por unidade-base de um insumo, em centavos. */
export function calculateIngredientUnitCost(input: {
  purchasePriceCents: number;
  purchaseQuantity: number;
  purchaseUnit: PurchaseUnit;
}) {
  nonNegative(input.purchasePriceCents, "O preço de compra");
  nonNegative(input.purchaseQuantity, "A quantidade comprada");
  const baseQuantity = toBaseQuantity(input.purchaseQuantity, input.purchaseUnit);
  if (baseQuantity <= 0) {
    throw new PricingError("Informe a quantidade comprada para calcular o custo unitário.");
  }
  return input.purchasePriceCents / baseQuantity;
}

/** Custo direto do produto: insumos usados + custos diretos adicionais. */
export function calculateProductDirectCost(input: {
  ingredientCostsCents: number[];
  extraCostsCents?: number[] | undefined;
}) {
  const sum = (list: number[], label: string) =>
    list.reduce((total, value) => total + nonNegative(value, label), 0);
  return (
    sum(input.ingredientCostsCents, "O custo de insumo") +
    sum(input.extraCostsCents ?? [], "O custo adicional")
  );
}

/**
 * Custo ajustado pela perda de produção (fórmula de rendimento):
 * custo ajustado = custo direto / (1 − perda)
 */
export function calculateWasteAdjustedCost(directCostCents: number, wastePercentage: number) {
  nonNegative(directCostCents, "O custo direto");
  percentage(wastePercentage, "A perda");
  const adjustedCostCents = directCostCents / (1 - wastePercentage / 100);
  return {
    directCostCents,
    adjustedCostCents,
    wasteCostCents: adjustedCostCents - directCostCents,
  };
}

/* ------------------------------------------------------------------ */
/* Despesas variáveis (canal de venda)                                 */
/* ------------------------------------------------------------------ */

export type ChannelFees = {
  taxPercentage?: number;
  cardFeePercentage?: number;
  marketplaceFeePercentage?: number;
  commissionPercentage?: number;
  deliveryFeePercentage?: number;
  otherFeePercentage?: number;
};

export const feeLabels: Record<keyof Required<ChannelFees>, string> = {
  taxPercentage: "Impostos",
  cardFeePercentage: "Cartão",
  marketplaceFeePercentage: "Marketplace",
  commissionPercentage: "Comissão",
  deliveryFeePercentage: "Delivery",
  otherFeePercentage: "Outras taxas",
};

/** Soma dos percentuais variáveis do canal. Lança erro se atingir 100%. */
export function totalFeePercentage(fees: ChannelFees) {
  const total = (Object.keys(feeLabels) as (keyof Required<ChannelFees>)[]).reduce(
    (sum, key) => sum + percentage(fees[key] ?? 0, feeLabels[key]),
    0,
  );
  if (total >= 100) {
    throw new PricingError("A soma das taxas variáveis precisa ser menor que 100%.");
  }
  return total;
}

/** Despesas variáveis em valor, para um preço de venda. */
export function calculateVariableFees(priceCents: number, fees: ChannelFees) {
  nonNegative(priceCents, "O preço de venda");
  const total = totalFeePercentage(fees);
  const breakdown = (Object.keys(feeLabels) as (keyof Required<ChannelFees>)[]).map((key) => ({
    key,
    label: feeLabels[key],
    percentage: fees[key] ?? 0,
    amountCents: (priceCents * (fees[key] ?? 0)) / 100,
  }));
  return {
    totalPercentage: total,
    totalCents: (priceCents * total) / 100,
    breakdown,
  };
}

/* ------------------------------------------------------------------ */
/* Margem de contribuição                                              */
/* ------------------------------------------------------------------ */

/** Margem de contribuição em valor: preço − custos variáveis monetários. */
export function calculateContributionMargin(input: {
  priceCents: number;
  unitCostCents: number;
  fees?: ChannelFees | undefined;
}) {
  nonNegative(input.priceCents, "O preço de venda");
  nonNegative(input.unitCostCents, "O custo do produto");
  const feesCents = calculateVariableFees(input.priceCents, input.fees ?? {}).totalCents;
  return input.priceCents - input.unitCostCents - feesCents;
}

/** Margem de contribuição percentual: MC / preço × 100. */
export function calculateContributionMarginPercentage(input: {
  priceCents: number;
  unitCostCents: number;
  fees?: ChannelFees | undefined;
}) {
  if (input.priceCents <= 0) {
    throw new PricingError("Informe um preço de venda maior que zero para calcular a margem.");
  }
  return (calculateContributionMargin(input) / input.priceCents) * 100;
}

/* ------------------------------------------------------------------ */
/* Markup                                                              */
/* ------------------------------------------------------------------ */

/**
 * Markup multiplicador = preço ÷ custo base.
 * Markup percentual = (multiplicador − 1) × 100 (quanto se acrescenta ao custo).
 * Não confundir com margem, que é calculada sobre o preço.
 */
export function calculateMarkup(priceCents: number, baseCostCents: number) {
  nonNegative(priceCents, "O preço de venda");
  nonNegative(baseCostCents, "O custo base");
  if (baseCostCents <= 0) {
    throw new PricingError("Informe o custo do produto para calcular o markup.");
  }
  const multiplier = priceCents / baseCostCents;
  return { multiplier, percentage: (multiplier - 1) * 100 };
}

/* ------------------------------------------------------------------ */
/* Preço recomendado                                                   */
/* ------------------------------------------------------------------ */

/**
 * Preço que cobre o custo, as taxas percentuais aplicadas sobre a venda
 * e a margem desejada:
 *
 * preço = custo / (1 − taxas − margem)
 *
 * O rateio de custo fixo por unidade é opcional e só deve ser usado quando
 * existir base operacional definida (ex.: vendas previstas no mês).
 */
export function calculateRecommendedPrice(input: {
  unitCostCents: number;
  fees?: ChannelFees | undefined;
  desiredMarginPercentage: number;
  fixedCostPerUnitCents?: number | undefined;
}) {
  const cost =
    nonNegative(input.unitCostCents, "O custo do produto") +
    nonNegative(input.fixedCostPerUnitCents ?? 0, "O rateio de custo fixo");
  const feesTotal = totalFeePercentage(input.fees ?? {});
  const margin = percentage(input.desiredMarginPercentage, "A margem desejada");
  const divisor = 1 - (feesTotal + margin) / 100;
  if (divisor <= 0) {
    throw new PricingError(
      "A soma das taxas com a margem desejada precisa ser menor que 100%. Reduza as taxas ou a margem.",
    );
  }
  return cost / divisor;
}

/** Rateio de custo fixo por unidade — só com base operacional definida. */
export function allocateFixedCostPerUnit(fixedCostsCents: number, expectedUnits: number) {
  nonNegative(fixedCostsCents, "O custo fixo total");
  nonNegative(expectedUnits, "A quantidade de vendas prevista");
  if (expectedUnits <= 0) {
    throw new PricingError(
      "Informe quantas unidades você espera vender no mês para ratear os custos fixos.",
    );
  }
  return fixedCostsCents / expectedUnits;
}

/**
 * Faixa de preços de um produto em um canal:
 * - mínimo: cobre custo direto e taxas, sem lucro (margem 0);
 * - saudável: atinge a margem configurada — é o preço recomendado;
 * - estratégico: faixa de teste acima do preço saudável.
 */
export function calculatePriceRange(input: {
  unitCostCents: number;
  fees?: ChannelFees | undefined;
  targetMarginPercentage: number;
  fixedCostPerUnitCents?: number | undefined;
  strategicRange?: { minPercentage: number; maxPercentage: number } | undefined;
}) {
  const minimumPriceCents = calculateRecommendedPrice({
    unitCostCents: input.unitCostCents,
    fees: input.fees,
    desiredMarginPercentage: 0,
    ...(input.fixedCostPerUnitCents === undefined
      ? {}
      : { fixedCostPerUnitCents: input.fixedCostPerUnitCents }),
  });
  const healthyPriceCents = calculateRecommendedPrice({
    unitCostCents: input.unitCostCents,
    fees: input.fees,
    desiredMarginPercentage: input.targetMarginPercentage,
    ...(input.fixedCostPerUnitCents === undefined
      ? {}
      : { fixedCostPerUnitCents: input.fixedCostPerUnitCents }),
  });
  const range = input.strategicRange ?? { minPercentage: 5, maxPercentage: 15 };
  nonNegative(range.minPercentage, "O início da faixa estratégica");
  nonNegative(range.maxPercentage, "O fim da faixa estratégica");
  if (range.maxPercentage < range.minPercentage) {
    throw new PricingError("O fim da faixa estratégica precisa ser maior que o início.");
  }
  return {
    minimumPriceCents,
    healthyPriceCents,
    strategicFromCents: healthyPriceCents * (1 + range.minPercentage / 100),
    strategicToCents: healthyPriceCents * (1 + range.maxPercentage / 100),
  };
}

/* ------------------------------------------------------------------ */
/* Empresa: ponto de equilíbrio e lucro                                */
/* ------------------------------------------------------------------ */

/** Ponto de equilíbrio em faturamento = custos fixos / MC% média. */
export function calculateBreakEvenRevenue(
  fixedCostsCents: number,
  contributionMarginPercentage: number,
) {
  nonNegative(fixedCostsCents, "O custo fixo total");
  finite(contributionMarginPercentage, "A margem de contribuição média");
  if (contributionMarginPercentage <= 0) {
    throw new PricingError(
      "Com margem de contribuição média zero ou negativa não existe ponto de equilíbrio: cada venda aumenta o prejuízo.",
    );
  }
  return fixedCostsCents / (contributionMarginPercentage / 100);
}

/** Margem de contribuição média ponderada pelo mix de vendas. */
export function calculateWeightedContributionMargin(
  items: {
    priceCents: number;
    unitCostCents: number;
    fees?: ChannelFees | undefined;
    monthlySales: number;
  }[],
) {
  let revenue = 0;
  let contribution = 0;
  for (const item of items) {
    const units = nonNegative(item.monthlySales, "A quantidade vendida");
    if (units <= 0 || item.priceCents <= 0) continue;
    revenue += item.priceCents * units;
    contribution +=
      calculateContributionMargin({
        priceCents: item.priceCents,
        unitCostCents: item.unitCostCents,
        ...(item.fees ? { fees: item.fees } : {}),
      }) * units;
  }
  if (revenue <= 0) {
    return { revenueCents: 0, contributionCents: 0, percentage: null as number | null };
  }
  return {
    revenueCents: revenue,
    contributionCents: contribution,
    percentage: (contribution / revenue) * 100,
  };
}

/** Lucro mensal = faturamento × MC% − custos fixos. */
export function calculateMonthlyProfit(input: {
  revenueCents: number;
  contributionMarginPercentage: number;
  fixedCostsCents: number;
}) {
  nonNegative(input.revenueCents, "O faturamento");
  finite(input.contributionMarginPercentage, "A margem de contribuição");
  nonNegative(input.fixedCostsCents, "O custo fixo total");
  const contributionCents = (input.revenueCents * input.contributionMarginPercentage) / 100;
  const profitCents = contributionCents - input.fixedCostsCents;
  return {
    contributionCents,
    profitCents,
    profitPercentage: input.revenueCents > 0 ? (profitCents / input.revenueCents) * 100 : null,
  };
}

/* ------------------------------------------------------------------ */
/* Desconto                                                            */
/* ------------------------------------------------------------------ */

/** Impacto de um desconto na margem de contribuição de um produto. */
export function calculateDiscountImpact(input: {
  priceCents: number;
  unitCostCents: number;
  fees?: ChannelFees | undefined;
  discountPercentage: number;
}) {
  const discount = percentage(input.discountPercentage, "O desconto");
  const fees = input.fees ?? {};
  const originalMarginCents = calculateContributionMargin({
    priceCents: input.priceCents,
    unitCostCents: input.unitCostCents,
    fees,
  });
  const discountedPriceCents = input.priceCents * (1 - discount / 100);
  const discountedMarginCents = calculateContributionMargin({
    priceCents: discountedPriceCents,
    unitCostCents: input.unitCostCents,
    fees,
  });
  const lossCents = originalMarginCents - discountedMarginCents;
  return {
    discountedPriceCents,
    originalMarginCents,
    discountedMarginCents,
    lossCents,
    discountedMarginPercentage:
      discountedPriceCents > 0 ? (discountedMarginCents / discountedPriceCents) * 100 : null,
    /** Quantas vezes é preciso vender mais para manter a mesma contribuição total. */
    salesMultiplierToKeepProfit:
      discountedMarginCents > 0 && originalMarginCents > 0
        ? originalMarginCents / discountedMarginCents
        : null,
    isBelowCost: discountedMarginCents < 0,
  };
}

/* ------------------------------------------------------------------ */
/* Lucro unitário e cenários de preço                                  */
/* ------------------------------------------------------------------ */

/**
 * Lucro unitário estimado: margem de contribuição menos o rateio de custo
 * fixo por unidade. Sem base operacional informada, o rateio é zero e o
 * resultado equivale à margem de contribuição.
 */
export function calculateUnitProfit(input: {
  priceCents: number;
  unitCostCents: number;
  fees?: ChannelFees | undefined;
  fixedCostPerUnitCents?: number | undefined;
}) {
  const contributionCents = calculateContributionMargin({
    priceCents: input.priceCents,
    unitCostCents: input.unitCostCents,
    ...(input.fees ? { fees: input.fees } : {}),
  });
  const fixedCostPerUnitCents = nonNegative(
    input.fixedCostPerUnitCents ?? 0,
    "O rateio de custo fixo",
  );
  return {
    contributionCents,
    fixedCostPerUnitCents,
    profitCents: contributionCents - fixedCostPerUnitCents,
  };
}

/**
 * Maior desconto (%) que ainda mantém a margem de contribuição na meta.
 * Como MC% = 1 − taxas − custo/preço, o menor preço aceitável é exatamente
 * o preço saudável; acima desse desconto a margem cai abaixo da meta.
 */
export function calculateMaxHealthyDiscount(input: {
  priceCents: number;
  unitCostCents: number;
  fees?: ChannelFees | undefined;
  targetMarginPercentage: number;
}) {
  if (input.priceCents <= 0) {
    throw new PricingError("Informe o preço atual para calcular o desconto máximo.");
  }
  const healthyPriceCents = calculateRecommendedPrice({
    unitCostCents: input.unitCostCents,
    fees: input.fees,
    desiredMarginPercentage: input.targetMarginPercentage,
  });
  const maxDiscountPercentage = Math.max(0, (1 - healthyPriceCents / input.priceCents) * 100);
  return { healthyPriceCents, maxDiscountPercentage };
}

/** Cenário de um preço: por unidade e no mês, com o volume informado. */
export function calculatePriceScenario(input: {
  priceCents: number;
  unitCostCents: number;
  fees?: ChannelFees | undefined;
  monthlySales: number;
  fixedCostsCents?: number | undefined;
}) {
  const units = nonNegative(input.monthlySales, "A quantidade vendida por mês");
  const fixedCostsCents = nonNegative(input.fixedCostsCents ?? 0, "O custo fixo total");
  const fixedCostPerUnitCents = units > 0 ? fixedCostsCents / units : 0;
  const unit = calculateUnitProfit({
    priceCents: input.priceCents,
    unitCostCents: input.unitCostCents,
    fees: input.fees,
    fixedCostPerUnitCents,
  });
  const monthlyContributionCents = unit.contributionCents * units;
  return {
    priceCents: input.priceCents,
    marginPercentage:
      input.priceCents > 0 ? (unit.contributionCents / input.priceCents) * 100 : null,
    contributionCents: unit.contributionCents,
    fixedCostPerUnitCents,
    unitProfitCents: unit.profitCents,
    monthlyRevenueCents: input.priceCents * units,
    monthlyContributionCents,
    monthlyProfitCents: monthlyContributionCents - fixedCostsCents,
  };
}

/** Comparação "E se eu vender por..." — mesmo volume nos dois cenários. */
export function comparePriceScenarios(input: {
  currentPriceCents: number;
  newPriceCents: number;
  unitCostCents: number;
  fees?: ChannelFees | undefined;
  monthlySales: number;
  fixedCostsCents?: number | undefined;
}) {
  const common = {
    unitCostCents: input.unitCostCents,
    fees: input.fees,
    monthlySales: input.monthlySales,
    fixedCostsCents: input.fixedCostsCents,
  };
  const current = calculatePriceScenario({ priceCents: input.currentPriceCents, ...common });
  const next = calculatePriceScenario({ priceCents: input.newPriceCents, ...common });
  return {
    current,
    next,
    unitImpactCents: next.contributionCents - current.contributionCents,
    monthlyImpactCents: next.monthlyContributionCents - current.monthlyContributionCents,
  };
}

/* ------------------------------------------------------------------ */
/* Meta: quanto preciso vender?                                        */
/* ------------------------------------------------------------------ */

/**
 * Plano para atingir uma meta de lucro mensal:
 * faturamento = (custos fixos + lucro desejado) / MC% média.
 */
export function calculateGoalPlan(input: {
  targetProfitCents: number;
  fixedCostsCents: number;
  contributionMarginPercentage: number;
  averageTicketCents?: number | undefined;
  expectedMonthlySales?: number | undefined;
  daysPerMonth?: number | undefined;
}) {
  nonNegative(input.targetProfitCents, "A meta de lucro");
  nonNegative(input.fixedCostsCents, "O custo fixo total");
  const margin = input.contributionMarginPercentage;
  finite(margin, "A margem de contribuição média");
  if (margin <= 0) {
    throw new PricingError(
      "Com margem de contribuição média zero ou negativa não é possível atingir a meta: cada venda aumenta o prejuízo.",
    );
  }
  const days = input.daysPerMonth ?? 30;
  if (days <= 0) throw new PricingError("Informe quantos dias por mês você vende.");
  const requiredRevenueCents =
    (input.fixedCostsCents + input.targetProfitCents) / (margin / 100);
  const breakEvenRevenueCents = calculateBreakEvenRevenue(input.fixedCostsCents, margin);
  const ticket = nonNegative(input.averageTicketCents ?? 0, "O ticket médio");
  const requiredSales = ticket > 0 ? requiredRevenueCents / ticket : null;
  const expectedUnits = nonNegative(input.expectedMonthlySales ?? 0, "A quantidade vendida por mês");
  return {
    requiredRevenueCents,
    breakEvenRevenueCents,
    requiredSales,
    requiredSalesPerDay: requiredSales === null ? null : requiredSales / days,
    requiredTicketCents: expectedUnits > 0 ? requiredRevenueCents / expectedUnits : null,
  };
}
