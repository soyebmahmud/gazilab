import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockLedgerMaterial, StockLedgerProduct, StockMovementType } from '@/types/database';
import { toast } from 'sonner';

export function useMaterialStockLedger(materialId?: string) {
  return useQuery({
    queryKey: ['stock-ledger-materials', materialId],
    queryFn: async () => {
      let query = supabase
        .from('stock_ledger_materials')
        .select(`
          *,
          raw_material:raw_materials(id, name, sku, unit, category, cost_per_unit, min_stock_level, current_stock, is_active)
        `)
        .order('created_at', { ascending: false });
      
      if (materialId) {
        query = query.eq('raw_material_id', materialId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as StockLedgerMaterial[];
    },
  });
}

export function useProductStockLedger(productId?: string) {
  return useQuery({
    queryKey: ['stock-ledger-products', productId],
    queryFn: async () => {
      let query = supabase
        .from('stock_ledger_products')
        .select(`
          *,
          product:products(id, name, sku, unit, category, cost_price, selling_price, min_stock_level, current_stock, is_active)
        `)
        .order('created_at', { ascending: false });
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as StockLedgerProduct[];
    },
  });
}

interface AddStockMovementMaterial {
  raw_material_id: string;
  movement_type: StockMovementType;
  quantity: number;
  notes?: string;
}

export function useAddMaterialStockMovement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: AddStockMovementMaterial) => {
      const { data: entry, error } = await supabase
        .from('stock_ledger_materials')
        .insert({
          ...data,
          balance_after: 0 // Will be calculated by trigger
        })
        .select()
        .single();
      
      if (error) throw error;
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-materials'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      toast.success('Stock movement recorded');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record movement: ${error.message}`);
    },
  });
}

interface AddStockMovementProduct {
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  notes?: string;
}

export function useAddProductStockMovement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: AddStockMovementProduct) => {
      const { data: entry, error } = await supabase
        .from('stock_ledger_products')
        .insert({
          ...data,
          balance_after: 0 // Will be calculated by trigger
        })
        .select()
        .single();
      
      if (error) throw error;
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock movement recorded');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record movement: ${error.message}`);
    },
  });
}
