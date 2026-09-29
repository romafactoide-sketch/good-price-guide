import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { usePlan } from "@/components/app/paywall";
import { plans } from "@/lib/plans";
import { kiwifyOffers } from "@/lib/kiwify-offers";
import { subscriptionQuery } from "@/lib/subscription";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/planos")({
  head: () => ({
    meta: [
      { title: "Planos — PreçoSadio" },
      {
        name: "description",
        content: "Compare as formas de acesso ao PreçoSadio Pro.",
      },
      { property: "og:title", content: "Planos — PreçoSadio" },
      {
        property: "og:description",
        content: "Mensal, anual e vitalício: escolha seu acesso Pro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { plan: currentPlan, loading } = usePlan();
  const { data: subscription, isFetching, isError, refetch } = useQuery(subscriptionQuery);
  const cycleName = {
    monthly: "Mensal",
    yearly: "Anual",
    lifetime: "Vitalício",
  }[subscription?.billing_cycle ?? ""];
  const accessEnd = subscription?.expires_at
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(subscription.expires_at))
    : null;
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Planos"
        description="Proteja sua margem todos os meses. Escolha a forma de acesso Pro e finalize a compra na Kiwify."
      />

      <section
        className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft"
        aria-live="polite"
      >
        <div>
          <p className="text-sm text-muted-foreground">Seu acesso no PreçoSadio</p>
          <p className="mt-1 font-semibold text-foreground">
            {loading
              ? "Consultando plano..."
              : currentPlan === "pro"
                ? `Pro ${cycleName ?? ""}`.trim()
                : "Free"}
          </p>
          {currentPlan === "pro" && accessEnd ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Acesso registrado até {accessEnd} (horário de Brasília).
            </p>
          ) : currentPlan === "pro" && subscription?.billing_cycle === "lifetime" ? (
            <p className="mt-1 text-sm text-muted-foreground">Acesso sem vencimento.</p>
          ) : null}
          {isError ? (
            <p className="mt-1 text-sm text-destructive">
              Não foi possível consultar seu plano. Tente atualizar.
            </p>
          ) : null}
        </div>
        <Button variant="subtle" disabled={isFetching} onClick={() => void refetch()}>
          {isFetching ? "Atualizando..." : "Atualizar status"}
        </Button>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            id: "monthly",
            title: "Mensal",
            price: "R$ 29,00",
            period: "/mês",
            detail: "Renovação mensal",
          },
          {
            id: "yearly",
            title: "Anual",
            price: "R$ 247,00",
            period: "/ano",
            detail: "Pagamento à vista com renovação anual",
          },
          {
            id: "lifetime",
            title: "Vitalício",
            price: "R$ 347,00",
            period: "pagamento único",
            detail: "Acesso Pro sem vencimento",
          },
        ].map((offer) => (
          <div
            key={offer.id}
            className={cn(
              "flex flex-col rounded-3xl border bg-card p-6 shadow-soft",
              offer.id === "yearly" ? "border-primary shadow-lift" : "border-border",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-foreground">{offer.title}</h2>
              {offer.id === "yearly" ? (
                <Badge variant="success">Economize R$ 101,00/ano</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{offer.detail}</p>
            <p className="mt-4 text-3xl font-extrabold tabular-nums text-foreground">
              {offer.price}
              <span className="ml-1 text-sm font-medium text-muted-foreground">{offer.period}</span>
            </p>
            <ul className="mt-5 grid flex-1 gap-2">
              {plans.pro.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            {loading || isError || isFetching ? (
              <Button className="mt-6" variant="subtle" disabled>
                Verificando plano...
              </Button>
            ) : currentPlan === "pro" ? (
              <Button className="mt-6" variant="subtle" disabled>
                Você já tem acesso Pro
              </Button>
            ) : (
              <Button asChild className="mt-6" variant={offer.id === "yearly" ? "hero" : "subtle"}>
                <a
                  href={kiwifyOffers[offer.id as keyof typeof kiwifyOffers].checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Assinar {offer.title}
                </a>
              </Button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Use na Kiwify o mesmo e-mail desta conta. O acesso Pro é liberado depois que o pagamento for
        aprovado; ao voltar, atualize a página se necessário. Cancelamentos de assinaturas
        recorrentes são feitos na Kiwify.
      </p>
    </div>
  );
}
