/** Only a settled sale may change access; values must come from the Kiwify sale API. */
export function verifiedSaleStatus(
  status: unknown,
  refundedAt: unknown,
): "paid" | "refunded" | null {
  if (status === "refunded" || status === "chargedback" || refundedAt) return "refunded";
  return status === "paid" ? "paid" : null;
}
