import { describe, expect, it } from "vitest";
import { calculateBusinessScore, classifyProductHealth, scoreBand } from "./health";

describe("classificação de produtos", () => {
  const target = 20;

  it("saudável quando a margem atinge o alvo", () => {
    expect(
      classifyProductHealth({ currentMarginPercentage: 25, targetMarginPercentage: target }),
    ).toBe("healthy");
    expect(
      classifyProductHealth({ currentMarginPercentage: 20, targetMarginPercentage: target }),
    ).toBe("healthy");
  });

  it("atenção quando a margem é positiva mas abaixo do alvo", () => {
    expect(
      classifyProductHealth({ currentMarginPercentage: 12, targetMarginPercentage: target }),
    ).toBe("attention");
  });

  it("crítico no limite padrão de 5% ou abaixo", () => {
    expect(
      classifyProductHealth({ currentMarginPercentage: 5, targetMarginPercentage: target }),
    ).toBe("critical");
    expect(
      classifyProductHealth({ currentMarginPercentage: -3, targetMarginPercentage: target }),
    ).toBe("critical");
  });

  it("respeita um limite crítico configurado", () => {
    expect(
      classifyProductHealth({
        currentMarginPercentage: 8,
        targetMarginPercentage: target,
        criticalMarginPercentage: 10,
      }),
    ).toBe("critical");
  });

  it("sem dados quando não há margem calculável", () => {
    expect(
      classifyProductHealth({ currentMarginPercentage: null, targetMarginPercentage: target }),
    ).toBe("unknown");
  });
});

describe("score do negócio", () => {
  it("é 100 no cenário ideal", () => {
    const result = calculateBusinessScore({
      statuses: ["healthy", "healthy"],
      averageMarginPercentage: 30,
      targetMarginPercentage: 20,
      revenueCents: 2_000_000,
      breakEvenCents: 1_000_000,
      dataSignals: [true, true, true],
    });
    expect(result.score).toBe(100);
    expect(scoreBand(result.score)).toBe("high");
  });

  it("é 0 sem nenhum dado", () => {
    const result = calculateBusinessScore({
      statuses: [],
      averageMarginPercentage: null,
      targetMarginPercentage: 20,
      revenueCents: 0,
      breakEvenCents: null,
      dataSignals: [false, false],
    });
    expect(result.score).toBe(0);
    expect(scoreBand(result.score)).toBe("low");
  });

  it("penaliza produtos fora da margem alvo", () => {
    const result = calculateBusinessScore({
      statuses: ["healthy", "attention", "critical", "critical"],
      averageMarginPercentage: 10,
      targetMarginPercentage: 20,
      revenueCents: 500_000,
      breakEvenCents: 1_000_000,
      dataSignals: [true, true, false, false],
    });
    // 25% saudáveis (10) + margem 50% (12,5) + faturamento 50% (10) + dados 50% (7,5)
    expect(result.score).toBe(40);
    expect(result.healthyShare).toBeCloseTo(0.25);
  });

  it("não passa de 100 com margem acima do alvo", () => {
    const result = calculateBusinessScore({
      statuses: ["healthy"],
      averageMarginPercentage: 90,
      targetMarginPercentage: 20,
      revenueCents: 10_000_000,
      breakEvenCents: 1_000_000,
      dataSignals: [true],
    });
    expect(result.score).toBe(100);
  });
});
