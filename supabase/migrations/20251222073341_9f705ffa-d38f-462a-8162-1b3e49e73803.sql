-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.expense_categories(id),
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  bank_account_id UUID,
  description TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank accounts table
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT,
  branch TEXT,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank transactions table for tracking all bank movements
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'transfer'
  amount NUMERIC NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_type TEXT, -- 'sale', 'purchase', 'expense', 'manual'
  reference_id UUID,
  description TEXT,
  balance_after NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add bank_account_id to expenses
ALTER TABLE public.expenses ADD CONSTRAINT expenses_bank_account_id_fkey 
  FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_categories
CREATE POLICY "Authenticated users can read expense_categories" ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert expense_categories" ON public.expense_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update expense_categories" ON public.expense_categories FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete expense_categories" ON public.expense_categories FOR DELETE USING (true);

-- RLS policies for expenses
CREATE POLICY "Authenticated users can read expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete expenses" ON public.expenses FOR DELETE USING (true);

-- RLS policies for bank_accounts
CREATE POLICY "Authenticated users can read bank_accounts" ON public.bank_accounts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert bank_accounts" ON public.bank_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update bank_accounts" ON public.bank_accounts FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete bank_accounts" ON public.bank_accounts FOR DELETE USING (true);

-- RLS policies for bank_transactions
CREATE POLICY "Authenticated users can read bank_transactions" ON public.bank_transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert bank_transactions" ON public.bank_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update bank_transactions" ON public.bank_transactions FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete bank_transactions" ON public.bank_transactions FOR DELETE USING (true);

-- Insert default expense categories
INSERT INTO public.expense_categories (name, description) VALUES
  ('Rent', 'Office or warehouse rent'),
  ('Salary', 'Employee salaries and wages'),
  ('Utilities', 'Electricity, water, gas bills'),
  ('Transport', 'Transportation and delivery costs'),
  ('Marketing', 'Advertising and promotional expenses'),
  ('Office Supplies', 'Stationery and office materials'),
  ('Maintenance', 'Equipment and facility maintenance'),
  ('Miscellaneous', 'Other expenses');

-- Create trigger for updated_at
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();