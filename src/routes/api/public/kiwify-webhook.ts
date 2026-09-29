import { createFileRoute } from "@tanstack/react-router";

// Webhook público (sem JWT): a Kiwify não envia sessão de usuário.
// Fail-closed: a venda é conferida na API oficial da Kiwify antes de conceder o Pro.
const offers = [
  // Mensal: R$ 29,00 é a venda já aprovada; R$ 29,90 é o preço planejado das próximas.
  { product: "a7c0d800-babb-11f1-b862-8f9991c1f93d", amounts: [2900, 2990], cycle: "monthly" },
  { product: "a7c0d800-babb-11f1-b862-8f9991c1f93d", amounts: [24700], cycle: "yearly" },
  { product: "7e73c3d0-babc-11f1-845f-f15309390953", amounts: [34700], cycle: "lifetime" },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecordValue = { [key: string]: any } & {
  order_id?: unknown;
  id?: unknown;
  status?: unknown;
  refunded_at?: unknown;
  approved_date?: unknown;
  payment?: unknown;
  customer?: unknown;
  product?: unknown;
  charge_amount?: unknown;
  charge_currency?: unknown;
  email?: unknown;
  access_token?: unknown;
};
function object(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : {};
}
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
function response(status: number, message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function apiToken(): Promise<string> {
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
  return body.access_token;
}

async function handle(request: Request): Promise<Response> {
  let step = "auth";
  try {
    const expected = required("KIWIFY_WEBHOOK_PATH_SECRET");
    const supplied = new URL(request.url).searchParams.get("key") ?? "";
    if (expected.length < 32 || supplied.length !== expected.length)
      return response(401, "unauthorized");
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++)
      mismatch |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
    if (mismatch !== 0) return response(401, "unauthorized");

    const raw = await request.text();
    if (raw.length > 65536) return response(413, "too large");
    let event: RecordValue;
    try {
      event = object(JSON.parse(raw));
    } catch {
      return response(400, "invalid json");
    }
    // Webhook real da Kiwify: { order: { order_id, ... } }. Só o ID é usado; o resto vem da API.
    const orderId = object(event["order"]).order_id ?? event.order_id;
    if (typeof orderId !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(orderId))
      return response(400, "invalid order");

    const saleResult = await fetch(
      `https://public-api.kiwify.com/v1/sales/${encodeURIComponent(orderId)}`,
      {
        headers: {
          Authorization: `Bearer ${await (step = "oauth", apiToken())}`,
          "x-kiwify-account-id": required("KIWIFY_ACCOUNT_ID"),
        },
      },
    );
    step = "sale_lookup";
    if (!saleResult.ok) throw new Error(`Kiwify sale lookup HTTP ${saleResult.status}`);
    step = "validation";
    const sale = object(await saleResult.json());
    const payment = object(sale.payment);
    const customer = object(sale.customer);
    const product = object(sale.product);
    // Valor bruto da oferta, em centavos: payment.charge_amount (fallback: product_base_price).
    const amount = payment["charge_amount"] ?? payment["product_base_price"];
    const offer = offers.find(
      (item) => item.product === product.id && (item.amounts as readonly number[]).includes(amount),
    );
    if (
      sale.id !== orderId ||
      !offer ||
      sale["currency"] !== "BRL" ||
      payment["product_base_currency"] !== "BRL" ||
      typeof customer.email !== "string" ||
      !customer.email.includes("@") ||
      typeof sale.approved_date !== "string" ||
      !Number.isFinite(Date.parse(sale.approved_date))
    ) {
      console.warn("Kiwify sale rejected", {
        idMatches: sale.id === orderId,
        productKnown: offers.some((item) => item.product === product.id),
        amount: typeof amount === "number" ? amount : null,
        currency: typeof sale["currency"] === "string" ? sale["currency"] : null,
      });
      return response(422, "sale does not match an offer");
    }
    const status =
      sale.status === "paid" && !sale.refunded_at
        ? "paid"
        : sale.status === "refunded" || sale.refunded_at
          ? "refunded"
          : null;
    if (!status) return response(202, "sale not settled");

    step = "database";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("apply_verified_kiwify_sale", {
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
    const e = object(error);
    console.error("Kiwify webhook error", {
      step,
      name: typeof e["name"] === "string" ? e["name"] : typeof error,
      code: typeof e["code"] === "string" ? e["code"] : null,
      message: typeof e["message"] === "string" ? e["message"].slice(0, 200) : String(error).slice(0, 200),
      hint: typeof e["hint"] === "string" ? e["hint"].slice(0, 200) : null,
    });
    return response(500, "processing failed");
  }
}

export const Route = createFileRoute("/api/public/kiwify-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
      GET: async () => response(405, "method not allowed"),
    },
  },
});
