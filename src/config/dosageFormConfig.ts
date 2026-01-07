import { UnitType } from '@/types/database';
import { DosageForm, PackagingUnit } from '@/types/packaging';

// Dosage form configuration for pharmaceutical products
export interface DosageFormConfig {
  defaultUnit: UnitType;
  unitLocked: boolean; // If true, user cannot change unit
  allowedUnits: UnitType[];
  defaultUnitsPerPack: number;
  unitsPerPackLabel: string;
  unitsPerPackDescription: string;
  primaryPackaging: PackagingUnit[];
  showFields: {
    // Solid forms (tablet/capsule)
    unitsPerStrip: boolean;
    stripType: boolean; // Alu-PVC, Alu-Alu, etc.
    
    // Liquid forms (syrup/suspension/drops)
    bottleSize: boolean;
    bottleType: boolean;
    capType: boolean;
    inductionSeal: boolean;
    measuringCup: boolean;
    dropper: boolean;
    
    // Semi-solid forms (cream/ointment/gel)
    tubeSize: boolean;
    tubeType: boolean;
    
    // Injectable forms
    vialSize: boolean;
    ampuleSize: boolean;
    needleIncluded: boolean;
    
    // Common
    labelRequired: boolean;
    outerCartonSize: boolean;
    leafletRequired: boolean;
  };
  categoryMapping: string; // Auto-map to product category
  strengthPlaceholder: string;
  batchSizeSuggestion: string;
}

