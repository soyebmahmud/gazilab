import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleItem, ProductBatch } from '@/types/database';
import { toast } from 'sonner';

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(*),
          items:sale_items(
            *,
            product:products(*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(*),
          items:sale_items(
            *,
            product:products(*),
            production_batch:production_batches(*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Sale;
    },
    enabled: !!id,
  });
}

export function useProductBatches(productId: string) {
  return useQuery({
    queryKey: ['product-batches', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_product_batches', { p_product_id: productId });
      
      if (error) throw error;
      return data as ProductBatch[];
    },
    enabled: !!productId,
  });
}

interface CreateSaleData {
  customer_id?: string;
  sale_date: string;
  discount_amount: number;
  tax_percent: number;
  notes?: string;
  items: {
    product_id: string;
    production_batch_id?: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
  }[];
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSaleData) => {
      // Generate invoice number
      const { data: invoiceNumber, error: invoiceError } = await supabase
        .rpc('generate_invoice_number');
      
      if (invoiceError) throw invoiceError;
      
      // Calculate totals
      let subtotal = 0;
      const processedItems = data.items.map(item => {
        const lineTotal = item.quantity * item.unit_price * (1 - item.discount_percent / 100);
        subtotal += lineTotal;
        return { ...item, line_total: lineTotal };
      });
      
      const taxAmount = (subtotal - data.discount_amount) * (data.tax_percent / 100);
      const totalAmount = subtotal - data.discount_amount + taxAmount;
      
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          invoice_number: invoiceNumber,
          customer_id: data.customer_id || null,
          sale_date: data.sale_date,
          subtotal,
          discount_amount: data.discount_amount,
          tax_percent: data.tax_percent,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          notes: data.notes || null,
          payment_status: 'pending'
        })
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      // Create sale items
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(
          processedItems.map(item => ({
            sale_id: sale.id,
            product_id: item.product_id,
            production_batch_id: item.production_batch_id || null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent,
            line_total: item.line_total
          }))
        );
      
      if (itemsError) throw itemsError;
      
      // Deduct from stock ledger
      for (const item of processedItems) {
        const { error: ledgerError } = await supabase
          .from('stock_ledger_products')
          .insert({
            product_id: item.product_id,
            movement_type: 'sale',
            quantity: item.quantity,
            reference_id: sale.id,
            reference_type: 'sale',
            notes: `Invoice: ${invoiceNumber}`,
            balance_after: 0 // Will be calculated by trigger
          });
        
        if (ledgerError) throw ledgerError;
      }
      
      // Update customer outstanding balance if customer selected
      if (data.customer_id) {
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('outstanding_balance')
          .eq('id', data.customer_id)
          .single();
        
        if (customerError) throw customerError;
        
        await supabase
          .from('customers')
          .update({ 
            outstanding_balance: (customer.outstanding_balance || 0) + totalAmount 
          })
          .eq('id', data.customer_id);
      }
      
      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger-products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['product-batches'] });
      toast.success('Sale created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create sale: ${error.message}`);
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ saleId, status, amountPaid }: { saleId: string; status: string; amountPaid?: number }) => {
      const { data: sale, error: fetchError } = await supabase
        .from('sales')
        .select('*, customer_id, total_amount')
        .eq('id', saleId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('sales')
        .update({ payment_status: status })
        .eq('id', saleId);
      
      if (error) throw error;
      
      // Update customer balance if paid
      if (status === 'paid' && sale.customer_id) {
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('outstanding_balance')
          .eq('id', sale.customer_id)
          .single();
        
        if (customerError) throw customerError;
        
        await supabase
          .from('customers')
          .update({ 
            outstanding_balance: Math.max(0, (customer.outstanding_balance || 0) - sale.total_amount)
          })
          .eq('id', sale.customer_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Payment status updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}
