CREATE TABLE public.sales_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  tax_percentage numeric NOT NULL DEFAULT 0 CHECK (tax_percentage >= 0 AND tax_percentage < 100),
  card_fee_percentage numeric NOT NULL DEFAULT 0 CHECK (card_fee_percentage >= 0 AND card_fee_percentage < 100),
  marketplace_fee_percentage numeric NOT NULL DEFAULT 0 CHECK (marketplace_fee_percentage >= 0 AND marketplace_fee_percentage < 100),
  commission_percentage numeric NOT NULL DEFAULT 0 CHECK (commission_percentage >= 0 AND commission_percentage < 100),
  delivery_fee_percentage numeric NOT NULL DEFAULT 0 CHECK (delivery_fee_percentage >= 0 AND delivery_fee_percentage < 100),
  other_fee_percentage numeric NOT NULL DEFAULT 0 CHECK (other_fee_percentage >= 0 AND other_fee_percentage < 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_channels TO authenticated;
GRANT ALL ON public.sales_channels TO service_role;
ALTER TABLE public.sales_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_channels_select_owned_business ON public.sales_channels FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = sales_channels.business_id AND b.user_id = auth.uid()));
CREATE POLICY sales_channels_insert_owned_business ON public.sales_channels FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = sales_channels.business_id AND b.user_id = auth.uid()));
CREATE POLICY sales_channels_update_owned_business ON public.sales_channels FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = sales_channels.business_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = sales_channels.business_id AND b.user_id = auth.uid()));
CREATE POLICY sales_channels_delete_owned_business ON public.sales_channels FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = sales_channels.business_id AND b.user_id = auth.uid()));

CREATE INDEX sales_channels_business_id_idx ON public.sales_channels(business_id);
CREATE TRIGGER sales_channels_set_updated_at BEFORE UPDATE ON public.sales_channels
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sales_channel_id uuid NOT NULL REFERENCES public.sales_channels(id) ON DELETE CASCADE,
  current_price_cents bigint NOT NULL DEFAULT 0 CHECK (current_price_cents >= 0),
  minimum_price_cents bigint NOT NULL DEFAULT 0 CHECK (minimum_price_cents >= 0),
  healthy_price_cents bigint NOT NULL DEFAULT 0 CHECK (healthy_price_cents >= 0),
  strategic_price_cents bigint NOT NULL DEFAULT 0 CHECK (strategic_price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, sales_channel_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_channels TO authenticated;
GRANT ALL ON public.product_channels TO service_role;
ALTER TABLE public.product_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_channels_select_owned ON public.product_channels FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_channels.product_id AND b.user_id = auth.uid()));
CREATE POLICY product_channels_insert_owned ON public.product_channels FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_channels.product_id AND b.user_id = auth.uid()));
CREATE POLICY product_channels_update_owned ON public.product_channels FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_channels.product_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_channels.product_id AND b.user_id = auth.uid()));
CREATE POLICY product_channels_delete_owned ON public.product_channels FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_channels.product_id AND b.user_id = auth.uid()));

CREATE INDEX product_channels_product_id_idx ON public.product_channels(product_id);
CREATE INDEX product_channels_sales_channel_id_idx ON public.product_channels(sales_channel_id);
CREATE TRIGGER product_channels_set_updated_at BEFORE UPDATE ON public.product_channels
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();