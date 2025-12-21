
-- Create sales table for invoices
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  tax_percent NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale_items table for line items
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  production_batch_id UUID REFERENCES public.production_batches(id),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sales
CREATE POLICY "Allow public read on sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sales" ON public.sales FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on sales" ON public.sales FOR DELETE USING (true);

-- Create RLS policies for sale_items
CREATE POLICY "Allow public read on sale_items" ON public.sale_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sale_items" ON public.sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sale_items" ON public.sale_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on sale_items" ON public.sale_items FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_count INTEGER;
  v_invoice_number TEXT;
BEGIN
  v_year := to_char(CURRENT_DATE, 'YY');
  v_month := to_char(CURRENT_DATE, 'MM');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.sales
  WHERE invoice_number LIKE 'INV-' || v_year || v_month || '%';
  
  v_invoice_number := 'INV-' || v_year || v_month || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_invoice_number;
END;
$$;

-- Create function to get available batches for a product
CREATE OR REPLACE FUNCTION public.get_product_batches(p_product_id UUID)
RETURNS TABLE (
  batch_id UUID,
  batch_number TEXT,
  quantity_available NUMERIC,
  manufacturing_date DATE,
  expiry_date DATE
)
LANGUAGE plpgsql
SET search_path = public
AS $$
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
  ORDER BY pb.manufacturing_date ASC, pb.created_at ASC;
END;
$$;
