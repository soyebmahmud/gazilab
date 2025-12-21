-- =====================================================
-- PHASE 1: Raw Material Batch Tracking
-- =====================================================

-- Create raw_material_batches table for batch-wise inventory
CREATE TABLE public.raw_material_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  quantity_received NUMERIC NOT NULL DEFAULT 0,
  quantity_remaining NUMERIC NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  supplier TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.raw_material_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on raw_material_batches" ON public.raw_material_batches FOR SELECT USING (true);
CREATE POLICY "Allow public insert on raw_material_batches" ON public.raw_material_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on raw_material_batches" ON public.raw_material_batches FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on raw_material_batches" ON public.raw_material_batches FOR DELETE USING (true);

-- Add batch reference to stock_ledger_materials
ALTER TABLE public.stock_ledger_materials 
ADD COLUMN raw_material_batch_id UUID REFERENCES public.raw_material_batches(id);

-- =====================================================
-- PHASE 2: Location Tracking for Products
-- =====================================================

-- Add location fields to products
ALTER TABLE public.products 
ADD COLUMN warehouse TEXT,
ADD COLUMN rack TEXT,
ADD COLUMN shelf TEXT;

-- Add location to production_batches
ALTER TABLE public.production_batches
ADD COLUMN warehouse TEXT,
ADD COLUMN rack TEXT,
ADD COLUMN shelf TEXT;

-- =====================================================
-- PHASE 3: Stock Reservation System
-- =====================================================

-- Create stock_reservations table
CREATE TABLE public.stock_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  raw_material_batch_id UUID REFERENCES public.raw_material_batches(id),
  production_batch_id UUID REFERENCES public.production_batches(id) ON DELETE CASCADE,
  quantity_reserved NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'consumed', 'released')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on stock_reservations" ON public.stock_reservations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on stock_reservations" ON public.stock_reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on stock_reservations" ON public.stock_reservations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on stock_reservations" ON public.stock_reservations FOR DELETE USING (true);

-- =====================================================
-- PHASE 4: Production Tracking Enhancement
-- =====================================================

-- Create production_material_usage to track which raw material batches were used
CREATE TABLE public.production_material_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_batch_id UUID NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id),
  raw_material_batch_id UUID REFERENCES public.raw_material_batches(id),
  quantity_used NUMERIC NOT NULL DEFAULT 0,
  wastage_quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production_material_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on production_material_usage" ON public.production_material_usage FOR SELECT USING (true);
CREATE POLICY "Allow public insert on production_material_usage" ON public.production_material_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on production_material_usage" ON public.production_material_usage FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on production_material_usage" ON public.production_material_usage FOR DELETE USING (true);

-- =====================================================
-- PHASE 5: Helper Functions
-- =====================================================

