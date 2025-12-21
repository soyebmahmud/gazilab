-- Create units enum for measurements
CREATE TYPE public.unit_type AS ENUM ('kg', 'g', 'l', 'ml', 'pcs', 'box', 'pack');

-- Create material category enum
CREATE TYPE public.material_category AS ENUM ('herbs', 'chemicals', 'packaging');

-- Create product category enum
CREATE TYPE public.product_category AS ENUM ('capsules', 'tablets', 'powder', 'liquid', 'cream', 'other');

-- Create stock movement type enum
CREATE TYPE public.stock_movement_type AS ENUM ('opening', 'production_in', 'production_out', 'adjustment_in', 'adjustment_out', 'sale', 'purchase', 'wastage');

-- Create production status enum
CREATE TYPE public.production_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- Raw Materials Table
CREATE TABLE public.raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category material_category NOT NULL DEFAULT 'herbs',
  unit unit_type NOT NULL DEFAULT 'kg',
  cost_per_unit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  min_stock_level NUMERIC(12, 3) NOT NULL DEFAULT 0,
  current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
  description TEXT,
  supplier TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products Table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category product_category NOT NULL DEFAULT 'capsules',
  unit unit_type NOT NULL DEFAULT 'pcs',
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  min_stock_level NUMERIC(12, 3) NOT NULL DEFAULT 0,
  current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
  manufacturing_date DATE,
  expiry_date DATE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bill of Materials (BOM) Table
CREATE TABLE public.bom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  estimated_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, version)
);

