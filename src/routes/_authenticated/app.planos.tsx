import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { usePlan } from "@/components/app/paywall";
import { plans } from "@/lib/plans";
import { kiwifyOffers } from "@/lib/kiwify-offers";
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
  const { plan: currentPlan } = usePlan();
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Planos"
        description="Proteja sua margem todos os meses. Escolha a forma de acesso Pro. A contratação estará disponível após a conexão do checkout da Kiwify."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            id: "monthly",
            title: "Mensal",
            price: "R$ 29,90",
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
                <Badge variant="success">Economize R$ 111,80/ano</Badge>
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
            <Button
              className="mt-6"
              variant={offer.id === "yearly" ? "hero" : "subtle"}
              disabled
              title={kiwifyOffers[offer.id as keyof typeof kiwifyOffers].checkoutUrl}
            >
              {currentPlan === "pro" ? "Você já tem acesso Pro" : "Checkout em preparação"}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Nenhuma cobrança será realizada nesta página enquanto o checkout não estiver conectado.
      </p>
    </div>
  );
}
