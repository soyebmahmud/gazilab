import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DamageLossSummary {
  period: 'daily' | 'monthly' | 'all';
  total_damaged_quantity: number;
  total_loss_value: number;
  pending_count: number;
  restored_count: number;
  destroyed_count: number;
  restored_value: number;
  destroyed_value: number;
}

export interface DamageByType {
  damage_type: string;
  damage_type_label: string;
  count: number;
  total_quantity: number;
  total_loss_value: number;
}

export interface ProductDamageSummary {
  product_id: string;
  product_name: string;
  product_sku: string;
  total_damaged: number;
  total_loss_value: number;
  pending_count: number;
  restored_count: number;
  destroyed_count: number;
}

export interface ReturnVsDamageData {
  period: string;
  returns_restored: number;
  returns_damaged: number;
  direct_damage: number;
  total_loss: number;
}

const DAMAGE_TYPE_LABELS: Record<string, string> = {
  'handling': 'হ্যান্ডলিং ক্ষতি',
  'expired': 'মেয়াদোত্তীর্ণ',
  'quality_rejected': 'মানসম্পন্ন নয়',
  'manufacturing_wastage': 'উৎপাদন অপচয়',
  'customer_return': 'গ্রাহক ফেরত',
  'transport_damage': 'পরিবহন ক্ষতি',
  'warehouse_damage': 'গুদাম ক্ষতি',
  'manufacturing_defect': 'উৎপাদন ত্রুটি',
  'return_damaged': 'ফেরত (ক্ষতিগ্রস্ত)',
};

// Get daily damage loss summary
export function useDailyDamageLoss() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['daily-damage-loss', today],
    queryFn: async () => {
      const startOfDay = `${today}T00:00:00`;
      const endOfDay = `${today}T23:59:59`;
      
      const { data: damages, error } = await supabase
        .from('damaged_goods')
        .select(`
          *,
          product:products(name, sku, cost_price)
        `)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);
      
      if (error) throw error;
      
      const pending = damages?.filter(d => d.status === 'pending') || [];
      const restored = damages?.filter(d => d.status === 'restored') || [];
      const destroyed = damages?.filter(d => d.status === 'destroyed') || [];
      
      const totalLoss = destroyed.reduce((sum, d) => 
        sum + (d.quantity * (d.product?.cost_price || 0)), 0);
      const restoredValue = restored.reduce((sum, d) => 
        sum + (d.quantity * (d.product?.cost_price || 0)), 0);
      
      return {
        period: 'daily' as const,
        total_damaged_quantity: damages?.reduce((sum, d) => sum + d.quantity, 0) || 0,
        total_loss_value: totalLoss,
        pending_count: pending.length,
        restored_count: restored.length,
        destroyed_count: destroyed.length,
        restored_value: restoredValue,
        destroyed_value: totalLoss,
      } as DamageLossSummary;
    },
  });
}

// Get monthly damage loss summary
export function useMonthlyDamageLoss() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['monthly-damage-loss', startOfMonth, endOfMonth],
    queryFn: async () => {
      const { data: damages, error } = await supabase
        .from('damaged_goods')
        .select(`
          *,
          product:products(name, sku, cost_price)
        `)
        .gte('created_at', `${startOfMonth}T00:00:00`)
        .lte('created_at', `${endOfMonth}T23:59:59`);
      
      if (error) throw error;
      
      const pending = damages?.filter(d => d.status === 'pending') || [];
      const restored = damages?.filter(d => d.status === 'restored') || [];
      const destroyed = damages?.filter(d => d.status === 'destroyed') || [];
      
      const totalLoss = destroyed.reduce((sum, d) => 
        sum + (d.quantity * (d.product?.cost_price || 0)), 0);
      const restoredValue = restored.reduce((sum, d) => 
        sum + (d.quantity * (d.product?.cost_price || 0)), 0);
      
      return {
        period: 'monthly' as const,
        total_damaged_quantity: damages?.reduce((sum, d) => sum + d.quantity, 0) || 0,
        total_loss_value: totalLoss,
        pending_count: pending.length,
        restored_count: restored.length,
        destroyed_count: destroyed.length,
        restored_value: restoredValue,
        destroyed_value: totalLoss,
      } as DamageLossSummary;
    },
  });
}

