import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DamagedComponent {
  id: string;
  damaged_goods_id: string | null;
  sale_return_id: string | null;
  assembly_name: string | null;
  component_name: string;
  component_sku: string;
  quantity_affected: number;
  cost_per_unit: number;
  loss_value: number;
  created_at: string;
  source_type: 'damage' | 'return';
}

export function useDamagedComponents(damagedGoodsId?: string) {
  return useQuery({
    queryKey: ['damaged-components', damagedGoodsId],
    queryFn: async () => {
      let query = supabase
        .from('damaged_packaging_components')
        .select(`
          id,
          damaged_goods_id,
          sale_return_id,
          packaging_assembly_id,
          raw_material_id,
          component_name,
          quantity_affected,
          created_at,
          packaging_assembly:packaging_assemblies(name),
          raw_material:raw_materials(sku, cost_per_unit)
        `)
        .order('created_at', { ascending: false });
      
      if (damagedGoodsId) {
        query = query.eq('damaged_goods_id', damagedGoodsId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        damaged_goods_id: item.damaged_goods_id,
        sale_return_id: item.sale_return_id,
        assembly_name: (item.packaging_assembly as any)?.name || null,
        component_name: item.component_name,
        component_sku: (item.raw_material as any)?.sku || '',
        quantity_affected: item.quantity_affected,
        cost_per_unit: (item.raw_material as any)?.cost_per_unit || 0,
        loss_value: item.quantity_affected * ((item.raw_material as any)?.cost_per_unit || 0),
        created_at: item.created_at,
        source_type: item.damaged_goods_id ? 'damage' : 'return'
      })) as DamagedComponent[];
    },
  });
}

export function useDamagedComponentsSummary() {
  return useQuery({
    queryKey: ['damaged-components-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('damaged_packaging_components')
        .select(`
          id,
          quantity_affected,
          raw_material:raw_materials(name, sku, cost_per_unit)
        `);
      
      if (error) throw error;
      
      // Aggregate by component
      const summary = new Map<string, { name: string; sku: string; totalQty: number; totalLoss: number }>();
      
      for (const item of data || []) {
        const rm = item.raw_material as any;
        if (!rm) continue;
        
        const key = rm.sku;
        const existing = summary.get(key) || { name: rm.name, sku: rm.sku, totalQty: 0, totalLoss: 0 };
        existing.totalQty += item.quantity_affected;
        existing.totalLoss += item.quantity_affected * (rm.cost_per_unit || 0);
        summary.set(key, existing);
      }
      
      return Array.from(summary.values()).sort((a, b) => b.totalLoss - a.totalLoss);
    },
  });
}
