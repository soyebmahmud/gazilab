-- Create packaging assemblies table
-- This allows defining composite packaging like "100ml Syrup Bottle Complete"
-- which contains multiple components (bottle, cap, seal, label, etc.)

CREATE TABLE public.packaging_assemblies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  description TEXT,
  packaging_level TEXT NOT NULL DEFAULT 'primary',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create packaging assembly components table
CREATE TABLE public.packaging_assembly_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assembly_id UUID NOT NULL REFERENCES public.packaging_assemblies(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  quantity_per_assembly NUMERIC NOT NULL DEFAULT 1,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add assembly reference to bom_items
ALTER TABLE public.bom_items 
ADD COLUMN packaging_assembly_id UUID REFERENCES public.packaging_assemblies(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.packaging_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_assembly_components ENABLE ROW LEVEL SECURITY;

-- RLS Policies for packaging_assemblies
CREATE POLICY "Authenticated users can read packaging_assemblies"
ON public.packaging_assemblies FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert packaging_assemblies"
ON public.packaging_assemblies FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update packaging_assemblies"
ON public.packaging_assemblies FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete packaging_assemblies"
ON public.packaging_assemblies FOR DELETE
USING (true);

-- RLS Policies for packaging_assembly_components
CREATE POLICY "Authenticated users can read packaging_assembly_components"
ON public.packaging_assembly_components FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert packaging_assembly_components"
ON public.packaging_assembly_components FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update packaging_assembly_components"
ON public.packaging_assembly_components FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete packaging_assembly_components"
ON public.packaging_assembly_components FOR DELETE
USING (true);

-- Create indexes
CREATE INDEX idx_packaging_assembly_components_assembly ON public.packaging_assembly_components(assembly_id);
CREATE INDEX idx_bom_items_assembly ON public.bom_items(packaging_assembly_id);

-- Function to expand assemblies in BOM for production
CREATE OR REPLACE FUNCTION public.get_expanded_bom_materials(
  p_bom_id UUID,
  p_production_quantity NUMERIC
)
RETURNS TABLE (
  raw_material_id UUID,
  material_name TEXT,
  material_sku TEXT,
  material_unit TEXT,
  bom_layer TEXT,
  base_quantity NUMERIC,
  wastage_percent NUMERIC,
  total_required NUMERIC,
  is_from_assembly BOOLEAN,
  assembly_name TEXT,
  cost_per_unit NUMERIC,
  total_cost NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.raw_material_id,
    rm.name AS material_name,
    rm.sku AS material_sku,
    rm.unit::TEXT AS material_unit,
    COALESCE(bi.bom_layer::TEXT, 'api_excipient') AS bom_layer,
    bi.quantity_per_unit AS base_quantity,
    bi.wastage_percent,
    (bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * p_production_quantity) AS total_required,
    false AS is_from_assembly,
    NULL::TEXT AS assembly_name,
    rm.cost_per_unit,
    (bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * p_production_quantity * rm.cost_per_unit) AS total_cost
  FROM bom_items bi
  JOIN raw_materials rm ON rm.id = bi.raw_material_id
  WHERE bi.bom_id = p_bom_id
    AND bi.packaging_assembly_id IS NULL
  
  UNION ALL
  
  SELECT 
    pac.raw_material_id,
    rm.name AS material_name,
    rm.sku AS material_sku,
    rm.unit::TEXT AS material_unit,
    COALESCE(bi.bom_layer::TEXT, 'primary_packaging') AS bom_layer,
    (bi.quantity_per_unit * pac.quantity_per_assembly) AS base_quantity,
    bi.wastage_percent,
    (bi.quantity_per_unit * pac.quantity_per_assembly * (1 + bi.wastage_percent / 100) * p_production_quantity) AS total_required,
    true AS is_from_assembly,
    pa.name AS assembly_name,
    rm.cost_per_unit,
    (bi.quantity_per_unit * pac.quantity_per_assembly * (1 + bi.wastage_percent / 100) * p_production_quantity * rm.cost_per_unit) AS total_cost
  FROM bom_items bi
  JOIN packaging_assemblies pa ON pa.id = bi.packaging_assembly_id
  JOIN packaging_assembly_components pac ON pac.assembly_id = pa.id
  JOIN raw_materials rm ON rm.id = pac.raw_material_id
  WHERE bi.bom_id = p_bom_id
    AND bi.packaging_assembly_id IS NOT NULL
    AND pa.is_active = true;
END;
$$;