import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  applyWaste,
  isPurchaseUnit,
  usageCostCents,
  type PurchaseUnit,
} from "@/lib/units";

export type Ingredient = Tables<"ingredients">;
export type Product = Tables<"products">;
export type ProductIngredient = Tables<"product_ingredients">;
export type ProductDirectCost = Tables<"product_direct_costs">;

export const ingredientCategories = {
  ingredient: "Ingrediente",
  packaging: "Embalagem",
  material: "Material",
  merchandise: "Mercadoria",
  other: "Outro",
} as const;

export const productCategories = {
  product: "Produto",
  service: "Serviço",
  other: "Outro",
} as const;

export const directCostKinds = {
  packaging: "Embalagem",
  material: "Material adicional",
  other: "Outro custo direto",
} as const;

export const productStatuses = {
  draft: "Rascunho",
  active: "Ativo",
  archived: "Arquivado",
} as const;

const asUnit = (value: string): PurchaseUnit => (isPurchaseUnit(value) ? value : "unidade");

/** Custo de uma linha da ficha técnica, em centavos. */
export function compositionCost(ingredient: Ingredient, quantityUsed: number, unitUsed: string) {
  return usageCostCents(Number(ingredient.unit_cost_cents), quantityUsed, asUnit(unitUsed));
}

/** Totais da ficha técnica: antes das perdas, perda estimada e custo ajustado. */
export function productTotals(
  ingredientCostCents: number,
  directCostsCents: number,
  wastePercentage: number,
) {
  return applyWaste(ingredientCostCents + directCostsCents, wastePercentage);
}

/**
 * Recalcula os custos gravados de um produto a partir da composição
 * e dos custos diretos atualmente persistidos.
 */
export async function recalculateProduct(productId: string) {
  const [{ data: product }, { data: lines }, { data: extras }] = await Promise.all([
    supabase.from("products").select("id,waste_percentage").eq("id", productId).maybeSingle(),
    supabase
      .from("product_ingredients")
      .select("id,quantity_used,unit_used,ingredient_id,ingredients(unit_cost_cents,base_unit)")
      .eq("product_id", productId),
    supabase.from("product_direct_costs").select("amount_cents").eq("product_id", productId),
  ]);

  if (!product) return;

  let ingredientCost = 0;
  for (const line of lines ?? []) {
    const unitCost = Number(
      (line as { ingredients: { unit_cost_cents: number } | null }).ingredients?.unit_cost_cents ??
        0,
    );
    const cost = usageCostCents(unitCost, Number(line.quantity_used), asUnit(line.unit_used));
    ingredientCost += cost;
    await supabase
      .from("product_ingredients")
      .update({ calculated_cost_cents: round4(cost) })
      .eq("id", line.id);
  }

  const extrasCost = (extras ?? []).reduce((sum, item) => sum + Number(item.amount_cents), 0);
  const totals = productTotals(ingredientCost, extrasCost, Number(product.waste_percentage));

  await supabase
    .from("products")
    .update({
      direct_cost_cents: round4(totals.directCostCents),
      waste_cost_cents: round4(totals.wasteCostCents),
      adjusted_cost_cents: round4(totals.adjustedCostCents),
    })
    .eq("id", productId);
}

/** Produtos que utilizam determinado insumo. */
export async function productsUsingIngredient(ingredientId: string) {
  const { data } = await supabase
    .from("product_ingredients")
    .select("product_id,products(id,name)")
    .eq("ingredient_id", ingredientId);

  const unique = new Map<string, string>();
  for (const row of data ?? []) {
    const product = (row as { products: { id: string; name: string } | null }).products;
    if (product) unique.set(product.id, product.name);
  }
  return [...unique].map(([id, name]) => ({ id, name }));
}

export const round4 = (value: number) => Math.round(value * 10000) / 10000;
