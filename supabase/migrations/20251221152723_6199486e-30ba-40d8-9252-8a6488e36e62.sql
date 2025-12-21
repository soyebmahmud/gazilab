-- =============================================
-- 1. ADD SALES RETURNS TABLE AND MOVEMENT TYPES
-- =============================================

-- Add new movement types for returns and damage
ALTER TYPE stock_movement_type ADD VALUE IF NOT EXISTS 'sale_return';
ALTER TYPE stock_movement_type ADD VALUE IF NOT EXISTS 'damage_out';
ALTER TYPE stock_movement_type ADD VALUE IF NOT EXISTS 'expired_out';

-- Create sale_returns table
CREATE TABLE public.sale_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id),
  sale_item_id UUID REFERENCES public.sale_items(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  production_batch_id UUID REFERENCES public.production_batches(id),
  original_invoice_number TEXT NOT NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_returned NUMERIC NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('customer_return', 'damaged', 'expired', 'quality_rejected')),
  return_status TEXT NOT NULL DEFAULT 'pending' CHECK (return_status IN ('pending', 'restored', 'damaged', 'destroyed')),
  restore_to_stock BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sale_returns
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on sale_returns" ON public.sale_returns FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sale_returns" ON public.sale_returns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sale_returns" ON public.sale_returns FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on sale_returns" ON public.sale_returns FOR DELETE USING (true);

-- Create damaged_goods table for tracking damaged/expired inventory
CREATE TABLE public.damaged_goods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  production_batch_id UUID REFERENCES public.production_batches(id),
  quantity NUMERIC NOT NULL,
  damage_type TEXT NOT NULL CHECK (damage_type IN ('handling', 'expired', 'quality_rejected', 'manufacturing_wastage', 'customer_return')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'restored', 'destroyed')),
  source_reference_id UUID,
  source_reference_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on damaged_goods
ALTER TABLE public.damaged_goods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on damaged_goods" ON public.damaged_goods FOR SELECT USING (true);
CREATE POLICY "Allow public insert on damaged_goods" ON public.damaged_goods FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on damaged_goods" ON public.damaged_goods FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on damaged_goods" ON public.damaged_goods FOR DELETE USING (true);

-- =============================================
-- 2. STOCK VALIDATION FUNCTION (PREVENTS OVERSELLING)
-- =============================================

CREATE OR REPLACE FUNCTION public.validate_sale_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_available_stock NUMERIC;
  v_product_name TEXT;
BEGIN
  -- Get available stock for the product
  SELECT p.current_stock, p.name INTO v_available_stock, v_product_name
  FROM public.products p
  WHERE p.id = NEW.product_id;
  
  -- Check if sufficient stock
  IF NEW.quantity > v_available_stock THEN
    RAISE EXCEPTION 'Insufficient stock for product "%". Available: %, Requested: %', 
      v_product_name, v_available_stock, NEW.quantity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for stock validation on sale_items insert
CREATE TRIGGER validate_sale_stock_trigger
  BEFORE INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sale_stock();

-- =============================================
-- 3. FUNCTION TO PROCESS SALE RETURN
-- =============================================

