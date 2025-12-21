-- Create role enum and user_roles table for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policy for user_roles table
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Drop all existing public access policies and replace with authenticated-only policies

-- bom table
DROP POLICY IF EXISTS "Allow public delete on bom" ON public.bom;
DROP POLICY IF EXISTS "Allow public insert on bom" ON public.bom;
DROP POLICY IF EXISTS "Allow public read on bom" ON public.bom;
DROP POLICY IF EXISTS "Allow public update on bom" ON public.bom;
CREATE POLICY "Authenticated users can read bom" ON public.bom FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bom" ON public.bom FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bom" ON public.bom FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete bom" ON public.bom FOR DELETE TO authenticated USING (true);

-- bom_items table
DROP POLICY IF EXISTS "Allow public delete on bom_items" ON public.bom_items;
DROP POLICY IF EXISTS "Allow public insert on bom_items" ON public.bom_items;
DROP POLICY IF EXISTS "Allow public read on bom_items" ON public.bom_items;
DROP POLICY IF EXISTS "Allow public update on bom_items" ON public.bom_items;
CREATE POLICY "Authenticated users can read bom_items" ON public.bom_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bom_items" ON public.bom_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bom_items" ON public.bom_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete bom_items" ON public.bom_items FOR DELETE TO authenticated USING (true);

-- customers table
DROP POLICY IF EXISTS "Allow public delete on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public insert on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public read on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public update on customers" ON public.customers;
CREATE POLICY "Authenticated users can read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

-- damaged_goods table
DROP POLICY IF EXISTS "Allow public delete on damaged_goods" ON public.damaged_goods;
DROP POLICY IF EXISTS "Allow public insert on damaged_goods" ON public.damaged_goods;
DROP POLICY IF EXISTS "Allow public read on damaged_goods" ON public.damaged_goods;
DROP POLICY IF EXISTS "Allow public update on damaged_goods" ON public.damaged_goods;
CREATE POLICY "Authenticated users can read damaged_goods" ON public.damaged_goods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert damaged_goods" ON public.damaged_goods FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update damaged_goods" ON public.damaged_goods FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete damaged_goods" ON public.damaged_goods FOR DELETE TO authenticated USING (true);

-- production_batches table
DROP POLICY IF EXISTS "Allow public delete on production_batches" ON public.production_batches;
DROP POLICY IF EXISTS "Allow public insert on production_batches" ON public.production_batches;
DROP POLICY IF EXISTS "Allow public read on production_batches" ON public.production_batches;
DROP POLICY IF EXISTS "Allow public update on production_batches" ON public.production_batches;
CREATE POLICY "Authenticated users can read production_batches" ON public.production_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert production_batches" ON public.production_batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update production_batches" ON public.production_batches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete production_batches" ON public.production_batches FOR DELETE TO authenticated USING (true);

-- production_material_usage table
DROP POLICY IF EXISTS "Allow public delete on production_material_usage" ON public.production_material_usage;
DROP POLICY IF EXISTS "Allow public insert on production_material_usage" ON public.production_material_usage;
DROP POLICY IF EXISTS "Allow public read on production_material_usage" ON public.production_material_usage;
DROP POLICY IF EXISTS "Allow public update on production_material_usage" ON public.production_material_usage;
CREATE POLICY "Authenticated users can read production_material_usage" ON public.production_material_usage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert production_material_usage" ON public.production_material_usage FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update production_material_usage" ON public.production_material_usage FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete production_material_usage" ON public.production_material_usage FOR DELETE TO authenticated USING (true);

-- products table
DROP POLICY IF EXISTS "Allow public delete on products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert on products" ON public.products;
DROP POLICY IF EXISTS "Allow public read on products" ON public.products;
DROP POLICY IF EXISTS "Allow public update on products" ON public.products;
CREATE POLICY "Authenticated users can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE TO authenticated USING (true);

-- purchase_order_items table
DROP POLICY IF EXISTS "Allow public delete on purchase_order_items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Allow public insert on purchase_order_items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Allow public read on purchase_order_items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Allow public update on purchase_order_items" ON public.purchase_order_items;
CREATE POLICY "Authenticated users can read purchase_order_items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert purchase_order_items" ON public.purchase_order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update purchase_order_items" ON public.purchase_order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete purchase_order_items" ON public.purchase_order_items FOR DELETE TO authenticated USING (true);

-- purchase_orders table
DROP POLICY IF EXISTS "Allow public delete on purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow public insert on purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow public read on purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow public update on purchase_orders" ON public.purchase_orders;
CREATE POLICY "Authenticated users can read purchase_orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert purchase_orders" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update purchase_orders" ON public.purchase_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete purchase_orders" ON public.purchase_orders FOR DELETE TO authenticated USING (true);

