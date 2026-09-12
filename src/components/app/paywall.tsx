import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  canUseFeature,
  featureBenefits,
  getPlan,
  getPlanLimits,
  plans,
  requiredPlanFor,
  type FeatureId,
  type PlanId,
} from "@/lib/plans";
import { track } from "@/lib/analytics";
import { effectivePlan, subscriptionQuery } from "@/lib/subscription";

type PaywallRequest = { feature: FeatureId; reason?: string };

type PlanContextValue = {
  plan: PlanId;
  planName: string;
  loading: boolean;
  limits: ReturnType<typeof getPlanLimits>;
  canUse: (feature: FeatureId) => boolean;
  openPaywall: (feature: FeatureId, reason?: string) => void;
  /** Executa a ação quando o plano permite; caso contrário abre o paywall. */
  guard: (feature: FeatureId, action: () => void, reason?: string) => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) throw new Error("usePlan precisa estar dentro de PaywallProvider");
  return context;
}

export function PaywallProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery(subscriptionQuery);
  const [request, setRequest] = useState<PaywallRequest | null>(null);
  const plan = effectivePlan(data ?? null);

  const value = useMemo<PlanContextValue>(
    () => ({
      plan,
      planName: getPlan(plan).name,
      loading: isLoading,
      limits: getPlanLimits(plan),
      canUse: (feature) => canUseFeature(plan, feature),
      openPaywall: (feature, reason) => {
        track("paywall_viewed", { feature, plan });
        setRequest(reason ? { feature, reason } : { feature });
      },
      guard: (feature, action, reason) => {
        if (canUseFeature(plan, feature)) return action();
        track("paywall_viewed", { feature, plan });
        setRequest(reason ? { feature, reason } : { feature });
      },
    }),
    [plan, isLoading],
  );

  const benefit = request ? featureBenefits[request.feature] : null;
  const target = request ? plans[requiredPlanFor(request.feature)] : plans.pro;

  return (
    <PlanContext.Provider value={value}>
      {children}
      <Dialog open={request !== null} onOpenChange={(open) => (open ? null : setRequest(null))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <Badge variant="success" className="w-fit">
              Plano {target.name}
            </Badge>
            <DialogTitle className="text-2xl">Proteja sua margem todos os meses.</DialogTitle>
            <DialogDescription>
              {request?.reason ? `${request.reason} ` : ""}
              {benefit ? benefit.benefit : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl bg-primary-soft/60 p-4">
            <p className="text-sm font-semibold text-primary-dark">
              {benefit?.title ?? "Recurso do Pro"}
            </p>
            <ul className="mt-3 grid gap-1.5">
              {target.highlights.slice(0, 6).map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-primary-dark/90">
                  <Sparkles className="size-3.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Seus dados já cadastrados continuam visíveis. Só as novas ações premium ficam
            bloqueadas.
          </p>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRequest(null)}>
              Agora não
            </Button>
            <Button
              asChild
              variant="hero"
              onClick={() => {
                track("upgrade_clicked", { plan: target.id, from: plan });
                setRequest(null);
              }}
            >
              <Link to="/app/planos">CONHECER O {target.name.toUpperCase()}</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PlanContext.Provider>
  );
}

/** Tela de recurso bloqueado, usada em páginas exclusivas de planos pagos. */
export function PremiumLock({ feature }: { feature: FeatureId }) {
  const { openPaywall } = usePlan();
  const benefit = featureBenefits[feature];
  const target = plans[requiredPlanFor(feature)];

  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-soft">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-dark">
        <Lock className="size-5" />
      </span>
      <h2 className="mt-4 text-xl font-bold text-foreground">Proteja sua margem todos os meses.</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {benefit.title}: {benefit.benefit} Disponível no plano {target.name}.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="hero" onClick={() => openPaywall(feature)}>
          CONHECER O {target.name.toUpperCase()}
        </Button>
        <Button asChild variant="subtle">
          <Link to="/app/planos">Ver todos os planos</Link>
        </Button>
      </div>
    </div>
  );
}
