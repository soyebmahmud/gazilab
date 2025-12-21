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
  units_per_pack: number; // E.g., 10 tablets per strip. BOM calculates per unit.
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

// Sales types
export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  production_batch_id?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
  created_at: string;
  product?: Product;
  production_batch?: ProductionBatch;
}

export interface ProductBatch {
  batch_id: string;
  batch_number: string;
  quantity_available: number;
  manufacturing_date?: string;
  expiry_date?: string;
}

// Raw Material Batch
export interface RawMaterialBatch {
  id: string;
  raw_material_id: string;
  batch_number: string;
  quantity_received: number;
  quantity_remaining: number;
  cost_per_unit: number;
  received_date: string;
  expiry_date?: string;
  supplier?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  raw_material?: RawMaterial;
}

// Stock Reservation
export interface StockReservation {
  id: string;
  raw_material_id: string;
  raw_material_batch_id?: string;
  production_batch_id?: string;
  quantity_reserved: number;
  status: 'reserved' | 'consumed' | 'released';
  notes?: string;
  created_at: string;
  updated_at: string;
  raw_material?: RawMaterial;
}

// Production Material Usage
export interface ProductionMaterialUsage {
  id: string;
  production_batch_id: string;
  raw_material_id: string;
  raw_material_batch_id?: string;
  quantity_used: number;
  wastage_quantity: number;
  created_at: string;
  raw_material?: RawMaterial;
}

// MRP Check Result
export interface MRPResult {
  raw_material_id: string;
  material_name: string;
  material_sku: string;
  unit: string;
  required_quantity: number;
  available_quantity: number;
  is_sufficient: boolean;
}

// Stock Summary
export interface StockSummary {
  item_id: string;
  item_name: string;
  item_sku: string;
  item_type: 'Raw Material' | 'Finished Goods';
  category: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  unit: string;
  min_stock_level: number;
  stock_status: 'OK' | 'Low' | 'Out of Stock';
  stock_value: number;
}

// Near Expiry Product
export interface NearExpiryProduct {
  batch_id: string;
  batch_number: string;
  product_name: string;
  product_sku: string;
  quantity_available: number;
  expiry_date: string;
  days_until_expiry: number;
}

// Batch Traceability
export interface BatchTraceability {
  production_batch_number: string;
  product_name: string;
  manufacturing_date?: string;
  expiry_date?: string;
  quantity_produced: number;
  warehouse?: string;
  rack?: string;
  shelf?: string;
  raw_material_name?: string;
  raw_material_batch_number?: string;
  quantity_used?: number;
  wastage_quantity?: number;
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
