import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id: string | null;
  amount: number;
  expense_date: string;
  payment_method: string;
  bank_account_id: string | null;
  description: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  category?: { id: string; name: string } | null;
  bank_account?: { account_name: string; bank_name: string } | null;
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as ExpenseCategory[];
    },
  });
}

export function useExpenses(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['expenses', dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(id, name),
          bank_account:bank_accounts(account_name, bank_name)
        `)
        .order('expense_date', { ascending: false });
      
      if (dateFrom) {
        query = query.gte('expense_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('expense_date', dateTo);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });
}

interface CreateExpenseData {
  category_id: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  bank_account_id?: string | null;
  description?: string;
  reference_number?: string;
  notes?: string;
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;

      // If paid via bank, record the transaction
      if (data.bank_account_id && data.payment_method === 'bank') {
        const { error: txError } = await supabase
          .from('bank_transactions')
          .insert({
            bank_account_id: data.bank_account_id,
            transaction_type: 'withdrawal',
            amount: data.amount,
            transaction_date: data.expense_date,
            reference_type: 'expense',
            reference_id: expense.id,
            description: data.description || 'Expense payment',
          });
        
        if (txError) throw txError;

        // Update bank balance directly
        const { data: currentAccount } = await supabase
          .from('bank_accounts')
          .select('current_balance')
          .eq('id', data.bank_account_id)
          .single();
        
        if (currentAccount) {
          await supabase
            .from('bank_accounts')
            .update({ current_balance: currentAccount.current_balance - data.amount })
            .eq('id', data.bank_account_id);
        }
      }

      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success('Expense recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record expense: ${error.message}`);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete expense: ${error.message}`);
    },
  });
}
