import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handle } from "./kiwify-webhook";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc } }));

const orderId = "aaad59ef-2120-4c4f-840e-1a19d10b67f4";
const email = "comprador@example.com";
const monthly = "a7c0d800-babb-11f1-b862-8f9991c1f93d";
const lifetime = "7e73c3d0-babc-11f1-845f-f15309390953";

function event(id = orderId, eventType?: string) {
  return new Request("https://example.com/api/public/kiwify-webhook?key=" + "x".repeat(40), {
    method: "POST",
    body: JSON.stringify({ order: { order_id: id, webhook_event_type: eventType } }),
  });
}

function sale(productId: string, amount: number, status = "paid") {
  return {
    id: orderId,
    product: { id: productId },
    payment: { charge_amount: amount, product_base_currency: "BRL" },
    currency: "BRL",
    customer: { email },
    status,
    approved_date: "2026-09-29T00:22:00.000Z",
    refunded_at: null,
  };
}

function apiReturns(value: ReturnType<typeof sale>) {
  const fetchMock = vi.fn(
    async (url: string) =>
      new Response(
        JSON.stringify(url.endsWith("/oauth/token") ? { access_token: "test-token" } : value),
        {
          status: 200,
        },
      ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("KIWIFY_WEBHOOK_PATH_SECRET", "x".repeat(40));
  vi.stubEnv("KIWIFY_CLIENT_ID", "test-client");
  vi.stubEnv("KIWIFY_CLIENT_SECRET", "test-secret");
  vi.stubEnv("KIWIFY_ACCOUNT_ID", "test-account");
  rpc.mockReset().mockResolvedValue({ data: "applied", error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Kiwify webhook with simulated API and database", () => {
  it("rejects requests without the secret before contacting Kiwify", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://example.com/api/public/kiwify-webhook", {
      method: "POST",
      body: JSON.stringify({ order: { order_id: orderId } }),
    });
    expect((await handle(request)).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    [monthly, 2900, "monthly"],
    [monthly, 24700, "yearly"],
    [lifetime, 34700, "lifetime"],
  ])("accepts a verified paid offer (%s, %i)", async (product, amount, cycle) => {
    const fetchMock = apiReturns(sale(product, amount));
    const result = await handle(event());
    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledWith("apply_verified_kiwify_sale", {
      p_order_id: orderId,
      p_email: email,
      p_product_id: product,
      p_cycle: cycle,
      p_status: "paid",
      p_approved_at: "2026-09-29T00:22:00.000Z",
    });
  });

  it("rejects a mismatched amount before writing to the database", async () => {
    apiReturns(sale(monthly, 2890));
    expect((await handle(event())).status).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("reverses a confirmed refund", async () => {
    apiReturns(sale(monthly, 2900, "refunded"));
    expect((await handle(event())).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "apply_verified_kiwify_sale",
      expect.objectContaining({ p_status: "refunded" }),
    );
  });

  it("accepts a new paid order on renewal", async () => {
    const renewalId = "cccd59ef-2120-4c4f-840e-1a19d10b67f4";
    apiReturns({ ...sale(monthly, 2900), id: renewalId });
    expect((await handle(event(renewalId, "subscription_renewed"))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "apply_verified_kiwify_sale",
      expect.objectContaining({ p_order_id: renewalId, p_status: "paid", p_cycle: "monthly" }),
    );
  });

  it("does not revoke a paid period just because renewal was canceled", async () => {
    apiReturns(sale(monthly, 2900));
    rpc.mockResolvedValue({ data: "duplicate", error: null });
    expect((await handle(event(orderId, "subscription_canceled"))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "apply_verified_kiwify_sale",
      expect.objectContaining({ p_status: "paid" }),
    );
  });

  it("acknowledges repeated notifications reported as duplicate by the database", async () => {
    apiReturns(sale(monthly, 2900));
    rpc.mockResolvedValue({ data: "duplicate", error: null });
    const result = await handle(event());
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ message: "duplicate" });
  });
});