-- raw_material_batches table
DROP POLICY IF EXISTS "Allow public delete on raw_material_batches" ON public.raw_material_batches;
DROP POLICY IF EXISTS "Allow public insert on raw_material_batches" ON public.raw_material_batches;
DROP POLICY IF EXISTS "Allow public read on raw_material_batches" ON public.raw_material_batches;
DROP POLICY IF EXISTS "Allow public update on raw_material_batches" ON public.raw_material_batches;
CREATE POLICY "Authenticated users can read raw_material_batches" ON public.raw_material_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert raw_material_batches" ON public.raw_material_batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update raw_material_batches" ON public.raw_material_batches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete raw_material_batches" ON public.raw_material_batches FOR DELETE TO authenticated USING (true);

-- raw_materials table
DROP POLICY IF EXISTS "Allow public delete on raw_materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Allow public insert on raw_materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Allow public read on raw_materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Allow public update on raw_materials" ON public.raw_materials;
CREATE POLICY "Authenticated users can read raw_materials" ON public.raw_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert raw_materials" ON public.raw_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update raw_materials" ON public.raw_materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete raw_materials" ON public.raw_materials FOR DELETE TO authenticated USING (true);

-- sale_items table
DROP POLICY IF EXISTS "Allow public delete on sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Allow public insert on sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Allow public read on sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Allow public update on sale_items" ON public.sale_items;
CREATE POLICY "Authenticated users can read sale_items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sale_items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sale_items" ON public.sale_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sale_items" ON public.sale_items FOR DELETE TO authenticated USING (true);

-- sale_payments table
DROP POLICY IF EXISTS "Allow public delete on sale_payments" ON public.sale_payments;
DROP POLICY IF EXISTS "Allow public insert on sale_payments" ON public.sale_payments;
DROP POLICY IF EXISTS "Allow public read on sale_payments" ON public.sale_payments;
DROP POLICY IF EXISTS "Allow public update on sale_payments" ON public.sale_payments;
CREATE POLICY "Authenticated users can read sale_payments" ON public.sale_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sale_payments" ON public.sale_payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sale_payments" ON public.sale_payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sale_payments" ON public.sale_payments FOR DELETE TO authenticated USING (true);

-- sale_returns table
DROP POLICY IF EXISTS "Allow public delete on sale_returns" ON public.sale_returns;
DROP POLICY IF EXISTS "Allow public insert on sale_returns" ON public.sale_returns;
DROP POLICY IF EXISTS "Allow public read on sale_returns" ON public.sale_returns;
DROP POLICY IF EXISTS "Allow public update on sale_returns" ON public.sale_returns;
CREATE POLICY "Authenticated users can read sale_returns" ON public.sale_returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sale_returns" ON public.sale_returns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sale_returns" ON public.sale_returns FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sale_returns" ON public.sale_returns FOR DELETE TO authenticated USING (true);

-- sales table
DROP POLICY IF EXISTS "Allow public delete on sales" ON public.sales;
DROP POLICY IF EXISTS "Allow public insert on sales" ON public.sales;
DROP POLICY IF EXISTS "Allow public read on sales" ON public.sales;
DROP POLICY IF EXISTS "Allow public update on sales" ON public.sales;
CREATE POLICY "Authenticated users can read sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sales" ON public.sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sales" ON public.sales FOR DELETE TO authenticated USING (true);

-- sellers table
DROP POLICY IF EXISTS "Allow public delete on sellers" ON public.sellers;
DROP POLICY IF EXISTS "Allow public insert on sellers" ON public.sellers;
DROP POLICY IF EXISTS "Allow public read on sellers" ON public.sellers;
DROP POLICY IF EXISTS "Allow public update on sellers" ON public.sellers;
CREATE POLICY "Authenticated users can read sellers" ON public.sellers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sellers" ON public.sellers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sellers" ON public.sellers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sellers" ON public.sellers FOR DELETE TO authenticated USING (true);

-- stock_ledger_materials table
DROP POLICY IF EXISTS "Allow public delete on stock_ledger_materials" ON public.stock_ledger_materials;
DROP POLICY IF EXISTS "Allow public insert on stock_ledger_materials" ON public.stock_ledger_materials;
DROP POLICY IF EXISTS "Allow public read on stock_ledger_materials" ON public.stock_ledger_materials;
DROP POLICY IF EXISTS "Allow public update on stock_ledger_materials" ON public.stock_ledger_materials;
CREATE POLICY "Authenticated users can read stock_ledger_materials" ON public.stock_ledger_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stock_ledger_materials" ON public.stock_ledger_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stock_ledger_materials" ON public.stock_ledger_materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stock_ledger_materials" ON public.stock_ledger_materials FOR DELETE TO authenticated USING (true);

-- stock_ledger_products table
DROP POLICY IF EXISTS "Allow public delete on stock_ledger_products" ON public.stock_ledger_products;
DROP POLICY IF EXISTS "Allow public insert on stock_ledger_products" ON public.stock_ledger_products;
DROP POLICY IF EXISTS "Allow public read on stock_ledger_products" ON public.stock_ledger_products;
DROP POLICY IF EXISTS "Allow public update on stock_ledger_products" ON public.stock_ledger_products;
CREATE POLICY "Authenticated users can read stock_ledger_products" ON public.stock_ledger_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stock_ledger_products" ON public.stock_ledger_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stock_ledger_products" ON public.stock_ledger_products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stock_ledger_products" ON public.stock_ledger_products FOR DELETE TO authenticated USING (true);

