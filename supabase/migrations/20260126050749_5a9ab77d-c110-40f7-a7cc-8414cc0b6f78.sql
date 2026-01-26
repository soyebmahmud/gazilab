-- Create purchase_order_payments table for tracking seller payments
CREATE TABLE public.purchase_order_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  reference_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add payment tracking columns to purchase_orders if not exist
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

-- Enable RLS
ALTER TABLE public.purchase_order_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view purchase order payments"
ON public.purchase_order_payments FOR SELECT
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can insert purchase order payments"
ON public.purchase_order_payments FOR INSERT
WITH CHECK (public.is_authenticated());

CREATE POLICY "Authenticated users can update purchase order payments"
ON public.purchase_order_payments FOR UPDATE
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can delete purchase order payments"
ON public.purchase_order_payments FOR DELETE
USING (public.is_authenticated());

-- Create function to update PO payment status
CREATE OR REPLACE FUNCTION public.update_po_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_total_paid NUMERIC;
  v_total_amount NUMERIC;
  v_new_status TEXT;
  v_po_id UUID;
  v_seller_id UUID;
  v_old_paid NUMERIC;
BEGIN
  v_po_id := COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  
  -- Calculate total paid for this PO
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.purchase_order_payments
  WHERE purchase_order_id = v_po_id;
  
  -- Get total amount and seller of the PO
  SELECT total_amount, seller_id, paid_amount INTO v_total_amount, v_seller_id, v_old_paid
  FROM public.purchase_orders
  WHERE id = v_po_id;
  
  -- Determine new status
  IF v_total_paid >= v_total_amount THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'pending';
  END IF;
  
  -- Update purchase_orders table
  UPDATE public.purchase_orders
  SET paid_amount = v_total_paid,
      payment_status = v_new_status
  WHERE id = v_po_id;
  
  -- Update seller outstanding balance
  IF v_seller_id IS NOT NULL THEN
    UPDATE public.sellers
    SET outstanding_balance = outstanding_balance - (v_total_paid - v_old_paid)
    WHERE id = v_seller_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for payment status updates
CREATE TRIGGER update_po_payment_status_on_insert
AFTER INSERT ON public.purchase_order_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_po_payment_status();

CREATE TRIGGER update_po_payment_status_on_update
AFTER UPDATE ON public.purchase_order_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_po_payment_status();

CREATE TRIGGER update_po_payment_status_on_delete
AFTER DELETE ON public.purchase_order_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_po_payment_status();

-- Update seller balance when PO is created/received (add to outstanding)
CREATE OR REPLACE FUNCTION public.update_seller_balance_on_po()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- When PO status changes to 'received' or 'partial', add to seller outstanding
  IF NEW.status IN ('received', 'partial') AND OLD.status = 'pending' THEN
    IF NEW.seller_id IS NOT NULL THEN
      UPDATE public.sellers
      SET outstanding_balance = outstanding_balance + NEW.total_amount
      WHERE id = NEW.seller_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_seller_balance_on_po_status
AFTER UPDATE ON public.purchase_orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.update_seller_balance_on_po();