export const DOSAGE_FORM_CONFIG: Record<DosageForm, DosageFormConfig> = {
  tablet: {
    defaultUnit: 'pcs',
    unitLocked: true,
    allowedUnits: ['pcs'],
    defaultUnitsPerPack: 10,
    unitsPerPackLabel: 'Units per Strip',
    unitsPerPackDescription: 'e.g., 10 tablets per strip',
    primaryPackaging: ['strip', 'blister', 'bottle'],
    showFields: {
      unitsPerStrip: true,
      stripType: true,
      bottleSize: false,
      bottleType: false,
      capType: false,
      inductionSeal: false,
      measuringCup: false,
      dropper: false,
      tubeSize: false,
      tubeType: false,
      vialSize: false,
      ampuleSize: false,
      needleIncluded: false,
      labelRequired: true,
      outerCartonSize: true,
      leafletRequired: true,
    },
    categoryMapping: 'tablets',
    strengthPlaceholder: 'e.g., 500mg, 250mg',
    batchSizeSuggestion: 'Usually 10,000 - 100,000 tablets',
  },
  
  capsule: {
    defaultUnit: 'pcs',
    unitLocked: true,
    allowedUnits: ['pcs'],
    defaultUnitsPerPack: 10,
    unitsPerPackLabel: 'Units per Strip',
    unitsPerPackDescription: 'e.g., 10 capsules per strip',
    primaryPackaging: ['strip', 'blister', 'bottle'],
    showFields: {
      unitsPerStrip: true,
      stripType: true,
      bottleSize: false,
      bottleType: false,
      capType: false,
      inductionSeal: false,
      measuringCup: false,
      dropper: false,
      tubeSize: false,
      tubeType: false,
      vialSize: false,
      ampuleSize: false,
      needleIncluded: false,
      labelRequired: true,
      outerCartonSize: true,
      leafletRequired: true,
    },
    categoryMapping: 'capsules',
    strengthPlaceholder: 'e.g., 500mg, 250mg',
    batchSizeSuggestion: 'Usually 10,000 - 100,000 capsules',
  },
  
  syrup: {
    defaultUnit: 'ml',
    unitLocked: true,
    allowedUnits: ['ml', 'l'],
    defaultUnitsPerPack: 1,
    unitsPerPackLabel: 'Bottles per Pack',
    unitsPerPackDescription: '1 bottle = 1 unit (specify size below)',
    primaryPackaging: ['bottle'],
    showFields: {
      unitsPerStrip: false,
      stripType: false,
      bottleSize: true,
      bottleType: true,
      capType: true,
      inductionSeal: true,
      measuringCup: true,
      dropper: false,
      tubeSize: false,
      tubeType: false,
      vialSize: false,
      ampuleSize: false,
      needleIncluded: false,
      labelRequired: true,
      outerCartonSize: true,
      leafletRequired: true,
    },
    categoryMapping: 'syrup',
    strengthPlaceholder: 'e.g., 5mg/5ml, 125mg/5ml',
    batchSizeSuggestion: 'Usually 500 - 5,000 bottles',
  },
  
  suspension: {
    defaultUnit: 'ml',
    unitLocked: true,
    allowedUnits: ['ml', 'l'],
    defaultUnitsPerPack: 1,
    unitsPerPackLabel: 'Bottles per Pack',
    unitsPerPackDescription: '1 bottle = 1 unit (specify size below)',
    primaryPackaging: ['bottle'],
    showFields: {
      unitsPerStrip: false,
      stripType: false,
      bottleSize: true,
      bottleType: true,
      capType: true,
      inductionSeal: true,
      measuringCup: true,
      dropper: false,
      tubeSize: false,
      tubeType: false,
      vialSize: false,
      ampuleSize: false,
      needleIncluded: false,
      labelRequired: true,
      outerCartonSize: true,
      leafletRequired: true,
    },
    categoryMapping: 'suspension',
    strengthPlaceholder: 'e.g., 125mg/5ml, 250mg/5ml',
    batchSizeSuggestion: 'Usually 500 - 5,000 bottles',
  },
  
  injection: {
    defaultUnit: 'ml',
    unitLocked: false,
    allowedUnits: ['ml', 'pcs'],
    defaultUnitsPerPack: 1,
    unitsPerPackLabel: 'Vials/Ampoules per Pack',
    unitsPerPackDescription: 'Number of vials or ampoules',
    primaryPackaging: ['vial', 'ampoule'],
    showFields: {
      unitsPerStrip: false,
      stripType: false,
      bottleSize: false,
      bottleType: false,
      capType: false,
      inductionSeal: false,
      measuringCup: false,
      dropper: false,
      tubeSize: false,
      tubeType: false,
      vialSize: true,
      ampuleSize: true,
      needleIncluded: true,
      labelRequired: true,
      outerCartonSize: true,
      leafletRequired: true,
    },
    categoryMapping: 'injection',
    strengthPlaceholder: 'e.g., 500mg/2ml, 1g/vial',
    batchSizeSuggestion: 'Usually 1,000 - 10,000 vials',
  },
  
  cream: {
    defaultUnit: 'g',
    unitLocked: true,
    allowedUnits: ['g'],
    defaultUnitsPerPack: 1,
    unitsPerPackLabel: 'Tubes per Pack',
    unitsPerPackDescription: '1 tube = 1 unit (specify size below)',
    primaryPackaging: ['tube', 'jar'],
    showFields: {
      unitsPerStrip: false,
      stripType: false,
      bottleSize: false,
      bottleType: false,
      capType: false,
      inductionSeal: false,
      measuringCup: false,
      dropper: false,
      tubeSize: true,
      tubeType: true,
      vialSize: false,
      ampuleSize: false,
      needleIncluded: false,
      labelRequired: true,
      outerCartonSize: true,
      leafletRequired: false,
    },
    categoryMapping: 'cream',
    strengthPlaceholder: 'e.g., 1% w/w, 0.05%',
    batchSizeSuggestion: 'Usually 1,000 - 10,000 tubes',
  },
  
  ointment: {
    defaultUnit: 'g',
    unitLocked: true,
    allowedUnits: ['g'],
    defaultUnitsPerPack: 1,
    unitsPerPackLabel: 'Tubes per Pack',
    unitsPerPackDescription: '1 tube = 1 unit (specify size below)',
    primaryPackaging: ['tube', 'jar'],
    showFields: {
      unitsPerStrip: false,
      stripType: false,
      bottleSize: false,
      bottleType: false,
      capType: false,
      inductionSeal: false,
      measuringCup: false,
      dropper: false,
      tubeSize: true,
      tubeType: true,
      vialSize: false,
      ampuleSize: false,
      needleIncluded: false,
      labelRequired: true,
      outerCartonSize: true,
      leafletRequired: false,
    },
    categoryMapping: 'ointment',
    strengthPlaceholder: 'e.g., 1% w/w, 0.1%',
    batchSizeSuggestion: 'Usually 1,000 - 10,000 tubes',
  },
  
  powder: {
    defaultUnit: 'g',
    unitLocked: false,
    allowedUnits: ['g', 'kg', 'pcs'],
    defaultUnitsPerPack: 1,
    unitsPerPackLabel: 'Sachets/Bottles per Pack',
    unitsPerPackDescription: 'Number of sachets or bottles',
    primaryPackaging: ['sachet', 'bottle', 'jar'],
    showFields: {
      unitsPerStrip: false,
      stripType: false,
      bottleSize: true,
      bottleType: true,
      capType: true,
      inductionSeal: true,
      measuringCup: false,
      dropper: false,
      tubeSize: false,
      tubeType: false,
      vialSize: false,
      ampuleSize: false,
      needleIncluded: false,
      labelRequired: true,
      outerCartonSize: true,
      leafletRequired: true,
    },
    categoryMapping: 'powder',
    strengthPlaceholder: 'e.g., 5g/sachet, 100g/bottle',
    batchSizeSuggestion: 'Usually 1,000 - 50,000 sachets',
  },
  
  drops: {
    defaultUnit: 'ml',
    unitLocked: true,
    allowedUnits: ['ml'],
    defaultUnitsPerPack: 1,
    unitsPerPackLabel: 'Bottles per Pack',
    unitsPerPackDescription: '1 dropper bottle = 1 unit',
    primaryPackaging: ['bottle'],
    showFields: {
      unitsPerStrip: false,
      stripType: false,
      bottleSize: true,
      bottleType: true,
      capType: true,
      inductionSeal: false,
      measuringCup: false,
      dropper: true,
      tubeSize: false,
      tubeType: false,
      vialSize: false,
      ampuleSize: false,
      needleIncluded: false,
      labelRequired: true,
      outerCartonSize: true,
      leafletRequired: true,
    },
    categoryMapping: 'drops',
    strengthPlaceholder: 'e.g., 0.5% w/v, 10mg/ml',
    batchSizeSuggestion: 'Usually 1,000 - 10,000 bottles',
  },
  
  vial: {
    defaultUnit: 'pcs',
    unitLocked: false,
    allowedUnits: ['pcs', 'ml'],
    defaultUnitsPerPack: 1,
    unitsPerPackLabel: 'Vials per Pack',
    unitsPerPackDescription: 'Number of vials per pack',
    primaryPackaging: ['vial'],
    showFields: {
      unitsPerStrip: false,
      stripType: false,
      bottleSize: false,
      bottleType: false,
      capType: false,
      inductionSeal: false,
      measuringCup: false,
      dropper: false,
      tubeSize: false,
      tubeType: false,
      vialSize: true,
      ampuleSize: false,
      needleIncluded: true,
      labelRequired: true,
      outerCartonSize: true,
      leafletRequired: true,
    },
    categoryMapping: 'vial',
    strengthPlaceholder: 'e.g., 500mg/vial, 1g/vial',
    batchSizeSuggestion: 'Usually 1,000 - 10,000 vials',
  },
  
  other: {
    defaultUnit: 'pcs',
    unitLocked: false,
    allowedUnits: ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'pack'],
    defaultUnitsPerPack: 1,
    unitsPerPackLabel: 'Units per Pack',
    unitsPerPackDescription: 'Specify units per pack',
    primaryPackaging: ['bottle', 'box', 'jar'],
    showFields: {
      unitsPerStrip: true,
      stripType: true,
      bottleSize: true,
      bottleType: true,
      capType: true,
      inductionSeal: true,
      measuringCup: true,
      dropper: true,
      tubeSize: true,
      tubeType: true,
      vialSize: true,
      ampuleSize: true,
      needleIncluded: true,
      labelRequired: true,
      outerCartonSize: true,
      leafletRequired: true,
    },
    categoryMapping: 'other',
    strengthPlaceholder: 'Specify strength',
    batchSizeSuggestion: 'Specify based on product type',
  },
};

