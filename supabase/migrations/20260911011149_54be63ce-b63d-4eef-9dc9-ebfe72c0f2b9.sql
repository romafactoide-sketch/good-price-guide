REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.profiles TO authenticated;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
ALTER FUNCTION public.ensure_my_workspace(text) SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.ensure_my_workspace(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_workspace(text) TO authenticated;
REVOKE ALL ON FUNCTION public.save_onboarding_step(uuid, smallint, text, bigint, integer, bigint, bigint, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_onboarding_step(uuid, smallint, text, bigint, integer, bigint, bigint, boolean) TO authenticated;