-- stock_reservations table
DROP POLICY IF EXISTS "Allow public delete on stock_reservations" ON public.stock_reservations;
DROP POLICY IF EXISTS "Allow public insert on stock_reservations" ON public.stock_reservations;
DROP POLICY IF EXISTS "Allow public read on stock_reservations" ON public.stock_reservations;
DROP POLICY IF EXISTS "Allow public update on stock_reservations" ON public.stock_reservations;
CREATE POLICY "Authenticated users can read stock_reservations" ON public.stock_reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stock_reservations" ON public.stock_reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stock_reservations" ON public.stock_reservations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stock_reservations" ON public.stock_reservations FOR DELETE TO authenticated USING (true);

-- Update database functions to require authentication
CREATE OR REPLACE FUNCTION public.process_sale_return(p_sale_id uuid, p_sale_item_id uuid, p_quantity numeric, p_reason text, p_restore_to_stock boolean DEFAULT false, p_notes text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_sale_item RECORD;
  v_sale RECORD;
  v_return_id UUID;
BEGIN
  -- Verify authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

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
    restore_to_stock, notes, return_status
  ) VALUES (
    p_sale_id, p_sale_item_id, v_sale_item.product_id, v_sale_item.production_batch_id,
    v_sale.invoice_number, p_quantity, p_reason,
    p_restore_to_stock, p_notes,
    CASE WHEN p_restore_to_stock THEN 'restored' ELSE 'pending' END
  ) RETURNING id INTO v_return_id;
  
  IF p_restore_to_stock THEN
    INSERT INTO public.stock_ledger_products (
      product_id, movement_type, quantity, 
      reference_id, reference_type, notes, balance_after
    ) VALUES (
      v_sale_item.product_id, 'sale_return', p_quantity,
      v_return_id, 'sale_return',
      'Return from ' || v_sale.invoice_number || ': ' || p_reason, 0
    );
  ELSE
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
$function$;

CREATE OR REPLACE FUNCTION public.record_product_damage(p_product_id uuid, p_production_batch_id uuid, p_quantity numeric, p_damage_type text, p_notes text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_damage_id UUID;
  v_current_stock NUMERIC;
BEGIN
  -- Verify authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT current_stock INTO v_current_stock FROM public.products WHERE id = p_product_id;
  
  IF p_quantity > v_current_stock THEN
    RAISE EXCEPTION 'Damage quantity (%) exceeds current stock (%)', p_quantity, v_current_stock;
  END IF;
  
  INSERT INTO public.damaged_goods (
    product_id, production_batch_id, quantity, damage_type, notes
  ) VALUES (
    p_product_id, p_production_batch_id, p_quantity, p_damage_type, p_notes
  ) RETURNING id INTO v_damage_id;
  
  INSERT INTO public.stock_ledger_products (
    product_id, movement_type, quantity,
    reference_id, reference_type, notes, balance_after
  ) VALUES (
    p_product_id, 'damage_out', p_quantity,
    v_damage_id, 'damaged_goods',
    'Damage: ' || p_damage_type || COALESCE(' - ' || p_notes, ''), 0
  );
  
  RETURN v_damage_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restore_damaged_goods(p_damaged_goods_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_damaged RECORD;
BEGIN
  -- Verify authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_damaged FROM public.damaged_goods WHERE id = p_damaged_goods_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Damaged goods record not found';
  END IF;
  
  IF v_damaged.status != 'pending' THEN
    RAISE EXCEPTION 'Cannot restore: item already processed (status: %)', v_damaged.status;
  END IF;
  
  UPDATE public.damaged_goods SET status = 'restored', updated_at = now() WHERE id = p_damaged_goods_id;
  
  INSERT INTO public.stock_ledger_products (
    product_id, movement_type, quantity,
    reference_id, reference_type, notes, balance_after
  ) VALUES (
    v_damaged.product_id, 'adjustment_in', v_damaged.quantity,
    p_damaged_goods_id, 'damaged_goods_restore',
    'Restored from damaged goods', 0
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.destroy_damaged_goods(p_damaged_goods_id uuid, p_notes text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_damaged RECORD;
BEGIN
  -- Verify authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_damaged FROM public.damaged_goods WHERE id = p_damaged_goods_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Damaged goods record not found';
  END IF;
  
  IF v_damaged.status != 'pending' THEN
    RAISE EXCEPTION 'Cannot destroy: item already processed (status: %)', v_damaged.status;
  END IF;
  
  UPDATE public.damaged_goods 
  SET status = 'destroyed', 
      notes = COALESCE(notes || ' | ', '') || 'Destroyed: ' || COALESCE(p_notes, 'No reason given'),
      updated_at = now() 
  WHERE id = p_damaged_goods_id;
END;
$function$;