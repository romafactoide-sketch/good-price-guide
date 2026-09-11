import { describe, expect, it } from "vitest";
import {
  PricingError,
  allocateFixedCostPerUnit,
  calculateBreakEvenRevenue,
  calculateContributionMargin,
  calculateContributionMarginPercentage,
  calculateDiscountImpact,
  calculateIngredientUnitCost,
  calculateMarkup,
  calculateMonthlyProfit,
  calculatePriceRange,
  calculateProductDirectCost,
  calculateRecommendedPrice,
  calculateVariableFees,
  calculateWasteAdjustedCost,
  calculateWeightedContributionMargin,
  totalFeePercentage,
} from "./engine";

describe("custos", () => {
  it("calcula custo unitário de 5 kg por R$200 em R$0,04/g", () => {
    expect(
      calculateIngredientUnitCost({
        purchasePriceCents: 20000,
        purchaseQuantity: 5,
        purchaseUnit: "kg",
      }),
    ).toBeCloseTo(4, 10);
  });

  it("recusa quantidade comprada zero", () => {
    expect(() =>
      calculateIngredientUnitCost({
        purchasePriceCents: 1000,
        purchaseQuantity: 0,
        purchaseUnit: "kg",
      }),
    ).toThrow(PricingError);
  });

  it("recusa valores negativos", () => {
    expect(() =>
      calculateIngredientUnitCost({
        purchasePriceCents: -1,
        purchaseQuantity: 1,
        purchaseUnit: "kg",
      }),
    ).toThrow(PricingError);
  });

  it("soma insumos e custos adicionais", () => {
    expect(
      calculateProductDirectCost({
        ingredientCostsCents: [720, 130.5],
        extraCostsCents: [200],
      }),
    ).toBeCloseTo(1050.5, 10);
  });

  it("ajusta o custo pela perda com fórmula de rendimento", () => {
    const result = calculateWasteAdjustedCost(1000, 10);
    expect(result.adjustedCostCents).toBeCloseTo(1111.1111, 3);
    expect(result.wasteCostCents).toBeCloseTo(111.1111, 3);
  });

  it("perda zero mantém o custo", () => {
    expect(calculateWasteAdjustedCost(1450, 0).adjustedCostCents).toBe(1450);
  });

  it("recusa perda de 100%", () => {
    expect(() => calculateWasteAdjustedCost(1000, 100)).toThrow(PricingError);
  });
});

describe("despesas variáveis", () => {
  const fees = {
    taxPercentage: 4,
    cardFeePercentage: 3,
    marketplaceFeePercentage: 0,
    commissionPercentage: 2,
    deliveryFeePercentage: 1,
    otherFeePercentage: 0,
  };

  it("soma os percentuais do canal", () => {
    expect(totalFeePercentage(fees)).toBeCloseTo(10, 10);
  });

  it("converte percentuais em valor sobre o preço", () => {
    const result = calculateVariableFees(2000, fees);
    expect(result.totalCents).toBeCloseTo(200, 10);
    expect(result.breakdown).toHaveLength(6);
  });

  it("taxa zero resulta em despesa zero", () => {
    expect(calculateVariableFees(2000, {}).totalCents).toBe(0);
  });

  it("recusa soma de taxas de 100% ou mais", () => {
    expect(() =>
      totalFeePercentage({ taxPercentage: 60, cardFeePercentage: 40 }),
    ).toThrow(PricingError);
  });

  it("recusa taxa individual de 100%", () => {
    expect(() => totalFeePercentage({ taxPercentage: 100 })).toThrow(PricingError);
  });
});

describe("margem de contribuição", () => {
  it("calcula valor e percentual", () => {
    const input = { priceCents: 2000, unitCostCents: 1450, fees: { taxPercentage: 10 } };
    expect(calculateContributionMargin(input)).toBeCloseTo(350, 10);
    expect(calculateContributionMarginPercentage(input)).toBeCloseTo(17.5, 10);
  });

  it("aceita margem negativa quando o preço não cobre o custo", () => {
    expect(
      calculateContributionMargin({ priceCents: 1000, unitCostCents: 1200 }),
    ).toBeCloseTo(-200, 10);
  });

  it("recusa preço zero no percentual (divisão por zero)", () => {
    expect(() =>
      calculateContributionMarginPercentage({ priceCents: 0, unitCostCents: 100 }),
    ).toThrow(PricingError);
  });
});

