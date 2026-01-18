-- Create table to track damaged packaging components
CREATE TABLE public.damaged_packaging_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  damaged_goods_id UUID REFERENCES public.damaged_goods(id) ON DELETE CASCADE,
  sale_return_id UUID REFERENCES public.sale_returns(id) ON DELETE CASCADE,
  packaging_assembly_id UUID REFERENCES public.packaging_assemblies(id),
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id),
  component_name TEXT NOT NULL,
  quantity_affected NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT at_least_one_reference CHECK (
    damaged_goods_id IS NOT NULL OR sale_return_id IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE public.damaged_packaging_components ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can manage damaged_packaging_components"
  ON public.damaged_packaging_components
  FOR ALL
  USING (public.is_authenticated())
  WITH CHECK (public.is_authenticated());

-- Create function to get assembly components for a product (via BOM)
CREATE OR REPLACE FUNCTION public.get_product_packaging_assemblies(p_product_id UUID)
RETURNS TABLE(
  assembly_id UUID,
  assembly_name TEXT,
  component_id UUID,
  component_name TEXT,
  component_sku TEXT,
  quantity_per_assembly NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id as assembly_id,
    pa.name as assembly_name,
    pac.raw_material_id as component_id,
    rm.name as component_name,
    rm.sku as component_sku,
    pac.quantity_per_assembly
  FROM public.bom b
  JOIN public.bom_items bi ON bi.bom_id = b.id
  JOIN public.packaging_assemblies pa ON pa.id = bi.packaging_assembly_id
  JOIN public.packaging_assembly_components pac ON pac.assembly_id = pa.id
  JOIN public.raw_materials rm ON rm.id = pac.raw_material_id
  WHERE b.product_id = p_product_id
    AND b.is_active = true
    AND bi.packaging_assembly_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create function to track assembly components on damage
CREATE OR REPLACE FUNCTION public.track_damaged_assembly_components()
RETURNS TRIGGER AS $$
DECLARE
  v_component RECORD;
  v_quantity NUMERIC;
BEGIN
  -- Get the quantity from the damaged goods record
  v_quantity := NEW.quantity;
  
  -- Find all packaging assembly components for this product
  FOR v_component IN
    SELECT * FROM public.get_product_packaging_assemblies(NEW.product_id)
  LOOP
    -- Insert component tracking record
    INSERT INTO public.damaged_packaging_components (
      damaged_goods_id,
      packaging_assembly_id,
      raw_material_id,
      component_name,
      quantity_affected
    ) VALUES (
      NEW.id,
      v_component.assembly_id,
      v_component.component_id,
      v_component.component_name,
      v_quantity * v_component.quantity_per_assembly
    );
    
    -- Deduct from raw material stock
    UPDATE public.raw_materials
    SET current_stock = current_stock - (v_quantity * v_component.quantity_per_assembly)
    WHERE id = v_component.component_id;
    
    -- Add to material stock ledger
    INSERT INTO public.stock_ledger_materials (
      raw_material_id,
      movement_type,
      quantity,
      reference_id,
      reference_type,
      notes,
      balance_after
    ) VALUES (
      v_component.component_id,
      'damage_out',
      v_quantity * v_component.quantity_per_assembly,
      NEW.id,
      'damaged_goods',
      'Assembly component damage: ' || v_component.component_name || ' x' || (v_quantity * v_component.quantity_per_assembly)::TEXT,
      0 -- Will be updated by trigger if exists
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for damaged goods
CREATE TRIGGER track_damaged_assembly_components_trigger
  AFTER INSERT ON public.damaged_goods
  FOR EACH ROW
  EXECUTE FUNCTION public.track_damaged_assembly_components();

-- Create function to track assembly components on sale return (when not restored)
CREATE OR REPLACE FUNCTION public.track_return_assembly_components()
RETURNS TRIGGER AS $$
DECLARE
  v_component RECORD;
  v_quantity NUMERIC;
BEGIN
  -- Only track if NOT restoring to stock (means it's damaged)
  IF NEW.restore_to_stock = true THEN
    RETURN NEW;
  END IF;
  
  v_quantity := NEW.quantity_returned;
  
  -- Find all packaging assembly components for this product
  FOR v_component IN
    SELECT * FROM public.get_product_packaging_assemblies(NEW.product_id)
  LOOP
    -- Insert component tracking record
    INSERT INTO public.damaged_packaging_components (
      sale_return_id,
      packaging_assembly_id,
      raw_material_id,
      component_name,
      quantity_affected
    ) VALUES (
      NEW.id,
      v_component.assembly_id,
      v_component.component_id,
      v_component.component_name,
      v_quantity * v_component.quantity_per_assembly
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for sale returns
CREATE TRIGGER track_return_assembly_components_trigger
  AFTER INSERT ON public.sale_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.track_return_assembly_components();

-- Create function to restore assembly components when damaged goods are restored
CREATE OR REPLACE FUNCTION public.restore_assembly_components()
RETURNS TRIGGER AS $$
DECLARE
  v_component RECORD;
BEGIN
  -- Only run when status changes to 'restored'
  IF NEW.status = 'restored' AND OLD.status = 'pending' THEN
    -- Restore all tracked components
    FOR v_component IN
      SELECT * FROM public.damaged_packaging_components
      WHERE damaged_goods_id = NEW.id
    LOOP
      -- Add back to raw material stock
      UPDATE public.raw_materials
      SET current_stock = current_stock + v_component.quantity_affected
      WHERE id = v_component.raw_material_id;
      
      -- Add to material stock ledger
      INSERT INTO public.stock_ledger_materials (
        raw_material_id,
        movement_type,
        quantity,
        reference_id,
        reference_type,
        notes,
        balance_after
      ) VALUES (
        v_component.raw_material_id,
        'adjustment_in',
        v_component.quantity_affected,
        NEW.id,
        'damaged_goods_restored',
        'Assembly component restored: ' || v_component.component_name,
        0
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for restoring damaged goods
CREATE TRIGGER restore_assembly_components_trigger
  AFTER UPDATE ON public.damaged_goods
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_assembly_components();

-- Create view to see damaged components summary
CREATE OR REPLACE VIEW public.damaged_components_summary AS
SELECT 
  dpc.id,
  dpc.damaged_goods_id,
  dpc.sale_return_id,
  pa.name as assembly_name,
  rm.name as component_name,
  rm.sku as component_sku,
  dpc.quantity_affected,
  rm.cost_per_unit,
  (dpc.quantity_affected * rm.cost_per_unit) as loss_value,
  dpc.created_at,
  CASE 
    WHEN dpc.damaged_goods_id IS NOT NULL THEN 'damage'
    ELSE 'return'
  END as source_type
FROM public.damaged_packaging_components dpc
LEFT JOIN public.packaging_assemblies pa ON pa.id = dpc.packaging_assembly_id
JOIN public.raw_materials rm ON rm.id = dpc.raw_material_id
ORDER BY dpc.created_at DESC;