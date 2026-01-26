import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface POPayment {
  id: string;
  purchase_order_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  bank_account_id?: string;
  reference_note?: string;
  created_at: string;
}

export interface CreatePOPaymentData {
  purchase_order_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  bank_account_id?: string;
  reference_note?: string;
}

export function usePurchaseOrderPayments(purchaseOrderId: string) {
  return useQuery({
    queryKey: ['purchase-order-payments', purchaseOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_order_payments')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as POPayment[];
    },
    enabled: !!purchaseOrderId,
  });
}

export function useAddPOPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePOPaymentData) => {
      // If bank payment, also record bank transaction
      if (data.bank_account_id) {
        // Get current bank balance
        const { data: bank, error: bankError } = await supabase
          .from('bank_accounts')
          .select('current_balance')
          .eq('id', data.bank_account_id)
          .single();
        
        if (bankError) throw bankError;
        
        const newBalance = (bank?.current_balance || 0) - data.amount;
        
        // Create bank transaction
        const { error: txError } = await supabase
          .from('bank_transactions')
          .insert({
            bank_account_id: data.bank_account_id,
            transaction_type: 'withdrawal',
            amount: data.amount,
            balance_after: newBalance,
            transaction_date: data.payment_date,
            description: `PO Payment: ${data.reference_note || 'Seller Payment'}`,
            reference_type: 'purchase_order',
            reference_id: data.purchase_order_id
          });
        
        if (txError) throw txError;
        
        // Update bank balance
        const { error: updateError } = await supabase
          .from('bank_accounts')
          .update({ current_balance: newBalance })
          .eq('id', data.bank_account_id);
        
        if (updateError) throw updateError;
      }
      
      const { data: payment, error } = await supabase
        .from('purchase_order_payments')
        .insert({
          purchase_order_id: data.purchase_order_id,
          amount: data.amount,
          payment_method: data.payment_method,
          payment_date: data.payment_date,
          bank_account_id: data.bank_account_id || null,
          reference_note: data.reference_note || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return payment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-payments', variables.purchase_order_id] });
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}

export function useDeletePOPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ paymentId, purchaseOrderId }: { paymentId: string; purchaseOrderId: string }) => {
      const { error } = await supabase
        .from('purchase_order_payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
      return purchaseOrderId;
    },
    onSuccess: (purchaseOrderId) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-payments', purchaseOrderId] });
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success('Payment deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete payment: ${error.message}`);
    },
  });
}