// Options for packaging-related fields
export const BOTTLE_SIZES = ['50ml', '60ml', '100ml', '120ml', '150ml', '200ml', '450ml', '500ml'];
export const BOTTLE_TYPES = ['PET', 'Glass (Amber)', 'Glass (Clear)', 'HDPE', 'LDPE'];
export const CAP_TYPES = ['Screw Cap', 'Child Resistant Cap', 'Flip Top Cap', 'Pump Dispenser', 'Dropper Cap'];
export const STRIP_TYPES = ['Alu-PVC', 'Alu-Alu', 'PVC-PVDC', 'Blister (Transparent)', 'Blister (Opaque)'];
export const TUBE_SIZES = ['5g', '10g', '15g', '20g', '30g', '50g', '100g'];
export const TUBE_TYPES = ['Aluminum', 'Laminated', 'LDPE', 'HDPE'];
export const VIAL_SIZES = ['2ml', '5ml', '10ml', '20ml', '30ml', '50ml', '100ml'];
export const AMPULE_SIZES = ['1ml', '2ml', '5ml', '10ml'];
export const CARTON_SIZES = ['10 units', '20 units', '25 units', '50 units', '100 units', '200 units'];

// Bengali labels
export const FIELD_LABELS = {
  bottleSize: 'বোতলের সাইজ',
  bottleType: 'বোতলের ধরন',
  capType: 'ক্যাপের ধরন',
  inductionSeal: 'ইন্ডাকশন সিল',
  measuringCup: 'মাপার কাপ',
  dropper: 'ড্রপার',
  stripType: 'স্ট্রিপের ধরন',
  tubeSize: 'টিউবের সাইজ',
  tubeType: 'টিউবের ধরন',
  vialSize: 'ভায়ালের সাইজ',
  ampuleSize: 'অ্যাম্পুলের সাইজ',
  needleIncluded: 'সুই অন্তর্ভুক্ত',
  labelRequired: 'লেবেল প্রয়োজন',
  outerCartonSize: 'আউটার কার্টন সাইজ',
  leafletRequired: 'লিফলেট প্রয়োজন',
};

// Get config for a dosage form
export function getDosageFormConfig(dosageForm: string | undefined): DosageFormConfig | null {
  if (!dosageForm) return null;
  return DOSAGE_FORM_CONFIG[dosageForm as DosageForm] || null;
}
