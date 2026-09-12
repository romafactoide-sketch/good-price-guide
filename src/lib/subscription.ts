import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isPlanId, type PlanId } from "@/lib/plans";

export type Subscription = Tables<"subscriptions">;

export const subscriptionKey = ["subscription"] as const;

/** Plano efetivo: assinaturas vencidas ou canceladas voltam para o Free. */
export function effectivePlan(subscription: Subscription | null): PlanId {
  if (!subscription) return "free";
  if (!isPlanId(subscription.plan)) return "free";
  if (subscription.status === "canceled" || subscription.status === "past_due") return "free";
  if (subscription.expires_at && new Date(subscription.expires_at).getTime() < Date.now()) {
    return "free";
  }
  return subscription.plan;
}

export const subscriptionQuery = queryOptions({
  queryKey: subscriptionKey,
  queryFn: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error("Sessão não encontrada");
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },
});

/** Troca de plano local (sem cobrança real nesta fase). */
export async function changePlan(plan: PlanId) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Sessão não encontrada");
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userData.user.id,
      plan,
      status: "active",
      billing_cycle: "monthly",
      started_at: new Date().toISOString(),
      expires_at: null,
      provider: "none",
      provider_subscription_id: null,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
