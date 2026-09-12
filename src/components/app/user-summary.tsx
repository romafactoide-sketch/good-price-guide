import { LogOut } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { workspaceQuery } from "@/lib/workspace";

export function UserSummary() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery(workspaceQuery);
  const name = data?.profile.name || data?.user.email?.split("@")[0] || "Sua conta";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-2 py-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
        {initials || "PS"}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {data?.business?.name || "Configure seu negócio"}
        </span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Sair"
        title="Sair"
        onClick={async () => {
          await queryClient.cancelQueries();
          queryClient.clear();
          await supabase.auth.signOut();
          navigate({ to: "/entrar", replace: true });
        }}
      >
        <LogOut />
      </Button>
    </div>
  );
}
