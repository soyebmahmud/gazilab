
-- Add units_per_pack column to products for strip/tablet conversion
-- This allows BOM to calculate per unit (tablet) while production can enter packs (strips)
ALTER TABLE public.products 
ADD COLUMN units_per_pack integer NOT NULL DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN public.products.units_per_pack IS 'Number of units per pack/strip. E.g., 10 tablets per strip. BOM calculates per unit, production converts.';
