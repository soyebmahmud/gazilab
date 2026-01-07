import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PackagingAssembly {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  packaging_level: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  components?: PackagingAssemblyComponent[];
}

export interface PackagingAssemblyComponent {
  id: string;
  assembly_id: string;
  raw_material_id: string;
  quantity_per_assembly: number;
  is_optional: boolean;
  notes: string | null;
  created_at: string;
  raw_material?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    cost_per_unit: number;
    current_stock: number;
  };
}

// Fetch all packaging assemblies
export function usePackagingAssemblies() {
  return useQuery({
    queryKey: ['packaging-assemblies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packaging_assemblies')
        .select(`
          *,
          components:packaging_assembly_components(
            *,
            raw_material:raw_materials(id, name, sku, unit, cost_per_unit, current_stock)
          )
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as PackagingAssembly[];
    },
  });
}

// Fetch single assembly with components
export function usePackagingAssembly(id: string) {
  return useQuery({
    queryKey: ['packaging-assembly', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packaging_assemblies')
        .select(`
          *,
          components:packaging_assembly_components(
            *,
            raw_material:raw_materials(id, name, sku, unit, cost_per_unit, current_stock)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as PackagingAssembly;
    },
    enabled: !!id,
  });
}

interface CreateAssemblyData {
  name: string;
  sku: string;
  description?: string;
  packaging_level: string;
  components: {
    raw_material_id: string;
    quantity_per_assembly: number;
    is_optional?: boolean;
    notes?: string;
  }[];
}

// Create new packaging assembly
export function useCreatePackagingAssembly() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, sku, description, packaging_level, components }: CreateAssemblyData) => {
      // Create assembly
      const { data: assembly, error: assemblyError } = await supabase
        .from('packaging_assemblies')
        .insert({ name, sku, description, packaging_level })
        .select()
        .single();
      
      if (assemblyError) throw assemblyError;
      
      // Add components
      if (components.length > 0) {
        const { error: componentsError } = await supabase
          .from('packaging_assembly_components')
          .insert(
            components.map(c => ({
              assembly_id: assembly.id,
              raw_material_id: c.raw_material_id,
              quantity_per_assembly: c.quantity_per_assembly,
              is_optional: c.is_optional || false,
              notes: c.notes
            }))
          );
        
        if (componentsError) throw componentsError;
      }
      
      return assembly;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-assemblies'] });
      toast.success('প্যাকেজিং অ্যাসেম্বলি তৈরি হয়েছে');
    },
    onError: (error: Error) => {
      toast.error(`ত্রুটি: ${error.message}`);
    },
  });
}

// Update packaging assembly
export function useUpdatePackagingAssembly() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      components, 
      ...updates 
    }: { 
      id: string;
      name?: string;
      sku?: string;
      description?: string;
      packaging_level?: string;
      is_active?: boolean;
      components?: CreateAssemblyData['components'] 
    }) => {
      // Update assembly
      const { data, error: assemblyError } = await supabase
        .from('packaging_assemblies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (assemblyError) throw assemblyError;
      
      // Update components if provided
      if (components) {
        // Delete existing
        await supabase
          .from('packaging_assembly_components')
          .delete()
          .eq('assembly_id', id);
        
        // Insert new
        if (components.length > 0) {
          const { error: componentsError } = await supabase
            .from('packaging_assembly_components')
            .insert(
              components.map(c => ({
                assembly_id: id,
                raw_material_id: c.raw_material_id,
                quantity_per_assembly: c.quantity_per_assembly,
                is_optional: c.is_optional || false,
                notes: c.notes
              }))
            );
          
          if (componentsError) throw componentsError;
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-assemblies'] });
      queryClient.invalidateQueries({ queryKey: ['packaging-assembly'] });
      toast.success('প্যাকেজিং অ্যাসেম্বলি আপডেট হয়েছে');
    },
    onError: (error: Error) => {
      toast.error(`ত্রুটি: ${error.message}`);
    },
  });
}

// Delete (deactivate) assembly
export function useDeletePackagingAssembly() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('packaging_assemblies')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-assemblies'] });
      toast.success('প্যাকেজিং অ্যাসেম্বলি মুছে ফেলা হয়েছে');
    },
    onError: (error: Error) => {
      toast.error(`ত্রুটি: ${error.message}`);
    },
  });
}

// Calculate total cost of an assembly
export function calculateAssemblyCost(assembly: PackagingAssembly): number {
  if (!assembly.components) return 0;
  return assembly.components.reduce((sum, comp) => {
    return sum + (comp.quantity_per_assembly * (comp.raw_material?.cost_per_unit || 0));
  }, 0);
}

// Get expanded BOM materials (expands assemblies into components)
export function useExpandedBOMMaterials(bomId: string, quantity: number) {
  return useQuery({
    queryKey: ['expanded-bom-materials', bomId, quantity],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_expanded_bom_materials', {
          p_bom_id: bomId,
          p_production_quantity: quantity
        });
      
      if (error) throw error;
      return data;
    },
    enabled: !!bomId && quantity > 0,
  });
}
