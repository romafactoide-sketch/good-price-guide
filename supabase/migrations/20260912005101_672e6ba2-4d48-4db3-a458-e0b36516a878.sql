ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS critical_margin_percentage numeric NOT NULL DEFAULT 5
  CHECK (critical_margin_percentage >= 0 AND critical_margin_percentage < 100);

CREATE TABLE public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'success')),
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  entity_type text,
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  dedupe_day date NOT NULL DEFAULT (now()::date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY alerts_select_owned_business ON public.alerts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = alerts.business_id AND b.user_id = auth.uid()));
CREATE POLICY alerts_insert_owned_business ON public.alerts FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = alerts.business_id AND b.user_id = auth.uid()));
CREATE POLICY alerts_update_owned_business ON public.alerts FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = alerts.business_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = alerts.business_id AND b.user_id = auth.uid()));
CREATE POLICY alerts_delete_owned_business ON public.alerts FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = alerts.business_id AND b.user_id = auth.uid()));

CREATE INDEX alerts_business_created_idx ON public.alerts(business_id, created_at DESC);
CREATE INDEX alerts_business_unread_idx ON public.alerts(business_id) WHERE read = false;
CREATE UNIQUE INDEX alerts_dedupe_idx
  ON public.alerts(business_id, type, COALESCE(entity_id, '00000000-0000-0000-0000-000000000000'::uuid), dedupe_day);

CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  provider text NOT NULL DEFAULT 'none',
  provider_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select_own ON public.subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY subscriptions_insert_own ON public.subscriptions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY subscriptions_update_own ON public.subscriptions FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.alert_ingredient_cost_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  direction text;
  variation numeric;
BEGIN
  IF NEW.unit_cost_cents IS DISTINCT FROM OLD.unit_cost_cents AND OLD.unit_cost_cents > 0 THEN
    variation := round(((NEW.unit_cost_cents - OLD.unit_cost_cents) / OLD.unit_cost_cents) * 100, 1);
    IF abs(variation) < 1 THEN
      RETURN NEW;
    END IF;
    direction := CASE WHEN variation > 0 THEN 'subiu' ELSE 'caiu' END;
    INSERT INTO public.alerts (business_id, type, severity, title, message, entity_type, entity_id)
    VALUES (
      NEW.business_id,
      'ingredient_cost_change',
      CASE WHEN variation > 0 THEN 'warning' ELSE 'success' END,
      'Custo de ' || NEW.name || ' ' || direction || ' ' || abs(variation) || '%',
      'Confira os produtos que usam ' || NEW.name || ': o preço de venda pode precisar de ajuste.',
      'ingredient',
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ingredients_alert_cost_change AFTER UPDATE ON public.ingredients
FOR EACH ROW EXECUTE FUNCTION public.alert_ingredient_cost_change();

CREATE OR REPLACE FUNCTION public.ensure_my_workspace(business_name text DEFAULT ''::text)
 RETURNS businesses
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
  claims jsonb := COALESCE(auth.jwt(), '{}'::jsonb);
  metadata jsonb := COALESCE(claims -> 'user_metadata', '{}'::jsonb);
  current_email text;
  current_name text;
  resolved_business_name text;
  result public.businesses;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  current_email := COALESCE(claims ->> 'email', metadata ->> 'email', '');
  current_name := COALESCE(metadata ->> 'name', metadata ->> 'full_name', '');
  resolved_business_name := left(btrim(COALESCE(NULLIF(business_name, ''), metadata ->> 'business_name', '')), 160);

  INSERT INTO public.profiles (id, name, email)
  VALUES (current_user_id, current_name, current_email)
  ON CONFLICT (id) DO UPDATE SET
    name = CASE WHEN public.profiles.name = '' THEN EXCLUDED.name ELSE public.profiles.name END,
    email = CASE WHEN EXCLUDED.email = '' THEN public.profiles.email ELSE EXCLUDED.email END;

  INSERT INTO public.subscriptions (user_id)
  VALUES (current_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO result
  FROM public.businesses
  WHERE user_id = current_user_id
  ORDER BY created_at
  LIMIT 1;

  IF result.id IS NULL THEN
    INSERT INTO public.businesses (user_id, name)
    VALUES (current_user_id, resolved_business_name)
    RETURNING * INTO result;
  ELSIF result.name = '' AND resolved_business_name <> '' THEN
    UPDATE public.businesses
    SET name = resolved_business_name
    WHERE id = result.id
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$function$;