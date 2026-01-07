import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductionBatch, BOMItem } from '@/types/database';
import { toast } from 'sonner';
import { ensureValidSession } from './useSupabaseQuery';

export function useProductionBatches() {
  return useQuery({
    queryKey: ['production-batches'],
    queryFn: async () => {
      await ensureValidSession();
      const { data, error } = await supabase
        .from('production_batches')
        .select(`
          *,
          product:products(*),
          bom:bom(
            *,
            items:bom_items(
              *,
              raw_material:raw_materials(*)
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProductionBatch[];
    },
  });
}

export function useProductionBatch(id: string) {
  return useQuery({
    queryKey: ['production-batch', id],
    queryFn: async () => {
      await ensureValidSession();
      const { data, error } = await supabase
        .from('production_batches')
        .select(`
          *,
          product:products(*),
          bom:bom(
            *,
            items:bom_items(
              *,
              raw_material:raw_materials(*)
            )
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as ProductionBatch;
    },
    enabled: !!id,
  });
}

function generateBatchNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BATCH-${year}${month}${day}-${random}`;
}

interface CreateProductionData {
  product_id: string;
  bom_id: string;
  quantity_planned: number;
  packaging_config_id?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  notes?: string;
}

export function useCreateProduction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateProductionData) => {
      // Ensure valid session before mutation
      const isValid = await ensureValidSession();
      if (!isValid) {
        throw new Error('Session expired. Please log in again.');
      }
      
      // Use hierarchical BOM to validate stock if packaging config is provided
      if (data.packaging_config_id) {
        const { data: hierarchicalBom, error: bomError } = await supabase
          .rpc('get_hierarchical_bom', {
            p_product_id: data.product_id,
            p_packaging_config_id: data.packaging_config_id,
            p_production_quantity: data.quantity_planned
          });
        
        if (bomError) throw bomError;
        
        // Validate stock availability for each material
        const insufficientMaterials: string[] = [];
        for (const item of hierarchicalBom || []) {
          const { data: availableStock } = await supabase
            .rpc('get_available_material_stock', { p_material_id: item.raw_material_id });
          
          if ((availableStock || 0) < item.calculated_quantity) {
            insufficientMaterials.push(
              `${item.material_name}: Required ${item.calculated_quantity.toFixed(2)} ${item.material_unit}, Available ${(availableStock || 0).toFixed(2)} ${item.material_unit}`
            );
          }
        }
        
        if (insufficientMaterials.length > 0) {
          throw new Error(`Insufficient stock:\n${insufficientMaterials.join('\n')}`);
        }
      } else {
        // Fallback to basic BOM validation
        const { data: bomData, error: bomError } = await supabase
          .from('bom')
          .select(`
            items:bom_items(
              *,
              raw_material:raw_materials(*)
            )
          `)
          .eq('id', data.bom_id)
          .single();
        
        if (bomError) throw bomError;
        
        const items = bomData.items as BOMItem[];
        
        for (const item of items) {
          const requiredQty = item.quantity_per_unit * (1 + item.wastage_percent / 100) * data.quantity_planned;
          if (item.raw_material && item.raw_material.current_stock < requiredQty) {
            throw new Error(`Insufficient stock for ${item.raw_material.name}. Required: ${requiredQty.toFixed(3)}, Available: ${item.raw_material.current_stock}`);
          }
        }
      }
      
      // Create production batch with packaging config
      const { data: batch, error: batchError } = await supabase
        .from('production_batches')
        .insert({
          batch_number: generateBatchNumber(),
          product_id: data.product_id,
          bom_id: data.bom_id,
          quantity_planned: data.quantity_planned,
          packaging_config_id: data.packaging_config_id,
          manufacturing_date: data.manufacturing_date,
          expiry_date: data.expiry_date,
          notes: data.notes,
          status: 'planned'
        })
        .select()
        .single();
      
      if (batchError) throw batchError;
      
      return batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-batches'] });
      toast.success('Production batch created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useStartProduction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (batchId: string) => {
      const isValid = await ensureValidSession();
      if (!isValid) {
        throw new Error('Session expired. Please log in again.');
      }
      
      // Get batch with BOM items
      const { data: batch, error: batchError } = await supabase
        .from('production_batches')
        .select(`
          *,
          bom:bom(
            items:bom_items(
              *,
              raw_material:raw_materials(*)
            )
          )
        `)
        .eq('id', batchId)
        .single();
      
      if (batchError) throw batchError;
      
      const items = batch.bom.items as BOMItem[];
      
      // Deduct raw materials
      for (const item of items) {
        const deductQty = item.quantity_per_unit * (1 + item.wastage_percent / 100) * batch.quantity_planned;
        
        const { error: ledgerError } = await supabase
          .from('stock_ledger_materials')
          .insert({
            raw_material_id: item.raw_material_id,
            movement_type: 'production_out',
            quantity: deductQty,
            reference_id: batchId,
            reference_type: 'production',
            notes: `Production batch: ${batch.batch_number}`,
            balance_after: 0 // Will be calculated by trigger
          });
        
        if (ledgerError) throw ledgerError;
      }
      
      // Update batch status
      const { data: updatedBatch, error: updateError } = await supabase
        .from('production_batches')
        .update({ status: 'in_progress' })
        .eq('id', batchId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return updatedBatch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-batches'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-materials'] });
      toast.success('Production started - materials deducted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to start production: ${error.message}`);
    },
  });
}

export function useCompleteProduction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ batchId, quantityProduced }: { batchId: string; quantityProduced: number }) => {
      const isValid = await ensureValidSession();
      if (!isValid) {
        throw new Error('Session expired. Please log in again.');
      }
      
      // Get batch
      const { data: batch, error: batchError } = await supabase
        .from('production_batches')
        .select('*')
        .eq('id', batchId)
        .single();
      
      if (batchError) throw batchError;
      
      // Add finished goods to stock
      const { error: ledgerError } = await supabase
        .from('stock_ledger_products')
        .insert({
          product_id: batch.product_id,
          movement_type: 'production_in',
          quantity: quantityProduced,
          reference_id: batchId,
          reference_type: 'production',
          notes: `Production batch: ${batch.batch_number}`,
          balance_after: 0 // Will be calculated by trigger
        });
      
      if (ledgerError) throw ledgerError;
      
      // Update batch status
      const { data: updatedBatch, error: updateError } = await supabase
        .from('production_batches')
        .update({ 
          status: 'completed',
          quantity_produced: quantityProduced
        })
        .eq('id', batchId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return updatedBatch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-batches'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-products'] });
      toast.success('Production completed - finished goods added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete production: ${error.message}`);
    },
  });
}
