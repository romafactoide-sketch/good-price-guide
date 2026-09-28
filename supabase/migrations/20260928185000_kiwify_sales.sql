-- Only the service role may apply verified Kiwify sales. Each order is used once.
CREATE TABLE public.kiwify_sales (
  order_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  sale_status text NOT NULL CHECK (sale_status IN ('paid', 'refunded')),
  approved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kiwify_sales ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kiwify_sales FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.kiwify_sales TO service_role;

CREATE OR REPLACE FUNCTION public.apply_verified_kiwify_sale(
  p_order_id text, p_email text, p_product_id text, p_cycle text,
  p_status text, p_approved_at timestamptz
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_count integer;
  v_previous public.kiwify_sales%ROWTYPE;
  v_active public.kiwify_sales%ROWTYPE;
  v_expires timestamptz;
BEGIN
  IF length(p_order_id) < 8 OR p_email IS NULL OR p_cycle NOT IN ('monthly', 'yearly', 'lifetime')
    OR p_status NOT IN ('paid', 'refunded') OR p_approved_at IS NULL THEN
    RAISE EXCEPTION 'invalid sale';
  END IF;
  SELECT count(*), min(id) INTO v_count, v_user_id FROM public.profiles
    WHERE lower(email) = lower(trim(p_email));
  IF v_count <> 1 THEN RAISE EXCEPTION 'buyer account missing or ambiguous'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  SELECT * INTO v_previous FROM public.kiwify_sales WHERE order_id = p_order_id FOR UPDATE;
  IF FOUND THEN
    IF v_previous.user_id <> v_user_id OR v_previous.product_id <> p_product_id
      OR v_previous.billing_cycle <> p_cycle THEN
      RAISE EXCEPTION 'order ownership mismatch';
    END IF;
    IF v_previous.sale_status = 'refunded' OR v_previous.sale_status = p_status THEN
      RETURN 'duplicate';
    END IF;
    UPDATE public.kiwify_sales SET sale_status = 'refunded', updated_at = now()
      WHERE order_id = p_order_id;
    SELECT * INTO v_active FROM public.kiwify_sales
      WHERE user_id = v_user_id AND sale_status = 'paid'
        AND (billing_cycle = 'lifetime' OR
          approved_at + CASE billing_cycle WHEN 'monthly' THEN interval '1 month' ELSE interval '1 year' END > now())
      ORDER BY (billing_cycle = 'lifetime') DESC, approved_at DESC LIMIT 1;
    IF NOT FOUND THEN
      UPDATE public.subscriptions SET plan = 'free', status = 'canceled', expires_at = now()
        WHERE user_id = v_user_id AND provider = 'kiwify';
    ELSE
      UPDATE public.subscriptions SET plan = 'pro', status = 'active',
        billing_cycle = v_active.billing_cycle,
        expires_at = CASE v_active.billing_cycle WHEN 'lifetime' THEN NULL
          WHEN 'monthly' THEN v_active.approved_at + interval '1 month'
          ELSE v_active.approved_at + interval '1 year' END,
        provider_subscription_id = v_active.order_id
        WHERE user_id = v_user_id AND provider = 'kiwify';
    END IF;
    RETURN 'refunded';
  END IF;

  IF p_status <> 'paid' THEN RETURN 'ignored'; END IF;
  INSERT INTO public.kiwify_sales(order_id, user_id, product_id, billing_cycle, sale_status, approved_at)
    VALUES (p_order_id, v_user_id, p_product_id, p_cycle, 'paid', p_approved_at);
  v_expires := CASE p_cycle
    WHEN 'monthly' THEN p_approved_at + interval '1 month'
    WHEN 'yearly' THEN p_approved_at + interval '1 year'
    ELSE NULL END;
  INSERT INTO public.subscriptions(user_id, plan, status, billing_cycle, started_at, expires_at,
    provider, provider_subscription_id)
    VALUES(v_user_id, 'pro', 'active', p_cycle, p_approved_at, v_expires, 'kiwify', p_order_id)
  ON CONFLICT (user_id) DO UPDATE SET
    plan = 'pro', status = 'active',
    billing_cycle = CASE WHEN public.subscriptions.billing_cycle = 'lifetime' THEN 'lifetime' ELSE EXCLUDED.billing_cycle END,
    expires_at = CASE WHEN public.subscriptions.billing_cycle = 'lifetime' THEN NULL
      WHEN EXCLUDED.expires_at IS NULL THEN NULL
      ELSE greatest(public.subscriptions.expires_at, EXCLUDED.expires_at) END,
    provider = 'kiwify', provider_subscription_id = EXCLUDED.provider_subscription_id;
  RETURN 'applied';
END;
$$;
REVOKE ALL ON FUNCTION public.apply_verified_kiwify_sale(text,text,text,text,text,timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_verified_kiwify_sale(text,text,text,text,text,timestamptz)
  TO service_role;
