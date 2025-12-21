import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockSummary, NearExpiryProduct, BatchTraceability, MRPResult } from '@/types/database';

export function useStockSummary() {
  return useQuery({
    queryKey: ['stock-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_stock_summary');
      if (error) throw error;
      return data as StockSummary[];
    },
  });
}

export function useNearExpiryProducts(days: number = 90) {
  return useQuery({
    queryKey: ['near-expiry-products', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_near_expiry_products', { p_days: days });
      if (error) throw error;
      return data as NearExpiryProduct[];
    },
  });
}

export function useBatchTraceability(productionBatchId: string) {
  return useQuery({
    queryKey: ['batch-traceability', productionBatchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_batch_traceability', { 
        p_production_batch_id: productionBatchId 
      });
      if (error) throw error;
      return data as BatchTraceability[];
    },
    enabled: !!productionBatchId,
  });
}

export function useMRPCheck(productId: string, quantity: number) {
  return useQuery({
    queryKey: ['mrp-check', productId, quantity],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_mrp', { 
        p_product_id: productId,
        p_quantity: quantity
      });
      if (error) throw error;
      return data as MRPResult[];
    },
    enabled: !!productId && quantity > 0,
  });
}
