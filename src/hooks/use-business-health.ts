import { useMemo } from "react";
import { usePricingData } from "@/hooks/use-pricing-data";
import type { Product } from "@/lib/catalog";
import {
  PricingError,
  calculateBreakEvenRevenue,
  calculateBusinessScore,
  calculateContributionMarginPercentage,
  calculateMarkup,
  calculatePriceRange,
  calculateUnitProfit,
  channelFees as feesOf,
  classifyProductHealth,
  type HealthStatus,
} from "@/lib/pricing";

export type HealthRow = {
  product: Product;
  currentPriceCents: number;
  healthyPriceCents: number | null;
  minimumPriceCents: number | null;
  currentMarginPercentage: number | null;
  targetMarginPercentage: number;
  unitProfitCents: number | null;
  markupMultiplier: number | null;
  status: HealthStatus;
  error: string | null;
};

/**
 * Saúde dos produtos e score do negócio.
 * Toda conta vem de `src/lib/pricing` — nada é recalculado aqui.
 */
export function useBusinessHealth() {
  const data = usePricingData();
  const { products, channels, fixedCostsCents, proLaboreCents, monthlyGoalCents } = data;
  const fees = channels[0] ? feesOf(channels[0]) : {};

  return useMemo(() => {
    const rows: HealthRow[] = products.map((product) => {
      const costCents = Number(product.adjusted_cost_cents);
      const targetMarginPercentage = Number(product.target_margin);
      const currentPriceCents = Number(product.current_price_cents);
      try {
        const range = calculatePriceRange({
          unitCostCents: costCents,
          fees,
          targetMarginPercentage,
        });
        const currentMarginPercentage =
          currentPriceCents > 0
            ? calculateContributionMarginPercentage({
                priceCents: currentPriceCents,
                unitCostCents: costCents,
                fees,
              })
            : null;
        return {
          product,
          currentPriceCents,
          healthyPriceCents: range.healthyPriceCents,
          minimumPriceCents: range.minimumPriceCents,
          currentMarginPercentage,
          targetMarginPercentage,
          unitProfitCents:
            currentPriceCents > 0
              ? calculateUnitProfit({
                  priceCents: currentPriceCents,
                  unitCostCents: costCents,
                  fees,
                }).profitCents
              : null,
          markupMultiplier:
            currentPriceCents > 0 && costCents > 0
              ? calculateMarkup(currentPriceCents, costCents).multiplier
              : null,
          status: classifyProductHealth({
            currentMarginPercentage,
            targetMarginPercentage,
            criticalMarginPercentage: data.criticalMarginPercentage,
          }),
          error: null,
        };
      } catch (error) {
        return {
          product,
          currentPriceCents,
          healthyPriceCents: null,
          minimumPriceCents: null,
          currentMarginPercentage: null,
          targetMarginPercentage,
          unitProfitCents: null,
          markupMultiplier: null,
          status: "unknown" as HealthStatus,
          error:
            error instanceof PricingError
              ? error.message
              : "Não foi possível calcular este produto.",
        };
      }
    });

    const margins = rows
      .map((row) => row.currentMarginPercentage)
      .filter((value): value is number => value !== null);
    const averageMarginPercentage = margins.length
      ? margins.reduce((sum, value) => sum + value, 0) / margins.length
      : null;

    const totalFixedCents = fixedCostsCents + proLaboreCents;
    let breakEvenCents: number | null = null;
    try {
      if (averageMarginPercentage !== null) {
        breakEvenCents = calculateBreakEvenRevenue(totalFixedCents, averageMarginPercentage);
      }
    } catch {
      breakEvenCents = null;
    }

    const score = calculateBusinessScore({
      statuses: rows.map((row) => row.status),
      averageMarginPercentage,
      targetMarginPercentage: rows[0] ? rows[0].targetMarginPercentage : 20,
      revenueCents: monthlyGoalCents,
      breakEvenCents,
      dataSignals: [
        rows.length > 0,
        rows.every((row) => row.currentPriceCents > 0) && rows.length > 0,
        totalFixedCents > 0,
        monthlyGoalCents > 0,
        channels.length > 0,
      ],
    });

    const counts = {
      healthy: rows.filter((row) => row.status === "healthy").length,
      attention: rows.filter((row) => row.status === "attention").length,
      critical: rows.filter((row) => row.status === "critical").length,
      unknown: rows.filter((row) => row.status === "unknown").length,
    };

    return {
      ...data,
      rows,
      counts,
      averageMarginPercentage,
      totalFixedCents,
      breakEvenCents,
      score,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, channels, fixedCostsCents, proLaboreCents, monthlyGoalCents, data.loading]);
}
