import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ProductPackagingConfig, 
  HierarchicalBOMItem, 
  PackagingCalculation,
  PackagingUnit
} from '@/types/packaging';

// Fetch all packaging configs for a product
export function useProductPackagingConfigs(productId?: string) {
  return useQuery({
    queryKey: ['packaging-configs', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_packaging_configs')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data as ProductPackagingConfig[];
    },
    enabled: !!productId,
  });
}

// Fetch default packaging config for a product
export function useDefaultPackagingConfig(productId?: string) {
  return useQuery({
    queryKey: ['packaging-config-default', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data, error } = await supabase
        .from('product_packaging_configs')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .eq('is_default', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProductPackagingConfig | null;
    },
    enabled: !!productId,
  });
}

// Create packaging config
interface CreatePackagingConfigData {
  product_id: string;
  config_name: string;
  is_default?: boolean;
  primary_pack_type: PackagingUnit;
  units_per_primary_pack: number;
  secondary_pack_type?: PackagingUnit | null;
  primary_packs_per_secondary?: number | null;
  tertiary_pack_type?: PackagingUnit | null;
  secondary_packs_per_tertiary?: number | null;
  notes?: string;
}

export function useCreatePackagingConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePackagingConfigData) => {
      // If this is set as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from('product_packaging_configs')
          .update({ is_default: false })
          .eq('product_id', data.product_id);
      }
      
      const { data: config, error } = await supabase
        .from('product_packaging_configs')
        .insert({
          ...data,
          is_default: data.is_default ?? false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return config;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packaging-configs', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['packaging-config-default', variables.product_id] });
      toast.success('প্যাকেজিং কনফিগারেশন তৈরি হয়েছে');
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });
}

// Update packaging config
export function useUpdatePackagingConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, productId, ...data }: Partial<CreatePackagingConfigData> & { id: string; productId: string }) => {
      // If setting as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from('product_packaging_configs')
          .update({ is_default: false })
          .eq('product_id', productId)
          .neq('id', id);
      }
      
      const { data: config, error } = await supabase
        .from('product_packaging_configs')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return config;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packaging-configs', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['packaging-config-default', variables.productId] });
      toast.success('প্যাকেজিং কনফিগারেশন আপডেট হয়েছে');
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });
}

// Delete packaging config
export function useDeletePackagingConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('product_packaging_configs')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packaging-configs', variables.productId] });
      toast.success('প্যাকেজিং কনফিগারেশন মুছে ফেলা হয়েছে');
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });
}

// Calculate packaging units from quantity
export function useCalculatePackaging(configId?: string, quantity?: number, unitType?: string) {
  return useQuery({
    queryKey: ['calculate-packaging', configId, quantity, unitType],
    queryFn: async () => {
      if (!configId || !quantity || !unitType) return null;
      
      const { data, error } = await supabase.rpc('calculate_packaging_units', {
        p_packaging_config_id: configId,
        p_quantity: quantity,
        p_unit_type: unitType,
      });
      
      if (error) throw error;
      return data?.[0] as PackagingCalculation | null;
    },
    enabled: !!configId && !!quantity && !!unitType,
  });
}

// Get hierarchical BOM with calculated quantities
export function useHierarchicalBOM(productId?: string, configId?: string, quantity?: number) {
  return useQuery({
    queryKey: ['hierarchical-bom', productId, configId, quantity],
    queryFn: async () => {
      if (!productId || !configId || !quantity) return [];
      
      const { data, error } = await supabase.rpc('get_hierarchical_bom', {
        p_product_id: productId,
        p_packaging_config_id: configId,
        p_production_quantity: quantity,
      });
      
      if (error) throw error;
      return data as HierarchicalBOMItem[];
    },
    enabled: !!productId && !!configId && !!quantity,
  });
}

// Helper function to calculate packaging breakdown locally
export function calculatePackagingBreakdown(
  config: ProductPackagingConfig,
  quantity: number,
  inputType: 'units' | 'primary' | 'secondary' | 'tertiary' = 'units'
): PackagingCalculation {
  let totalUnits: number;
  let primaryPacks: number;
  let secondaryPacks: number;
  let tertiaryPacks: number;
  
  const unitsPerPrimary = config.units_per_primary_pack || 1;
  const primaryPerSecondary = config.primary_packs_per_secondary || 1;
  const secondaryPerTertiary = config.secondary_packs_per_tertiary || 1;
  
  switch (inputType) {
    case 'tertiary':
      tertiaryPacks = quantity;
      secondaryPacks = quantity * secondaryPerTertiary;
      primaryPacks = secondaryPacks * primaryPerSecondary;
      totalUnits = primaryPacks * unitsPerPrimary;
      break;
    case 'secondary':
      secondaryPacks = quantity;
      tertiaryPacks = Math.ceil(quantity / secondaryPerTertiary);
      primaryPacks = quantity * primaryPerSecondary;
      totalUnits = primaryPacks * unitsPerPrimary;
      break;
    case 'primary':
      primaryPacks = quantity;
      secondaryPacks = Math.ceil(quantity / primaryPerSecondary);
      tertiaryPacks = Math.ceil(secondaryPacks / secondaryPerTertiary);
      totalUnits = quantity * unitsPerPrimary;
      break;
    default: // units
      totalUnits = quantity;
      primaryPacks = Math.ceil(quantity / unitsPerPrimary);
      secondaryPacks = Math.ceil(primaryPacks / primaryPerSecondary);
      tertiaryPacks = Math.ceil(secondaryPacks / secondaryPerTertiary);
  }
  
  return {
    total_units: totalUnits,
    primary_packs: primaryPacks,
    secondary_packs: secondaryPacks,
    tertiary_packs: tertiaryPacks,
  };
}
