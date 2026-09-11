import { Link } from "@tanstack/react-router";
import {
  Bell,
  Boxes,
  FileBarChart,
  Home,
  Package,
  Receipt,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoUser } from "@/lib/demo-data";

export const navItems = [
  { label: "Início", to: "/app", icon: Home },
  { label: "Produtos", to: "/app/produtos", icon: Package },
  { label: "Serviços", to: "/app/servicos", icon: Wrench },
  { label: "Insumos", to: "/app/insumos", icon: Boxes },
  { label: "Custos", to: "/app/custos", icon: Receipt },
  { label: "Simuladores", to: "/app/simuladores", icon: SlidersHorizontal },
  { label: "Metas", to: "/app/metas", icon: Target },
  { label: "Relatórios", to: "/app/relatorios", icon: FileBarChart },
  { label: "Alertas", to: "/app/alertas", icon: Bell },
  { label: "Configurações", to: "/app/configuracoes", icon: Settings },
] as const;

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="px-5 py-5">
        <Logo to="/app" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="grid gap-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                activeOptions={{ exact: item.to === "/app" }}
                activeProps={{
                  className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                }}
                inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-2xl bg-primary-soft/70 p-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <span className="min-w-0">
              <span className="block text-xs text-primary-dark/80">Plano atual</span>
              <span className="block truncate text-sm font-bold text-primary-dark">
                {demoUser.plan}
              </span>
            </span>
            <Badge variant="success" className="shrink-0">
              Ativo
            </Badge>
          </div>
          <Button asChild variant="soft" size="sm" className="mt-3 w-full">
            <Link to="/app/configuracoes">
              <Sparkles />
              Gerenciar plano
            </Link>
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
            {demoUser.initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {demoUser.fullName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {demoUser.business}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
