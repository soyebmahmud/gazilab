import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, BOMItem } from '@/types/database';
import { toast } from 'sonner';
import { ensureValidSession, withJwtRefreshRetry } from './useSupabaseQuery';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');

      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('name')
      );
      
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');

      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle()
      );
      
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}

interface CreateProductData {
  product: Omit<Product, 'id' | 'current_stock' | 'cost_price' | 'created_at' | 'updated_at'> & { opening_stock?: number };
  bomItems?: Omit<BOMItem, 'id' | 'bom_id' | 'created_at' | 'raw_material'>[];
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ product, bomItems }: CreateProductData) => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');
      
      const { opening_stock, ...productData } = product;
      
      const { data: newProduct, error: productError } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('products')
          .insert({ ...productData, cost_price: 0 })
          .select()
          .single()
      );
      
      if (productError) throw productError;
      
      if (opening_stock && opening_stock > 0 && newProduct) {
        const { error: ledgerError } = await withJwtRefreshRetry(async () =>
          await supabase
            .from('stock_ledger_products')
            .insert({
              product_id: newProduct.id,
              movement_type: 'opening',
              quantity: opening_stock,
              notes: 'Opening stock',
              balance_after: opening_stock
            })
        );
        
        if (ledgerError) throw ledgerError;
      }
      
      if (bomItems && bomItems.length > 0 && newProduct) {
        const { data: newBom, error: bomError } = await withJwtRefreshRetry(async () =>
          await supabase
            .from('bom')
            .insert({
              product_id: newProduct.id,
              version: 1,
              is_active: true
            })
            .select()
            .single()
        );
        
        if (bomError) throw bomError;
        
        if (newBom) {
          const { error: itemsError } = await withJwtRefreshRetry(async () =>
            await supabase
              .from('bom_items')
              .insert(
                bomItems.map(item => ({
                  bom_id: newBom.id,
                  raw_material_id: item.raw_material_id,
                  quantity_per_unit: item.quantity_per_unit,
                  wastage_percent: item.wastage_percent
                }))
              )
          );
          
          if (itemsError) throw itemsError;
        }
      }
      
      return newProduct as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-products'] });
      toast.success('Product created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');
      
      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('products')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
      );
      
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');
      
      const { error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('products')
          .update({ is_active: false })
          .eq('id', id)
      );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
}

export function useDeletedProducts() {
  return useQuery({
    queryKey: ['deleted-products'],
    queryFn: async () => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');

      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('products')
          .select('*')
          .eq('is_active', false)
          .order('name')
      );
      
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useRestoreProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');
      
      const { error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('products')
          .update({ is_active: true })
          .eq('id', id)
      );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-products'] });
      toast.success('Product restored successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to restore product: ${error.message}`);
    },
  });
}
