-- Update the invoice number generator to use new format #GLL-YYYY-MM-DD-XXXX
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_date TEXT;
  v_count INTEGER;
  v_invoice_number TEXT;
BEGIN
  v_date := to_char(CURRENT_DATE, 'YYYY-MM-DD');
  
  -- Count invoices for today
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.sales
  WHERE invoice_number LIKE '#GLL-' || v_date || '-%';
  
  v_invoice_number := '#GLL-' || v_date || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_invoice_number;
END;
$function$;

-- Update get_product_batches to return FEFO (First Expired First Out) order
CREATE OR REPLACE FUNCTION public.get_product_batches(p_product_id uuid)
 RETURNS TABLE(batch_id uuid, batch_number text, quantity_available numeric, manufacturing_date date, expiry_date date)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pb.id as batch_id,
    pb.batch_number,
    pb.quantity_produced - COALESCE(
      (SELECT SUM(si.quantity) FROM public.sale_items si WHERE si.production_batch_id = pb.id), 0
    ) as quantity_available,
    pb.manufacturing_date,
    pb.expiry_date
  FROM public.production_batches pb
  WHERE pb.product_id = p_product_id
    AND pb.status = 'completed'
    AND pb.quantity_produced > 0
  HAVING pb.quantity_produced - COALESCE(
    (SELECT SUM(si.quantity) FROM public.sale_items si WHERE si.production_batch_id = pb.id), 0
  ) > 0
  ORDER BY pb.expiry_date ASC NULLS LAST, pb.manufacturing_date ASC, pb.created_at ASC;
END;
$function$;

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  seller_id UUID REFERENCES public.sellers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_percent NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  received_quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on purchase_orders
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on purchase_orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on purchase_orders" ON public.purchase_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on purchase_orders" ON public.purchase_orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on purchase_orders" ON public.purchase_orders FOR DELETE USING (true);

-- Enable RLS on purchase_order_items
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on purchase_order_items" ON public.purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on purchase_order_items" ON public.purchase_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on purchase_order_items" ON public.purchase_order_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on purchase_order_items" ON public.purchase_order_items FOR DELETE USING (true);

-- Create PO number generator
CREATE OR REPLACE FUNCTION public.generate_po_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_date TEXT;
  v_count INTEGER;
  v_po_number TEXT;
BEGIN
  v_date := to_char(CURRENT_DATE, 'YYYY-MM-DD');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.purchase_orders
  WHERE order_number LIKE '#PO-' || v_date || '-%';
  
  v_po_number := '#PO-' || v_date || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_po_number;
END;
$function$;

-- Create function to get expiry alerts
CREATE OR REPLACE FUNCTION public.get_expiry_alerts(p_days integer DEFAULT 90)
 RETURNS TABLE(
   batch_id uuid, 
   batch_number text, 
   product_id uuid,
   product_name text, 
   product_sku text, 
   quantity_available numeric, 
   expiry_date date, 
   days_until_expiry integer,
   alert_level text
 )
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pb.id as batch_id,
    pb.batch_number,
    pb.product_id,
    p.name as product_name,
    p.sku as product_sku,
    pb.quantity_produced - COALESCE((SELECT SUM(si.quantity) FROM public.sale_items si WHERE si.production_batch_id = pb.id), 0) as quantity_available,
    pb.expiry_date,
    (pb.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    CASE 
      WHEN pb.expiry_date <= CURRENT_DATE THEN 'expired'
      WHEN pb.expiry_date <= CURRENT_DATE + 30 THEN 'critical'
      WHEN pb.expiry_date <= CURRENT_DATE + 60 THEN 'warning'
      ELSE 'info'
    END as alert_level
  FROM public.production_batches pb
  JOIN public.products p ON p.id = pb.product_id
  WHERE pb.status = 'completed'
    AND pb.expiry_date IS NOT NULL
    AND pb.expiry_date <= CURRENT_DATE + p_days
    AND pb.quantity_produced > COALESCE((SELECT SUM(si.quantity) FROM public.sale_items si WHERE si.production_batch_id = pb.id), 0)
  ORDER BY pb.expiry_date ASC;
END;
$function$;