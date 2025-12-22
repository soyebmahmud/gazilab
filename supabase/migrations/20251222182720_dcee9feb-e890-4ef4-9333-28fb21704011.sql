-- =====================================================
-- PHARMACEUTICAL PACKAGING LAYERS SCHEMA
-- =====================================================

-- 1. Add dosage form type enum for pharmaceutical products
CREATE TYPE dosage_form AS ENUM (
  'tablet',
  'capsule', 
  'syrup',
  'suspension',
  'injection',
  'cream',
  'ointment',
  'powder',
  'drops',
  'vial',
  'other'
);

-- 2. Add BOM layer type enum for hierarchical BOM
CREATE TYPE bom_layer AS ENUM (
  'api_excipient',      -- Active Pharmaceutical Ingredient + Excipients
  'primary_packaging',   -- Direct contact: blister, bottle, vial
  'secondary_packaging', -- Box, carton
  'tertiary_packaging'   -- Shipper, bulk packaging
);

-- 3. Add packaging unit type enum
CREATE TYPE packaging_unit AS ENUM (
  'strip',
  'blister',
  'bottle',
  'vial',
  'ampoule',
  'tube',
  'jar',
  'sachet',
  'box',
  'carton',
  'shipper'
);

-- 4. Extend products table with pharmaceutical fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS dosage_form dosage_form DEFAULT 'tablet';
ALTER TABLE products ADD COLUMN IF NOT EXISTS strength TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_size NUMERIC DEFAULT 1000;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_life_months INTEGER DEFAULT 24;

-- 5. Create product_packaging_configs table for packaging layer definitions
CREATE TABLE product_packaging_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  config_name TEXT NOT NULL DEFAULT 'Default',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Primary packaging layer (direct contact)
  primary_pack_type packaging_unit NOT NULL DEFAULT 'strip',
  units_per_primary_pack INTEGER NOT NULL DEFAULT 10, -- e.g., 10 tablets per strip
  
  -- Secondary packaging layer (box)
  secondary_pack_type packaging_unit DEFAULT 'box',
  primary_packs_per_secondary INTEGER DEFAULT 10, -- e.g., 10 strips per box
  
  -- Tertiary packaging layer (carton/shipper)
  tertiary_pack_type packaging_unit DEFAULT 'carton',
  secondary_packs_per_tertiary INTEGER DEFAULT 20, -- e.g., 20 boxes per carton
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Add layer column to bom_items for hierarchical BOM
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS bom_layer bom_layer DEFAULT 'api_excipient';
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS scales_with packaging_unit DEFAULT NULL;

-- 7. Add packaging config to production batches
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS packaging_config_id UUID REFERENCES product_packaging_configs(id);

-- 8. Enable RLS on new table
ALTER TABLE product_packaging_configs ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for packaging configs
CREATE POLICY "Authenticated users can read product_packaging_configs"
ON product_packaging_configs FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert product_packaging_configs"
ON product_packaging_configs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update product_packaging_configs"
ON product_packaging_configs FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete product_packaging_configs"
ON product_packaging_configs FOR DELETE
USING (true);

-- 10. Create trigger for updated_at
CREATE TRIGGER update_packaging_configs_updated_at
BEFORE UPDATE ON product_packaging_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 11. Create function to calculate total units from packaging hierarchy
CREATE OR REPLACE FUNCTION calculate_packaging_units(
  p_packaging_config_id UUID,
  p_quantity NUMERIC,
  p_unit_type TEXT -- 'primary', 'secondary', 'tertiary'
)
RETURNS TABLE (
  total_units NUMERIC,
  primary_packs NUMERIC,
  secondary_packs NUMERIC,
  tertiary_packs NUMERIC
)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_config RECORD;
BEGIN
  SELECT * INTO v_config FROM product_packaging_configs WHERE id = p_packaging_config_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Packaging configuration not found';
  END IF;
  
  -- Calculate based on input unit type
  IF p_unit_type = 'tertiary' THEN
    tertiary_packs := p_quantity;
    secondary_packs := p_quantity * COALESCE(v_config.secondary_packs_per_tertiary, 1);
    primary_packs := secondary_packs * COALESCE(v_config.primary_packs_per_secondary, 1);
    total_units := primary_packs * v_config.units_per_primary_pack;
  ELSIF p_unit_type = 'secondary' THEN
    secondary_packs := p_quantity;
    tertiary_packs := CEIL(p_quantity / GREATEST(COALESCE(v_config.secondary_packs_per_tertiary, 1), 1));
    primary_packs := p_quantity * COALESCE(v_config.primary_packs_per_secondary, 1);
    total_units := primary_packs * v_config.units_per_primary_pack;
  ELSIF p_unit_type = 'primary' THEN
    primary_packs := p_quantity;
    secondary_packs := CEIL(p_quantity / GREATEST(COALESCE(v_config.primary_packs_per_secondary, 1), 1));
    tertiary_packs := CEIL(secondary_packs / GREATEST(COALESCE(v_config.secondary_packs_per_tertiary, 1), 1));
    total_units := p_quantity * v_config.units_per_primary_pack;
  ELSE -- units
    total_units := p_quantity;
    primary_packs := CEIL(p_quantity / v_config.units_per_primary_pack);
    secondary_packs := CEIL(primary_packs / GREATEST(COALESCE(v_config.primary_packs_per_secondary, 1), 1));
    tertiary_packs := CEIL(secondary_packs / GREATEST(COALESCE(v_config.secondary_packs_per_tertiary, 1), 1));
  END IF;
  
  RETURN NEXT;
