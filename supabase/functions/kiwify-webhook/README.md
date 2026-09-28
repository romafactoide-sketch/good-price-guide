# Kiwify webhook

Deploy this Supabase Edge Function with JWT verification **disabled** because Kiwify cannot send a Supabase user JWT. Configure `KIWIFY_CLIENT_ID`, `KIWIFY_CLIENT_SECRET`, `KIWIFY_ACCOUNT_ID` and a random 32+ character `KIWIFY_WEBHOOK_PATH_SECRET` as Supabase Edge Function secrets. Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` at runtime. Apply both subscription migrations before deploying.

Use `https://<project-ref>.supabase.co/functions/v1/kiwify-webhook?key=<KIWIFY_WEBHOOK_PATH_SECRET>` as the destination URL in Kiwify. Do not expose this URL in frontend code, logs, or a public issue. Configure events for approved purchase, renewed subscription, refund, chargeback, canceled subscription and late subscription. The endpoint independently looks up the sale's current state in Kiwify's producer API. It currently grants a plan only for an exact BRL amount and known product. Unknown formats fail closed. It cannot infer cancellation or lateness solely from a paid sale; those events require separate subscription verification after a real sample and are not processed yet.

The buyer must already have a PreçoSadio account with the same email as the Kiwify purchase. Missing or ambiguous accounts result in a retryable error; reconcile these manually. Never send API secrets in chat or commit them to GitHub.

Before enabling checkout, inspect a Kiwify test webhook and a real sale response (redact buyer details) to confirm `order_id`, amount, currency, email, product and status. Verify replay, refund, monthly, annual and lifetime flows and two-user isolation. The screenshot's Kiwify Token field is not used for authorization here because its delivery semantics are undocumented; rotate any token shown in a screenshot.
