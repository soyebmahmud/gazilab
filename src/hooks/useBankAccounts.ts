import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string | null;
  branch: string | null;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_type: string;
  amount: number;
  transaction_date: string;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  balance_after: number;
  created_at: string;
  bank_account?: { account_name: string; bank_name: string };
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_name');
      if (error) throw error;
      return data as BankAccount[];
    },
  });
}

export function useBankTransactions(bankAccountId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['bank-transactions', bankAccountId, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('bank_transactions')
        .select(`
          *,
          bank_account:bank_accounts(account_name, bank_name)
        `)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (bankAccountId) {
        query = query.eq('bank_account_id', bankAccountId);
      }
      if (dateFrom) {
        query = query.gte('transaction_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('transaction_date', dateTo);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BankTransaction[];
    },
  });
}

interface CreateBankAccountData {
  account_name: string;
  bank_name: string;
  account_number?: string;
  branch?: string;
  opening_balance: number;
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateBankAccountData) => {
      const { data: account, error } = await supabase
        .from('bank_accounts')
        .insert({
          ...data,
          current_balance: data.opening_balance,
        })
        .select()
        .single();
      
      if (error) throw error;
      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Bank account created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create bank account: ${error.message}`);
    },
  });
}

interface CreateBankTransactionData {
  bank_account_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  transaction_date: string;
  description?: string;
}

export function useCreateBankTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateBankTransactionData) => {
      // Get current balance
      const { data: account } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', data.bank_account_id)
        .single();
      
      const balanceChange = data.transaction_type === 'deposit' ? data.amount : -data.amount;
      const newBalance = (account?.current_balance || 0) + balanceChange;
      
      // Insert transaction
      const { data: transaction, error } = await supabase
        .from('bank_transactions')
        .insert({
          ...data,
          reference_type: 'manual',
          balance_after: newBalance,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Update account balance
      await supabase
        .from('bank_accounts')
        .update({ current_balance: newBalance })
        .eq('id', data.bank_account_id);

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success('Transaction recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record transaction: ${error.message}`);
    },
  });
}
