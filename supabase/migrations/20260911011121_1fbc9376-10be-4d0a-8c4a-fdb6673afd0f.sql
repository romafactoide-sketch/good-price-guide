CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_name_length CHECK (char_length(name) <= 120),
  CONSTRAINT profiles_email_length CHECK (char_length(email) <= 320)
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  business_type text,
  monthly_revenue_cents bigint,
  monthly_sales integer,
  average_ticket_cents bigint,
  pro_labore_cents bigint NOT NULL DEFAULT 0,
  onboarding_step smallint NOT NULL DEFAULT 1,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT businesses_name_length CHECK (char_length(name) <= 160),
  CONSTRAINT businesses_type_valid CHECK (business_type IS NULL OR business_type IN ('products', 'services', 'both')),
  CONSTRAINT businesses_revenue_nonnegative CHECK (monthly_revenue_cents IS NULL OR monthly_revenue_cents >= 0),
  CONSTRAINT businesses_sales_nonnegative CHECK (monthly_sales IS NULL OR monthly_sales >= 0),
  CONSTRAINT businesses_ticket_nonnegative CHECK (average_ticket_cents IS NULL OR average_ticket_cents >= 0),
  CONSTRAINT businesses_pro_labore_nonnegative CHECK (pro_labore_cents >= 0),
  CONSTRAINT businesses_onboarding_step_valid CHECK (onboarding_step BETWEEN 1 AND 4)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "businesses_select_own" ON public.businesses
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "businesses_insert_own" ON public.businesses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "businesses_update_own" ON public.businesses
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "businesses_delete_own" ON public.businesses
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.fixed_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  amount_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fixed_costs_name_not_blank CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
  CONSTRAINT fixed_costs_category_valid CHECK (category IN ('structure', 'personnel', 'marketing', 'administrative', 'technology', 'financial', 'other')),
  CONSTRAINT fixed_costs_amount_nonnegative CHECK (amount_cents >= 0)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fixed_costs TO authenticated;
GRANT ALL ON public.fixed_costs TO service_role;
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fixed_costs_select_owned_business" ON public.fixed_costs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid())
  );
CREATE POLICY "fixed_costs_insert_owned_business" ON public.fixed_costs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid())
  );
CREATE POLICY "fixed_costs_update_owned_business" ON public.fixed_costs
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid())
  );
CREATE POLICY "fixed_costs_delete_owned_business" ON public.fixed_costs
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid())
  );

CREATE INDEX businesses_user_id_idx ON public.businesses(user_id);
CREATE INDEX fixed_costs_business_id_idx ON public.fixed_costs(business_id);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER businesses_set_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER fixed_costs_set_updated_at
  BEFORE UPDATE ON public.fixed_costs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = CASE WHEN public.profiles.name = '' THEN EXCLUDED.name ELSE public.profiles.name END,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.ensure_my_workspace(business_name text DEFAULT '')
RETURNS public.businesses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_email text;
  current_name text;
  result public.businesses;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT COALESCE(email, ''), COALESCE(raw_user_meta_data ->> 'name', raw_user_meta_data ->> 'full_name', '')
    INTO current_email, current_name
    FROM auth.users
    WHERE id = current_user_id;

  INSERT INTO public.profiles (id, name, email)
  VALUES (current_user_id, current_name, current_email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  SELECT * INTO result
  FROM public.businesses
  WHERE user_id = current_user_id
  ORDER BY created_at
  LIMIT 1;

  IF result.id IS NULL THEN
    INSERT INTO public.businesses (user_id, name)
    VALUES (current_user_id, left(COALESCE(business_name, ''), 160))
    RETURNING * INTO result;
  ELSIF result.name = '' AND btrim(COALESCE(business_name, '')) <> '' THEN
    UPDATE public.businesses
    SET name = left(btrim(business_name), 160)
    WHERE id = result.id
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_my_workspace(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_my_workspace(text) FROM anon;

CREATE OR REPLACE FUNCTION public.save_onboarding_step(
  target_business_id uuid,
  step_number smallint,
  business_kind text DEFAULT NULL,
  pro_labore_value_cents bigint DEFAULT NULL,
  monthly_sales_value integer DEFAULT NULL,
  average_ticket_value_cents bigint DEFAULT NULL,
  monthly_revenue_value_cents bigint DEFAULT NULL,
  complete_onboarding boolean DEFAULT false
)
RETURNS public.businesses
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result public.businesses;
BEGIN
  UPDATE public.businesses
  SET business_type = CASE WHEN step_number = 1 THEN business_kind ELSE business_type END,
      pro_labore_cents = CASE WHEN step_number = 3 THEN COALESCE(pro_labore_value_cents, 0) ELSE pro_labore_cents END,
      monthly_sales = CASE WHEN step_number = 4 THEN monthly_sales_value ELSE monthly_sales END,
      average_ticket_cents = CASE WHEN step_number = 4 THEN average_ticket_value_cents ELSE average_ticket_cents END,
      monthly_revenue_cents = CASE WHEN step_number = 4 THEN monthly_revenue_value_cents ELSE monthly_revenue_cents END,
      onboarding_step = CASE WHEN complete_onboarding THEN 4 ELSE LEAST(4, GREATEST(onboarding_step, step_number + 1)) END,
      onboarding_completed = complete_onboarding OR onboarding_completed
  WHERE id = target_business_id AND user_id = auth.uid()
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Business not found';
  END IF;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.save_onboarding_step(uuid, smallint, text, bigint, integer, bigint, bigint, boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.save_onboarding_step(uuid, smallint, text, bigint, integer, bigint, bigint, boolean) FROM anon;