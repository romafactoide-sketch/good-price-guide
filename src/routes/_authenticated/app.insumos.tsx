import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Boxes, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { EmptyState } from "@/components/ui/empty-state";
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
import {
  ingredientCategories,
  productsUsingIngredient,
  recalculateProduct,
  round4,
  type Ingredient,
} from "@/lib/catalog";
import { centsToCurrencyText, currencyTextToCents, formatBRLFromCents } from "@/lib/money";
import {
  baseUnitOf,
  formatQuantity,
  formatUnitCost,
  isPurchaseUnit,
  parseDecimal,
  purchaseUnits,
  toBaseQuantity,
  unitCostCents,
  type PurchaseUnit,
} from "@/lib/units";
import { ensureWorkspace } from "@/lib/workspace";
import { usePlan } from "@/components/app/paywall";
import { canCreateIngredient } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/app/insumos")({
  head: () => ({
    meta: [
      { title: "Insumos — PreçoSadio" },
      {
        name: "description",
        content:
          "Cadastre ingredientes, embalagens e materiais e descubra o custo unitário de cada insumo.",
      },
      { property: "og:title", content: "Insumos — PreçoSadio" },
      {
        property: "og:description",
        content: "Controle o custo unitário dos insumos que compõem seus produtos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IngredientsPage,
});

type Usage = Record<string, number>;

function IngredientsPage() {
  const { plan, openPaywall } = usePlan();
  const [businessId, setBusinessId] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [usage, setUsage] = useState<Usage>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<keyof typeof ingredientCategories>("ingredient");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<PurchaseUnit>("kg");
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [impact, setImpact] = useState<{ id: string; name: string }[] | null>(null);

  const quantityNumber = parseDecimal(quantity);
  const priceCents = currencyTextToCents(price);
  const previewBaseUnit = baseUnitOf(unit);
  const previewUnitCost = unitCostCents(priceCents, quantityNumber, unit);

  async function load() {
    const business = await ensureWorkspace();
    setBusinessId(business.id);
    const [{ data, error }, { data: links }] = await Promise.all([
      supabase.from("ingredients").select("*").eq("business_id", business.id).order("name"),
      supabase.from("product_ingredients").select("ingredient_id,product_id"),
    ]);
    setLoading(false);
    if (error) {
      toast.error("Não foi possível carregar os insumos.");
      return;
    }
    setIngredients(data);
    const counts: Usage = {};
    const seen = new Set<string>();
    for (const link of links ?? []) {
      const key = `${link.ingredient_id}:${link.product_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      counts[link.ingredient_id] = (counts[link.ingredient_id] ?? 0) + 1;
    }
    setUsage(counts);
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return ingredients.filter((item) => {
      const matchesTerm =
        !term ||
        item.name.toLowerCase().includes(term) ||
        (item.supplier ?? "").toLowerCase().includes(term);
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesUnit = unitFilter === "all" || item.purchase_unit === unitFilter;
      return matchesTerm && matchesCategory && matchesUnit;
    });
  }, [ingredients, search, categoryFilter, unitFilter]);

  /** Novo insumo respeitando o limite do plano. */
  function startCreate() {
    const check = canCreateIngredient(plan, ingredients.length);
    if (!check.allowed) {
      openPaywall("unlimited_ingredients", check.message ?? undefined);
      return;
    }
    showForm();
  }

  function showForm(item?: Ingredient) {
    setEditing(item ?? null);
    setName(item?.name ?? "");
    setCategory((item?.category as keyof typeof ingredientCategories) ?? "ingredient");
    setQuantity(item ? formatQuantity(Number(item.purchase_quantity)) : "");
    setUnit(item && isPurchaseUnit(item.purchase_unit) ? item.purchase_unit : "kg");
    setPrice(centsToCurrencyText(item?.purchase_price_cents));
    setSupplier(item?.supplier ?? "");
    setPurchaseDate(item?.purchase_date ?? "");
    setImpact(null);
    setOpen(true);
  }

  function buildPayload() {
    return {
      business_id: businessId,
      name: name.trim().slice(0, 120),
      category,
      purchase_quantity: round4(quantityNumber),
      purchase_unit: unit,
      purchase_price_cents: priceCents,
      base_unit: previewBaseUnit,
      base_quantity: round4(toBaseQuantity(quantityNumber, unit)),
      unit_cost_cents: round4(previewUnitCost),
      supplier: supplier.trim().slice(0, 120) || null,
      purchase_date: purchaseDate || null,
    };
  }

  function validate() {
    if (!name.trim()) {
      toast.error("Informe o nome do insumo.");
      return false;
    }
    if (quantityNumber <= 0) {
      toast.error("Informe a quantidade comprada.");
      return false;
    }
    if (priceCents <= 0) {
      toast.error("Informe o preço pago.");
      return false;
    }
    return true;
  }

  async function requestSave() {
    if (!validate()) return;
    if (editing) {
      const changed =
        Number(editing.purchase_price_cents) !== priceCents ||
        Number(editing.purchase_quantity) !== round4(quantityNumber) ||
        editing.purchase_unit !== unit;
      if (changed) {
        const affected = await productsUsingIngredient(editing.id);
        if (affected.length) {
          setImpact(affected);
          return;
        }
      }
    }
    await persist();
  }

  async function persist() {
    setSaving(true);
    const payload = buildPayload();
    const result = editing
      ? await supabase.from("ingredients").update(payload).eq("id", editing.id)
      : await supabase.from("ingredients").insert(payload);

    if (result.error) {
      setSaving(false);
      toast.error("Não foi possível salvar o insumo.");
      return;
    }

    if (editing) {
      const affected = impact ?? (await productsUsingIngredient(editing.id));
      for (const product of affected) await recalculateProduct(product.id);
    }

    setSaving(false);
    setImpact(null);
    setOpen(false);
    toast.success(editing ? "Insumo atualizado." : "Insumo cadastrado.");
    await load();
  }

  async function remove(item: Ingredient) {
    const affected = await productsUsingIngredient(item.id);
    const warning = affected.length
      ? `Excluir ${item.name}? Ele é usado em ${affected.length} produto(s) e sairá dessas fichas técnicas.`
      : `Excluir ${item.name}?`;
    if (!window.confirm(warning)) return;
    const { error } = await supabase.from("ingredients").delete().eq("id", item.id);
    if (error) {
      toast.error("Não foi possível excluir o insumo.");
      return;
    }
    for (const product of affected) await recalculateProduct(product.id);
    toast.success("Insumo excluído.");
    await load();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Insumos"
        description="Ingredientes, embalagens e materiais que compõem o que você vende."
        actions={
          <Button variant="hero" onClick={startCreate}>
            <Plus />
            Novo insumo
          </Button>
        }
      />

      {ingredients.length ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_11rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou fornecedor"
              className="pl-9"
              aria-label="Buscar insumo"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger aria-label="Filtrar por categoria">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {Object.entries(ingredientCategories).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger aria-label="Filtrar por unidade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {purchaseUnits.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Carregando insumos...
        </div>
      ) : ingredients.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Você ainda não cadastrou nenhum insumo."
          description="Cadastre ingredientes, materiais ou mercadorias para calcular seus produtos automaticamente."
          action={
            <Button variant="hero" onClick={startCreate}>
              <Plus />
              Novo insumo
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Nenhum insumo encontrado com esses filtros.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-5 py-3">Insumo</th>
                  <th className="px-5 py-3">Quantidade</th>
                  <th className="px-5 py-3 text-right">Preço pago</th>
                  <th className="px-5 py-3 text-right">Custo unitário</th>
                  <th className="px-5 py-3 text-center">Produtos</th>
                  <th className="px-5 py-3">Atualizado</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className="border-b border-border/70 last:border-0">
                    <td className="px-5 py-4">
                      <span className="block font-semibold">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ingredientCategories[item.category as keyof typeof ingredientCategories] ??
                          "Outro"}
                        {item.supplier ? ` · ${item.supplier}` : ""}
                      </span>
                    </td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">
                      {formatQuantity(Number(item.purchase_quantity))} {item.purchase_unit}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums">
                      {formatBRLFromCents(item.purchase_price_cents)}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {formatUnitCost(Number(item.unit_cost_cents), item.base_unit)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-dark">
                        {usage[item.id] ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {new Date(item.updated_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => showForm(item)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir ${item.name}`}
                          onClick={() => remove(item)}
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
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar insumo" : "Novo insumo"}</DialogTitle>
            <DialogDescription>
              Informe como você compra este insumo para calcularmos o custo unitário.
            </DialogDescription>
          </DialogHeader>

          {impact ? (
            <div className="grid gap-3">
              <div className="rounded-xl bg-warning-soft p-4">
                <strong className="text-sm">
                  Este insumo afeta {impact.length} produto{impact.length > 1 ? "s" : ""}.
                </strong>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vamos atualizar o custo desses produtos. Os preços de venda continuam como estão.
                </p>
              </div>
              <ul className="grid gap-1.5 text-sm">
                {impact.map((product) => (
                  <li
                    key={product.id}
                    className="rounded-lg border border-border px-3 py-2 font-medium"
                  >
                    {product.name}
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setImpact(null)}>
                  Voltar
                </Button>
                <Button variant="hero" disabled={saving} onClick={persist}>
                  {saving ? "Atualizando..." : "Atualizar custos"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="ingredient-name">Nome</Label>
                  <Input
                    id="ingredient-name"
                    value={name}
                    maxLength={120}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex.: Chocolate meio amargo"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Categoria</Label>
                  <Select
                    value={category}
                    onValueChange={(value) =>
                      setCategory(value as keyof typeof ingredientCategories)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ingredientCategories).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="ingredient-quantity">Quantidade comprada</Label>
                    <Input
                      id="ingredient-quantity"
                      inputMode="decimal"
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(event.target.value.replace(/[^\d.,]/g, "").slice(0, 12))
                      }
                      placeholder="Ex.: 5"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Unidade</Label>
                    <Select value={unit} onValueChange={(value) => setUnit(value as PurchaseUnit)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {purchaseUnits.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ingredient-price">Preço pago</Label>
                  <CurrencyInput id="ingredient-price" value={price} onValueChange={setPrice} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="ingredient-supplier">Fornecedor (opcional)</Label>
                    <Input
                      id="ingredient-supplier"
                      value={supplier}
                      maxLength={120}
                      onChange={(event) => setSupplier(event.target.value)}
                      placeholder="Ex.: Distribuidora Central"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="ingredient-date">Data da compra (opcional)</Label>
                    <Input
                      id="ingredient-date"
                      type="date"
                      value={purchaseDate}
                      onChange={(event) => setPurchaseDate(event.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-primary-soft p-4">
                  <span className="text-sm font-semibold text-primary-dark">Custo por unidade</span>
                  <strong className="text-lg tabular-nums text-primary-dark">
                    {formatUnitCost(previewUnitCost, previewBaseUnit)}
                  </strong>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="hero" disabled={saving} onClick={requestSave}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
