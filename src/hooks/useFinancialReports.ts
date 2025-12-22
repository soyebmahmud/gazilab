import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SalesReportData {
  id: string;
  invoice_number: string;
  sale_date: string;
  customer_name: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  items_count: number;
}

export interface PurchaseReportData {
  id: string;
  order_number: string;
  order_date: string;
  seller_name: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  items_count: number;
}

export interface ProfitLossData {
  total_sales: number;
  total_cost_of_goods: number;
  gross_profit: number;
  total_expenses: number;
  total_damage_loss: number;
  net_profit: number;
  sales_count: number;
  returns_count: number;
  returns_value: number;
}

export interface ProductProfitData {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity_sold: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  profit_margin: number;
}

export interface CashSummaryData {
  opening_cash: number;
  cash_in: number;
  cash_out: number;
  closing_cash: number;
  bank_deposits: number;
  bank_withdrawals: number;
}

export interface PartyStatementData {
  party_id: string;
  party_name: string;
  party_type: 'customer' | 'seller';
  opening_balance: number;
  total_sales: number;
  total_payments: number;
  total_returns: number;
  closing_balance: number;
}

// Sales Report
export function useSalesReport(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['sales-report', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          sale_date,
          customer:customers(name),
          subtotal,
          discount_amount,
          tax_amount,
          total_amount,
          paid_amount,
          payment_status,
          sale_items(count)
        `)
        .gte('sale_date', dateFrom)
        .lte('sale_date', dateTo)
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(sale => ({
        id: sale.id,
        invoice_number: sale.invoice_number,
        sale_date: sale.sale_date,
        customer_name: sale.customer?.name || 'Walk-in Customer',
        subtotal: sale.subtotal,
        discount_amount: sale.discount_amount,
        tax_amount: sale.tax_amount,
        total_amount: sale.total_amount,
        paid_amount: sale.paid_amount,
        payment_status: sale.payment_status,
        items_count: sale.sale_items?.[0]?.count || 0,
      })) as SalesReportData[];
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Purchase Report
export function usePurchaseReport(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['purchase-report', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          order_number,
          order_date,
          seller:sellers(name),
          subtotal,
          discount_amount,
          tax_amount,
          total_amount,
          status,
          purchase_order_items(count)
        `)
        .gte('order_date', dateFrom)
        .lte('order_date', dateTo)
        .order('order_date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(po => ({
        id: po.id,
        order_number: po.order_number,
        order_date: po.order_date,
        seller_name: po.seller?.name || 'Unknown Seller',
        subtotal: po.subtotal,
        discount_amount: po.discount_amount,
        tax_amount: po.tax_amount,
        total_amount: po.total_amount,
        status: po.status,
        items_count: po.purchase_order_items?.[0]?.count || 0,
      })) as PurchaseReportData[];
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Profit & Loss Report
export function useProfitLossReport(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['profit-loss-report', dateFrom, dateTo],
    queryFn: async () => {
      // Get sales data
      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount, subtotal')
        .gte('sale_date', dateFrom)
        .lte('sale_date', dateTo);
      
      // Get sale items with cost
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          product:products(cost_price)
        `)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`);
      
      // Get expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', dateFrom)
        .lte('expense_date', dateTo);
      
      // Get damaged goods (losses)
      const { data: damages } = await supabase
        .from('damaged_goods')
        .select(`
          quantity,
          product:products(cost_price)
        `)
        .eq('status', 'destroyed')
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`);
      
      // Get returns
      const { data: returns } = await supabase
        .from('sale_returns')
        .select(`
          quantity_returned,
          product:products(selling_price)
        `)
        .gte('return_date', dateFrom)
        .lte('return_date', dateTo);
      
      const totalSales = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
      const totalCostOfGoods = saleItems?.reduce((sum, item) => 
        sum + (item.quantity * (item.product?.cost_price || 0)), 0) || 0;
      const grossProfit = totalSales - totalCostOfGoods;
      const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const totalDamageLoss = damages?.reduce((sum, d) => 
        sum + (d.quantity * (d.product?.cost_price || 0)), 0) || 0;
      const returnsValue = returns?.reduce((sum, r) => 
        sum + (r.quantity_returned * (r.product?.selling_price || 0)), 0) || 0;
      const netProfit = grossProfit - totalExpenses - totalDamageLoss;
      
      return {
        total_sales: totalSales,
        total_cost_of_goods: totalCostOfGoods,
        gross_profit: grossProfit,
        total_expenses: totalExpenses,
        total_damage_loss: totalDamageLoss,
        net_profit: netProfit,
        sales_count: sales?.length || 0,
        returns_count: returns?.length || 0,
        returns_value: returnsValue,
      } as ProfitLossData;
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Product-wise Profit & Loss
export function useProductProfitReport(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['product-profit-report', dateFrom, dateTo],
    queryFn: async () => {
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          line_total,
          product:products(id, name, sku, cost_price)
        `)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`);
      
      if (!saleItems) return [];
      
      // Group by product
      const productMap = new Map<string, ProductProfitData>();
      
      saleItems.forEach(item => {
        if (!item.product) return;
        
        const existing = productMap.get(item.product.id);
        const cost = item.quantity * item.product.cost_price;
        const revenue = item.line_total;
        
        if (existing) {
          existing.quantity_sold += item.quantity;
          existing.total_revenue += revenue;
          existing.total_cost += cost;
          existing.gross_profit = existing.total_revenue - existing.total_cost;
          existing.profit_margin = existing.total_revenue > 0 
            ? (existing.gross_profit / existing.total_revenue) * 100 
            : 0;
        } else {
          productMap.set(item.product.id, {
            product_id: item.product.id,
            product_name: item.product.name,
            product_sku: item.product.sku,
            quantity_sold: item.quantity,
            total_revenue: revenue,
            total_cost: cost,
            gross_profit: revenue - cost,
            profit_margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
          });
        }
      });
      
      return Array.from(productMap.values()).sort((a, b) => b.gross_profit - a.gross_profit);
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Cash Summary
export function useCashSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['cash-summary', dateFrom, dateTo],
    queryFn: async () => {
      // Get cash payments received
      const { data: payments } = await supabase
        .from('sale_payments')
        .select('amount, payment_method')
        .eq('payment_method', 'cash')
        .gte('payment_date', dateFrom)
        .lte('payment_date', dateTo);
      
      // Get cash expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, payment_method')
        .eq('payment_method', 'cash')
        .gte('expense_date', dateFrom)
        .lte('expense_date', dateTo);
      
      // Get bank transactions
      const { data: bankTx } = await supabase
        .from('bank_transactions')
        .select('amount, transaction_type')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo);
      
      const cashIn = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const cashOut = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const bankDeposits = bankTx?.filter(t => t.transaction_type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0) || 0;
      const bankWithdrawals = bankTx?.filter(t => t.transaction_type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0) || 0;
      
      return {
        opening_cash: 0, // Would need historical calculation
        cash_in: cashIn,
        cash_out: cashOut,
        closing_cash: cashIn - cashOut,
        bank_deposits: bankDeposits,
        bank_withdrawals: bankWithdrawals,
      } as CashSummaryData;
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Daily Sales / Day Book
export function useDailySales(date: string) {
  return useQuery({
    queryKey: ['daily-sales', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(name),
          sale_items(
            quantity,
            unit_price,
            line_total,
            product:products(name, sku)
          )
        `)
        .eq('sale_date', date)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!date,
  });
}

