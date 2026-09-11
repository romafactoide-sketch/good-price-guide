CREATE OR REPLACE FUNCTION public.ensure_my_workspace(business_name text DEFAULT ''::text)
 RETURNS public.businesses
 LANGUAGE plpgsql
 SECURITY INVOKER
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

REVOKE ALL ON FUNCTION public.ensure_my_workspace(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_workspace(text) TO authenticated;