import { createClient } from "npm:@supabase/supabase-js@2";

// This function is intentionally fail-closed: sale and buyer are checked against
// Kiwify's authenticated API, not trusted from the webhook body.
const offers = [
  { product: "a7c0d800-babb-11f1-b862-8f9991c1f93d", amount: 2990, cycle: "monthly" },
  { product: "a7c0d800-babb-11f1-b862-8f9991c1f93d", amount: 24700, cycle: "yearly" },
  { product: "7e73c3d0-babc-11f1-845f-f15309390953", amount: 34700, cycle: "lifetime" },
] as const;

type RecordValue = Record<string, unknown>;
function object(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : {};
}
function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
function response(status: number, message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

let cachedToken: { token: string; expires: number } | undefined;
async function apiToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.token;
  const result = await fetch("https://public-api.kiwify.com/v1/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: required("KIWIFY_CLIENT_ID"),
      client_secret: required("KIWIFY_CLIENT_SECRET"),
    }),
  });
  if (!result.ok) throw new Error(`Kiwify OAuth HTTP ${result.status}`);
  const body = object(await result.json());
  if (typeof body.access_token !== "string") throw new Error("Kiwify OAuth response invalid");
  cachedToken = {
    token: body.access_token,
    expires: Date.now() + Math.min(Number(body.expires_in) || 3600, 3600) * 1000,
  };
  return cachedToken.token;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return response(405, "method not allowed");
  try {
    // Kiwify's public producer docs do not specify a verifiable delivery signature.
    // A separate long random URL secret limits unsolicited requests; sale API is authoritative.
    const expected = required("KIWIFY_WEBHOOK_PATH_SECRET");
    const supplied = new URL(request.url).searchParams.get("key") ?? "";
    if (expected.length < 32 || supplied.length !== expected.length)
      return response(401, "unauthorized");
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++)
      mismatch |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
    if (mismatch !== 0) return response(401, "unauthorized");
    if (Number(request.headers.get("content-length")) > 65536) return response(413, "too large");

    const event = object(await request.json());
    const orderId = event.order_id;
    if (typeof orderId !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(orderId))
      return response(400, "invalid order");

    const saleResult = await fetch(
      `https://public-api.kiwify.com/v1/sales/${encodeURIComponent(orderId)}`,
      {
        headers: {
          Authorization: `Bearer ${await apiToken()}`,
          "x-kiwify-account-id": required("KIWIFY_ACCOUNT_ID"),
        },
      },
    );
    if (!saleResult.ok) throw new Error(`Kiwify sale lookup HTTP ${saleResult.status}`);
    const sale = object(await saleResult.json());
    const payment = object(sale.payment);
    const customer = object(sale.customer);
    const product = object(sale.product);
    const amount = payment.charge_amount;
    const offer = offers.find((item) => item.product === product.id && item.amount === amount);
    if (
      sale.id !== orderId ||
      !offer ||
      payment.charge_currency !== "BRL" ||
      typeof customer.email !== "string" ||
      !customer.email.includes("@") ||
      typeof sale.approved_date !== "string" ||
      !Number.isFinite(Date.parse(sale.approved_date))
    ) {
      return response(422, "sale does not match an offer");
    }
    const status =
      sale.status === "paid" && !sale.refunded_at
        ? "paid"
        : sale.status === "refunded" || sale.refunded_at
          ? "refunded"
          : null;
    if (!status) return response(202, "sale not settled");

    const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.rpc("apply_verified_kiwify_sale", {
      p_order_id: orderId,
      p_email: customer.email,
      p_product_id: offer.product,
      p_cycle: offer.cycle,
      p_status: status,
      p_approved_at: sale.approved_date,
    });
    if (error) throw error;
    return response(200, String(data));
  } catch (error) {
    console.error("Kiwify webhook error", error instanceof Error ? error.message : "unknown");
    return response(500, "processing failed");
  }
});
