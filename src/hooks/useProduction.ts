import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductionBatch, BOMItem } from '@/types/database';
import { toast } from 'sonner';
import { ensureValidSession, withJwtRefreshRetry } from './useSupabaseQuery';

export function useProductionBatches() {
  return useQuery({
    queryKey: ['production-batches'],
    queryFn: async () => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');

      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
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
          .order('created_at', { ascending: false })
      );
      
      if (error) throw error;
      return data as ProductionBatch[];
    },
  });
}

export function useProductionBatch(id: string) {
  return useQuery({
    queryKey: ['production-batch', id],
    queryFn: async () => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');

      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
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
          .maybeSingle()
      );
      
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

interface MaterialRequirement {
  raw_material_id: string;
  material_name: string;
  material_unit: string;
  required_quantity: number;
  available_stock: number;
}

export function useCreateProduction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateProductionData) => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');
      
      // Use unified validation approach
      const materialRequirements: MaterialRequirement[] = [];
      
      // Use hierarchical BOM if packaging config is provided, otherwise use standard BOM
      if (data.packaging_config_id) {
        const { data: hierarchicalBom, error: bomError } = await withJwtRefreshRetry(async () =>
          await supabase.rpc('get_hierarchical_bom', {
            p_product_id: data.product_id,
            p_packaging_config_id: data.packaging_config_id,
            p_production_quantity: data.quantity_planned
          })
        );
        
        if (bomError) throw bomError;
        
        for (const item of hierarchicalBom || []) {
          const { data: availableStock } = await withJwtRefreshRetry(async () =>
            await supabase.rpc('get_available_material_stock', { p_material_id: item.raw_material_id })
          );
          
          materialRequirements.push({
            raw_material_id: item.raw_material_id,
            material_name: item.material_name,
            material_unit: item.material_unit,
            required_quantity: item.calculated_quantity,
            available_stock: availableStock || 0
          });
        }
      } else {
        const { data: bomData, error: bomError } = await withJwtRefreshRetry(async () =>
          await supabase
            .from('bom')
            .select(`
              items:bom_items(
                *,
                raw_material:raw_materials(*)
              )
            `)
            .eq('id', data.bom_id)
            .single()
        );
        
        if (bomError) throw bomError;
        
        const items = bomData?.items as BOMItem[];
        
        for (const item of items || []) {
          const requiredQty = item.quantity_per_unit * (1 + item.wastage_percent / 100) * data.quantity_planned;
          
          const { data: availableStock } = await withJwtRefreshRetry(async () =>
            await supabase.rpc('get_available_material_stock', { p_material_id: item.raw_material_id })
          );
          
          materialRequirements.push({
            raw_material_id: item.raw_material_id,
            material_name: item.raw_material?.name || 'Unknown',
            material_unit: item.raw_material?.unit || 'pcs',
            required_quantity: requiredQty,
            available_stock: availableStock || 0
          });
        }
      }
      
      // Check for insufficient materials
      const insufficientMaterials = materialRequirements
        .filter(m => m.available_stock < m.required_quantity)
        .map(m => `${m.material_name}: Required ${m.required_quantity.toFixed(2)} ${m.material_unit}, Available ${m.available_stock.toFixed(2)} ${m.material_unit}`);
      
      if (insufficientMaterials.length > 0) {
        throw new Error(`Insufficient stock:\n${insufficientMaterials.join('\n')}`);
      }
      
      const { data: batch, error: batchError } = await withJwtRefreshRetry(async () =>
        await supabase
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
          .single()
      );
      
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
      if (!isValid) throw new Error('Session expired. Please log in again.');
      
      const { data: batch, error: batchError } = await withJwtRefreshRetry(async () =>
        await supabase
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
          .single()
      );
      
      if (batchError) throw batchError;
      
      const items = batch.bom.items as BOMItem[];
      
      for (const item of items) {
        const deductQty = item.quantity_per_unit * (1 + item.wastage_percent / 100) * batch.quantity_planned;
        
        // Get current stock for accurate balance_after
        const { data: material } = await withJwtRefreshRetry(async () =>
          await supabase
            .from('raw_materials')
            .select('current_stock')
            .eq('id', item.raw_material_id)
            .single()
        );
        
        const newBalance = (material?.current_stock || 0) - deductQty;
        
        const { error: ledgerError } = await withJwtRefreshRetry(async () =>
          await supabase
            .from('stock_ledger_materials')
            .insert({
              raw_material_id: item.raw_material_id,
              movement_type: 'production_out',
              quantity: deductQty,
              reference_id: batchId,
              reference_type: 'production',
              notes: `Production batch: ${batch.batch_number}`,
              balance_after: newBalance
            })
        );
        
        if (ledgerError) throw ledgerError;
        
        // Update raw material stock
        const { error: stockError } = await withJwtRefreshRetry(async () =>
          await supabase
            .from('raw_materials')
            .update({ current_stock: newBalance })
            .eq('id', item.raw_material_id)
        );
        
        if (stockError) {
          console.error('Failed to update material stock:', stockError);
        }
      }
      
      const { data: updatedBatch, error: updateError } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('production_batches')
          .update({ status: 'in_progress' })
          .eq('id', batchId)
          .select()
          .single()
      );
      
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
      if (!isValid) throw new Error('Session expired. Please log in again.');
      
      const { data: batch, error: batchError } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('production_batches')
          .select('*, product:products(current_stock)')
          .eq('id', batchId)
          .single()
      );
      
      if (batchError) throw batchError;
      
      const currentStock = batch.product?.current_stock || 0;
      const newBalance = currentStock + quantityProduced;
      
      const { error: ledgerError } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('stock_ledger_products')
          .insert({
            product_id: batch.product_id,
            movement_type: 'production_in',
            quantity: quantityProduced,
            reference_id: batchId,
            reference_type: 'production',
            notes: `Production batch: ${batch.batch_number}`,
            balance_after: newBalance
          })
      );
      
      if (ledgerError) throw ledgerError;
      
      // Update product stock
      const { error: stockError } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('products')
          .update({ current_stock: newBalance })
          .eq('id', batch.product_id)
      );
      
      if (stockError) {
        console.error('Failed to update product stock:', stockError);
      }
      
      const { data: updatedBatch, error: updateError } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('production_batches')
          .update({ 
            status: 'completed',
            quantity_produced: quantityProduced
          })
          .eq('id', batchId)
          .select()
          .single()
      );
      
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
