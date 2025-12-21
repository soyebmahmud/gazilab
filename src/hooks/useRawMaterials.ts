import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RawMaterial, MaterialUsage, CanDeleteMaterial } from '@/types/database';
import { toast } from 'sonner';

export function useRawMaterials() {
  return useQuery({
    queryKey: ['raw-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as RawMaterial[];
    },
  });
}

export function useRawMaterial(id: string) {
  return useQuery({
    queryKey: ['raw-material', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as RawMaterial;
    },
    enabled: !!id,
  });
}

export function useCreateRawMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (material: Omit<RawMaterial, 'id' | 'current_stock' | 'created_at' | 'updated_at'> & { opening_stock?: number }) => {
      const { opening_stock, ...materialData } = material;
      
      // Create the material
      const { data: newMaterial, error: materialError } = await supabase
        .from('raw_materials')
        .insert(materialData)
        .select()
        .single();
      
      if (materialError) throw materialError;
      
      // Add opening stock entry if provided
      if (opening_stock && opening_stock > 0) {
        const { error: ledgerError } = await supabase
          .from('stock_ledger_materials')
          .insert({
            raw_material_id: newMaterial.id,
            movement_type: 'opening',
            quantity: opening_stock,
            notes: 'Opening stock',
            balance_after: opening_stock
          });
        
        if (ledgerError) throw ledgerError;
      }
      
      return newMaterial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-materials'] });
      toast.success('Raw material created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create material: ${error.message}`);
    },
  });
}

export function useUpdateRawMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RawMaterial> & { id: string }) => {
      const { data, error } = await supabase
        .from('raw_materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      toast.success('Raw material updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update material: ${error.message}`);
    },
  });
}

export function useMaterialUsage(materialId: string) {
  return useQuery({
    queryKey: ['material-usage', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_material_usage', { material_id: materialId });
      
      if (error) throw error;
      return data as MaterialUsage[];
    },
    enabled: !!materialId,
  });
}

export function useCanDeleteMaterial(materialId: string) {
  return useQuery({
    queryKey: ['can-delete-material', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('can_delete_material', { material_id: materialId });
      
      if (error) throw error;
      return data[0] as CanDeleteMaterial;
    },
    enabled: !!materialId,
  });
}

export function useDeleteRawMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First check if can delete
      const { data: canDelete, error: checkError } = await supabase
        .rpc('can_delete_material', { material_id: id });
      
      if (checkError) throw checkError;
      
      const result = canDelete[0] as CanDeleteMaterial;
      
      if (!result.can_delete) {
        throw new Error(`Cannot delete: Used in ${result.usage_count} BOM(s) and has ${result.ledger_count} stock entries`);
      }
      
      const { error } = await supabase
        .from('raw_materials')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      toast.success('Raw material deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