-- BOM Items Table (materials in each BOM)
CREATE TABLE public.bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES public.bom(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  quantity_per_unit NUMERIC(12, 4) NOT NULL DEFAULT 0,
  wastage_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock Ledger for Raw Materials
CREATE TABLE public.stock_ledger_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  movement_type stock_movement_type NOT NULL,
  quantity NUMERIC(12, 3) NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  balance_after NUMERIC(12, 3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock Ledger for Products
CREATE TABLE public.stock_ledger_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type stock_movement_type NOT NULL,
  quantity NUMERIC(12, 3) NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  balance_after NUMERIC(12, 3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Production Batches Table
CREATE TABLE public.production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT UNIQUE NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  bom_id UUID NOT NULL REFERENCES public.bom(id) ON DELETE RESTRICT,
  quantity_planned NUMERIC(12, 3) NOT NULL,
  quantity_produced NUMERIC(12, 3) NOT NULL DEFAULT 0,
  status production_status NOT NULL DEFAULT 'planned',
  manufacturing_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers Table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  gst_number TEXT,
  outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sellers/Suppliers Table
CREATE TABLE public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  gst_number TEXT,
  outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for now, can be restricted later with auth)
CREATE POLICY "Allow public read on raw_materials" ON public.raw_materials FOR SELECT USING (true);
CREATE POLICY "Allow public insert on raw_materials" ON public.raw_materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on raw_materials" ON public.raw_materials FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on raw_materials" ON public.raw_materials FOR DELETE USING (true);

CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert on products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public read on bom" ON public.bom FOR SELECT USING (true);
CREATE POLICY "Allow public insert on bom" ON public.bom FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on bom" ON public.bom FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on bom" ON public.bom FOR DELETE USING (true);

CREATE POLICY "Allow public read on bom_items" ON public.bom_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on bom_items" ON public.bom_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on bom_items" ON public.bom_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on bom_items" ON public.bom_items FOR DELETE USING (true);

CREATE POLICY "Allow public read on stock_ledger_materials" ON public.stock_ledger_materials FOR SELECT USING (true);
CREATE POLICY "Allow public insert on stock_ledger_materials" ON public.stock_ledger_materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on stock_ledger_materials" ON public.stock_ledger_materials FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on stock_ledger_materials" ON public.stock_ledger_materials FOR DELETE USING (true);

CREATE POLICY "Allow public read on stock_ledger_products" ON public.stock_ledger_products FOR SELECT USING (true);
CREATE POLICY "Allow public insert on stock_ledger_products" ON public.stock_ledger_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on stock_ledger_products" ON public.stock_ledger_products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on stock_ledger_products" ON public.stock_ledger_products FOR DELETE USING (true);

CREATE POLICY "Allow public read on production_batches" ON public.production_batches FOR SELECT USING (true);
CREATE POLICY "Allow public insert on production_batches" ON public.production_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on production_batches" ON public.production_batches FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on production_batches" ON public.production_batches FOR DELETE USING (true);

CREATE POLICY "Allow public read on customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on customers" ON public.customers FOR DELETE USING (true);

CREATE POLICY "Allow public read on sellers" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sellers" ON public.sellers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sellers" ON public.sellers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on sellers" ON public.sellers FOR DELETE USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_raw_materials_updated_at BEFORE UPDATE ON public.raw_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bom_updated_at BEFORE UPDATE ON public.bom FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_production_batches_updated_at BEFORE UPDATE ON public.production_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to recalculate material stock from ledger
CREATE OR REPLACE FUNCTION public.recalculate_material_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.raw_materials 
  SET current_stock = COALESCE((
    SELECT SUM(
      CASE 
        WHEN movement_type IN ('opening', 'purchase', 'adjustment_in') THEN quantity
        ELSE -quantity
      END
    )
    FROM public.stock_ledger_materials 
    WHERE raw_material_id = COALESCE(NEW.raw_material_id, OLD.raw_material_id)
  ), 0)
  WHERE id = COALESCE(NEW.raw_material_id, OLD.raw_material_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to recalculate product stock from ledger
CREATE OR REPLACE FUNCTION public.recalculate_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products 
  SET current_stock = COALESCE((
    SELECT SUM(
      CASE 
        WHEN movement_type IN ('opening', 'production_in', 'adjustment_in', 'purchase') THEN quantity
        ELSE -quantity
      END
    )
    FROM public.stock_ledger_products 
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
  ), 0)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers to auto-update stock on ledger changes
CREATE TRIGGER recalc_material_stock_on_insert AFTER INSERT ON public.stock_ledger_materials FOR EACH ROW EXECUTE FUNCTION public.recalculate_material_stock();
CREATE TRIGGER recalc_material_stock_on_update AFTER UPDATE ON public.stock_ledger_materials FOR EACH ROW EXECUTE FUNCTION public.recalculate_material_stock();
CREATE TRIGGER recalc_material_stock_on_delete AFTER DELETE ON public.stock_ledger_materials FOR EACH ROW EXECUTE FUNCTION public.recalculate_material_stock();

CREATE TRIGGER recalc_product_stock_on_insert AFTER INSERT ON public.stock_ledger_products FOR EACH ROW EXECUTE FUNCTION public.recalculate_product_stock();
CREATE TRIGGER recalc_product_stock_on_update AFTER UPDATE ON public.stock_ledger_products FOR EACH ROW EXECUTE FUNCTION public.recalculate_product_stock();
CREATE TRIGGER recalc_product_stock_on_delete AFTER DELETE ON public.stock_ledger_products FOR EACH ROW EXECUTE FUNCTION public.recalculate_product_stock();

-- Function to calculate BOM estimated cost
CREATE OR REPLACE FUNCTION public.calculate_bom_cost()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.bom 
  SET estimated_cost = COALESCE((
    SELECT SUM(
      bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * rm.cost_per_unit
    )
    FROM public.bom_items bi
    JOIN public.raw_materials rm ON rm.id = bi.raw_material_id
    WHERE bi.bom_id = COALESCE(NEW.bom_id, OLD.bom_id)
  ), 0)
  WHERE id = COALESCE(NEW.bom_id, OLD.bom_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to update BOM cost when items change
CREATE TRIGGER calc_bom_cost_on_insert AFTER INSERT ON public.bom_items FOR EACH ROW EXECUTE FUNCTION public.calculate_bom_cost();
CREATE TRIGGER calc_bom_cost_on_update AFTER UPDATE ON public.bom_items FOR EACH ROW EXECUTE FUNCTION public.calculate_bom_cost();
CREATE TRIGGER calc_bom_cost_on_delete AFTER DELETE ON public.bom_items FOR EACH ROW EXECUTE FUNCTION public.calculate_bom_cost();

-- Function to get material usage (which products/BOMs use this material)
CREATE OR REPLACE FUNCTION public.get_material_usage(material_id UUID)
RETURNS TABLE (
  product_name TEXT,
  product_sku TEXT,
  bom_version INTEGER,
  quantity_per_unit NUMERIC,
  wastage_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name as product_name,
    p.sku as product_sku,
    b.version as bom_version,
    bi.quantity_per_unit,
    bi.wastage_percent
  FROM public.bom_items bi
  JOIN public.bom b ON b.id = bi.bom_id
  JOIN public.products p ON p.id = b.product_id
  WHERE bi.raw_material_id = material_id
  ORDER BY p.name, b.version;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to check if material can be deleted
CREATE OR REPLACE FUNCTION public.can_delete_material(material_id UUID)
RETURNS TABLE (
  can_delete BOOLEAN,
  usage_count INTEGER,
  ledger_count INTEGER
) AS $$
DECLARE
  v_usage_count INTEGER;
  v_ledger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_usage_count FROM public.bom_items WHERE raw_material_id = material_id;
  SELECT COUNT(*) INTO v_ledger_count FROM public.stock_ledger_materials WHERE raw_material_id = material_id;
  
  RETURN QUERY SELECT 
    (v_usage_count = 0 AND v_ledger_count = 0) as can_delete,
    v_usage_count as usage_count,
    v_ledger_count as ledger_count;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create indexes for performance
CREATE INDEX idx_raw_materials_category ON public.raw_materials(category);
CREATE INDEX idx_raw_materials_sku ON public.raw_materials(sku);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_bom_product_id ON public.bom(product_id);
CREATE INDEX idx_bom_items_bom_id ON public.bom_items(bom_id);
CREATE INDEX idx_bom_items_material_id ON public.bom_items(raw_material_id);
CREATE INDEX idx_stock_ledger_materials_material_id ON public.stock_ledger_materials(raw_material_id);
CREATE INDEX idx_stock_ledger_products_product_id ON public.stock_ledger_products(product_id);
CREATE INDEX idx_production_batches_product_id ON public.production_batches(product_id);
CREATE INDEX idx_production_batches_status ON public.production_batches(status);