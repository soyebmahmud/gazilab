import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RawMaterial, Product, DashboardStats } from '@/types/database';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      
      if (productsError) throw productsError;
      
      // Fetch raw materials
      const { data: materials, error: materialsError } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('is_active', true);
      
      if (materialsError) throw materialsError;
      
      // Fetch customers for receivables
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('outstanding_balance')
        .eq('is_active', true);
      
      if (customersError) throw customersError;
      
      // Fetch BOMs for manufacturing value
      const { data: boms, error: bomsError } = await supabase
        .from('bom')
        .select('estimated_cost, product_id')
        .eq('is_active', true);
      
      if (bomsError) throw bomsError;
      
      // Calculate stats
      const rawMaterialValue = (materials as RawMaterial[]).reduce(
        (sum, m) => sum + (m.current_stock * m.cost_per_unit), 0
      );
      
      const finishedGoodsValue = (products as Product[]).reduce(
        (sum, p) => sum + (p.current_stock * p.selling_price), 0
      );
      
      const totalReceivable = customers.reduce(
        (sum, c) => sum + Number(c.outstanding_balance), 0
      );
      
      // Calculate manufacturing value (BOM cost * product stock)
      let manufacturingValue = 0;
      for (const bom of boms) {
        const product = (products as Product[]).find(p => p.id === bom.product_id);
        if (product) {
          manufacturingValue += Number(bom.estimated_cost) * product.current_stock;
        }
      }
      
      // Low stock products
      const lowStockProducts = (products as Product[]).filter(
        p => p.current_stock <= p.min_stock_level
      );
      
      // Low stock materials
      const lowStockMaterials = (materials as RawMaterial[]).filter(
        m => m.current_stock <= m.min_stock_level
      );
      
      // Products by category
      const categoryCount: Record<string, number> = {};
      for (const product of products as Product[]) {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
      }
      const productsByCategory = Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count
      }));
      
      return {
        totalProducts: products.length,
        totalMaterials: materials.length,
        totalReceivable,
        inventoryValue: rawMaterialValue + finishedGoodsValue,
        rawMaterialValue,
        finishedGoodsValue,
        manufacturingValue,
        lowStockProducts,
        lowStockMaterials,
        productsByCategory
      };
    },
  });
}

export function useInventoryInsights() {
  return useQuery({
    queryKey: ['inventory-insights'],
    queryFn: async () => {
      // Fetch materials with stock
      const { data: materials, error: materialsError } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('is_active', true)
        .order('current_stock', { ascending: false });
      
      if (materialsError) throw materialsError;
      
      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      
      if (productsError) throw productsError;
      
      // High value materials (by total value)
      const highValueMaterials = [...(materials as RawMaterial[])]
        .sort((a, b) => (b.current_stock * b.cost_per_unit) - (a.current_stock * a.cost_per_unit))
        .slice(0, 5);
      
      // Total quantities by unit
      const materialsByUnit: Record<string, number> = {};
      for (const m of materials as RawMaterial[]) {
        materialsByUnit[m.unit] = (materialsByUnit[m.unit] || 0) + m.current_stock;
      }
      
      const productsByUnit: Record<string, number> = {};
      for (const p of products as Product[]) {
        productsByUnit[p.unit] = (productsByUnit[p.unit] || 0) + p.current_stock;
      }
      
      return {
        highValueMaterials,
        materialsByUnit,
        productsByUnit,
        totalMaterialQty: (materials as RawMaterial[]).reduce((sum, m) => sum + m.current_stock, 0),
        totalProductQty: (products as Product[]).reduce((sum, p) => sum + p.current_stock, 0)
      };
    }
  });
}

