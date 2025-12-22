import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FeasibilityItem {
  productId: string;
  productName: string;
  productSku: string;
  canProduce: boolean;
  maxProducibleQuantity: number;
  blockingMaterials: {
    name: string;
    available: number;
    required: number;
    unit: string;
  }[];
}

export const useProductionFeasibility = () => {
  return useQuery({
    queryKey: ["production-feasibility"],
    queryFn: async (): Promise<FeasibilityItem[]> => {
      // Fetch active BOMs with their items
      const { data: boms, error: bomError } = await supabase
        .from("bom")
        .select(`
          id,
          product_id,
          products(id, name, sku),
          items:bom_items(
            quantity_per_unit,
            wastage_percent,
            raw_material:raw_materials(id, name, current_stock, unit)
          )
        `)
        .eq("is_active", true);

      if (bomError) throw bomError;
      if (!boms) return [];

      return boms.map((bom: any) => {
        const items = bom.items || [];
        
        const blockingMaterials = items
          .filter((item: any) => {
            const requiredPerUnit = item.quantity_per_unit * (1 + (item.wastage_percent || 0) / 100);
            return (item.raw_material?.current_stock || 0) < requiredPerUnit;
          })
          .map((item: any) => ({
            name: item.raw_material?.name || "Unknown",
            available: item.raw_material?.current_stock || 0,
            required: item.quantity_per_unit * (1 + (item.wastage_percent || 0) / 100),
            unit: item.raw_material?.unit || "",
          }));

        // Calculate max producible quantity
        let maxQuantity = Infinity;
        items.forEach((item: any) => {
          const requiredPerUnit = item.quantity_per_unit * (1 + (item.wastage_percent || 0) / 100);
          const available = item.raw_material?.current_stock || 0;
          const canMake = requiredPerUnit > 0 ? Math.floor(available / requiredPerUnit) : 0;
          maxQuantity = Math.min(maxQuantity, canMake);
        });

        return {
          productId: bom.product_id,
          productName: bom.products?.name || "Unknown",
          productSku: bom.products?.sku || "",
          canProduce: blockingMaterials.length === 0 && items.length > 0,
          maxProducibleQuantity: maxQuantity === Infinity ? 0 : maxQuantity,
          blockingMaterials,
        };
      });
    },
    staleTime: 30000,
  });
};
