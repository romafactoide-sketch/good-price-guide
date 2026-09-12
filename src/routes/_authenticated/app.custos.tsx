import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { centsToCurrencyText, currencyTextToCents, formatBRLFromCents } from "@/lib/money";
import { ensureWorkspace } from "@/lib/workspace";
import { usePlan } from "@/components/app/paywall";
import { TableSkeleton } from "@/components/app/loading-skeletons";
import { useConfirm } from "@/components/ui/confirm-dialog";

type FixedCost = Tables<"fixed_costs">;
const categories = {
  structure: "Estrutura",
  personnel: "Pessoal",
  marketing: "Marketing",
  administrative: "Administrativo",
  technology: "Tecnologia",
  financial: "Financeiro",
  other: "Outro",
} as const;

export const Route = createFileRoute("/_authenticated/app/custos")({
  head: () => ({
    meta: [
      { title: "Custos fixos — PreçoSadio" },
      {
        name: "description",
        content: "Cadastre e acompanhe os custos fixos mensais do seu negócio.",
      },
      { property: "og:title", content: "Custos fixos — PreçoSadio" },
      { property: "og:description", content: "Gerencie os custos fixos mensais do seu negócio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CostsPage,
});

function CostsPage() {
  const { guard } = usePlan();
  const { confirm, confirmDialog } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState("");
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [editing, setEditing] = useState<FixedCost | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<keyof typeof categories>("structure");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const total = useMemo(() => costs.reduce((sum, cost) => sum + cost.amount_cents, 0), [costs]);

  async function load() {
    const business = await ensureWorkspace();
    setBusinessId(business.id);
    const { data, error } = await supabase
      .from("fixed_costs")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at");
    if (error) {
      setLoading(false);
      toast.error("Não foi possível carregar os custos. Tente novamente.");
      return;
    }
    setCosts(data);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function showForm(cost?: FixedCost) {
    setEditing(cost ?? null);
    setName(cost?.name ?? "");
    setCategory((cost?.category as keyof typeof categories) ?? "structure");
    setAmount(centsToCurrencyText(cost?.amount_cents));
    setOpen(true);
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Informe o nome do custo.");
      return;
    }
    setSaving(true);
    const payload = {
      business_id: businessId,
      name: name.trim(),
      category,
      amount_cents: currencyTextToCents(amount),
    };
    const result = editing
      ? await supabase.from("fixed_costs").update(payload).eq("id", editing.id)
      : await supabase.from("fixed_costs").insert(payload);
    setSaving(false);
    if (result.error) {
      toast.error("Não conseguimos salvar este custo. Tente novamente.");
      return;
    }
    toast.success(editing ? "Custo atualizado." : "Custo adicionado.");
    setOpen(false);
    await load();
  }

  async function remove(cost: FixedCost) {
    const ok = await confirm({
      title: `Excluir ${cost.name}?`,
      description: "Este custo fixo deixará de entrar no cálculo do ponto de equilíbrio.",
    });
    if (!ok) return;
    const { error } = await supabase.from("fixed_costs").delete().eq("id", cost.id);
    if (error) {
      toast.error("Não conseguimos excluir este custo. Tente novamente.");
      return;
    }
    toast.success("Custo excluído.");
    await load();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Custos fixos"
        description="Acompanhe as despesas mensais que existem mesmo sem vendas."
        actions={
          <Button variant="hero" onClick={() => guard("fixed_costs", () => showForm())}>
            <Plus />
            Adicionar custo
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="text-sm text-muted-foreground">Total mensal</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums">{formatBRLFromCents(total)}</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary-dark">
            <Receipt />
          </span>
          <div>
            <strong className="block text-lg">{costs.length}</strong>
            <span className="text-sm text-muted-foreground">custos cadastrados</span>
          </div>
        </div>
      </div>
      {loading ? (
        <TableSkeleton />
      ) : (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {costs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-5 py-3">Custo</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3 text-right">Valor</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((cost) => (
                  <tr key={cost.id} className="border-b border-border/70 last:border-0">
                    <td className="px-5 py-4 font-semibold">{cost.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {categories[cost.category as keyof typeof categories] ?? "Outro"}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums">
                      {formatBRLFromCents(cost.amount_cents)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${cost.name}`}
                          onClick={() => showForm(cost)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir ${cost.name}`}
                          onClick={() => remove(cost)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <Receipt className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 font-bold">Nenhum custo cadastrado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione aluguel, energia, equipe e outras despesas mensais.
            </p>
          </div>
        )}
      </div>
      )}
      {confirmDialog}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar custo" : "Adicionar custo"}</DialogTitle>
            <DialogDescription>Informe o valor mensal desta despesa.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cost-name">Custo</Label>
              <Input
                id="cost-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Aluguel"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as keyof typeof categories)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categories).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cost-amount">Valor</Label>
              <CurrencyInput id="cost-amount" value={amount} onValueChange={setAmount} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="hero" disabled={saving} onClick={save}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