// Get damage loss by type
export function useDamageLossByType(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['damage-loss-by-type', dateFrom, dateTo],
    queryFn: async () => {
      const { data: damages, error } = await supabase
        .from('damaged_goods')
        .select(`
          damage_type,
          quantity,
          status,
          product:products(cost_price)
        `)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`);
      
      if (error) throw error;
      
      const typeMap = new Map<string, DamageByType>();
      
      damages?.forEach(damage => {
        const lossValue = damage.status === 'destroyed' 
          ? damage.quantity * (damage.product?.cost_price || 0) 
          : 0;
        
        const existing = typeMap.get(damage.damage_type);
        if (existing) {
          existing.count += 1;
          existing.total_quantity += damage.quantity;
          existing.total_loss_value += lossValue;
        } else {
          typeMap.set(damage.damage_type, {
            damage_type: damage.damage_type,
            damage_type_label: DAMAGE_TYPE_LABELS[damage.damage_type] || damage.damage_type,
            count: 1,
            total_quantity: damage.quantity,
            total_loss_value: lossValue,
          });
        }
      });
      
      return Array.from(typeMap.values()).sort((a, b) => b.total_loss_value - a.total_loss_value);
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Get product-wise damage summary
export function useProductDamageSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['product-damage-summary', dateFrom, dateTo],
    queryFn: async () => {
      const { data: damages, error } = await supabase
        .from('damaged_goods')
        .select(`
          quantity,
          status,
          product:products(id, name, sku, cost_price)
        `)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`);
      
      if (error) throw error;
      
      const productMap = new Map<string, ProductDamageSummary>();
      
      damages?.forEach(damage => {
        if (!damage.product) return;
        
        const lossValue = damage.status === 'destroyed' 
          ? damage.quantity * damage.product.cost_price 
          : 0;
        
        const existing = productMap.get(damage.product.id);
        if (existing) {
          existing.total_damaged += damage.quantity;
          existing.total_loss_value += lossValue;
          if (damage.status === 'pending') existing.pending_count += 1;
          if (damage.status === 'restored') existing.restored_count += 1;
          if (damage.status === 'destroyed') existing.destroyed_count += 1;
        } else {
          productMap.set(damage.product.id, {
            product_id: damage.product.id,
            product_name: damage.product.name,
            product_sku: damage.product.sku,
            total_damaged: damage.quantity,
            total_loss_value: lossValue,
            pending_count: damage.status === 'pending' ? 1 : 0,
            restored_count: damage.status === 'restored' ? 1 : 0,
            destroyed_count: damage.status === 'destroyed' ? 1 : 0,
          });
        }
      });
      
      return Array.from(productMap.values()).sort((a, b) => b.total_loss_value - a.total_loss_value);
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Get return vs damage breakdown
export function useReturnVsDamageBreakdown(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['return-vs-damage', dateFrom, dateTo],
    queryFn: async () => {
      // Get sales returns
      const { data: returns } = await supabase
        .from('sale_returns')
        .select(`
          quantity_returned,
          return_status,
          restore_to_stock,
          product:products(cost_price)
        `)
        .gte('return_date', dateFrom)
        .lte('return_date', dateTo);
      
      // Get direct damages (not from returns)
      const { data: directDamages } = await supabase
        .from('damaged_goods')
        .select(`
          quantity,
          status,
          source_reference_type,
          product:products(cost_price)
        `)
        .is('source_reference_type', null)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`);
      
      const returnsRestored = returns?.filter(r => r.restore_to_stock)
        .reduce((sum, r) => sum + (r.quantity_returned * (r.product?.cost_price || 0)), 0) || 0;
      
      const returnsDamaged = returns?.filter(r => !r.restore_to_stock)
        .reduce((sum, r) => sum + (r.quantity_returned * (r.product?.cost_price || 0)), 0) || 0;
      
      const directDamageValue = directDamages?.filter(d => d.status === 'destroyed')
        .reduce((sum, d) => sum + (d.quantity * (d.product?.cost_price || 0)), 0) || 0;
      
      return {
        period: `${dateFrom} - ${dateTo}`,
        returns_restored: returnsRestored,
        returns_damaged: returnsDamaged,
        direct_damage: directDamageValue,
        total_loss: returnsDamaged + directDamageValue,
      } as ReturnVsDamageData;
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

// Comprehensive damage and return loss report
export function useComprehensiveLossReport(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['comprehensive-loss-report', dateFrom, dateTo],
    queryFn: async () => {
      // Get all damaged goods
      const { data: damages } = await supabase
        .from('damaged_goods')
        .select(`
          *,
          product:products(id, name, sku, cost_price)
        `)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .order('created_at', { ascending: false });
      
      // Get all returns
      const { data: returns } = await supabase
        .from('sale_returns')
        .select(`
          *,
          product:products(id, name, sku, cost_price, selling_price)
        `)
        .gte('return_date', dateFrom)
        .lte('return_date', dateTo)
        .order('return_date', { ascending: false });
      
      // Calculate totals
      const destroyedDamages = damages?.filter(d => d.status === 'destroyed') || [];
      const pendingDamages = damages?.filter(d => d.status === 'pending') || [];
      const restoredDamages = damages?.filter(d => d.status === 'restored') || [];
      
      const restoredReturns = returns?.filter(r => r.restore_to_stock) || [];
      const damagedReturns = returns?.filter(r => !r.restore_to_stock) || [];
      
      const totalDestroyedLoss = destroyedDamages.reduce((sum, d) => 
        sum + (d.quantity * (d.product?.cost_price || 0)), 0);
      
      const totalPendingValue = pendingDamages.reduce((sum, d) => 
        sum + (d.quantity * (d.product?.cost_price || 0)), 0);
      
      const totalRestoredValue = restoredDamages.reduce((sum, d) => 
        sum + (d.quantity * (d.product?.cost_price || 0)), 0);
      
      const returnRestoredValue = restoredReturns.reduce((sum, r) => 
        sum + (r.quantity_returned * (r.product?.cost_price || 0)), 0);
      
      const returnDamagedValue = damagedReturns.reduce((sum, r) => 
        sum + (r.quantity_returned * (r.product?.cost_price || 0)), 0);
      
      return {
        damages: damages || [],
        returns: returns || [],
        summary: {
          total_damage_records: damages?.length || 0,
          total_return_records: returns?.length || 0,
          destroyed_count: destroyedDamages.length,
          pending_count: pendingDamages.length,
          restored_count: restoredDamages.length,
          return_restored_count: restoredReturns.length,
          return_damaged_count: damagedReturns.length,
          total_destroyed_loss: totalDestroyedLoss,
          total_pending_value: totalPendingValue,
          total_restored_value: totalRestoredValue,
          return_restored_value: returnRestoredValue,
          return_damaged_value: returnDamagedValue,
          net_loss: totalDestroyedLoss + returnDamagedValue,
        },
      };
    },
    enabled: !!dateFrom && !!dateTo,
  });
}
