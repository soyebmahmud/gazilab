import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Seller } from '@/types/database';
import { toast } from 'sonner';

export function useSellers() {
  return useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Seller[];
    },
  });
}

export function useSeller(id: string) {
  return useQuery({
    queryKey: ['seller', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Seller;
    },
    enabled: !!id,
  });
}

export function useCreateSeller() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (seller: Omit<Seller, 'id' | 'outstanding_balance' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('sellers')
        .insert({ ...seller, outstanding_balance: 0 })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success('Seller created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create seller: ${error.message}`);
    },
  });
}

export function useUpdateSeller() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Seller> & { id: string }) => {
      const { data, error } = await supabase
        .from('sellers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success('Seller updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update seller: ${error.message}`);
    },
  });
}

export function useDeleteSeller() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sellers')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success('Seller deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete seller: ${error.message}`);
    },
  });
}