describe("markup", () => {
  it("markup é preço dividido pelo custo", () => {
    const markup = calculateMarkup(2071.4286, 1450);
    expect(markup.multiplier).toBeCloseTo(1.4286, 4);
    expect(markup.percentage).toBeCloseTo(42.86, 2);
  });

  it("recusa custo zero", () => {
    expect(() => calculateMarkup(2000, 0)).toThrow(PricingError);
  });
});

describe("preço recomendado", () => {
  it("custo R$14,50, taxas 10% e margem 20% resultam em ~R$20,71", () => {
    const price = calculateRecommendedPrice({
      unitCostCents: 1450,
      fees: { taxPercentage: 10 },
      desiredMarginPercentage: 20,
    });
    expect(price / 100).toBeCloseTo(20.71, 2);
    expect(price).toBeCloseTo(1450 / 0.7, 6);
  });

  it("o preço recomendado entrega exatamente a margem desejada", () => {
    const fees = { taxPercentage: 6, cardFeePercentage: 4 };
    const price = calculateRecommendedPrice({
      unitCostCents: 1450,
      fees,
      desiredMarginPercentage: 20,
    });
    expect(
      calculateContributionMarginPercentage({ priceCents: price, unitCostCents: 1450, fees }),
    ).toBeCloseTo(20, 8);
  });

  it("sem taxas e sem margem o preço é o próprio custo", () => {
    expect(
      calculateRecommendedPrice({ unitCostCents: 1450, desiredMarginPercentage: 0 }),
    ).toBe(1450);
  });

  it("taxas altas elevam muito o preço", () => {
    const price = calculateRecommendedPrice({
      unitCostCents: 1000,
      fees: { marketplaceFeePercentage: 25, taxPercentage: 20, cardFeePercentage: 15 },
      desiredMarginPercentage: 10,
    });
    expect(price).toBeCloseTo(1000 / 0.3, 6);
  });

  it("custo zero resulta em preço zero", () => {
    expect(
      calculateRecommendedPrice({
        unitCostCents: 0,
        fees: { taxPercentage: 10 },
        desiredMarginPercentage: 20,
      }),
    ).toBe(0);
  });

  it("recusa taxas + margem iguais ou acima de 100%", () => {
    expect(() =>
      calculateRecommendedPrice({
        unitCostCents: 1000,
        fees: { taxPercentage: 50, cardFeePercentage: 30 },
        desiredMarginPercentage: 20,
      }),
    ).toThrow(PricingError);
  });

  it("recusa margem de 100% ou mais", () => {
    expect(() =>
      calculateRecommendedPrice({ unitCostCents: 1000, desiredMarginPercentage: 100 }),
    ).toThrow(PricingError);
  });

  it("recusa valores inválidos", () => {
    expect(() =>
      calculateRecommendedPrice({ unitCostCents: Number.NaN, desiredMarginPercentage: 10 }),
    ).toThrow(PricingError);
  });

  it("rateia custo fixo por unidade apenas com base operacional", () => {
    expect(allocateFixedCostPerUnit(300000, 500)).toBe(600);
    expect(() => allocateFixedCostPerUnit(300000, 0)).toThrow(PricingError);
  });
});

describe("faixa de preços", () => {
  it("mínimo cobre custo e taxas, saudável atinge a margem, estratégico fica acima", () => {
    const range = calculatePriceRange({
      unitCostCents: 1450,
      fees: { taxPercentage: 10 },
      targetMarginPercentage: 20,
    });
    expect(range.minimumPriceCents).toBeCloseTo(1450 / 0.9, 6);
    expect(range.healthyPriceCents).toBeCloseTo(1450 / 0.7, 6);
    expect(range.strategicFromCents).toBeCloseTo(range.healthyPriceCents * 1.05, 6);
    expect(range.strategicToCents).toBeCloseTo(range.healthyPriceCents * 1.15, 6);
  });

  it("aceita faixa estratégica configurada", () => {
    const range = calculatePriceRange({
      unitCostCents: 1000,
      targetMarginPercentage: 0,
      strategicRange: { minPercentage: 10, maxPercentage: 30 },
    });
    expect(range.strategicFromCents).toBeCloseTo(1100, 6);
    expect(range.strategicToCents).toBeCloseTo(1300, 6);
  });

  it("recusa faixa estratégica invertida", () => {
    expect(() =>
      calculatePriceRange({
        unitCostCents: 1000,
        targetMarginPercentage: 10,
        strategicRange: { minPercentage: 20, maxPercentage: 5 },
      }),
    ).toThrow(PricingError);
  });
});

