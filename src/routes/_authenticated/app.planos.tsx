import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { usePlan } from "@/components/app/paywall";
import { formatPlanPrice, planOrder, plans, type PlanId } from "@/lib/plans";
import { changePlan, subscriptionKey } from "@/lib/subscription";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/planos")({
  head: () => ({
    meta: [
      { title: "Planos — PreçoSadio" },
      {
        name: "description",
        content:
          "Compare os planos Free, Pro e Negócio do PreçoSadio e escolha quanto controle você quer sobre a sua margem.",
      },
      { property: "og:title", content: "Planos — PreçoSadio" },
      {
        property: "og:description",
        content: "Free, Pro e Negócio: escolha o plano que protege a sua margem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { plan: currentPlan } = usePlan();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<PlanId | null>(null);

  async function select(plan: PlanId) {
    setSaving(plan);
    try {
      await changePlan(plan);
      await queryClient.invalidateQueries({ queryKey: subscriptionKey });
      toast.success(`Plano ${plans[plan].name} ativado.`);
    } catch {
      toast.error("Não foi possível mudar de plano agora.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Planos"
        description="Proteja sua margem todos os meses. A cobrança automática entra em breve — por enquanto a troca é liberada aqui."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {planOrder.map((id) => {
          const plan = plans[id];
          const isCurrent = currentPlan === id;
          const featured = id === "pro";
          return (
            <div
              key={id}
              className={cn(
                "flex flex-col rounded-3xl border bg-card p-6 shadow-soft",
                featured ? "border-primary shadow-lift" : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-foreground">{plan.name}</h2>
                {featured ? <Badge variant="success">Recomendado</Badge> : null}
                {isCurrent ? <Badge variant="secondary">Plano atual</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <p className="mt-4 text-3xl font-extrabold tabular-nums text-foreground">
                {formatPlanPrice(plan)}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  {plan.priceCents === 0 ? "para sempre" : "/mês"}
                </span>
              </p>

              <ul className="mt-5 grid flex-1 gap-2">
                {plan.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6"
                variant={featured ? "hero" : "subtle"}
                disabled={isCurrent || saving !== null}
                onClick={() => select(id)}
              >
                {isCurrent ? (
                  "Seu plano"
                ) : (
                  <>
                    <Sparkles />
                    {saving === id ? "Ativando..." : `Escolher ${plan.name}`}
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Se você trocar para um plano menor, nada do que já cadastrou é apagado: apenas novas ações
        premium ficam bloqueadas.
      </p>
    </div>
  );
}
