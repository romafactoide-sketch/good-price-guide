import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const workspaceKey = ["workspace"] as const;

export const workspaceQuery = queryOptions({
  queryKey: workspaceKey,
  queryFn: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error("Sessão não encontrada");

    const [{ data: profile, error: profileError }, { data: business, error: businessError }] =
      await Promise.all([
        supabase.from("profiles").select("id,name,email").eq("id", userData.user.id).single(),
        supabase
          .from("businesses")
          .select("*")
          .eq("user_id", userData.user.id)
          .order("created_at")
          .limit(1)
          .maybeSingle(),
      ]);

    if (profileError) throw profileError;
    if (businessError) throw businessError;
    return { user: userData.user, profile, business };
  },
});

export async function ensureWorkspace(businessName = "") {
  const { data, error } = await supabase.rpc("ensure_my_workspace", {
    business_name: businessName,
  });
  if (error) throw error;
  return data;
}