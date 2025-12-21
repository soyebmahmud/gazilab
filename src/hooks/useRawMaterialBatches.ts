import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RawMaterialBatch } from '@/types/database';
import { toast } from 'sonner';

export function useRawMaterialBatches(materialId?: string) {
  return useQuery({
    queryKey: ['raw-material-batches', materialId],
    queryFn: async () => {
      let query = supabase
        .from('raw_material_batches')
        .select(`
          *,
          raw_material:raw_materials(id, name, sku, unit)
        `)
        .eq('is_active', true)
        .order('expiry_date', { ascending: true, nullsFirst: false });
      
      if (materialId) {
        query = query.eq('raw_material_id', materialId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as RawMaterialBatch[];
    },
  });
}

export function useAvailableBatches(materialId: string) {
  return useQuery({
    queryKey: ['available-batches', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raw_material_batches')
        .select('*')
        .eq('raw_material_id', materialId)
        .eq('is_active', true)
        .gt('quantity_remaining', 0)
        .order('expiry_date', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return data as RawMaterialBatch[];
    },
    enabled: !!materialId,
  });
}

interface CreateBatchData {
  raw_material_id: string;
  batch_number: string;
  quantity_received: number;
  cost_per_unit: number;
  received_date?: string;
  expiry_date?: string;
  supplier?: string;
  notes?: string;
}

export function useCreateRawMaterialBatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateBatchData) => {
      // Insert batch
      const { data: batch, error: batchError } = await supabase
        .from('raw_material_batches')
        .insert({
          ...data,
          quantity_remaining: data.quantity_received
        })
        .select()
        .single();
      
      if (batchError) throw batchError;

      // Record in stock ledger
      const { error: ledgerError } = await supabase
        .from('stock_ledger_materials')
        .insert({
          raw_material_id: data.raw_material_id,
          raw_material_batch_id: batch.id,
          movement_type: 'purchase',
          quantity: data.quantity_received,
          balance_after: 0, // Will be calculated by trigger
          notes: `Batch ${data.batch_number} received`
        });

      if (ledgerError) throw ledgerError;

      return batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-material-batches'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-materials'] });
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
      toast.success('Raw material batch added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add batch: ${error.message}`);
    },
  });
}

export function useUpdateRawMaterialBatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<RawMaterialBatch> & { id: string }) => {
      const { data: batch, error } = await supabase
        .from('raw_material_batches')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-material-batches'] });
      toast.success('Batch updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update batch: ${error.message}`);
    },
  });
}