describe("empresa", () => {
  const mix = [
    { priceCents: 2000, unitCostCents: 800, fees: { taxPercentage: 10 }, monthlySales: 100 },
    { priceCents: 1000, unitCostCents: 600, fees: { cardFeePercentage: 5 }, monthlySales: 50 },
  ];

  it("calcula margem de contribuição ponderada pelo mix", () => {
    const weighted = calculateWeightedContributionMargin(mix);
    // MC: (2000-800-200)*100 = 100000 ; (1000-600-50)*50 = 17500
    expect(weighted.contributionCents).toBeCloseTo(117500, 6);
    expect(weighted.revenueCents).toBe(250000);
    expect(weighted.percentage).toBeCloseTo(47, 6);
  });

  it("mix sem vendas não tem margem ponderada", () => {
    const weighted = calculateWeightedContributionMargin([
      { priceCents: 2000, unitCostCents: 800, monthlySales: 0 },
    ]);
    expect(weighted.percentage).toBeNull();
  });

  it("ponto de equilíbrio é custo fixo dividido pela MC% média", () => {
    expect(calculateBreakEvenRevenue(500000, 47)).toBeCloseTo(500000 / 0.47, 6);
  });

  it("recusa ponto de equilíbrio com MC% zero ou negativa", () => {
    expect(() => calculateBreakEvenRevenue(500000, 0)).toThrow(PricingError);
    expect(() => calculateBreakEvenRevenue(500000, -5)).toThrow(PricingError);
  });

  it("calcula lucro mensal", () => {
    const result = calculateMonthlyProfit({
      revenueCents: 1000000,
      contributionMarginPercentage: 40,
      fixedCostsCents: 250000,
    });
    expect(result.contributionCents).toBe(400000);
    expect(result.profitCents).toBe(150000);
    expect(result.profitPercentage).toBeCloseTo(15, 10);
  });

  it("no ponto de equilíbrio o lucro é zero", () => {
    const breakEven = calculateBreakEvenRevenue(250000, 40);
    expect(
      calculateMonthlyProfit({
        revenueCents: breakEven,
        contributionMarginPercentage: 40,
        fixedCostsCents: 250000,
      }).profitCents,
    ).toBeCloseTo(0, 6);
  });
});

describe("desconto", () => {
  it("mostra perda de margem e quanto é preciso vender mais", () => {
    const impact = calculateDiscountImpact({
      priceCents: 2000,
      unitCostCents: 1000,
      fees: { taxPercentage: 10 },
      discountPercentage: 10,
    });
    expect(impact.discountedPriceCents).toBeCloseTo(1800, 10);
    // MC original: 2000-1000-200 = 800 ; com desconto: 1800-1000-180 = 620
    expect(impact.originalMarginCents).toBeCloseTo(800, 10);
    expect(impact.discountedMarginCents).toBeCloseTo(620, 10);
    expect(impact.lossCents).toBeCloseTo(180, 10);
    expect(impact.salesMultiplierToKeepProfit).toBeCloseTo(800 / 620, 10);
    expect(impact.isBelowCost).toBe(false);
  });

  it("desconto zero não muda nada", () => {
    const impact = calculateDiscountImpact({
      priceCents: 2000,
      unitCostCents: 1000,
      discountPercentage: 0,
    });
    expect(impact.discountedMarginCents).toBe(impact.originalMarginCents);
  });

  it("aponta venda abaixo do custo com desconto agressivo", () => {
    const impact = calculateDiscountImpact({
      priceCents: 2000,
      unitCostCents: 1500,
      fees: { taxPercentage: 10 },
      discountPercentage: 40,
    });
    expect(impact.isBelowCost).toBe(true);
    expect(impact.salesMultiplierToKeepProfit).toBeNull();
  });

  it("recusa desconto de 100% ou negativo", () => {
    expect(() =>
      calculateDiscountImpact({ priceCents: 2000, unitCostCents: 100, discountPercentage: 100 }),
    ).toThrow(PricingError);
    expect(() =>
      calculateDiscountImpact({ priceCents: 2000, unitCostCents: 100, discountPercentage: -5 }),
    ).toThrow(PricingError);
  });
});