// Party Statement
export function usePartyStatement(partyId: string, partyType: 'customer' | 'seller', dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['party-statement', partyId, partyType, dateFrom, dateTo],
    queryFn: async () => {
      if (partyType === 'customer') {
        const { data: customer } = await supabase
          .from('customers')
          .select('name, outstanding_balance')
          .eq('id', partyId)
          .single();
        
        const { data: sales } = await supabase
          .from('sales')
          .select('total_amount, paid_amount')
          .eq('customer_id', partyId)
          .gte('sale_date', dateFrom)
          .lte('sale_date', dateTo);
        
        const { data: returns } = await supabase
          .from('sale_returns')
          .select('quantity_returned, product:products(selling_price)')
          .eq('sale_id', partyId)
          .gte('return_date', dateFrom)
          .lte('return_date', dateTo);
        
        const totalSales = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
        const totalPayments = sales?.reduce((sum, s) => sum + s.paid_amount, 0) || 0;
        const totalReturns = returns?.reduce((sum, r) => 
          sum + (r.quantity_returned * (r.product?.selling_price || 0)), 0) || 0;
        
        return {
          party_id: partyId,
          party_name: customer?.name || '',
          party_type: 'customer' as const,
          opening_balance: 0,
          total_sales: totalSales,
          total_payments: totalPayments,
          total_returns: totalReturns,
          closing_balance: customer?.outstanding_balance || 0,
        };
      } else {
        const { data: seller } = await supabase
          .from('sellers')
          .select('name, outstanding_balance')
          .eq('id', partyId)
          .single();
        
        const { data: purchases } = await supabase
          .from('purchase_orders')
          .select('total_amount')
          .eq('seller_id', partyId)
          .gte('order_date', dateFrom)
          .lte('order_date', dateTo);
        
        const totalPurchases = purchases?.reduce((sum, p) => sum + p.total_amount, 0) || 0;
        
        return {
          party_id: partyId,
          party_name: seller?.name || '',
          party_type: 'seller' as const,
          opening_balance: 0,
          total_sales: totalPurchases,
          total_payments: 0,
          total_returns: 0,
          closing_balance: seller?.outstanding_balance || 0,
        };
      }
    },
    enabled: !!partyId && !!dateFrom && !!dateTo,
  });
}

