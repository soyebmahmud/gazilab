-- Create sale_payments table for multiple payments per invoice
CREATE TABLE public.sale_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read on sale_payments" ON public.sale_payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sale_payments" ON public.sale_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sale_payments" ON public.sale_payments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on sale_payments" ON public.sale_payments FOR DELETE USING (true);

-- Add paid_amount column to sales table
ALTER TABLE public.sales ADD COLUMN paid_amount NUMERIC NOT NULL DEFAULT 0;

-- Create function to update payment status automatically
CREATE OR REPLACE FUNCTION public.update_sale_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid NUMERIC;
  v_total_amount NUMERIC;
  v_new_status TEXT;
BEGIN
  -- Calculate total paid for this sale
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.sale_payments
  WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id);
  
  -- Get total amount of the sale
  SELECT total_amount INTO v_total_amount
  FROM public.sales
  WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
  
  -- Determine new status
  IF v_total_paid >= v_total_amount THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'pending';
  END IF;
  
  -- Update sales table
  UPDATE public.sales
  SET paid_amount = v_total_paid,
      payment_status = v_new_status
  WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic status updates
CREATE TRIGGER update_payment_status_on_insert
AFTER INSERT ON public.sale_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_sale_payment_status();

CREATE TRIGGER update_payment_status_on_update
AFTER UPDATE ON public.sale_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_sale_payment_status();

CREATE TRIGGER update_payment_status_on_delete
AFTER DELETE ON public.sale_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_sale_payment_status();