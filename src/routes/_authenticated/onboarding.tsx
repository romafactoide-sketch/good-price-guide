import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Box, Plus, Trash2, Wrench } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/ui/progress-bar";
import { supabase } from "@/integrations/supabase/client";
import { centsToCurrencyText, currencyTextToCents, formatBRLFromCents } from "@/lib/money";
import { ensureWorkspace } from "@/lib/workspace";

type CostDraft = { id?: string; name: string; category: string; amount: string };
const initialCosts: CostDraft[] = ["Aluguel", "Energia", "Água", "Internet", "Funcionários", "Marketing", "Sistemas"].map((name) => ({ name, category: name === "Funcionários" ? "personnel" : name === "Marketing" ? "marketing" : name === "Sistemas" ? "technology" : "structure", amount: "" }));

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [
    { title: "Configure seu negócio — PreçoSadio" },
    { name: "description", content: "Informe custos, pró-labore e dados operacionais do seu negócio." },
    { property: "og:title", content: "Configure seu negócio — PreçoSadio" },
    { property: "og:description", content: "Configure as informações essenciais do seu negócio." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [businessId, setBusinessId] = useState("");
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("");
  const [costs, setCosts] = useState<CostDraft[]>(initialCosts);
  const [proLabore, setProLabore] = useState("");
  const [monthlySales, setMonthlySales] = useState("");
  const [averageTicket, setAverageTicket] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ensureWorkspace().then(async (business) => {
      if (business.onboarding_completed) return navigate({ to: "/app", replace: true });
      setBusinessId(business.id);
      setStep(business.onboarding_step);
      setBusinessType(business.business_type ?? "");
      setProLabore(centsToCurrencyText(business.pro_labore_cents));
      setMonthlySales(business.monthly_sales?.toString() ?? "");
      setAverageTicket(centsToCurrencyText(business.average_ticket_cents));
      setMonthlyRevenue(centsToCurrencyText(business.monthly_revenue_cents));
      const { data } = await supabase.from("fixed_costs").select("id,name,category,amount_cents").eq("business_id", business.id).order("created_at");
      if (data?.length) setCosts(data.map((cost) => ({ id: cost.id, name: cost.name, category: cost.category, amount: centsToCurrencyText(cost.amount_cents) })));
    }).catch(() => setError("Não foi possível carregar sua configuração."));
  }, [navigate]);

  const total = useMemo(() => costs.reduce((sum, cost) => sum + currencyTextToCents(cost.amount), 0), [costs]);

  async function saveCurrent(next: number, complete = false) {
    if (!businessId) return;
    if (step === 1 && !businessType) return setError("Escolha uma opção para continuar.");
    setSaving(true); setError("");
    try {
      if (step === 2) {
        await supabase.from("fixed_costs").delete().eq("business_id", businessId);
        const valid = costs.filter((cost) => cost.name.trim() && currencyTextToCents(cost.amount) > 0);
        if (valid.length) {
          const { error: costError } = await supabase.from("fixed_costs").insert(valid.map((cost) => ({ business_id: businessId, name: cost.name.trim(), category: cost.category, amount_cents: currencyTextToCents(cost.amount) })));
          if (costError) throw costError;
        }
      }
      const onboardingArgs = {
        target_business_id: businessId,
        step_number: step,
        complete_onboarding: complete,
        ...(step === 1 ? { business_kind: businessType } : {}),
        ...(step === 3 ? { pro_labore_value_cents: currencyTextToCents(proLabore) } : {}),
        ...(step === 4 && monthlySales ? { monthly_sales_value: Number(monthlySales) } : {}),
        ...(step === 4 && averageTicket ? { average_ticket_value_cents: currencyTextToCents(averageTicket) } : {}),
        ...(step === 4 && monthlyRevenue ? { monthly_revenue_value_cents: currencyTextToCents(monthlyRevenue) } : {}),
      };
      const { error: saveError } = await supabase.rpc("save_onboarding_step", onboardingArgs);
      if (saveError) throw saveError;
      if (complete) navigate({ to: "/app", replace: true }); else setStep(next);
    } catch { setError("Não foi possível salvar. Tente novamente."); } finally { setSaving(false); }
  }

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-2xl">
      <Logo />
      <div className="mt-8"><ProgressBar value={step * 25} label={`Etapa ${step} de 4`} caption={`${step * 25}%`} /></div>
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-8">
        {step === 1 ? <><h1 className="text-2xl font-extrabold">O que você vende?</h1><p className="mt-2 text-sm text-muted-foreground">Escolha a opção que melhor representa seu negócio.</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{[{ value: "products", label: "Produtos", icon: Box }, { value: "services", label: "Serviços", icon: Wrench }, { value: "both", label: "Ambos", icon: Plus }].map((option) => <Button key={option.value} type="button" variant="subtle" onClick={() => setBusinessType(option.value)} className={`grid h-auto min-h-28 place-items-center gap-2 p-4 ${businessType === option.value ? "border-primary bg-primary-soft text-primary-dark" : ""}`}><option.icon className="size-5" />{option.label}</Button>)}</div></> : null}
        {step === 2 ? <><h1 className="text-2xl font-extrabold">Vamos entender seus custos mensais.</h1><p className="mt-2 text-sm text-muted-foreground">Preencha o que se aplica ao seu negócio.</p><div className="mt-6 grid gap-4">{costs.map((cost, index) => <div key={`${cost.id ?? "new"}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3"><div className="grid gap-1.5"><Label htmlFor={`cost-${index}`}>{index < 7 ? cost.name : "Nome do custo"}</Label>{index >= 7 ? <Input value={cost.name} onChange={(event) => setCosts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder="Ex.: Contador" className="mb-2" /> : null}<CurrencyInput id={`cost-${index}`} value={cost.amount} onValueChange={(value) => setCosts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, amount: value } : item))} /></div>{index >= 7 ? <Button type="button" variant="ghost" size="icon" aria-label={`Excluir ${cost.name || "custo"}`} onClick={() => setCosts((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button> : null}</div>)}<Button type="button" variant="subtle" onClick={() => setCosts((current) => [...current, { name: "", category: "other", amount: "" }])}><Plus />Adicionar outro custo</Button><div className="flex items-center justify-between rounded-xl bg-primary-soft p-4"><span className="text-sm font-semibold text-primary-dark">Total de custos fixos</span><strong className="text-lg text-primary-dark">{formatBRLFromCents(total)}</strong></div></div></> : null}
        {step === 3 ? <><div className="flex items-center gap-2"><h1 className="text-2xl font-extrabold">Quanto você deseja receber pelo seu trabalho?</h1><InfoTooltip content="O pró-labore é o valor mensal que você deseja retirar pelo seu trabalho no negócio." /></div><div className="mt-6 grid gap-1.5"><Label htmlFor="pro-labore">Pró-labore</Label><CurrencyInput id="pro-labore" value={proLabore} onValueChange={setProLabore} /></div></> : null}
        {step === 4 ? <><h1 className="text-2xl font-extrabold">Conte um pouco sobre suas vendas</h1><p className="mt-2 text-sm text-muted-foreground">Estes campos são opcionais e podem ser alterados depois.</p><div className="mt-6 grid gap-4"><div className="grid gap-1.5"><Label htmlFor="sales">Vendas mensais aproximadas</Label><Input id="sales" inputMode="numeric" value={monthlySales} onChange={(event) => setMonthlySales(event.target.value.replace(/\D/g, ""))} placeholder="Ex.: 120" /></div><div className="grid gap-1.5"><Label htmlFor="ticket">Ticket médio</Label><CurrencyInput id="ticket" value={averageTicket} onValueChange={setAverageTicket} /></div><div className="grid gap-1.5"><Label htmlFor="revenue">Faturamento médio mensal</Label><CurrencyInput id="revenue" value={monthlyRevenue} onValueChange={setMonthlyRevenue} /></div></div></> : null}
        {error ? <p className="mt-5 text-sm text-destructive">{error}</p> : null}
        <div className="mt-8 flex items-center justify-between gap-3"><Button type="button" variant="ghost" disabled={step === 1 || saving} onClick={() => setStep((current) => Math.max(1, current - 1))}><ArrowLeft />Voltar</Button><Button type="button" variant="hero" disabled={saving} onClick={() => saveCurrent(Math.min(4, step + 1), step === 4)}>{saving ? "Salvando..." : step === 4 ? "Concluir" : "Continuar"}<ArrowRight /></Button></div>
      </section>
    </div>
  </main>;
}