// Item-wise Sales Report
export function useItemWiseSalesReport(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['item-wise-sales', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          unit_price,
          line_total,
          product:products(id, name, sku, category)
        `)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`);
      
      if (!data) return [];
      
      // Group by product
      const productMap = new Map<string, {
        product_id: string;
        product_name: string;
        product_sku: string;
        category: string;
        quantity_sold: number;
        total_revenue: number;
        avg_price: number;
      }>();
      
      data.forEach(item => {
        if (!item.product) return;
        
        const existing = productMap.get(item.product.id);
        if (existing) {
          existing.quantity_sold += item.quantity;
          existing.total_revenue += item.line_total;
          existing.avg_price = existing.total_revenue / existing.quantity_sold;
        } else {
          productMap.set(item.product.id, {
            product_id: item.product.id,
            product_name: item.product.name,
            product_sku: item.product.sku,
            category: item.product.category,
            quantity_sold: item.quantity,
            total_revenue: item.line_total,
            avg_price: item.unit_price,
          });
        }
      });
      
      return Array.from(productMap.values()).sort((a, b) => b.quantity_sold - a.quantity_sold);
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Item-wise Purchase Report
export function useItemWisePurchaseReport(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['item-wise-purchase', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase
        .from('purchase_order_items')
        .select(`
          quantity,
          received_quantity,
          unit_price,
          line_total,
          raw_material:raw_materials(id, name, sku, category)
        `)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`);
      
      if (!data) return [];
      
      // Group by material
      const materialMap = new Map<string, {
        material_id: string;
        material_name: string;
        material_sku: string;
        category: string;
        quantity_ordered: number;
        quantity_received: number;
        total_cost: number;
        avg_price: number;
      }>();
      
      data.forEach(item => {
        if (!item.raw_material) return;
        
        const existing = materialMap.get(item.raw_material.id);
        if (existing) {
          existing.quantity_ordered += item.quantity;
          existing.quantity_received += item.received_quantity;
          existing.total_cost += item.line_total;
          existing.avg_price = existing.total_cost / existing.quantity_ordered;
        } else {
          materialMap.set(item.raw_material.id, {
            material_id: item.raw_material.id,
            material_name: item.raw_material.name,
            material_sku: item.raw_material.sku,
            category: item.raw_material.category,
            quantity_ordered: item.quantity,
            quantity_received: item.received_quantity,
            total_cost: item.line_total,
            avg_price: item.unit_price,
          });
        }
      });
      
      return Array.from(materialMap.values()).sort((a, b) => b.total_cost - a.total_cost);
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Stock Movement Report
export function useStockMovementReport(dateFrom: string, dateTo: string, itemType: 'material' | 'product') {
  return useQuery({
    queryKey: ['stock-movement', dateFrom, dateTo, itemType],
    queryFn: async () => {
      if (itemType === 'material') {
        const { data } = await supabase
          .from('stock_ledger_materials')
          .select(`
            *,
            raw_material:raw_materials(name, sku)
          `)
          .gte('created_at', `${dateFrom}T00:00:00`)
          .lte('created_at', `${dateTo}T23:59:59`)
          .order('created_at', { ascending: false });
        
        return data || [];
      } else {
        const { data } = await supabase
          .from('stock_ledger_products')
          .select(`
            *,
            product:products(name, sku)
          `)
          .gte('created_at', `${dateFrom}T00:00:00`)
          .lte('created_at', `${dateTo}T23:59:59`)
          .order('created_at', { ascending: false });
        
        return data || [];
      }
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Expense Report by Category
export function useExpenseByCategory(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['expense-by-category', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase
        .from('expenses')
        .select(`
          amount,
          category:expense_categories(id, name)
        `)
        .gte('expense_date', dateFrom)
        .lte('expense_date', dateTo);
      
      if (!data) return [];
      
      // Group by category
      const categoryMap = new Map<string, {
        category_id: string;
        category_name: string;
        total_amount: number;
        count: number;
      }>();
      
      data.forEach(expense => {
        const catId = expense.category?.id || 'uncategorized';
        const catName = expense.category?.name || 'Uncategorized';
        
        const existing = categoryMap.get(catId);
        if (existing) {
          existing.total_amount += expense.amount;
          existing.count += 1;
        } else {
          categoryMap.set(catId, {
            category_id: catId,
            category_name: catName,
            total_amount: expense.amount,
            count: 1,
          });
        }
      });
      
      return Array.from(categoryMap.values()).sort((a, b) => b.total_amount - a.total_amount);
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Balance Sheet (Simple)
export function useBalanceSheet(asOfDate: string) {
  return useQuery({
    queryKey: ['balance-sheet', asOfDate],
    queryFn: async () => {
      // Get inventory value
      const { data: materials } = await supabase
        .from('raw_materials')
        .select('current_stock, cost_per_unit');
      
      const { data: products } = await supabase
        .from('products')
        .select('current_stock, cost_price');
      
      // Get receivables (customer outstanding)
      const { data: customers } = await supabase
        .from('customers')
        .select('outstanding_balance');
      
      // Get bank balances
      const { data: banks } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('is_active', true);
      
      // Get payables (seller outstanding)
      const { data: sellers } = await supabase
        .from('sellers')
        .select('outstanding_balance');
      
      const inventoryMaterials = materials?.reduce((sum, m) => sum + (m.current_stock * m.cost_per_unit), 0) || 0;
      const inventoryProducts = products?.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0) || 0;
      const totalInventory = inventoryMaterials + inventoryProducts;
      
      const totalReceivables = customers?.reduce((sum, c) => sum + c.outstanding_balance, 0) || 0;
      const totalBankBalance = banks?.reduce((sum, b) => sum + b.current_balance, 0) || 0;
      const totalPayables = sellers?.reduce((sum, s) => sum + s.outstanding_balance, 0) || 0;
      
      return {
        assets: {
          inventory_raw_materials: inventoryMaterials,
          inventory_finished_goods: inventoryProducts,
          total_inventory: totalInventory,
          accounts_receivable: totalReceivables,
          bank_balance: totalBankBalance,
          total_current_assets: totalInventory + totalReceivables + totalBankBalance,
        },
        liabilities: {
          accounts_payable: totalPayables,
          total_current_liabilities: totalPayables,
        },
        equity: {
          total_equity: (totalInventory + totalReceivables + totalBankBalance) - totalPayables,
        },
      };
    },
    enabled: !!asOfDate,
  });
}
