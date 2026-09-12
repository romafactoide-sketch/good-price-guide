import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/landing/site-nav";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { Benefits } from "@/components/landing/benefits";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { SiteFooter } from "@/components/landing/site-footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ensureWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PreçoSadio | Calculadora de preço de venda, margem e markup" },
      {
        name: "description",
        content:
          "Calcule quanto cobrar pelos seus produtos e serviços. Descubra preço saudável, margem, markup, custos e ponto de equilíbrio.",
      },
      {
        property: "og:title",
        content: "PreçoSadio | Calculadora de preço de venda, margem e markup",
      },
      {
        property: "og:description",
        content:
          "Calcule quanto cobrar pelos seus produtos e serviços. Descubra preço saudável, margem, markup, custos e ponto de equilíbrio.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "PreçoSadio" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "PreçoSadio | Calculadora de preço de venda, margem e markup",
      },
      {
        name: "twitter:description",
        content:
          "Calcule quanto cobrar pelos seus produtos e serviços. Descubra preço saudável, margem, markup, custos e ponto de equilíbrio.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const business = await ensureWorkspace();
      navigate({ to: business.onboarding_completed ? "/app" : "/onboarding", replace: true });
    });
  }, [navigate]);
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main>
        <section className="bg-gradient-hero">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark">
                <Sparkles className="size-3.5" />
                Mais lucro para o seu esforço
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] text-foreground sm:text-5xl">
                Descubra quanto cobrar para seu negócio realmente dar lucro.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Cadastre seus custos e descubra seu preço mínimo, preço saudável, margem, markup e
                quanto precisa vender para atingir suas metas.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="hero" size="xl">
                  <Link to="/criar-conta">
                    Calcular meu preço grátis
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="subtle" size="xl">
                  <a href="#como-funciona">
                    <PlayCircle />
                    Ver como funciona
                  </a>
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Grátis para começar • Sem cartão de crédito • Feito em português
              </p>
            </div>

            <div className="lg:pl-6">
              <DashboardMockup />
            </div>
          </div>
        </section>

        <Benefits />
        <HowItWorks />
        <Pricing />

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-3xl bg-gradient-primary px-6 py-12 text-center shadow-lift sm:px-12">
            <h2 className="text-2xl font-extrabold text-primary-foreground sm:text-3xl">
              Seu trabalho merece um preço saudável.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/85 sm:text-base">
              Crie sua conta e veja em minutos quanto cobrar por cada produto ou serviço.
            </p>
            <Button asChild size="xl" variant="subtle" className="mt-7">
              <Link to="/criar-conta">
                Criar conta grátis
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
