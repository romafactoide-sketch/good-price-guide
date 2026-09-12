import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/catalog";
import { listSalesChannels, type SalesChannel } from "@/lib/pricing";
import { ensureWorkspace } from "@/lib/workspace";

export type PricingData = {
  loading: boolean;
  businessId: string;
  channels: SalesChannel[];
  products: Product[];
  fixedCostsCents: number;
  proLaboreCents: number;
  monthlyGoalCents: number;
};

/** Carrega apenas os dados do negócio do usuário autenticado. */
export function usePricingData() {
  const [data, setData] = useState<PricingData>({
    loading: true,
    businessId: "",
    channels: [],
    products: [],
    fixedCostsCents: 0,
    proLaboreCents: 0,
    monthlyGoalCents: 0,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const business = await ensureWorkspace();
      const [channels, productsResult, costsResult] = await Promise.all([
        listSalesChannels(business.id),
        supabase.from("products").select("*").eq("business_id", business.id).order("name"),
        supabase.from("fixed_costs").select("amount_cents").eq("business_id", business.id),
      ]);
      if (!active) return;
      if (productsResult.error || costsResult.error)
        throw productsResult.error ?? costsResult.error;
      setData({
        loading: false,
        businessId: business.id,
        channels,
        products: productsResult.data,
        fixedCostsCents: (costsResult.data ?? []).reduce(
          (sum: number, cost: { amount_cents: number }) => sum + Number(cost.amount_cents),
          0,
        ),
        proLaboreCents: Number(business.pro_labore_cents ?? 0),
        monthlyGoalCents: Number(business.monthly_revenue_cents ?? 0),
      });
    })().catch(() => {
      if (!active) return;
      setData((current) => ({ ...current, loading: false }));
      toast.error("Não foi possível carregar seus dados.");
    });
    return () => {
      active = false;
    };
  }, []);

  return data;
}
