/** Unidades de compra e uso suportadas pelo PreçoSadio. */
export const purchaseUnits = [
  "g",
  "kg",
  "ml",
  "L",
  "unidade",
  "metro",
  "cm",
  "pacote",
  "caixa",
  "outro",
] as const;

export type PurchaseUnit = (typeof purchaseUnits)[number];

/** Cada unidade aponta para sua unidade-base e o fator de conversão. */
const unitBase: Record<PurchaseUnit, { base: string; factor: number }> = {
  g: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  ml: { base: "ml", factor: 1 },
  L: { base: "ml", factor: 1000 },
  metro: { base: "cm", factor: 100 },
  cm: { base: "cm", factor: 1 },
  unidade: { base: "unidade", factor: 1 },
  pacote: { base: "pacote", factor: 1 },
  caixa: { base: "caixa", factor: 1 },
  outro: { base: "outro", factor: 1 },
};

export const isPurchaseUnit = (value: string): value is PurchaseUnit =>
  (purchaseUnits as readonly string[]).includes(value);

export const baseUnitOf = (unit: PurchaseUnit) => unitBase[unit].base;

/** Converte uma quantidade para a unidade-base da mesma família. */
export const toBaseQuantity = (quantity: number, unit: PurchaseUnit) =>
  quantity * unitBase[unit].factor;

/** Unidades que podem ser usadas quando o insumo tem determinada unidade-base. */
export const compatibleUnits = (base: string) =>
  purchaseUnits.filter((unit) => unitBase[unit].base === base);

export const areUnitsCompatible = (a: PurchaseUnit, b: PurchaseUnit) =>
  unitBase[a].base === unitBase[b].base;

/** Custo por unidade-base, em centavos, com frações preservadas. */
export const unitCostCents = (
  purchasePriceCents: number,
  purchaseQuantity: number,
  unit: PurchaseUnit,
) => {
  const base = toBaseQuantity(purchaseQuantity, unit);
  if (!base) return 0;
  return purchasePriceCents / base;
};

/** Custo de uma quantidade utilizada, em centavos. */
export const usageCostCents = (
  unitCost: number,
  quantityUsed: number,
  unitUsed: PurchaseUnit,
) => unitCost * toBaseQuantity(quantityUsed, unitUsed);

/** Aceita "1.234,5678" ou "1234.5678" e devolve número. */
export const parseDecimal = (value: string) => {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const formatQuantity = (quantity: number) =>
  quantity.toLocaleString("pt-BR", { maximumFractionDigits: 4 });

/** Custo unitário legível, ex.: "R$ 0,0215/g". */
export const formatUnitCost = (unitCost: number, baseUnit: string) =>
  `${(unitCost / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })}/${baseUnit}`;

/**
 * Aplica a perda de produção pela fórmula de rendimento.
 * custo ajustado = custo direto / (1 - perda)
 */
export const applyWaste = (directCostCents: number, wastePercentage: number) => {
  const waste = Math.min(Math.max(wastePercentage, 0), 99.99) / 100;
  const adjusted = directCostCents / (1 - waste);
  return {
    directCostCents,
    adjustedCostCents: adjusted,
    wasteCostCents: adjusted - directCostCents,
  };
};
