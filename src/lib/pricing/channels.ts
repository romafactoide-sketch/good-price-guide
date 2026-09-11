import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ChannelFees } from "./engine";

export type SalesChannel = Tables<"sales_channels">;
export type ProductChannel = Tables<"product_channels">;

/** Converte a linha do canal nas taxas usadas pelo motor financeiro. */
export const channelFees = (channel: SalesChannel): ChannelFees => ({
  taxPercentage: Number(channel.tax_percentage),
  cardFeePercentage: Number(channel.card_fee_percentage),
  marketplaceFeePercentage: Number(channel.marketplace_fee_percentage),
  commissionPercentage: Number(channel.commission_percentage),
  deliveryFeePercentage: Number(channel.delivery_fee_percentage),
  otherFeePercentage: Number(channel.other_fee_percentage),
});

export async function listSalesChannels(businessId: string) {
  const { data, error } = await supabase
    .from("sales_channels")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function listProductChannels(salesChannelId: string) {
  const { data, error } = await supabase
    .from("product_channels")
    .select("*")
    .eq("sales_channel_id", salesChannelId);
  if (error) throw error;
  return data;
}

export async function saveProductChannelPrices(
  rows: {
    product_id: string;
    sales_channel_id: string;
    current_price_cents: number;
    minimum_price_cents: number;
    healthy_price_cents: number;
    strategic_price_cents: number;
  }[],
) {
  if (!rows.length) return;
  const { error } = await supabase
    .from("product_channels")
    .upsert(rows, { onConflict: "product_id,sales_channel_id" });
  if (error) throw error;
}