END;
$$;

-- 12. Create function to get BOM with packaging materials calculated
CREATE OR REPLACE FUNCTION get_hierarchical_bom(
  p_product_id UUID,
  p_packaging_config_id UUID,
  p_production_quantity NUMERIC
)
RETURNS TABLE (
  bom_item_id UUID,
  raw_material_id UUID,
  material_name TEXT,
  material_sku TEXT,
  material_unit TEXT,
  bom_layer bom_layer,
  scales_with packaging_unit,
  base_quantity_per_unit NUMERIC,
  wastage_percent NUMERIC,
  calculated_quantity NUMERIC,
  cost_per_unit NUMERIC,
  total_cost NUMERIC
)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_config RECORD;
  v_total_units NUMERIC;
  v_primary_packs NUMERIC;
  v_secondary_packs NUMERIC;
  v_tertiary_packs NUMERIC;
  v_bom_id UUID;
BEGIN
  -- Get packaging config
  SELECT * INTO v_config FROM product_packaging_configs WHERE id = p_packaging_config_id;
  
  -- Calculate packaging quantities
  v_total_units := p_production_quantity;
  v_primary_packs := CEIL(p_production_quantity / GREATEST(v_config.units_per_primary_pack, 1));
  v_secondary_packs := CEIL(v_primary_packs / GREATEST(COALESCE(v_config.primary_packs_per_secondary, 1), 1));
  v_tertiary_packs := CEIL(v_secondary_packs / GREATEST(COALESCE(v_config.secondary_packs_per_tertiary, 1), 1));
  
  -- Get active BOM
  SELECT id INTO v_bom_id FROM bom WHERE product_id = p_product_id AND is_active = true LIMIT 1;
  
  IF v_bom_id IS NULL THEN
    RAISE EXCEPTION 'No active BOM found for product';
  END IF;
  
  RETURN QUERY
  SELECT 
    bi.id as bom_item_id,
    bi.raw_material_id,
    rm.name as material_name,
    rm.sku as material_sku,
    rm.unit::TEXT as material_unit,
    COALESCE(bi.bom_layer, 'api_excipient'::bom_layer) as bom_layer,
    bi.scales_with,
    bi.quantity_per_unit as base_quantity_per_unit,
    bi.wastage_percent,
    CASE 
      -- API/Excipient: scales with total units
      WHEN COALESCE(bi.bom_layer, 'api_excipient') = 'api_excipient' THEN
        bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * v_total_units
      -- Primary packaging: scales with primary packs
      WHEN bi.bom_layer = 'primary_packaging' THEN
        bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * v_primary_packs
      -- Secondary packaging: scales with secondary packs
      WHEN bi.bom_layer = 'secondary_packaging' THEN
        bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * v_secondary_packs
      -- Tertiary packaging: scales with tertiary packs
      WHEN bi.bom_layer = 'tertiary_packaging' THEN
        bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * v_tertiary_packs
      ELSE
        bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * v_total_units
    END as calculated_quantity,
    rm.cost_per_unit,
    CASE 
      WHEN COALESCE(bi.bom_layer, 'api_excipient') = 'api_excipient' THEN
        bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * v_total_units * rm.cost_per_unit
      WHEN bi.bom_layer = 'primary_packaging' THEN
        bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * v_primary_packs * rm.cost_per_unit
      WHEN bi.bom_layer = 'secondary_packaging' THEN
        bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * v_secondary_packs * rm.cost_per_unit
      WHEN bi.bom_layer = 'tertiary_packaging' THEN
        bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * v_tertiary_packs * rm.cost_per_unit
      ELSE
        bi.quantity_per_unit * (1 + bi.wastage_percent / 100) * v_total_units * rm.cost_per_unit
    END as total_cost
  FROM bom_items bi
  JOIN raw_materials rm ON rm.id = bi.raw_material_id
  WHERE bi.bom_id = v_bom_id
  ORDER BY bi.bom_layer, rm.name;
END;
$$;

-- 13. Index for faster queries
CREATE INDEX IF NOT EXISTS idx_packaging_configs_product ON product_packaging_configs(product_id);
CREATE INDEX IF NOT EXISTS idx_packaging_configs_active ON product_packaging_configs(product_id, is_active, is_default);
CREATE INDEX IF NOT EXISTS idx_bom_items_layer ON bom_items(bom_layer);