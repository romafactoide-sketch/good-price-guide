import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "para sempre",
    description: "Para testar e precificar seus primeiros itens.",
    features: ["Até 3 produtos", "Custos e insumos básicos", "Preço mínimo e saudável"],
    cta: "Começar grátis",
    featured: false,
  },
  {
    name: "Pro",
    price: "R$ 29,00",
    period: "por mês",
    description: "Para quem vende todos os dias e quer margem protegida.",
    features: [
      "Produtos e insumos ilimitados",
      "Simuladores de preço e desconto",
      "Metas e ponto de equilíbrio",
      "Alertas de margem crítica",
    ],
    cta: "Assinar Pro",
    featured: true,
  },
  {
    name: "Anual",
    price: "R$ 247",
    period: "por ano, à vista (recorrente)",
    description: "Todos os recursos Pro com economia de R$ 101,00 por ano.",
    features: [
      "Todos os recursos Pro",
      "Produtos e insumos ilimitados",
      "Alertas e simulações",
      "Pagamento anual à vista",
    ],
    cta: "Conhecer o Pro",
    featured: false,
  },
  {
    name: "Vitalício",
    price: "R$ 347",
    period: "pagamento único",
    description: "Acesso permanente aos recursos Pro desta oferta.",
    features: ["Todos os recursos Pro", "Produtos e insumos ilimitados", "Pagamento único"],
    cta: "Conhecer o Pro",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-primary">Planos</span>
        <h2 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
          Comece grátis e cresça quando fizer sentido.
        </h2>
      </div>

      <div className="mt-10 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={cn(
              "rounded-3xl border bg-card p-7 shadow-soft",
              plan.featured ? "border-primary/40 shadow-lift lg:-mt-4 lg:pb-10" : "border-border",
            )}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h3 className="truncate text-lg font-bold text-foreground">{plan.name}</h3>
              {plan.featured ? (
                <Badge variant="success" className="shrink-0">
                  Mais escolhido
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <p className="mt-5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </p>
            <ul className="mt-6 grid gap-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant={plan.featured ? "hero" : "subtle"}
              size="lg"
              className="mt-7 w-full"
            >
              <Link to="/criar-conta">{plan.cta}</Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
