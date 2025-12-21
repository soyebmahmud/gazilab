import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SaleReturn {
  id: string;
  sale_id: string;
  sale_item_id?: string;
  product_id: string;
  production_batch_id?: string;
  original_invoice_number: string;
  return_date: string;
  quantity_returned: number;
  reason: 'customer_return' | 'damaged' | 'expired' | 'quality_rejected';
  return_status: 'pending' | 'restored' | 'damaged' | 'destroyed';
  restore_to_stock: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  product?: { name: string; sku: string };
}

export const RETURN_REASONS = [
  { value: 'customer_return', label: 'Customer Return' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'quality_rejected', label: 'Quality Rejected' },
] as const;

export function useSalesReturns() {
  return useQuery({
    queryKey: ['sale-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_returns')
        .select(`
          *,
          product:products(name, sku)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SaleReturn[];
    },
  });
}

export function useSaleReturns(saleId: string) {
  return useQuery({
    queryKey: ['sale-returns', saleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_returns')
        .select(`
          *,
          product:products(name, sku)
        `)
        .eq('sale_id', saleId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SaleReturn[];
    },
    enabled: !!saleId,
  });
}

interface ProcessReturnData {
  sale_id: string;
  sale_item_id: string;
  quantity: number;
  reason: string;
  restore_to_stock: boolean;
  notes?: string;
}

export function useProcessSaleReturn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ProcessReturnData) => {
      const { data: result, error } = await supabase.rpc('process_sale_return', {
        p_sale_id: data.sale_id,
        p_sale_item_id: data.sale_item_id,
        p_quantity: data.quantity,
        p_reason: data.reason,
        p_restore_to_stock: data.restore_to_stock,
        p_notes: data.notes || null,
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-returns'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-products'] });
      queryClient.invalidateQueries({ queryKey: ['damaged-goods'] });
      toast.success('Sale return processed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to process return: ${error.message}`);
    },
  });
}