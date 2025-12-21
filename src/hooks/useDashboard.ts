import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RawMaterial, Product, DashboardStats } from '@/types/database';

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
