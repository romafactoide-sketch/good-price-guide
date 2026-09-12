import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { formatBRLFromCents } from "@/lib/money";
import { healthLabels, type HealthStatus } from "@/lib/pricing";

export type Alert = Tables<"alerts">;

export type AlertType =
  | "ingredient_cost_change"
  | "product_below_target"
  | "product_critical"
  | "product_margin_improved"
  | "price_far_below_recommended"
  | "break_even_up"
  | "break_even_snapshot";

export type AlertSeverity = "info" | "warning" | "critical" | "success";

export type AlertDraft = {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
};

export const alertFilters = {
  all: "Todos",
  critical: "Críticos",
  costs: "Custos",
  products: "Produtos",
  goals: "Metas",
} as const;

export type AlertFilter = keyof typeof alertFilters;

const costTypes: AlertType[] = ["ingredient_cost_change"];
const productTypes: AlertType[] = [
  "product_below_target",
  "product_critical",
  "product_margin_improved",
  "price_far_below_recommended",
];
const goalTypes: AlertType[] = ["break_even_up"];

/** Alertas técnicos que não aparecem na lista. */
const hiddenTypes: AlertType[] = ["break_even_snapshot"];

export const isVisibleAlert = (alert: Alert) => !hiddenTypes.includes(alert.type as AlertType);

export function matchesFilter(alert: Alert, filter: AlertFilter) {
  const type = alert.type as AlertType;
  if (filter === "all") return true;
  if (filter === "critical") return alert.severity === "critical";
  if (filter === "costs") return costTypes.includes(type);
  if (filter === "products") return productTypes.includes(type);
  return goalTypes.includes(type);
}

export type HealthSnapshot = {
  productId: string;
  productName: string;
  status: HealthStatus;
  marginPercentage: number | null;
  targetMarginPercentage: number;
  currentPriceCents: number;
  healthyPriceCents: number;
};

/** Monta os alertas do negócio a partir da saúde calculada pelo motor financeiro. */
export function buildBusinessAlerts(input: {
  products: HealthSnapshot[];
  breakEvenCents: number | null;
  previousBreakEvenCents: number | null;
}): AlertDraft[] {
  const drafts: AlertDraft[] = [];

  for (const product of input.products) {
    if (product.status === "critical") {
      drafts.push({
        type: "product_critical",
        severity: "critical",
        title: `${product.productName} está com margem crítica`,
        message: `A margem atual é de ${formatPercent(product.marginPercentage)} e o preço saudável é ${formatBRLFromCents(product.healthyPriceCents)}.`,
        entity_type: "product",
        entity_id: product.productId,
      });
    } else if (product.status === "attention") {
      drafts.push({
        type: "product_below_target",
        severity: "warning",
        title: `${product.productName} está abaixo da margem alvo`,
        message: `Margem atual ${formatPercent(product.marginPercentage)}, alvo ${formatPercent(product.targetMarginPercentage)}.`,
        entity_type: "product",
        entity_id: product.productId,
      });
    } else if (product.status === "healthy") {
      drafts.push({
        type: "product_margin_improved",
        severity: "success",
        title: `${product.productName} está saudável`,
        message: `A margem atual (${formatPercent(product.marginPercentage)}) já atinge o alvo de ${formatPercent(product.targetMarginPercentage)}.`,
        entity_type: "product",
        entity_id: product.productId,
      });
    }

    if (
      product.healthyPriceCents > 0 &&
      product.currentPriceCents > 0 &&
      product.currentPriceCents < product.healthyPriceCents * 0.9
    ) {
      drafts.push({
        type: "price_far_below_recommended",
        severity: "warning",
        title: `${product.productName} está bem abaixo do preço recomendado`,
        message: `Você cobra ${formatBRLFromCents(product.currentPriceCents)} e o preço saudável é ${formatBRLFromCents(product.healthyPriceCents)}.`,
        entity_type: "product",
        entity_id: product.productId,
      });
    }
  }

  if (
    input.breakEvenCents !== null &&
    input.previousBreakEvenCents !== null &&
    input.previousBreakEvenCents > 0 &&
    input.breakEvenCents > input.previousBreakEvenCents * 1.1
  ) {
    drafts.push({
      type: "break_even_up",
      severity: "warning",
      title: "Seu ponto de equilíbrio subiu",
      message: `Agora você precisa faturar ${formatBRLFromCents(input.breakEvenCents)} por mês para não ter prejuízo (antes eram ${formatBRLFromCents(input.previousBreakEvenCents)}).`,
      entity_type: "business",
      entity_id: null,
    });
  }

  if (input.breakEvenCents !== null) {
    drafts.push({
      type: "break_even_snapshot",
      severity: "info",
      title: "Registro do ponto de equilíbrio",
      message: String(Math.round(input.breakEvenCents)),
      entity_type: "business",
      entity_id: null,
    });
  }

  return drafts;
}

const formatPercent = (value: number | null) =>
  value === null
    ? "—"
    : `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export const statusLabel = (status: HealthStatus) => healthLabels[status];

export async function listAlerts(businessId: string) {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

export async function lastBreakEvenSnapshotCents(businessId: string) {
  const { data, error } = await supabase
    .from("alerts")
    .select("message")
    .eq("business_id", businessId)
    .eq("type", "break_even_snapshot")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const value = Number(data?.message ?? Number.NaN);
  return Number.isFinite(value) ? value : null;
}

/**
 * Grava os alertas do dia. O banco tem índice único por
 * negócio + tipo + item + dia, então repetições são ignoradas.
 */
export async function saveAlerts(businessId: string, drafts: AlertDraft[]) {
  let created = 0;
  for (const draft of drafts) {
    const { error } = await supabase.from("alerts").insert({ business_id: businessId, ...draft });
    if (!error) created += 1;
    else if (error.code !== "23505") throw error;
  }
  return created;
}

export async function markAlertRead(id: string, read = true) {
  const { error } = await supabase.from("alerts").update({ read }).eq("id", id);
  if (error) throw error;
}

export async function markAllAlertsRead(businessId: string) {
  const { error } = await supabase
    .from("alerts")
    .update({ read: true })
    .eq("business_id", businessId)
    .eq("read", false);
  if (error) throw error;
}
