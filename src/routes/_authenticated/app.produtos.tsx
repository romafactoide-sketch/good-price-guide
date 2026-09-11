import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Package, Pencil, Plus, Trash2, X } from "lucide-react";
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
import { PercentageInput } from "@/components/ui/percentage-input";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  compositionCost,
  directCostKinds,
  productCategories,
  productStatuses,
  productTotals,
  round4,
  type Ingredient,
  type Product,
} from "@/lib/catalog";
import { centsToCurrencyText, currencyTextToCents, formatBRLFromCents } from "@/lib/money";
import {
  areUnitsCompatible,
  compatibleUnits,
  formatQuantity,
  isPurchaseUnit,
  parseDecimal,
  type PurchaseUnit,
} from "@/lib/units";
import { ensureWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/_authenticated/app/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — PreçoSadio" },
      {
        name: "description",
        content:
          "Monte a ficha técnica dos seus produtos, some ingredientes e custos diretos e veja o custo ajustado pelas perdas.",
      },
      { property: "og:title", content: "Produtos — PreçoSadio" },
      {
        property: "og:description",
        content: "Ficha técnica, composição e perdas dos seus produtos em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

type CompositionLine = { ingredientId: string; quantity: string; unit: PurchaseUnit };
type ExtraLine = { name: string; kind: keyof typeof directCostKinds; amount: string };

const emptyComposition = (): CompositionLine => ({
  ingredientId: "",
  quantity: "",
  unit: "g",
});

function ProductsPage() {
  const [businessId, setBusinessId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<keyof typeof productCategories>("product");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [margin, setMargin] = useState("");
  const [waste, setWaste] = useState("");
  const [status, setStatus] = useState<keyof typeof productStatuses>("active");
  const [lines, setLines] = useState<CompositionLine[]>([emptyComposition()]);
  const [extras, setExtras] = useState<ExtraLine[]>([]);

  async function load() {
    const business = await ensureWorkspace();
    setBusinessId(business.id);
    const [productsResult, ingredientsResult] = await Promise.all([
      supabase.from("products").select("*").eq("business_id", business.id).order("name"),
      supabase.from("ingredients").select("*").eq("business_id", business.id).order("name"),
    ]);
    setLoading(false);
    if (productsResult.error || ingredientsResult.error) {
      toast.error("Não foi possível carregar seus produtos.");
      return;
    }
    setProducts(productsResult.data);
    setIngredients(ingredientsResult.data);
  }

  useEffect(() => {
    load();
  }, []);

  const ingredientsById = useMemo(
    () => new Map(ingredients.map((item) => [item.id, item])),
    [ingredients],
  );

  const ingredientCostCents = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const ingredient = ingredientsById.get(line.ingredientId);
        if (!ingredient) return sum;
        return sum + compositionCost(ingredient, parseDecimal(line.quantity), line.unit);
      }, 0),
    [lines, ingredientsById],
  );

  const extrasCostCents = useMemo(
    () => extras.reduce((sum, extra) => sum + currencyTextToCents(extra.amount), 0),
    [extras],
  );

  const wasteNumber = Math.min(parseDecimal(waste), 99.99);
  const totals = productTotals(ingredientCostCents, extrasCostCents, wasteNumber);

  async function showForm(product?: Product) {
    setEditing(product ?? null);
    setStep(1);
    setName(product?.name ?? "");
    setCategory((product?.category as keyof typeof productCategories) ?? "product");
    setDescription(product?.description ?? "");
    setPrice(centsToCurrencyText(product?.current_price_cents));
    setMargin(product ? formatQuantity(Number(product.target_margin)) : "");
    setWaste(product ? formatQuantity(Number(product.waste_percentage)) : "");
    setStatus((product?.status as keyof typeof productStatuses) ?? "active");
    setLines([emptyComposition()]);
    setExtras([]);
    setOpen(true);

    if (product) {
      const [composition, directCosts] = await Promise.all([
        supabase
          .from("product_ingredients")
          .select("ingredient_id,quantity_used,unit_used")
          .eq("product_id", product.id),
        supabase
          .from("product_direct_costs")
          .select("name,kind,amount_cents")
          .eq("product_id", product.id),
      ]);
      const loadedLines = (composition.data ?? []).map((line) => ({
        ingredientId: line.ingredient_id,
        quantity: formatQuantity(Number(line.quantity_used)),
        unit: (isPurchaseUnit(line.unit_used) ? line.unit_used : "g") as PurchaseUnit,
      }));
      setLines(loadedLines.length ? loadedLines : [emptyComposition()]);
      setExtras(
        (directCosts.data ?? []).map((extra) => ({
          name: extra.name,
          kind: extra.kind as keyof typeof directCostKinds,
          amount: centsToCurrencyText(extra.amount_cents),
        })),
      );
    }
  }

  function updateLine(index: number, patch: Partial<CompositionLine>) {
    setLines((current) =>
      current.map((line, position) => (position === index ? { ...line, ...patch } : line)),
    );
  }

  function pickIngredient(index: number, ingredientId: string) {
    const ingredient = ingredientsById.get(ingredientId);
    const allowed = ingredient ? compatibleUnits(ingredient.base_unit) : [];
    updateLine(index, {
      ingredientId,
      unit: (allowed[0] ?? "unidade") as PurchaseUnit,
    });
  }

  function stepOneValid() {
    if (!name.trim()) {
      toast.error("Informe o nome do produto.");
      return false;
    }
    return true;
  }

  function stepTwoValid() {
    for (const line of lines) {
      if (!line.ingredientId) continue;
      const ingredient = ingredientsById.get(line.ingredientId);
      if (!ingredient) continue;
      if (!isPurchaseUnit(ingredient.purchase_unit)) continue;
      if (!areUnitsCompatible(line.unit, ingredient.purchase_unit)) {
        toast.error(`A unidade escolhida não combina com a compra de ${ingredient.name}.`);
        return false;
      }
      if (parseDecimal(line.quantity) <= 0) {
        toast.error(`Informe a quantidade usada de ${ingredient.name}.`);
        return false;
      }
    }
    return true;
  }

  async function save() {
    if (!stepOneValid() || !stepTwoValid()) return;
    if (parseDecimal(waste) >= 100) {
      toast.error("A perda precisa ser menor que 100%.");
      return;
    }
    setSaving(true);

    const payload = {
      business_id: businessId,
      name: name.trim().slice(0, 120),
      category,
      description: description.trim().slice(0, 500),
      current_price_cents: currencyTextToCents(price),
      target_margin: Math.min(parseDecimal(margin), 100),
      waste_percentage: wasteNumber,
      status,
      direct_cost_cents: round4(totals.directCostCents),
      waste_cost_cents: round4(totals.wasteCostCents),
      adjusted_cost_cents: round4(totals.adjustedCostCents),
    };

    let productId = editing?.id ?? "";
    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) {
        setSaving(false);
        toast.error("Não foi possível salvar o produto.");
        return;
      }
      await Promise.all([
        supabase.from("product_ingredients").delete().eq("product_id", editing.id),
        supabase.from("product_direct_costs").delete().eq("product_id", editing.id),
      ]);
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error || !data) {
        setSaving(false);
        toast.error("Não foi possível salvar o produto.");
        return;
      }
      productId = data.id;
    }

    const compositionRows = lines
      .filter((line) => line.ingredientId && parseDecimal(line.quantity) > 0)
      .map((line) => {
        const ingredient = ingredientsById.get(line.ingredientId)!;
        return {
          product_id: productId,
          ingredient_id: line.ingredientId,
          quantity_used: round4(parseDecimal(line.quantity)),
          unit_used: line.unit,
          calculated_cost_cents: round4(
            compositionCost(ingredient, parseDecimal(line.quantity), line.unit),
          ),
        };
      });

    const extraRows = extras
      .filter((extra) => extra.name.trim())
      .map((extra) => ({
        product_id: productId,
        name: extra.name.trim().slice(0, 120),
        kind: extra.kind,
        amount_cents: currencyTextToCents(extra.amount),
      }));

    if (compositionRows.length) await supabase.from("product_ingredients").insert(compositionRows);
    if (extraRows.length) await supabase.from("product_direct_costs").insert(extraRows);

    setSaving(false);
    setOpen(false);
    toast.success(editing ? "Produto atualizado." : "Produto cadastrado.");
    await load();
  }

  async function remove(product: Product) {
    if (!window.confirm(`Excluir ${product.name}? A ficha técnica também será removida.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      toast.error("Não foi possível excluir o produto.");
      return;
    }
    toast.success("Produto excluído.");
    await load();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Produtos"
        description="Ficha técnica, composição e perdas de cada produto ou serviço."
        actions={
          <Button variant="hero" onClick={() => showForm()}>
            <Plus />
            Novo produto
          </Button>
        }
      />

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Carregando produtos...
        </div>
      ) : ingredients.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Você ainda não cadastrou nenhum insumo."
          description="Cadastre ingredientes, materiais ou mercadorias para calcular seus produtos automaticamente."
          action={
            <Button variant="hero" asChild>
              <Link to="/app/insumos">Cadastrar insumos</Link>
            </Button>
          }
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto cadastrado ainda."
          description="Crie seu primeiro produto e monte a ficha técnica com os insumos que você já cadastrou."
          action={
            <Button variant="hero" onClick={() => showForm()}>
              <Plus />
              Novo produto
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="grid gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-foreground">{product.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {productCategories[product.category as keyof typeof productCategories]} ·{" "}
                    {productStatuses[product.status as keyof typeof productStatuses]}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${product.name}`}
                    onClick={() => showForm(product)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${product.name}`}
                    onClick={() => remove(product)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <dl className="grid gap-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Preço atual</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatBRLFromCents(product.current_price_cents)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Custo antes das perdas</dt>
                  <dd className="tabular-nums">
                    {formatBRLFromCents(Math.round(Number(product.direct_cost_cents)))}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Perda ({Number(product.waste_percentage)}%)</dt>
                  <dd className="tabular-nums">
                    {formatBRLFromCents(Math.round(Number(product.waste_cost_cents)))}
                  </dd>
                </div>
                <div className="mt-1 flex justify-between border-t border-border pt-2">
                  <dt className="font-semibold">Custo direto ajustado</dt>
                  <dd className="font-semibold tabular-nums text-primary-dark">
                    {formatBRLFromCents(Math.round(Number(product.adjusted_cost_cents)))}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              {step === 1
                ? "Comece pelas informações básicas do produto."
                : step === 2
                  ? "O que este produto utiliza?"
                  : "Custos diretos extras e perda na produção."}
            </DialogDescription>
          </DialogHeader>

          <ProgressBar value={(step / 3) * 100} />

          {step === 1 ? (
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="product-name">Nome</Label>
                <Input
                  id="product-name"
                  value={name}
                  maxLength={120}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Bolo de chocolate"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Categoria</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => setCategory(value as keyof typeof productCategories)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(productCategories).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Situação</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as keyof typeof productStatuses)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(productStatuses).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="product-description">Descrição (opcional)</Label>
                <Textarea
                  id="product-description"
                  value={description}
                  maxLength={500}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Como você descreve este produto para o cliente?"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="product-price">Preço atual</Label>
                  <CurrencyInput id="product-price" value={price} onValueChange={setPrice} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="product-margin">Margem desejada</Label>
                  <PercentageInput id="product-margin" value={margin} onValueChange={setMargin} />
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="grid gap-4">
              {lines.map((line, index) => {
                const ingredient = ingredientsById.get(line.ingredientId);
                const allowed = ingredient
                  ? compatibleUnits(ingredient.base_unit)
                  : (["unidade"] as PurchaseUnit[]);
                const cost = ingredient
                  ? compositionCost(ingredient, parseDecimal(line.quantity), line.unit)
                  : 0;
                return (
                  <div
                    key={index}
                    className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_6rem_6rem_auto] sm:items-end"
                  >
                    <div className="grid gap-1.5">
                      <Label>Insumo</Label>
                      <Select
                        value={line.ingredientId}
                        onValueChange={(value) => pickIngredient(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Quantidade</Label>
                      <Input
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(index, {
                            quantity: event.target.value.replace(/[^\d.,]/g, "").slice(0, 12),
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Unidade</Label>
                      <Select
                        value={line.unit}
                        onValueChange={(value) => updateLine(index, { unit: value as PurchaseUnit })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allowed.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <strong className="text-sm tabular-nums">
                        {formatBRLFromCents(Math.round(cost))}
                      </strong>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remover insumo"
                        onClick={() =>
                          setLines((current) =>
                            current.length === 1
                              ? [emptyComposition()]
                              : current.filter((_, position) => position !== index),
                          )
                        }
                      >
                        <X />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <Button
                variant="soft"
                onClick={() => setLines((current) => [...current, emptyComposition()])}
              >
                <Plus />
                Adicionar insumo
              </Button>
              <div className="flex items-center justify-between rounded-xl bg-primary-soft p-4 text-primary-dark">
                <span className="text-sm font-semibold">Custo dos insumos</span>
                <strong className="tabular-nums">
                  {formatBRLFromCents(Math.round(ingredientCostCents))}
                </strong>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {extras.map((extra, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_11rem_9rem_auto] sm:items-end"
                >
                  <div className="grid gap-1.5">
                    <Label>Nome</Label>
                    <Input
                      value={extra.name}
                      maxLength={120}
                      onChange={(event) =>
                        setExtras((current) =>
                          current.map((item, position) =>
                            position === index ? { ...item, name: event.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Ex.: Caixa de papelão"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Tipo</Label>
                    <Select
                      value={extra.kind}
                      onValueChange={(value) =>
                        setExtras((current) =>
                          current.map((item, position) =>
                            position === index
                              ? { ...item, kind: value as keyof typeof directCostKinds }
                              : item,
                          ),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(directCostKinds).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Valor</Label>
                    <CurrencyInput
                      value={extra.amount}
                      onValueChange={(value) =>
                        setExtras((current) =>
                          current.map((item, position) =>
                            position === index ? { ...item, amount: value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover custo"
                    onClick={() =>
                      setExtras((current) => current.filter((_, position) => position !== index))
                    }
                  >
                    <X />
                  </Button>
                </div>
              ))}
              <Button
                variant="soft"
                onClick={() =>
                  setExtras((current) => [...current, { name: "", kind: "packaging", amount: "" }])
                }
              >
                <Plus />
                Adicionar custo direto
              </Button>

              <div className="grid gap-1.5">
                <Label htmlFor="product-waste">Perda na produção</Label>
                <PercentageInput id="product-waste" value={waste} onValueChange={setWaste} />
                <p className="text-xs text-muted-foreground">
                  Exemplo: 5% de perda em receitas, quebras ou sobras.
                </p>
              </div>

              <dl className="grid gap-2 rounded-xl bg-primary-soft p-4 text-sm text-primary-dark">
                <div className="flex justify-between">
                  <dt>Custo direto antes das perdas</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatBRLFromCents(Math.round(totals.directCostCents))}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Perda estimada</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatBRLFromCents(Math.round(totals.wasteCostCents))}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-primary/20 pt-2">
                  <dt className="font-semibold">Custo direto ajustado</dt>
                  <dd className="text-base font-bold tabular-nums">
                    {formatBRLFromCents(Math.round(totals.adjustedCostCents))}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <DialogFooter>
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            )}
            {step < 3 ? (
              <Button
                variant="hero"
                onClick={() => {
                  if (step === 1 && !stepOneValid()) return;
                  if (step === 2 && !stepTwoValid()) return;
                  setStep(step + 1);
                }}
              >
                Continuar
              </Button>
            ) : (
              <Button variant="hero" disabled={saving} onClick={save}>
                {saving ? "Salvando..." : "Salvar produto"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