-- Function to get available stock (total - reserved)
CREATE OR REPLACE FUNCTION public.get_available_material_stock(p_material_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_current_stock NUMERIC;
  v_reserved_stock NUMERIC;
BEGIN
  SELECT current_stock INTO v_current_stock FROM public.raw_materials WHERE id = p_material_id;
  
  SELECT COALESCE(SUM(quantity_reserved), 0) INTO v_reserved_stock 
  FROM public.stock_reservations 
  WHERE raw_material_id = p_material_id AND status = 'reserved';
  
  RETURN COALESCE(v_current_stock, 0) - v_reserved_stock;
END;
$$;

-- Function to check MRP (Material Requirement Planning)
CREATE OR REPLACE FUNCTION public.check_mrp(p_product_id UUID, p_quantity NUMERIC)
RETURNS TABLE(
  raw_material_id UUID,
  material_name TEXT,
  material_sku TEXT,
  unit TEXT,
  required_quantity NUMERIC,
  available_quantity NUMERIC,
  is_sufficient BOOLEAN
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rm.id as raw_material_id,
    rm.name as material_name,
    rm.sku as material_sku,
    rm.unit::TEXT as unit,
    (bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * p_quantity) as required_quantity,
    public.get_available_material_stock(rm.id) as available_quantity,
    (public.get_available_material_stock(rm.id) >= (bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * p_quantity)) as is_sufficient
  FROM public.bom b
  JOIN public.bom_items bi ON bi.bom_id = b.id
  JOIN public.raw_materials rm ON rm.id = bi.raw_material_id
  WHERE b.product_id = p_product_id AND b.is_active = true
  ORDER BY rm.name;
END;
$$;

-- Function to get near-expiry products
CREATE OR REPLACE FUNCTION public.get_near_expiry_products(p_days INTEGER DEFAULT 90)
RETURNS TABLE(
  batch_id UUID,
  batch_number TEXT,
  product_name TEXT,
  product_sku TEXT,
  quantity_available NUMERIC,
  expiry_date DATE,
  days_until_expiry INTEGER
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pb.id as batch_id,
    pb.batch_number,
    p.name as product_name,
    p.sku as product_sku,
    pb.quantity_produced - COALESCE((SELECT SUM(si.quantity) FROM public.sale_items si WHERE si.production_batch_id = pb.id), 0) as quantity_available,
    pb.expiry_date,
    (pb.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry
  FROM public.production_batches pb
  JOIN public.products p ON p.id = pb.product_id
  WHERE pb.status = 'completed'
    AND pb.expiry_date IS NOT NULL
    AND pb.expiry_date <= CURRENT_DATE + p_days
    AND pb.quantity_produced > COALESCE((SELECT SUM(si.quantity) FROM public.sale_items si WHERE si.production_batch_id = pb.id), 0)
  ORDER BY pb.expiry_date ASC;
END;
$$;

-- Function to get stock summary report
CREATE OR REPLACE FUNCTION public.get_stock_summary()
RETURNS TABLE(
  item_id UUID,
  item_name TEXT,
  item_sku TEXT,
  item_type TEXT,
  category TEXT,
  current_stock NUMERIC,
  reserved_stock NUMERIC,
  available_stock NUMERIC,
  unit TEXT,
  min_stock_level NUMERIC,
  stock_status TEXT,
  stock_value NUMERIC
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Raw Materials
  RETURN QUERY
  SELECT 
    rm.id as item_id,
    rm.name as item_name,
    rm.sku as item_sku,
    'Raw Material'::TEXT as item_type,
    rm.category::TEXT as category,
    rm.current_stock,
    COALESCE((SELECT SUM(sr.quantity_reserved) FROM public.stock_reservations sr WHERE sr.raw_material_id = rm.id AND sr.status = 'reserved'), 0) as reserved_stock,
    rm.current_stock - COALESCE((SELECT SUM(sr.quantity_reserved) FROM public.stock_reservations sr WHERE sr.raw_material_id = rm.id AND sr.status = 'reserved'), 0) as available_stock,
    rm.unit::TEXT as unit,
    rm.min_stock_level,
    CASE 
      WHEN rm.current_stock <= 0 THEN 'Out of Stock'
      WHEN rm.current_stock <= rm.min_stock_level THEN 'Low'
      ELSE 'OK'
    END as stock_status,
    rm.current_stock * rm.cost_per_unit as stock_value
  FROM public.raw_materials rm
  WHERE rm.is_active = true
  
  UNION ALL
  
  -- Finished Products
  SELECT 
    p.id as item_id,
    p.name as item_name,
    p.sku as item_sku,
    'Finished Goods'::TEXT as item_type,
    p.category::TEXT as category,
    p.current_stock,
    0::NUMERIC as reserved_stock,
    p.current_stock as available_stock,
    p.unit::TEXT as unit,
    p.min_stock_level,
    CASE 
      WHEN p.current_stock <= 0 THEN 'Out of Stock'
      WHEN p.current_stock <= p.min_stock_level THEN 'Low'
      ELSE 'OK'
    END as stock_status,
    p.current_stock * p.cost_price as stock_value
  FROM public.products p
  WHERE p.is_active = true
  
  ORDER BY item_type, item_name;
END;
$$;

-- Function to get batch traceability
CREATE OR REPLACE FUNCTION public.get_batch_traceability(p_production_batch_id UUID)
RETURNS TABLE(
  production_batch_number TEXT,
  product_name TEXT,
  manufacturing_date DATE,
  expiry_date DATE,
  quantity_produced NUMERIC,
  warehouse TEXT,
  rack TEXT,
  shelf TEXT,
  raw_material_name TEXT,
  raw_material_batch_number TEXT,
  quantity_used NUMERIC,
  wastage_quantity NUMERIC
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pb.batch_number as production_batch_number,
    p.name as product_name,
    pb.manufacturing_date,
    pb.expiry_date,
    pb.quantity_produced,
    pb.warehouse,
    pb.rack,
    pb.shelf,
    rm.name as raw_material_name,
    rmb.batch_number as raw_material_batch_number,
    pmu.quantity_used,
    pmu.wastage_quantity
  FROM public.production_batches pb
  JOIN public.products p ON p.id = pb.product_id
  LEFT JOIN public.production_material_usage pmu ON pmu.production_batch_id = pb.id
  LEFT JOIN public.raw_materials rm ON rm.id = pmu.raw_material_id
  LEFT JOIN public.raw_material_batches rmb ON rmb.id = pmu.raw_material_batch_id
  WHERE pb.id = p_production_batch_id
  ORDER BY rm.name;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_raw_material_batches_updated_at
  BEFORE UPDATE ON public.raw_material_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_reservations_updated_at
  BEFORE UPDATE ON public.stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_material_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_material_usage;