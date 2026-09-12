/**
 * Eventos de produto do PreçoSadio.
 *
 * Estrutura organizada e centralizada: nenhuma tela deve inventar nome de
 * evento. Nesta fase não há plataforma externa integrada — os eventos ficam
 * em memória e no console (modo dev) e podem ser enviados depois para
 * qualquer provedor apenas trocando `sink`.
 */

export type AnalyticsEvent =
  | "signup_started"
  | "signup_completed"
  | "onboarding_completed"
  | "product_created"
  | "pricing_calculated"
  | "simulation_used"
  | "paywall_viewed"
  | "upgrade_clicked";

export type AnalyticsPayload = Record<string, string | number | boolean | null>;

type TrackedEvent = {
  event: AnalyticsEvent;
  payload: AnalyticsPayload;
  at: string;
};

const buffer: TrackedEvent[] = [];
const MAX_BUFFER = 100;

/** Substitua por um envio real (ex.: fetch para o provedor) quando quiser. */
let sink: ((tracked: TrackedEvent) => void) | null = null;

export function setAnalyticsSink(next: ((tracked: TrackedEvent) => void) | null) {
  sink = next;
}

export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  const tracked: TrackedEvent = { event, payload, at: new Date().toISOString() };
  buffer.push(tracked);
  if (buffer.length > MAX_BUFFER) buffer.shift();
  if (import.meta.env.DEV) console.info("[analytics]", event, payload);
  try {
    sink?.(tracked);
  } catch (error) {
    console.error("[analytics] falha ao enviar evento", error);
  }
}

export const analyticsBuffer = () => [...buffer];