export function useManufacturingInsights() {
  return useQuery({
    queryKey: ['manufacturing-insights'],
    queryFn: async () => {
      // Fetch production batches
      const { data: batches, error: batchesError } = await supabase
        .from('production_batches')
        .select(`
          *,
          product:products(*),
          bom:bom(estimated_cost)
        `);
      
      if (batchesError) throw batchesError;
      
      // Fetch all BOMs with products
      const { data: boms, error: bomsError } = await supabase
        .from('bom')
        .select(`
          *,
          product:products(name, sku)
        `)
        .eq('is_active', true)
        .order('estimated_cost', { ascending: false });
      
      if (bomsError) throw bomsError;
      
      // Costliest product to manufacture
      const costliestBom = boms[0];
      
      // Calculate average manufacturing cost
      const avgCost = boms.length > 0 
        ? boms.reduce((sum, b) => sum + Number(b.estimated_cost), 0) / boms.length 
        : 0;
      
      // Total production value
      const completedBatches = batches.filter((b: any) => b.status === 'completed');
      const totalProductionValue = completedBatches.reduce((sum: number, b: any) => {
        return sum + (b.quantity_produced * Number(b.bom?.estimated_cost || 0));
      }, 0);
      
      // Production efficiency
      const efficiency = completedBatches.length > 0
        ? completedBatches.reduce((sum: number, b: any) => {
            return sum + (b.quantity_produced / b.quantity_planned * 100);
          }, 0) / completedBatches.length
        : 0;
      
      return {
        costliestProduct: costliestBom?.product,
        costliestBomCost: costliestBom?.estimated_cost || 0,
        averageCost: avgCost,
        totalProductionValue,
        productionEfficiency: efficiency,
        totalBatches: batches.length,
        completedBatches: completedBatches.length
      };
    }
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      // Low stock materials
      const { data: materials, error: materialsError } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('is_active', true);
      
      if (materialsError) throw materialsError;
      
      const nearingOutOfStock = (materials as RawMaterial[]).filter(
        m => m.current_stock > 0 && m.current_stock <= m.min_stock_level * 1.5
      );
      
      const outOfStock = (materials as RawMaterial[]).filter(
        m => m.current_stock <= 0
      );
      
      // Products with insufficient materials for production
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          bom:bom(
            *,
            items:bom_items(
              *,
              raw_material:raw_materials(*)
            )
          )
        `)
        .eq('is_active', true);
      
      if (productsError) throw productsError;
      
      const blockedProducts = [];
      for (const product of products as any[]) {
        const activeBom = product.bom?.find((b: any) => b.is_active);
        if (activeBom?.items) {
          for (const item of activeBom.items) {
            if (item.raw_material && item.raw_material.current_stock < item.quantity_per_unit) {
              blockedProducts.push({
                product,
                material: item.raw_material,
                required: item.quantity_per_unit,
                available: item.raw_material.current_stock
              });
              break;
            }
          }
        }
      }
      
      return {
        nearingOutOfStock,
        outOfStock,
        blockedProducts
      };
    }
  });
}

export function useSalesTrends() {
  return useQuery({
    queryKey: ['sales-trends'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('sale_date, total_amount')
        .order('sale_date', { ascending: true });
      
      if (error) throw error;
      
      // Group by month
      const monthlyData: Record<string, number> = {};
      for (const sale of data || []) {
        const date = new Date(sale.sale_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(sale.total_amount);
      }
      
      // Convert to array and get last 6 months
      const months = Object.entries(monthlyData)
        .map(([month, total]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          total
        }))
        .slice(-6);
      
      return months;
    }
  });
}

export function useProductionTrends() {
  return useQuery({
    queryKey: ['production-trends'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_batches')
        .select('created_at, quantity_produced, status')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Group by month
      const monthlyData: Record<string, { produced: number; planned: number }> = {};
      for (const batch of data || []) {
        const date = new Date(batch.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { produced: 0, planned: 0 };
        }
        monthlyData[monthKey].produced += batch.quantity_produced || 0;
        monthlyData[monthKey].planned += 1;
      }
      
      // Convert to array and get last 6 months
      const months = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          produced: data.produced,
          batches: data.planned
        }))
        .slice(-6);
      
      return months;
    }
  });
}

export function useWeeklySales() {
  return useQuery({
    queryKey: ['weekly-sales'],
    queryFn: async () => {
      // Get start and end of current week (Sunday to Saturday)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const { data, error } = await supabase
        .from('sales')
        .select('sale_date, total_amount')
        .gte('sale_date', startOfWeek.toISOString().split('T')[0])
        .lte('sale_date', endOfWeek.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      // Create array for all 7 days of the week
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekData = days.map((day, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTotal = (data || [])
          .filter(sale => sale.sale_date === dateStr)
          .reduce((sum, sale) => sum + Number(sale.total_amount), 0);
        
        return {
          day,
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          total: dayTotal
        };
      });
      
      return weekData;
    }
  });
}

export function useInventoryTrends() {
  return useQuery({
    queryKey: ['inventory-trends'],
    queryFn: async () => {
      // Get stock ledger entries for products
      const { data: productLedger, error: productError } = await supabase
        .from('stock_ledger_products')
        .select('created_at, balance_after, product_id')
        .order('created_at', { ascending: true });
      
      if (productError) throw productError;
      
      // Get stock ledger entries for materials
      const { data: materialLedger, error: materialError } = await supabase
        .from('stock_ledger_materials')
        .select('created_at, balance_after, raw_material_id')
        .order('created_at', { ascending: true });
      
      if (materialError) throw materialError;
      
      // Get current product and material prices for value calculation
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, selling_price');
      
      if (prodError) throw prodError;
      
      const { data: materials, error: matError } = await supabase
        .from('raw_materials')
        .select('id, cost_per_unit');
      
      if (matError) throw matError;
      
      const productPrices = Object.fromEntries((products || []).map(p => [p.id, Number(p.selling_price)]));
      const materialPrices = Object.fromEntries((materials || []).map(m => [m.id, Number(m.cost_per_unit)]));
      
      // Group by day and calculate latest balance for each item
      const dailyData: Record<string, { productValue: number; materialValue: number }> = {};
      
      // Process product ledger
      const productBalances: Record<string, number> = {};
      for (const entry of productLedger || []) {
        const date = new Date(entry.created_at);
        const dateKey = date.toISOString().split('T')[0];
        productBalances[entry.product_id] = entry.balance_after;
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { productValue: 0, materialValue: 0 };
        }
        // Calculate total product value from all product balances
        dailyData[dateKey].productValue = Object.entries(productBalances)
          .reduce((sum, [id, balance]) => sum + (balance * (productPrices[id] || 0)), 0);
      }
      
      // Process material ledger
      const materialBalances: Record<string, number> = {};
      for (const entry of materialLedger || []) {
        const date = new Date(entry.created_at);
        const dateKey = date.toISOString().split('T')[0];
        materialBalances[entry.raw_material_id] = entry.balance_after;
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { productValue: 0, materialValue: 0 };
        }
        // Calculate total material value from all material balances
        dailyData[dateKey].materialValue = Object.entries(materialBalances)
          .reduce((sum, [id, balance]) => sum + (balance * (materialPrices[id] || 0)), 0);
      }
      
      // Convert to array and get last 14 days
      const trends = Object.entries(dailyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, values]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          products: values.productValue,
          materials: values.materialValue,
          total: values.productValue + values.materialValue
        }));
      
      return trends;
    }
  });
}

export function useTopSellingProducts() {
  return useQuery({
    queryKey: ['top-selling-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          line_total,
          product:products(id, name, sku)
        `);
      
      if (error) throw error;
      
      // Aggregate by product
      const productSales: Record<string, { name: string; sku: string; quantity: number; revenue: number }> = {};
      
      for (const item of data || []) {
        const product = item.product as any;
        if (!product) continue;
        
        if (!productSales[product.id]) {
          productSales[product.id] = {
            name: product.name,
            sku: product.sku,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[product.id].quantity += Number(item.quantity);
        productSales[product.id].revenue += Number(item.line_total);
      }
      
      // Sort by revenue and get top 5
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      return topProducts;
    }
  });
}

