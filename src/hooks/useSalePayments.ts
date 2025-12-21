import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SalePayment {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_note: string | null;
  created_at: string;
}

export function useSalePayments(saleId: string) {
  return useQuery({
    queryKey: ['sale-payments', saleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_payments')
        .select('*')
        .eq('sale_id', saleId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as SalePayment[];
    },
    enabled: !!saleId,
  });
}

interface CreatePaymentData {
  sale_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_note?: string;
}

export function useAddPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const { data: payment, error } = await supabase
        .from('sale_payments')
        .insert({
          sale_id: data.sale_id,
          amount: data.amount,
          payment_method: data.payment_method,
          payment_date: data.payment_date,
          reference_note: data.reference_note || null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update customer outstanding balance if customer exists
      const { data: sale } = await supabase
        .from('sales')
        .select('customer_id')
        .eq('id', data.sale_id)
        .single();
      
      if (sale?.customer_id) {
        const { data: customer } = await supabase
          .from('customers')
          .select('outstanding_balance')
          .eq('id', sale.customer_id)
          .single();
        
        if (customer) {
          await supabase
            .from('customers')
            .update({ 
              outstanding_balance: Math.max(0, (customer.outstanding_balance || 0) - data.amount)
            })
            .eq('id', sale.customer_id);
        }
      }
      
      return payment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale-payments', variables.sale_id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ paymentId, saleId }: { paymentId: string; saleId: string }) => {
      const { error } = await supabase
        .from('sale_payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
      return saleId;
    },
    onSuccess: (saleId) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale-payments', saleId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Payment deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete payment: ${error.message}`);
    },
  });
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'mobile', label: 'Mobile Banking' },
  { value: 'credit', label: 'Credit' },
] as const;
