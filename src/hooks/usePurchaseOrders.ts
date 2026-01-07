import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ensureValidSession } from './useSupabaseQuery';

export interface PurchaseOrder {
  id: string;
  order_number: string;
  seller_id?: string;
  order_date: string;
  expected_delivery_date?: string;
  status: string;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  seller?: {
    id: string;
    name: string;
    phone?: string;
  };
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  raw_material_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  received_quantity: number;
  raw_material?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      await ensureValidSession();
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          seller:sellers(*),
          items:purchase_order_items(
            *,
            raw_material:raw_materials(*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      await ensureValidSession();
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          seller:sellers(*),
          items:purchase_order_items(
            *,
            raw_material:raw_materials(*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as PurchaseOrder;
    },
    enabled: !!id,
  });
}

interface CreatePOData {
  seller_id?: string;
  order_date: string;
  expected_delivery_date?: string;
  discount_amount: number;
  tax_percent: number;
  notes?: string;
  items: {
    raw_material_id: string;
    quantity: number;
    unit_price: number;
  }[];
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePOData) => {
      const isValid = await ensureValidSession();
      if (!isValid) {
        throw new Error('Session expired. Please log in again.');
      }
      
      // Generate PO number
      const { data: orderNumber, error: poError } = await supabase
        .rpc('generate_po_number');
      
      if (poError) throw poError;
      
      // Calculate totals
      let subtotal = 0;
      const processedItems = data.items.map(item => {
        const lineTotal = item.quantity * item.unit_price;
        subtotal += lineTotal;
        return { ...item, line_total: lineTotal };
      });
      
      const taxAmount = (subtotal - data.discount_amount) * (data.tax_percent / 100);
      const totalAmount = subtotal - data.discount_amount + taxAmount;
      
      // Create PO
      const { data: po, error: createError } = await supabase
        .from('purchase_orders')
        .insert({
          order_number: orderNumber,
          seller_id: data.seller_id || null,
          order_date: data.order_date,
          expected_delivery_date: data.expected_delivery_date || null,
          subtotal,
          discount_amount: data.discount_amount,
          tax_percent: data.tax_percent,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          notes: data.notes || null,
          status: 'pending'
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Create PO items
      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(
          processedItems.map(item => ({
            purchase_order_id: po.id,
            raw_material_id: item.raw_material_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total
          }))
        );
      
      if (itemsError) throw itemsError;
      
      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create purchase order: ${error.message}`);
    },
  });
}

export function useReceivePOItems() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ poId, items }: { 
      poId: string; 
      items: { 
        item_id: string;
        raw_material_id: string; 
        quantity: number;
        batch_number: string;
        expiry_date?: string;
        cost_per_unit: number;
      }[] 
    }) => {
      const isValid = await ensureValidSession();
      if (!isValid) {
        throw new Error('Session expired. Please log in again.');
      }
      
      for (const item of items) {
        // Create raw material batch
        const { data: batch, error: batchError } = await supabase
          .from('raw_material_batches')
          .insert({
            raw_material_id: item.raw_material_id,
            batch_number: item.batch_number,
            quantity_received: item.quantity,
            quantity_remaining: item.quantity,
            cost_per_unit: item.cost_per_unit,
            expiry_date: item.expiry_date || null,
            received_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();
        
        if (batchError) throw batchError;
        
        // Create stock ledger entry
        const { error: ledgerError } = await supabase
          .from('stock_ledger_materials')
          .insert({
            raw_material_id: item.raw_material_id,
            raw_material_batch_id: batch.id,
            movement_type: 'purchase',
            quantity: item.quantity,
            reference_id: poId,
            reference_type: 'purchase_order',
            notes: `PO Received: Batch ${item.batch_number}`,
            balance_after: 0
          });
        
        if (ledgerError) throw ledgerError;
        
        // Update PO item received quantity
        const { error: updateError } = await supabase
          .from('purchase_order_items')
          .update({ received_quantity: item.quantity })
          .eq('id', item.item_id);
        
        if (updateError) throw updateError;
      }
      
      // Update PO status
      const { error: statusError } = await supabase
        .from('purchase_orders')
        .update({ status: 'received' })
        .eq('id', poId);
      
      if (statusError) throw statusError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-materials'] });
      toast.success('Items received and stock updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to receive items: ${error.message}`);
    },
  });
}

export function useUpdatePOStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ poId, status }: { poId: string; status: string }) => {
      const isValid = await ensureValidSession();
      if (!isValid) {
        throw new Error('Session expired. Please log in again.');
      }
      
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', poId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Status updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}
