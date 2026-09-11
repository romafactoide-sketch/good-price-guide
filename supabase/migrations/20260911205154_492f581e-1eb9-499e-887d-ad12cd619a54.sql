CREATE TABLE public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  purchase_quantity numeric(14,4) NOT NULL DEFAULT 0,
  purchase_unit text NOT NULL DEFAULT 'unidade',
  purchase_price_cents bigint NOT NULL DEFAULT 0,
  base_unit text NOT NULL DEFAULT 'unidade',
  base_quantity numeric(16,4) NOT NULL DEFAULT 0,
  unit_cost_cents numeric(16,6) NOT NULL DEFAULT 0,
  supplier text,
  purchase_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ingredients_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT ingredients_quantity_positive CHECK (purchase_quantity >= 0),
  CONSTRAINT ingredients_base_quantity_positive CHECK (base_quantity >= 0),
  CONSTRAINT ingredients_price_positive CHECK (purchase_price_cents >= 0),
  CONSTRAINT ingredients_unit_cost_positive CHECK (unit_cost_cents >= 0),
  CONSTRAINT ingredients_purchase_unit_valid CHECK (purchase_unit IN ('g','kg','ml','L','unidade','metro','cm','pacote','caixa','outro')),
  CONSTRAINT ingredients_base_unit_valid CHECK (base_unit IN ('g','ml','unidade','cm','pacote','caixa','outro')),
  CONSTRAINT ingredients_category_valid CHECK (category IN ('ingredient','packaging','material','merchandise','other'))
);

CREATE INDEX ingredients_business_id_idx ON public.ingredients (business_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredients TO authenticated;
GRANT ALL ON public.ingredients TO service_role;

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY ingredients_select_owned_business ON public.ingredients FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = ingredients.business_id AND b.user_id = auth.uid()));
CREATE POLICY ingredients_insert_owned_business ON public.ingredients FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = ingredients.business_id AND b.user_id = auth.uid()));
CREATE POLICY ingredients_update_owned_business ON public.ingredients FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = ingredients.business_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = ingredients.business_id AND b.user_id = auth.uid()));
CREATE POLICY ingredients_delete_owned_business ON public.ingredients FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = ingredients.business_id AND b.user_id = auth.uid()));

CREATE TRIGGER ingredients_set_updated_at BEFORE UPDATE ON public.ingredients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL DEFAULT '',
  image_url text,
  current_price_cents bigint NOT NULL DEFAULT 0,
  target_margin numeric(6,2) NOT NULL DEFAULT 0,
  waste_percentage numeric(6,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  direct_cost_cents numeric(16,4) NOT NULL DEFAULT 0,
  waste_cost_cents numeric(16,4) NOT NULL DEFAULT 0,
  adjusted_cost_cents numeric(16,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT products_price_positive CHECK (current_price_cents >= 0),
  CONSTRAINT products_margin_range CHECK (target_margin >= 0 AND target_margin <= 100),
  CONSTRAINT products_waste_range CHECK (waste_percentage >= 0 AND waste_percentage < 100),
  CONSTRAINT products_status_valid CHECK (status IN ('draft','active','archived')),
  CONSTRAINT products_category_valid CHECK (category IN ('product','service','other')),
  CONSTRAINT products_costs_positive CHECK (direct_cost_cents >= 0 AND waste_cost_cents >= 0 AND adjusted_cost_cents >= 0)
);

CREATE INDEX products_business_id_idx ON public.products (business_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_owned_business ON public.products FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = products.business_id AND b.user_id = auth.uid()));
CREATE POLICY products_insert_owned_business ON public.products FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = products.business_id AND b.user_id = auth.uid()));
CREATE POLICY products_update_owned_business ON public.products FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = products.business_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = products.business_id AND b.user_id = auth.uid()));
CREATE POLICY products_delete_owned_business ON public.products FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = products.business_id AND b.user_id = auth.uid()));

CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_used numeric(14,4) NOT NULL DEFAULT 0,
  unit_used text NOT NULL DEFAULT 'unidade',
  calculated_cost_cents numeric(16,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_ingredients_quantity_positive CHECK (quantity_used >= 0),
  CONSTRAINT product_ingredients_cost_positive CHECK (calculated_cost_cents >= 0),
  CONSTRAINT product_ingredients_unit_valid CHECK (unit_used IN ('g','kg','ml','L','unidade','metro','cm','pacote','caixa','outro'))
);

CREATE INDEX product_ingredients_product_id_idx ON public.product_ingredients (product_id);
CREATE INDEX product_ingredients_ingredient_id_idx ON public.product_ingredients (ingredient_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_ingredients TO authenticated;
GRANT ALL ON public.product_ingredients TO service_role;

ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_ingredients_select_owned ON public.product_ingredients FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_ingredients.product_id AND b.user_id = auth.uid()));
CREATE POLICY product_ingredients_insert_owned ON public.product_ingredients FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_ingredients.product_id AND b.user_id = auth.uid()));
CREATE POLICY product_ingredients_update_owned ON public.product_ingredients FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_ingredients.product_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_ingredients.product_id AND b.user_id = auth.uid()));
CREATE POLICY product_ingredients_delete_owned ON public.product_ingredients FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_ingredients.product_id AND b.user_id = auth.uid()));

CREATE TRIGGER product_ingredients_set_updated_at BEFORE UPDATE ON public.product_ingredients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_direct_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'other',
  amount_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_direct_costs_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT product_direct_costs_amount_positive CHECK (amount_cents >= 0),
  CONSTRAINT product_direct_costs_kind_valid CHECK (kind IN ('packaging','material','other'))
);

CREATE INDEX product_direct_costs_product_id_idx ON public.product_direct_costs (product_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_direct_costs TO authenticated;
GRANT ALL ON public.product_direct_costs TO service_role;

ALTER TABLE public.product_direct_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_direct_costs_select_owned ON public.product_direct_costs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_direct_costs.product_id AND b.user_id = auth.uid()));
CREATE POLICY product_direct_costs_insert_owned ON public.product_direct_costs FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_direct_costs.product_id AND b.user_id = auth.uid()));
CREATE POLICY product_direct_costs_update_owned ON public.product_direct_costs FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_direct_costs.product_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_direct_costs.product_id AND b.user_id = auth.uid()));
CREATE POLICY product_direct_costs_delete_owned ON public.product_direct_costs FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p JOIN public.businesses b ON b.id = p.business_id WHERE p.id = product_direct_costs.product_id AND b.user_id = auth.uid()));

CREATE TRIGGER product_direct_costs_set_updated_at BEFORE UPDATE ON public.product_direct_costs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();