// Top 5 Most Profitable Products
export function useTopProfitableProducts() {
  return useQuery({
    queryKey: ['top-profitable-products'],
    queryFn: async () => {
      // Get sale items with product info
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          line_total,
          unit_price,
          product:products(id, name, sku, cost_price, selling_price)
        `);
      
      if (error) throw error;
      
      // Calculate profit per product
      const productProfits: Record<string, { 
        name: string; 
        sku: string; 
        totalRevenue: number; 
        totalCost: number;
        totalProfit: number;
        unitsSold: number;
        profitMargin: number;
      }> = {};
      
      for (const item of data || []) {
        const product = item.product as any;
        if (!product) continue;
        
        const productId = product.id;
        const costPrice = Number(product.cost_price) || 0;
        const revenue = Number(item.line_total) || 0;
        const cost = Number(item.quantity) * costPrice;
        const profit = revenue - cost;
        
        if (!productProfits[productId]) {
          productProfits[productId] = {
            name: product.name,
            sku: product.sku,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            unitsSold: 0,
            profitMargin: 0
          };
        }
        
        productProfits[productId].totalRevenue += revenue;
        productProfits[productId].totalCost += cost;
        productProfits[productId].totalProfit += profit;
        productProfits[productId].unitsSold += Number(item.quantity);
      }
      
      // Calculate profit margin and sort by total profit
      const topProducts = Object.entries(productProfits)
        .map(([id, data]) => ({
          id,
          ...data,
          profitMargin: data.totalRevenue > 0 
            ? ((data.totalProfit / data.totalRevenue) * 100) 
            : 0
        }))
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 5);
      
      return topProducts;
    }
  });
}

export function useProfitMargins() {
  return useQuery({
    queryKey: ['profit-margins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, cost_price, selling_price')
        .eq('is_active', true)
        .order('selling_price', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      return (data || []).map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        cost: Number(p.cost_price),
        profit: Number(p.selling_price) - Number(p.cost_price),
        margin: Number(p.cost_price) > 0 
          ? ((Number(p.selling_price) - Number(p.cost_price)) / Number(p.selling_price) * 100).toFixed(1)
          : 0
      }));
    }
  });
}

export function useMaterialConsumption() {
  return useQuery({
    queryKey: ['material-consumption'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_material_usage')
        .select(`
          quantity_used,
          wastage_quantity,
          raw_material:raw_materials(id, name, unit)
        `);
      
      if (error) throw error;
      
      // Aggregate by material
      const materialUsage: Record<string, { name: string; unit: string; used: number; wastage: number }> = {};
      
      for (const item of data || []) {
        const material = item.raw_material as any;
        if (!material) continue;
        
        if (!materialUsage[material.id]) {
          materialUsage[material.id] = {
            name: material.name,
            unit: material.unit,
            used: 0,
            wastage: 0
          };
        }
        materialUsage[material.id].used += Number(item.quantity_used);
        materialUsage[material.id].wastage += Number(item.wastage_quantity);
      }
      
      // Sort by total used and get top 8
      const topMaterials = Object.values(materialUsage)
        .sort((a, b) => b.used - a.used)
        .slice(0, 8)
        .map(m => ({
          name: m.name.length > 12 ? m.name.substring(0, 12) + '...' : m.name,
          used: m.used,
          wastage: m.wastage,
          total: m.used + m.wastage
        }));
      
      return topMaterials;
    }
  });
}

export function useSalesByCustomer() {
  return useQuery({
    queryKey: ['sales-by-customer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          total_amount,
          customer:customers(id, name)
        `);
      
      if (error) throw error;
      
      // Aggregate by customer
      const customerSales: Record<string, { name: string; total: number; count: number }> = {};
      
      for (const sale of data || []) {
        const customer = sale.customer as any;
        const customerId = customer?.id || 'walk-in';
        const customerName = customer?.name || 'Walk-in Customer';
        
        if (!customerSales[customerId]) {
          customerSales[customerId] = {
            name: customerName,
            total: 0,
            count: 0
          };
        }
        customerSales[customerId].total += Number(sale.total_amount);
        customerSales[customerId].count += 1;
      }
      
      // Sort by total and get top 5
      const topCustomers = Object.values(customerSales)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(c => ({
          name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
          total: c.total,
          orders: c.count
        }));
      
      return topCustomers;
    }
  });
}

