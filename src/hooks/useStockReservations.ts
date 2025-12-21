import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockReservation } from '@/types/database';
import { toast } from 'sonner';

export function useStockReservations(productionBatchId?: string) {
  return useQuery({
    queryKey: ['stock-reservations', productionBatchId],
    queryFn: async () => {
      let query = supabase
        .from('stock_reservations')
        .select(`
          *,
          raw_material:raw_materials(id, name, sku, unit)
        `)
        .eq('status', 'reserved')
        .order('created_at', { ascending: false });
      
      if (productionBatchId) {
        query = query.eq('production_batch_id', productionBatchId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as StockReservation[];
    },
  });
}

export function useReservedQuantity(materialId: string) {
  return useQuery({
    queryKey: ['reserved-quantity', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_reservations')
        .select('quantity_reserved')
        .eq('raw_material_id', materialId)
        .eq('status', 'reserved');
      
      if (error) throw error;
      return data.reduce((sum, r) => sum + Number(r.quantity_reserved), 0);
    },
    enabled: !!materialId,
  });
}

interface CreateReservationData {
  raw_material_id: string;
  raw_material_batch_id?: string;
  production_batch_id: string;
  quantity_reserved: number;
  notes?: string;
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateReservationData) => {
      const { data: reservation, error } = await supabase
        .from('stock_reservations')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reserved-quantity'] });
      toast.success('Stock reserved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reserve stock: ${error.message}`);
    },
  });
}

export function useReleaseReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('stock_reservations')
        .update({ status: 'released' })
        .eq('id', reservationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reserved-quantity'] });
      toast.success('Reservation released');
    },
    onError: (error: Error) => {
      toast.error(`Failed to release reservation: ${error.message}`);
    },
  });
}

export function useConsumeReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('stock_reservations')
        .update({ status: 'consumed' })
        .eq('id', reservationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reserved-quantity'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to consume reservation: ${error.message}`);
    },
  });
}
