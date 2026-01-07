import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types/database';
import { toast } from 'sonner';
import { ensureValidSession, withJwtRefreshRetry } from './useSupabaseQuery';

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');

      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('customers')
          .select('*')
          .eq('is_active', true)
          .order('name')
      );
      
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');

      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .maybeSingle()
      );
      
      if (error) throw error;
      return data as Customer;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'outstanding_balance' | 'created_at' | 'updated_at'>) => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');
      
      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('customers')
          .insert({ ...customer, outstanding_balance: 0 })
          .select()
          .single()
      );
      
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create customer: ${error.message}`);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');
      
      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('customers')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
      );
      
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update customer: ${error.message}`);
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');
      
      const { error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('customers')
          .update({ is_active: false })
          .eq('id', id)
      );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
    },
  });
}