// Today's Net Profit hook
export function useTodayProfit() {
  return useQuery({
    queryKey: ['today-profit'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get today's sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, subtotal')
        .eq('sale_date', today);
      
      if (salesError) throw salesError;
      
      // Get today's expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('expense_date', today);
      
      if (expensesError) throw expensesError;
      
      // Get today's sale items for COGS calculation
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          product:products(cost_price),
          sale:sales!inner(sale_date)
        `)
        .eq('sale.sale_date', today);
      
      if (saleItemsError) throw saleItemsError;
      
      const totalSales = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const cogs = saleItems?.reduce((sum, item: any) => {
        const costPrice = item.product?.cost_price || 0;
        return sum + (Number(item.quantity) * Number(costPrice));
      }, 0) || 0;
      
      const grossProfit = totalSales - cogs;
      const netProfit = grossProfit - totalExpenses;
      
      return {
        totalSales,
        totalExpenses,
        cogs,
        grossProfit,
        netProfit
      };
    }
  });
}

// This Month's Profit hook
export function useMonthProfit() {
  return useQuery({
    queryKey: ['month-profit'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
      
      // Get this month's sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('sale_date', monthStart)
        .lte('sale_date', monthEnd);
      
      if (salesError) throw salesError;
      
      // Get this month's expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd);
      
      if (expensesError) throw expensesError;
      
      // Get this month's sale items for COGS
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          product:products(cost_price),
          sale:sales!inner(sale_date)
        `)
        .gte('sale.sale_date', monthStart)
        .lte('sale.sale_date', monthEnd);
      
      if (saleItemsError) throw saleItemsError;
      
      const totalSales = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const cogs = saleItems?.reduce((sum, item: any) => {
        const costPrice = item.product?.cost_price || 0;
        return sum + (Number(item.quantity) * Number(costPrice));
      }, 0) || 0;
      
      const grossProfit = totalSales - cogs;
      const netProfit = grossProfit - totalExpenses;
      
      return {
        totalSales,
        totalExpenses,
        cogs,
        grossProfit,
        netProfit
      };
    }
  });
}

