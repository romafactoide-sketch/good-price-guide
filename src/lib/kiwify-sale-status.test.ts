import { describe, expect, it } from "vitest";
import { verifiedSaleStatus } from "./kiwify-sale-status";

describe("verified Kiwify sale status", () => {
  it("grants access only to paid sales", () => {
    expect(verifiedSaleStatus("paid", null)).toBe("paid");
    expect(verifiedSaleStatus("waiting_payment", null)).toBeNull();
    expect(verifiedSaleStatus("refused", null)).toBeNull();
  });

  it("reverses refunded and charged back sales", () => {
    expect(verifiedSaleStatus("refunded", null)).toBe("refunded");
    expect(verifiedSaleStatus("chargedback", null)).toBe("refunded");
    expect(verifiedSaleStatus("paid", "2026-09-29T00:00:00Z")).toBe("refunded");
  });
});
