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