CREATE OR REPLACE FUNCTION public.process_sale_return(
  p_sale_id UUID,
  p_sale_item_id UUID,
  p_quantity NUMERIC,
  p_reason TEXT,
  p_restore_to_stock BOOLEAN DEFAULT false,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_sale_item RECORD;
  v_sale RECORD;
  v_return_id UUID;
  v_movement_type TEXT;
BEGIN
  -- Get sale item details
  SELECT si.*, p.name as product_name
  INTO v_sale_item
  FROM public.sale_items si
  JOIN public.products p ON p.id = si.product_id
  WHERE si.id = p_sale_item_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale item not found';
  END IF;
  
  -- Get sale details
  SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id;
  
  -- Validate quantity
  IF p_quantity > v_sale_item.quantity THEN
    RAISE EXCEPTION 'Return quantity (%) exceeds original sold quantity (%)', p_quantity, v_sale_item.quantity;
  END IF;
  
  -- Create sale return record
  INSERT INTO public.sale_returns (
    sale_id, sale_item_id, product_id, production_batch_id,
    original_invoice_number, quantity_returned, reason, 
    restore_to_stock, notes,
    return_status
  ) VALUES (
    p_sale_id, p_sale_item_id, v_sale_item.product_id, v_sale_item.production_batch_id,
    v_sale.invoice_number, p_quantity, p_reason,
    p_restore_to_stock, p_notes,
    CASE WHEN p_restore_to_stock THEN 'restored' ELSE 'pending' END
  ) RETURNING id INTO v_return_id;
  
  -- If restoring to stock, add to product stock via ledger
  IF p_restore_to_stock THEN
    INSERT INTO public.stock_ledger_products (
      product_id, movement_type, quantity, 
      reference_id, reference_type, notes, balance_after
    ) VALUES (
      v_sale_item.product_id, 'sale_return', p_quantity,
      v_return_id, 'sale_return',
      'Return from ' || v_sale.invoice_number || ': ' || p_reason,
      0 -- Will be calculated by trigger
    );
  ELSE
    -- Add to damaged goods for later decision
    INSERT INTO public.damaged_goods (
      product_id, production_batch_id, quantity,
      damage_type, source_reference_id, source_reference_type, notes
    ) VALUES (
      v_sale_item.product_id, v_sale_item.production_batch_id, p_quantity,
      'customer_return', v_return_id, 'sale_return',
      'From ' || v_sale.invoice_number || ': ' || p_reason || COALESCE(' - ' || p_notes, '')
    );
  END IF;
  
  RETURN v_return_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- 4. FUNCTION TO RECORD DAMAGE/WASTAGE
-- =============================================

CREATE OR REPLACE FUNCTION public.record_product_damage(
  p_product_id UUID,
  p_production_batch_id UUID,
  p_quantity NUMERIC,
  p_damage_type TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_damage_id UUID;
  v_current_stock NUMERIC;
BEGIN
  -- Check current stock
  SELECT current_stock INTO v_current_stock FROM public.products WHERE id = p_product_id;
  
  IF p_quantity > v_current_stock THEN
    RAISE EXCEPTION 'Damage quantity (%) exceeds current stock (%)', p_quantity, v_current_stock;
  END IF;
  
  -- Create damaged goods record
  INSERT INTO public.damaged_goods (
    product_id, production_batch_id, quantity, damage_type, notes
  ) VALUES (
    p_product_id, p_production_batch_id, p_quantity, p_damage_type, p_notes
  ) RETURNING id INTO v_damage_id;
  
  -- Deduct from stock via ledger
  INSERT INTO public.stock_ledger_products (
    product_id, movement_type, quantity,
    reference_id, reference_type, notes, balance_after
  ) VALUES (
    p_product_id, 'damage_out', p_quantity,
    v_damage_id, 'damaged_goods',
    'Damage: ' || p_damage_type || COALESCE(' - ' || p_notes, ''),
    0 -- Will be calculated by trigger
  );
  
  RETURN v_damage_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- 5. FUNCTION TO RESTORE DAMAGED GOODS TO STOCK
-- =============================================

CREATE OR REPLACE FUNCTION public.restore_damaged_goods(
  p_damaged_goods_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_damaged RECORD;
BEGIN
  -- Get damaged goods record
  SELECT * INTO v_damaged FROM public.damaged_goods WHERE id = p_damaged_goods_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Damaged goods record not found';
  END IF;
  
  IF v_damaged.status != 'pending' THEN
    RAISE EXCEPTION 'Cannot restore: item already processed (status: %)', v_damaged.status;
  END IF;
  
  -- Update status
  UPDATE public.damaged_goods SET status = 'restored', updated_at = now() WHERE id = p_damaged_goods_id;
  
  -- Add back to stock via ledger
  INSERT INTO public.stock_ledger_products (
    product_id, movement_type, quantity,
    reference_id, reference_type, notes, balance_after
  ) VALUES (
    v_damaged.product_id, 'adjustment_in', v_damaged.quantity,
    p_damaged_goods_id, 'damaged_goods_restore',
    'Restored from damaged goods',
    0 -- Will be calculated by trigger
  );
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- 6. FUNCTION TO MARK DAMAGED GOODS AS DESTROYED
-- =============================================

CREATE OR REPLACE FUNCTION public.destroy_damaged_goods(
  p_damaged_goods_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_damaged RECORD;
BEGIN
  -- Get damaged goods record
  SELECT * INTO v_damaged FROM public.damaged_goods WHERE id = p_damaged_goods_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Damaged goods record not found';
  END IF;
  
  IF v_damaged.status != 'pending' THEN
    RAISE EXCEPTION 'Cannot destroy: item already processed (status: %)', v_damaged.status;
  END IF;
  
  -- Update status
  UPDATE public.damaged_goods 
  SET status = 'destroyed', 
      notes = COALESCE(notes || ' | ', '') || 'Destroyed: ' || COALESCE(p_notes, 'No reason given'),
      updated_at = now() 
  WHERE id = p_damaged_goods_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- 7. UPDATE STOCK RECALCULATION TO HANDLE NEW MOVEMENT TYPES
-- =============================================

CREATE OR REPLACE FUNCTION public.recalculate_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products 
  SET current_stock = COALESCE((
    SELECT SUM(
      CASE 
        WHEN movement_type IN ('opening', 'production_in', 'adjustment_in', 'purchase', 'sale_return') THEN quantity
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

-- Recreate trigger to ensure it uses updated function
DROP TRIGGER IF EXISTS trigger_recalculate_product_stock ON public.stock_ledger_products;
CREATE TRIGGER trigger_recalculate_product_stock
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_ledger_products
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_product_stock();

-- Add updated_at trigger to new tables
CREATE TRIGGER update_sale_returns_updated_at
  BEFORE UPDATE ON public.sale_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_damaged_goods_updated_at
  BEFORE UPDATE ON public.damaged_goods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();