// Profit Trends (Last 30 days daily, monthly, yearly)
export function useProfitTrends(period: 'daily' | 'monthly' | 'yearly' = 'daily') {
  return useQuery({
    queryKey: ['profit-trends', period],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      let groupByFormat: string;
      
      if (period === 'daily') {
        startDate = subDays(now, 30);
        groupByFormat = 'yyyy-MM-dd';
      } else if (period === 'monthly') {
        startDate = subDays(now, 365);
        groupByFormat = 'yyyy-MM';
      } else {
        startDate = subDays(now, 365 * 3);
        groupByFormat = 'yyyy';
      }
      
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      
      // Get sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('sale_date, total_amount')
        .gte('sale_date', startDateStr);
      
      if (salesError) throw salesError;
      
      // Get expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('expense_date, amount')
        .gte('expense_date', startDateStr);
      
      if (expensesError) throw expensesError;
      
      // Get sale items with cost
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          product:products(cost_price),
          sale:sales!inner(sale_date)
        `)
        .gte('sale.sale_date', startDateStr);
      
      if (saleItemsError) throw saleItemsError;
      
      // Group data by period
      const groupedData: Record<string, { sales: number; expenses: number; cogs: number }> = {};
      
      // Group sales
      for (const sale of sales || []) {
        const key = format(new Date(sale.sale_date), groupByFormat);
        if (!groupedData[key]) {
          groupedData[key] = { sales: 0, expenses: 0, cogs: 0 };
        }
        groupedData[key].sales += Number(sale.total_amount);
      }
      
      // Group expenses
      for (const expense of expenses || []) {
        const key = format(new Date(expense.expense_date), groupByFormat);
        if (!groupedData[key]) {
          groupedData[key] = { sales: 0, expenses: 0, cogs: 0 };
        }
        groupedData[key].expenses += Number(expense.amount);
      }
      
      // Group COGS
      for (const item of saleItems || []) {
        const saleData = item.sale as any;
        if (!saleData?.sale_date) continue;
        const key = format(new Date(saleData.sale_date), groupByFormat);
        if (!groupedData[key]) {
          groupedData[key] = { sales: 0, expenses: 0, cogs: 0 };
        }
        const costPrice = (item.product as any)?.cost_price || 0;
        groupedData[key].cogs += Number(item.quantity) * Number(costPrice);
      }
      
      // Convert to array with profit calculation
      const trends = Object.entries(groupedData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => {
          const grossProfit = data.sales - data.cogs;
          const netProfit = grossProfit - data.expenses;
          
          let displayDate = date;
          if (period === 'daily') {
            displayDate = format(new Date(date), 'dd MMM');
          } else if (period === 'monthly') {
            displayDate = format(new Date(date + '-01'), 'MMM yy');
          }
          
          return {
            date: displayDate,
            sales: data.sales,
            expenses: data.expenses,
            cogs: data.cogs,
            grossProfit,
            netProfit
          };
        });
      
      return trends;
    }
  });
}
