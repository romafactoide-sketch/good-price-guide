export const formatBRLFromCents = (cents: number | null | undefined) =>
  ((cents ?? 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const currencyTextToCents = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits ? Number.parseInt(digits, 10) : 0;
};

export const centsToCurrencyText = (cents: number | null | undefined) =>
  cents ? (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "";
