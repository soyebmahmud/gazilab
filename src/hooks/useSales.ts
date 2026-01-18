import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleItem, ProductBatch } from '@/types/database';
import { toast } from 'sonner';
import { ensureValidSession, withJwtRefreshRetry } from './useSupabaseQuery';

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');

      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('sales')
          .select(`
            *,
            customer:customers(*),
            items:sale_items(
              *,
              product:products(*)
            )
          `)
          .order('created_at', { ascending: false })
      );
      
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');

      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase
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
          .maybeSingle()
      );
      
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
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');

      const { data, error } = await withJwtRefreshRetry(async () =>
        await supabase.rpc('get_product_batches', { p_product_id: productId })
      );
      
      if (error) throw error;
      return data as ProductBatch[];
    },
    enabled: !!productId,
  });
}

type SaleUnitType = 'units' | 'primary' | 'secondary' | 'tertiary';

interface CreateSaleData {
  customer_id?: string;
  sale_date: string;
  discount_amount: number;
  tax_percent: number;
  notes?: string;
  manual_invoice_number?: string;
  items: {
    product_id: string;
    production_batch_id?: string;
    quantity: number;
    unit_type: SaleUnitType;
    unit_price: number;
    discount_percent: number;
  }[];
}

interface ProcessedItem {
  product_id: string;
  production_batch_id?: string;
  quantity: number;
  unit_type: SaleUnitType;
  unit_price: number;
  discount_percent: number;
  actual_quantity: number;
  line_total: number;
  product_name: string;
  current_stock: number;
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSaleData) => {
      const isValid = await ensureValidSession();
      if (!isValid) throw new Error('Session expired. Please log in again.');
      
      // Step 1: Process items and validate stock BEFORE creating any records
      const processedItems: ProcessedItem[] = [];
      let subtotal = 0;
      
      for (const item of data.items) {
        // Get product info including stock
        const { data: product, error: productError } = await withJwtRefreshRetry(async () =>
          await supabase
            .from('products')
            .select('current_stock, name')
            .eq('id', item.product_id)
            .single()
        );
        
        if (productError) throw productError;
        
        let actualQuantity = item.quantity;
        
        // Convert units if not 'units'
        if (item.unit_type !== 'units') {
          const { data: packagingConfig } = await withJwtRefreshRetry(async () =>
            await supabase
              .from('product_packaging_configs')
              .select('*')
              .eq('product_id', item.product_id)
              .eq('is_default', true)
              .maybeSingle()
          );
          
          if (packagingConfig) {
            const { data: converted } = await withJwtRefreshRetry(async () =>
              await supabase.rpc('calculate_packaging_units', {
                p_packaging_config_id: packagingConfig.id,
                p_quantity: item.quantity,
                p_unit_type: item.unit_type
              })
            );
            
            if (converted && converted.length > 0) {
              actualQuantity = converted[0].total_units;
            }
          } else {
            // No packaging config found, throw error for non-unit types
            throw new Error(`No packaging configuration found for ${product.name}. Cannot sell by ${item.unit_type}.`);
          }
        }
        
        // Validate stock BEFORE proceeding
        if (product.current_stock < actualQuantity) {
          throw new Error(`Insufficient stock for ${product.name}. Required: ${actualQuantity}, Available: ${product.current_stock}`);
        }
        
        const lineTotal = item.quantity * item.unit_price * (1 - item.discount_percent / 100);
        subtotal += lineTotal;
        
        processedItems.push({
          ...item,
          actual_quantity: actualQuantity,
          line_total: lineTotal,
          product_name: product.name,
          current_stock: product.current_stock
        });
      }
      
      // Step 2: Generate invoice number
      let invoiceNumber = data.manual_invoice_number?.trim();
      
      if (!invoiceNumber) {
        const { data: generatedNumber, error: invoiceError } = await withJwtRefreshRetry(async () =>
          await supabase.rpc('generate_invoice_number')
        );
        
        if (invoiceError) throw invoiceError;
        invoiceNumber = generatedNumber;
      }
      
      // Step 3: Calculate totals
      const taxAmount = (subtotal - data.discount_amount) * (data.tax_percent / 100);
      const totalAmount = subtotal - data.discount_amount + taxAmount;
      
      // Step 4: Create sale record
      const { data: sale, error: saleError } = await withJwtRefreshRetry(async () =>
        await supabase
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
          .single()
      );
      
      if (saleError) throw saleError;
      
      // Step 5: Insert sale items
      const { error: itemsError } = await withJwtRefreshRetry(async () =>
        await supabase
          .from('sale_items')
          .insert(
            processedItems.map(item => ({
              sale_id: sale.id,
              product_id: item.product_id,
              production_batch_id: item.production_batch_id || null,
              quantity: item.actual_quantity,
              unit_price: item.unit_price,
              discount_percent: item.discount_percent,
              line_total: item.line_total
            }))
          )
      );
      
      if (itemsError) {
        // Rollback: delete the sale record
        await supabase.from('sales').delete().eq('id', sale.id);
        throw itemsError;
      }
      
      // Step 6: Insert stock ledger entries with correct balance_after
      for (const item of processedItems) {
        const newBalance = item.current_stock - item.actual_quantity;
        
        const { error: ledgerError } = await withJwtRefreshRetry(async () =>
          await supabase
            .from('stock_ledger_products')
            .insert({
              product_id: item.product_id,
              movement_type: 'sale',
              quantity: item.actual_quantity,
              reference_id: sale.id,
              reference_type: 'sale',
              notes: `Invoice: ${invoiceNumber} (${item.quantity} ${item.unit_type})`,
              balance_after: newBalance
            })
        );
        
        if (ledgerError) {
          // Rollback: delete sale items and sale
          await supabase.from('sale_items').delete().eq('sale_id', sale.id);
          await supabase.from('sales').delete().eq('id', sale.id);
          throw ledgerError;
        }
        
        // Update product stock
        const { error: stockError } = await withJwtRefreshRetry(async () =>
          await supabase
            .from('products')
            .update({ current_stock: newBalance })
            .eq('id', item.product_id)
        );
        
        if (stockError) {
          // Log error but don't fail - trigger should handle this
          console.error('Failed to update product stock:', stockError);
        }
      }
      
      // Step 7: Update customer outstanding balance
      if (data.customer_id) {
        const { data: customer, error: customerError } = await withJwtRefreshRetry(async () =>
          await supabase
            .from('customers')
            .select('outstanding_balance')
            .eq('id', data.customer_id)
            .single()
        );
        
        if (customerError) {
          console.error('Failed to fetch customer:', customerError);
        } else {
          await withJwtRefreshRetry(async () =>
            await supabase
              .from('customers')
              .update({ 
                outstanding_balance: (customer.outstanding_balance || 0) + totalAmount 
              })
              .eq('id', data.customer_id)
          );
        }
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

// Payment tracking is now handled via useSalePayments hook
