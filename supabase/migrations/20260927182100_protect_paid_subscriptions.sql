-- Billing entitlements must only be written by a trusted server using service_role.
DROP POLICY IF EXISTS subscriptions_insert_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_update_own ON public.subscriptions;
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM anon, authenticated;

-- Workspace initialization still creates the free subscription through its
-- SECURITY DEFINER function; the function owner must be able to insert here.
ALTER FUNCTION public.ensure_my_workspace(text) SECURITY DEFINER;
ALTER FUNCTION public.ensure_my_workspace(text) SET search_path = public;
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_billing_cycle_check
  CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime'));
