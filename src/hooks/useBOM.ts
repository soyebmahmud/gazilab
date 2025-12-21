import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BOM, BOMItem } from '@/types/database';
import { toast } from 'sonner';

export function useBOMs() {
  return useQuery({
    queryKey: ['boms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bom')
        .select(`
          *,
          product:products(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BOM[];
    },
  });
}

export function useBOM(id: string) {
  return useQuery({
    queryKey: ['bom', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bom')
        .select(`
          *,
          product:products(*),
          items:bom_items(
            *,
            raw_material:raw_materials(*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as BOM;
    },
    enabled: !!id,
  });
}

export function useProductBOMs(productId: string) {
  return useQuery({
    queryKey: ['product-boms', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bom')
        .select(`
          *,
          items:bom_items(
            *,
            raw_material:raw_materials(*)
          )
        `)
        .eq('product_id', productId)
        .order('version', { ascending: false });
      
      if (error) throw error;
      return data as BOM[];
    },
    enabled: !!productId,
  });
}

export function useActiveBOM(productId: string) {
  return useQuery({
    queryKey: ['active-bom', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bom')
        .select(`
          *,
          items:bom_items(
            *,
            raw_material:raw_materials(*)
          )
        `)
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as BOM | null;
    },
    enabled: !!productId,
  });
}

interface CreateBOMData {
  product_id: string;
  notes?: string;
  items: Omit<BOMItem, 'id' | 'bom_id' | 'created_at' | 'raw_material'>[];
}

export function useCreateBOM() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ product_id, notes, items }: CreateBOMData) => {
      // Get next version number
      const { data: existingBOMs } = await supabase
        .from('bom')
        .select('version')
        .eq('product_id', product_id)
        .order('version', { ascending: false })
        .limit(1);
      
      const nextVersion = (existingBOMs?.[0]?.version || 0) + 1;
      
      // Deactivate existing BOMs for this product
      await supabase
        .from('bom')
        .update({ is_active: false })
        .eq('product_id', product_id);
      
      // Create BOM
      const { data: newBom, error: bomError } = await supabase
        .from('bom')
        .insert({
          product_id,
          version: nextVersion,
          notes,
          is_active: true
        })
        .select()
        .single();
      
      if (bomError) throw bomError;
      
      // Add BOM items
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('bom_items')
          .insert(
            items.map(item => ({
              bom_id: newBom.id,
              raw_material_id: item.raw_material_id,
              quantity_per_unit: item.quantity_per_unit,
              wastage_percent: item.wastage_percent
            }))
          );
        
        if (itemsError) throw itemsError;
      }
      
      return newBom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      queryClient.invalidateQueries({ queryKey: ['product-boms'] });
      queryClient.invalidateQueries({ queryKey: ['active-bom'] });
      toast.success('BOM created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create BOM: ${error.message}`);
    },
  });
}

// Get products that don't have any BOM yet (for initial BOM creation)
export function useProductsWithoutBOM() {
  return useQuery({
    queryKey: ['products-without-bom'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      
      if (productsError) throw productsError;
      
      const { data: boms, error: bomsError } = await supabase
        .from('bom')
        .select('product_id');
      
      if (bomsError) throw bomsError;
      
      const productIdsWithBom = new Set(boms.map(b => b.product_id));
      return products.filter(p => !productIdsWithBom.has(p.id));
    },
  });
}

export function useUpdateBOM() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, items, ...updates }: Partial<BOM> & { id: string; items?: Omit<BOMItem, 'id' | 'bom_id' | 'created_at' | 'raw_material'>[] }) => {
      // Update BOM
      const { data, error: bomError } = await supabase
        .from('bom')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (bomError) throw bomError;
      
      // Update items if provided
      if (items) {
        // Delete existing items
        await supabase.from('bom_items').delete().eq('bom_id', id);
        
        // Insert new items
        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from('bom_items')
            .insert(
              items.map(item => ({
                bom_id: id,
                raw_material_id: item.raw_material_id,
                quantity_per_unit: item.quantity_per_unit,
                wastage_percent: item.wastage_percent
              }))
            );
          
          if (itemsError) throw itemsError;
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      queryClient.invalidateQueries({ queryKey: ['bom'] });
      queryClient.invalidateQueries({ queryKey: ['product-boms'] });
      queryClient.invalidateQueries({ queryKey: ['active-bom'] });
      toast.success('BOM updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update BOM: ${error.message}`);
    },
  });
}
