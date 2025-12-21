import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DamagedGood {
  id: string;
  product_id: string;
  production_batch_id?: string;
  quantity: number;
  damage_type: 'handling' | 'expired' | 'quality_rejected' | 'manufacturing_wastage' | 'customer_return';
  status: 'pending' | 'restored' | 'destroyed';
  source_reference_id?: string;
  source_reference_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  product?: { name: string; sku: string };
}

export const DAMAGE_TYPES = [
  { value: 'handling', label: 'Damaged during handling' },
  { value: 'expired', label: 'Expired goods' },
  { value: 'quality_rejected', label: 'Quality rejected' },
  { value: 'manufacturing_wastage', label: 'Manufacturing wastage' },
  { value: 'customer_return', label: 'Customer return' },
] as const;

export function useDamagedGoods() {
  return useQuery({
    queryKey: ['damaged-goods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('damaged_goods')
        .select(`
          *,
          product:products(name, sku)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DamagedGood[];
    },
  });
}

export function usePendingDamagedGoods() {
  return useQuery({
    queryKey: ['damaged-goods', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('damaged_goods')
        .select(`
          *,
          product:products(name, sku)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DamagedGood[];
    },
  });
}

interface RecordDamageData {
  product_id: string;
  production_batch_id?: string;
  quantity: number;
  damage_type: string;
  notes?: string;
}

export function useRecordProductDamage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RecordDamageData) => {
      const { data: result, error } = await supabase.rpc('record_product_damage', {
        p_product_id: data.product_id,
        p_production_batch_id: data.production_batch_id || null,
        p_quantity: data.quantity,
        p_damage_type: data.damage_type,
        p_notes: data.notes || null,
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damaged-goods'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-products'] });
      toast.success('Damage recorded and stock deducted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record damage: ${error.message}`);
    },
  });
}

export function useRestoreDamagedGoods() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (damagedGoodsId: string) => {
      const { error } = await supabase.rpc('restore_damaged_goods', {
        p_damaged_goods_id: damagedGoodsId,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damaged-goods'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-products'] });
      toast.success('Item restored to sellable stock');
    },
    onError: (error: Error) => {
      toast.error(`Failed to restore: ${error.message}`);
    },
  });
}

export function useDestroyDamagedGoods() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { error } = await supabase.rpc('destroy_damaged_goods', {
        p_damaged_goods_id: id,
        p_notes: notes || null,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damaged-goods'] });
      toast.success('Item marked as destroyed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to destroy: ${error.message}`);
    },
  });
}