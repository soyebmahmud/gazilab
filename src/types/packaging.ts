// Pharmaceutical Packaging Types

export type DosageForm = 
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'suspension'
  | 'injection'
  | 'cream'
  | 'ointment'
  | 'powder'
  | 'drops'
  | 'vial'
  | 'other';

export type BOMLayer = 
  | 'api_excipient'
  | 'primary_packaging'
  | 'secondary_packaging'
  | 'tertiary_packaging';

export type PackagingUnit = 
  | 'strip'
  | 'blister'
  | 'bottle'
  | 'vial'
  | 'ampoule'
  | 'tube'
  | 'jar'
  | 'sachet'
  | 'box'
  | 'carton'
  | 'shipper';

export interface ProductPackagingConfig {
  id: string;
  product_id: string;
  config_name: string;
  is_default: boolean;
  is_active: boolean;
  primary_pack_type: PackagingUnit;
  units_per_primary_pack: number;
  secondary_pack_type: PackagingUnit | null;
  primary_packs_per_secondary: number | null;
  tertiary_pack_type: PackagingUnit | null;
  secondary_packs_per_tertiary: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HierarchicalBOMItem {
  bom_item_id: string;
  raw_material_id: string;
  material_name: string;
  material_sku: string;
  material_unit: string;
  bom_layer: BOMLayer;
  scales_with: PackagingUnit | null;
  base_quantity_per_unit: number;
  wastage_percent: number;
  calculated_quantity: number;
  cost_per_unit: number;
  total_cost: number;
}

export interface PackagingCalculation {
  total_units: number;
  primary_packs: number;
  secondary_packs: number;
  tertiary_packs: number;
}

// Labels for UI
export const DOSAGE_FORM_LABELS: Record<DosageForm, string> = {
  tablet: 'ট্যাবলেট (Tablet)',
  capsule: 'ক্যাপসুল (Capsule)',
  syrup: 'সিরাপ (Syrup)',
  suspension: 'সাসপেনশন (Suspension)',
  injection: 'ইনজেকশন (Injection)',
  cream: 'ক্রিম (Cream)',
  ointment: 'অয়েন্টমেন্ট (Ointment)',
  powder: 'পাউডার (Powder)',
  drops: 'ড্রপস (Drops)',
  vial: 'ভায়াল (Vial)',
  other: 'অন্যান্য (Other)',
};

export const BOM_LAYER_LABELS: Record<BOMLayer, string> = {
  api_excipient: 'এপিআই ও এক্সিপিয়েন্ট (API & Excipients)',
  primary_packaging: 'প্রাইমারি প্যাকেজিং (Primary Packaging)',
  secondary_packaging: 'সেকেন্ডারি প্যাকেজিং (Secondary Packaging)',
  tertiary_packaging: 'টার্শিয়ারি প্যাকেজিং (Tertiary Packaging)',
};

export const BOM_LAYER_DESCRIPTIONS: Record<BOMLayer, string> = {
  api_excipient: 'সক্রিয় উপাদান এবং সহায়ক উপাদান - ঔষধের মূল ফর্মুলা',
  primary_packaging: 'সরাসরি সংস্পর্শে আসে - স্ট্রিপ, বোতল, ভায়াল',
  secondary_packaging: 'বক্স, কার্টন - বিক্রয় প্যাকেজিং',
  tertiary_packaging: 'শিপার, বাল্ক প্যাকেজিং - পরিবহন প্যাকেজিং',
};

export const PACKAGING_UNIT_LABELS: Record<PackagingUnit, string> = {
  strip: 'স্ট্রিপ (Strip)',
  blister: 'ব্লিস্টার (Blister)',
  bottle: 'বোতল (Bottle)',
  vial: 'ভায়াল (Vial)',
  ampoule: 'অ্যাম্পুল (Ampoule)',
  tube: 'টিউব (Tube)',
  jar: 'জার (Jar)',
  sachet: 'স্যাচেট (Sachet)',
  box: 'বক্স (Box)',
  carton: 'কার্টন (Carton)',
  shipper: 'শিপার (Shipper)',
};

// Get appropriate primary packaging for dosage form
export const PRIMARY_PACKAGING_MAP: Record<DosageForm, PackagingUnit[]> = {
  tablet: ['strip', 'blister', 'bottle'],
  capsule: ['strip', 'blister', 'bottle'],
  syrup: ['bottle'],
  suspension: ['bottle'],
  injection: ['vial', 'ampoule'],
  cream: ['tube', 'jar'],
  ointment: ['tube', 'jar'],
  powder: ['sachet', 'bottle', 'jar'],
  drops: ['bottle'],
  vial: ['vial'],
  other: ['bottle', 'box', 'jar'],
};
