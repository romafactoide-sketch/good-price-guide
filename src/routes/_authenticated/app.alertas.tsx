import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumLock, usePlan } from "@/components/app/paywall";
import { useBusinessHealth } from "@/hooks/use-business-health";
import {
  alertFilters,
  buildBusinessAlerts,
  isVisibleAlert,
  lastBreakEvenSnapshotCents,
  listAlerts,
  markAlertRead,
  markAllAlertsRead,
  matchesFilter,
  saveAlerts,
  type Alert,
  type AlertFilter,
} from "@/lib/alerts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas — PreçoSadio" },
      {
        name: "description",
        content:
          "Avisos automáticos quando um insumo encarece, um produto perde margem ou o ponto de equilíbrio sobe.",
      },
      { property: "og:title", content: "Alertas — PreçoSadio" },
      {
        property: "og:description",
        content: "Saiba na hora quando algum produto começa a dar prejuízo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

const severityVariant = {
  critical: "danger",
  warning: "warning",
  success: "success",
  info: "info",
} as const;

const severityLabel = {
  critical: "Crítico",
  warning: "Atenção",
  success: "Boa notícia",
  info: "Informação",
} as const;

function AlertsPage() {
  const { canUse } = usePlan();
  const allowed = canUse("alerts");
  const health = useBusinessHealth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const businessId = health.businessId;

  async function refresh(businessKey: string) {
    const data = await listAlerts(businessKey);
    setAlerts(data.filter(isVisibleAlert));
    setLoaded(true);
  }

  async function analyse(businessKey: string) {
    setSyncing(true);
    try {
      const previous = await lastBreakEvenSnapshotCents(businessKey);
      const drafts = buildBusinessAlerts({
        products: health.rows.map((row) => ({
          productId: row.product.id,
          productName: row.product.name,
          status: row.status,
          marginPercentage: row.currentMarginPercentage,
          targetMarginPercentage: row.targetMarginPercentage,
          currentPriceCents: row.currentPriceCents,
          healthyPriceCents: row.healthyPriceCents ?? 0,
        })),
        breakEvenCents: health.breakEvenCents,
        previousBreakEvenCents: previous,
      });
      await saveAlerts(businessKey, drafts);
      await refresh(businessKey);
    } catch {
      toast.error("Não foi possível atualizar seus alertas.");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (!allowed || health.loading || !businessId) return;
    analyse(businessId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, health.loading, businessId]);

  const visible = useMemo(
    () => alerts.filter((alert) => matchesFilter(alert, filter)),
    [alerts, filter],
  );
  const unread = alerts.filter((alert) => !alert.read).length;

  if (!allowed) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Alertas"
          description="Avisos automáticos quando algum produto começa a dar prejuízo."
        />
        <PremiumLock feature="alerts" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Alertas"
        description="Avisos automáticos sobre custos, margens e metas do seu negócio."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="subtle"
              disabled={syncing || !businessId}
              onClick={() => businessId && analyse(businessId)}
            >
              <RefreshCw />
              {syncing ? "Verificando..." : "Verificar agora"}
            </Button>
            <Button
              variant="hero"
              disabled={!unread || !businessId}
              onClick={async () => {
                if (!businessId) return;
                await markAllAlertsRead(businessId);
                await refresh(businessId);
              }}
            >
              <CheckCheck />
              Marcar tudo como lido
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(Object.keys(alertFilters) as AlertFilter[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "hero" : "subtle"}
            onClick={() => setFilter(key)}
          >
            {alertFilters[key]}
          </Button>
        ))}
      </div>

      {!loaded || health.loading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Verificando seus produtos...
        </div>
      ) : visible.length ? (
        <ul className="grid gap-3">
          {visible.map((alert) => (
            <li
              key={alert.id}
              className={cn(
                "rounded-2xl border bg-card p-5 shadow-soft",
                alert.read ? "border-border opacity-80" : "border-primary/25",
              )}
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        severityVariant[alert.severity as keyof typeof severityVariant] ?? "neutral"
                      }
                    >
                      {severityLabel[alert.severity as keyof typeof severityLabel] ?? "Aviso"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <h2 className="mt-2 font-bold text-foreground">{alert.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {alert.entity_type === "product" && alert.entity_id ? (
                    <Button asChild variant="subtle" size="sm">
                      <Link
                        to="/app/resultado/$productId"
                        params={{ productId: alert.entity_id }}
                      >
                        Ver produto
                      </Link>
                    </Button>
                  ) : null}
                  {alert.entity_type === "ingredient" ? (
                    <Button asChild variant="subtle" size="sm">
                      <Link to="/app/insumos">Ver insumos</Link>
                    </Button>
                  ) : null}
                  {!alert.read ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await markAlertRead(alert.id);
                        if (businessId) await refresh(businessId);
                      }}
                    >
                      Marcar como lido
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Bell}
          title="Nenhum alerta por aqui"
          description="Tudo tranquilo: nenhum produto está com margem crítica agora."
          action={
            <Button asChild variant="subtle">
              <Link to="/app/saude">Ver saúde dos produtos</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
