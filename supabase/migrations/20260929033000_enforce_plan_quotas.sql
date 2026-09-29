-- The browser checks these limits for UX, but direct API inserts must obey them too.
-- Existing records are untouched. Only new rows inserted with an authenticated JWT are checked.
CREATE OR REPLACE FUNCTION public.enforce_plan_insert_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_plan text;
  v_limit integer;
  v_count integer;
BEGIN
  -- Server-side administrative imports may be performed with service_role.
  IF auth.role() IS DISTINCT FROM 'authenticated' THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'businesses' THEN
    v_user_id := NEW.user_id;
  ELSE
    SELECT b.user_id INTO v_user_id
      FROM public.businesses b WHERE b.id = NEW.business_id;
  END IF;
  IF v_user_id IS NULL OR v_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'business does not belong to current user' USING ERRCODE = '42501';
  END IF;

  -- Serialize inserts for the same account, including inserts into different businesses.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('plan-quota:' || v_user_id::text, 0)
  );

  SELECT COALESCE((
    SELECT s.plan FROM public.subscriptions s
      WHERE s.user_id = v_user_id AND s.status = 'active'
        AND (s.expires_at IS NULL OR s.expires_at > now())
        AND s.plan IN ('pro', 'business')
      LIMIT 1
  ), 'free') INTO v_plan;

  IF TG_TABLE_NAME = 'businesses' THEN
    IF v_plan = 'business' THEN RETURN NEW; END IF;
    v_limit := 1;
    SELECT count(*) INTO v_count FROM public.businesses b WHERE b.user_id = v_user_id;
  ELSIF TG_TABLE_NAME = 'products' THEN
    IF v_plan <> 'free' THEN RETURN NEW; END IF;
    v_limit := 3;
    SELECT count(*) INTO v_count FROM public.products p
      JOIN public.businesses b ON b.id = p.business_id WHERE b.user_id = v_user_id;
  ELSIF TG_TABLE_NAME = 'ingredients' THEN
    IF v_plan <> 'free' THEN RETURN NEW; END IF;
    v_limit := 5;
    SELECT count(*) INTO v_count FROM public.ingredients i
      JOIN public.businesses b ON b.id = i.business_id WHERE b.user_id = v_user_id;
  ELSE
    RAISE EXCEPTION 'unexpected quota table';
  END IF;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'plan limit reached for %', TG_TABLE_NAME USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER businesses_enforce_plan_quota
  BEFORE INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_insert_quota();
CREATE TRIGGER products_enforce_plan_quota
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_insert_quota();
CREATE TRIGGER ingredients_enforce_plan_quota
  BEFORE INSERT ON public.ingredients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_insert_quota();
