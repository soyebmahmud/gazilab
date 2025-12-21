// Database types for ManufactureERP
export type UnitType = 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'box' | 'pack';
export type MaterialCategory = 'herbs' | 'chemicals' | 'packaging';
export type ProductCategory = 'capsules' | 'tablets' | 'powder' | 'liquid' | 'cream' | 'other';
export type StockMovementType = 'opening' | 'production_in' | 'production_out' | 'adjustment_in' | 'adjustment_out' | 'sale' | 'purchase' | 'wastage';
export type ProductionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  category: MaterialCategory;
  unit: UnitType;
  cost_per_unit: number;
  min_stock_level: number;
  current_stock: number;
  description?: string;
  supplier?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  unit: UnitType;
  selling_price: number;
  cost_price: number;
  min_stock_level: number;
  current_stock: number;
  manufacturing_date?: string;
  expiry_date?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BOM {
  id: string;
  product_id: string;
  version: number;
  notes?: string;
  estimated_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
  items?: BOMItem[];
}

export interface BOMItem {
  id: string;
  bom_id: string;
  raw_material_id: string;
  quantity_per_unit: number;
  wastage_percent: number;
  created_at: string;
  raw_material?: RawMaterial;
}

export interface StockLedgerMaterial {
  id: string;
  raw_material_id: string;
  movement_type: StockMovementType;
  quantity: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  balance_after: number;
  created_at: string;
  raw_material?: RawMaterial;
}

export interface StockLedgerProduct {
  id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  balance_after: number;
  created_at: string;
  product?: Product;
}

export interface ProductionBatch {
  id: string;
  batch_number: string;
  product_id: string;
  bom_id: string;
  quantity_planned: number;
  quantity_produced: number;
  status: ProductionStatus;
  manufacturing_date?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
  bom?: BOM;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  gst_number?: string;
  outstanding_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  gst_number?: string;
  outstanding_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialUsage {
  product_name: string;
  product_sku: string;
  bom_version: number;
  quantity_per_unit: number;
  wastage_percent: number;
}

export interface CanDeleteMaterial {
  can_delete: boolean;
  usage_count: number;
  ledger_count: number;
}

// Dashboard statistics
export interface DashboardStats {
  totalProducts: number;
  totalMaterials: number;
  totalReceivable: number;
  inventoryValue: number;
  rawMaterialValue: number;
  finishedGoodsValue: number;
  manufacturingValue: number;
  lowStockProducts: Product[];
  lowStockMaterials: RawMaterial[];
  productsByCategory: { category: string; count: number }[];
}
