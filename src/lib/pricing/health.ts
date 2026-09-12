/**
 * Classificação de saúde dos produtos e score operacional do negócio.
 * Funções puras — nenhuma fórmula fica nos componentes React.
 */

export const DEFAULT_CRITICAL_MARGIN_PERCENTAGE = 5;

export type HealthStatus = "healthy" | "attention" | "critical" | "unknown";

export const healthLabels: Record<HealthStatus, string> = {
  healthy: "Saudável",
  attention: "Atenção",
  critical: "Crítico",
  unknown: "Sem dados",
};

/**
 * Saudável: margem atual >= margem alvo.
 * Atenção: margem positiva, porém abaixo da alvo.
 * Crítico: margem <= limite crítico configurado (padrão 5%).
 */
export function classifyProductHealth(input: {
  currentMarginPercentage: number | null;
  targetMarginPercentage: number;
  criticalMarginPercentage?: number;
}): HealthStatus {
  const margin = input.currentMarginPercentage;
  if (margin === null || !Number.isFinite(margin)) return "unknown";
  const critical = input.criticalMarginPercentage ?? DEFAULT_CRITICAL_MARGIN_PERCENTAGE;
  if (margin <= critical) return "critical";
  if (margin >= input.targetMarginPercentage) return "healthy";
  return "attention";
}

export type ScoreInput = {
  statuses: HealthStatus[];
  averageMarginPercentage: number | null;
  targetMarginPercentage: number;
  revenueCents: number;
  breakEvenCents: number | null;
  /** Sinais de preenchimento: cada item true soma na qualidade dos dados. */
  dataSignals: boolean[];
};

export type ScoreBreakdown = {
  score: number;
  healthyShare: number;
  parts: { label: string; value: number; weight: number }[];
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Score operacional 0–100. É um indicador de acompanhamento, não uma
 * medida financeira exata: pesos explícitos e sem precisão inventada.
 */
export function calculateBusinessScore(input: ScoreInput): ScoreBreakdown {
  const known = input.statuses.filter((status) => status !== "unknown");
  const healthy = known.filter((status) => status === "healthy").length;
  const healthyShare = known.length > 0 ? healthy / known.length : 0;

  const marginTarget = input.targetMarginPercentage > 0 ? input.targetMarginPercentage : 20;
  const marginScore =
    input.averageMarginPercentage === null
      ? 0
      : clamp01(input.averageMarginPercentage / marginTarget);

  const breakEvenScore =
    input.breakEvenCents === null || input.breakEvenCents <= 0
      ? 0
      : clamp01(input.revenueCents / input.breakEvenCents);

  const dataScore =
    input.dataSignals.length === 0
      ? 0
      : input.dataSignals.filter(Boolean).length / input.dataSignals.length;

  const parts = [
    { label: "Produtos saudáveis", value: healthyShare, weight: 40 },
    { label: "Margem média", value: marginScore, weight: 25 },
    { label: "Faturamento vs. ponto de equilíbrio", value: breakEvenScore, weight: 20 },
    { label: "Dados preenchidos", value: dataScore, weight: 15 },
  ];

  const score = Math.round(parts.reduce((sum, part) => sum + clamp01(part.value) * part.weight, 0));
  return { score: Math.max(0, Math.min(100, score)), healthyShare, parts };
}

export type ScoreBand = "low" | "medium" | "high";

export function scoreBand(score: number): ScoreBand {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export const scoreMessages: Record<ScoreBand, string> = {
  high: "Seu negócio está com preços em boa forma. Continue acompanhando.",
  medium: "Há espaço para melhorar: alguns produtos estão abaixo da margem alvo.",
  low: "Atenção: seus preços atuais podem não estar cobrindo custos e lucro.",
};
