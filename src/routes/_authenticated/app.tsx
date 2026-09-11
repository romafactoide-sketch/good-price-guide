import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { SidebarContent } from "@/components/app/app-sidebar";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: async () => {
    const { data: business, error } = await supabase
      .from("businesses")
      .select("onboarding_completed")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!business?.onboarding_completed) throw redirect({ to: "/onboarding" });
  },
  component: AppLayout,
});

function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-sidebar-border lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="subtle" size="icon" aria-label="Abrir menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[17rem] p-0">
                <SidebarContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <Logo to="/app" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Alertas">
              <Bell />
            </Button>
            <span className="grid size-9 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
              PS
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
