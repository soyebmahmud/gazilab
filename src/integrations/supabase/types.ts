export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      allowed_emails: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          is_active: boolean
          name: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          bank_name: string
          branch: string | null
          created_at: string
          current_balance: number
          id: string
          is_active: boolean
          opening_balance: number
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          bank_name: string
          branch?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          opening_balance?: number
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          bank_name?: string
          branch?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          opening_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          balance_after: number
          bank_account_id: string
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after?: number
          bank_account_id: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          bank_account_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bom: {
        Row: {
          created_at: string
          estimated_cost: number
          id: string
          is_active: boolean
          notes: string | null
          product_id: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          estimated_cost?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          product_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          estimated_cost?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          product_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "bom_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_items: {
        Row: {
          bom_id: string
          bom_layer: Database["public"]["Enums"]["bom_layer"] | null
          created_at: string
          id: string
          packaging_assembly_id: string | null
          quantity_per_unit: number
          raw_material_id: string
          scales_with: Database["public"]["Enums"]["packaging_unit"] | null
          wastage_percent: number
        }
        Insert: {
          bom_id: string
          bom_layer?: Database["public"]["Enums"]["bom_layer"] | null
          created_at?: string
          id?: string
          packaging_assembly_id?: string | null
          quantity_per_unit?: number
          raw_material_id: string
          scales_with?: Database["public"]["Enums"]["packaging_unit"] | null
          wastage_percent?: number
        }
        Update: {
          bom_id?: string
          bom_layer?: Database["public"]["Enums"]["bom_layer"] | null
          created_at?: string
          id?: string
          packaging_assembly_id?: string | null
          quantity_per_unit?: number
          raw_material_id?: string
          scales_with?: Database["public"]["Enums"]["packaging_unit"] | null
          wastage_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bom"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_packaging_assembly_id_fkey"
            columns: ["packaging_assembly_id"]
            isOneToOne: false
            referencedRelation: "packaging_assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          is_active: boolean
          name: string
          outstanding_balance: number
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean
          name: string
          outstanding_balance?: number
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean
          name?: string
          outstanding_balance?: number
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      damaged_goods: {
        Row: {
          created_at: string
          damage_type: string
          id: string
          notes: string | null
          product_id: string
          production_batch_id: string | null
          quantity: number
          source_reference_id: string | null
          source_reference_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          damage_type: string
          id?: string
          notes?: string | null
          product_id: string
          production_batch_id?: string | null
          quantity: number
          source_reference_id?: string | null
          source_reference_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          damage_type?: string
          id?: string
          notes?: string | null
          product_id?: string
          production_batch_id?: string | null
          quantity?: number
          source_reference_id?: string | null
          source_reference_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "damaged_goods_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damaged_goods_production_batch_id_fkey"
            columns: ["production_batch_id"]
            isOneToOne: false
            referencedRelation: "production_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          bank_account_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          expense_date: string
          id: string
          notes: string | null
          payment_method: string
          reference_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          reference_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          reference_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging_assemblies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          packaging_level: string
          sku: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          packaging_level?: string
          sku: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          packaging_level?: string
          sku?: string
          updated_at?: string
        }
        Relationships: []
      }
      packaging_assembly_components: {
        Row: {
          assembly_id: string
          created_at: string
          id: string
          is_optional: boolean
          notes: string | null
          quantity_per_assembly: number
          raw_material_id: string
        }
        Insert: {
          assembly_id: string
          created_at?: string
          id?: string
          is_optional?: boolean
          notes?: string | null
          quantity_per_assembly?: number
          raw_material_id: string
        }
        Update: {
          assembly_id?: string
          created_at?: string
          id?: string
          is_optional?: boolean
          notes?: string | null
          quantity_per_assembly?: number
          raw_material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_assembly_components_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "packaging_assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_assembly_components_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      product_packaging_configs: {
        Row: {
          config_name: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          notes: string | null
          primary_pack_type: Database["public"]["Enums"]["packaging_unit"]
          primary_packs_per_secondary: number | null
          product_id: string
          secondary_pack_type:
            | Database["public"]["Enums"]["packaging_unit"]
            | null
          secondary_packs_per_tertiary: number | null
          tertiary_pack_type:
            | Database["public"]["Enums"]["packaging_unit"]
            | null
          units_per_primary_pack: number
          updated_at: string
        }
        Insert: {
          config_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          notes?: string | null
          primary_pack_type?: Database["public"]["Enums"]["packaging_unit"]
          primary_packs_per_secondary?: number | null
          product_id: string
          secondary_pack_type?:
            | Database["public"]["Enums"]["packaging_unit"]
            | null
          secondary_packs_per_tertiary?: number | null
          tertiary_pack_type?:
            | Database["public"]["Enums"]["packaging_unit"]
            | null
          units_per_primary_pack?: number
          updated_at?: string
        }
        Update: {
          config_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          notes?: string | null
          primary_pack_type?: Database["public"]["Enums"]["packaging_unit"]
          primary_packs_per_secondary?: number | null
          product_id?: string
          secondary_pack_type?:
            | Database["public"]["Enums"]["packaging_unit"]
            | null
          secondary_packs_per_tertiary?: number | null
          tertiary_pack_type?:
            | Database["public"]["Enums"]["packaging_unit"]
            | null
          units_per_primary_pack?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_packaging_configs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_batches: {
        Row: {
          batch_number: string
          bom_id: string
          created_at: string
          expiry_date: string | null
          id: string
          manufacturing_date: string | null
          notes: string | null
          packaging_config_id: string | null
          product_id: string
          quantity_planned: number
          quantity_produced: number
          rack: string | null
          shelf: string | null
          status: Database["public"]["Enums"]["production_status"]
          updated_at: string
          warehouse: string | null
        }
        Insert: {
          batch_number: string
          bom_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          notes?: string | null
          packaging_config_id?: string | null
          product_id: string
          quantity_planned: number
          quantity_produced?: number
          rack?: string | null
          shelf?: string | null
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
          warehouse?: string | null
        }
        Update: {
          batch_number?: string
          bom_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          notes?: string | null
          packaging_config_id?: string | null
          product_id?: string
          quantity_planned?: number
          quantity_produced?: number
          rack?: string | null
          shelf?: string | null
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
          warehouse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_batches_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bom"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batches_packaging_config_id_fkey"
            columns: ["packaging_config_id"]
            isOneToOne: false
            referencedRelation: "product_packaging_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_material_usage: {
        Row: {
          created_at: string
          id: string
          production_batch_id: string
          quantity_used: number
          raw_material_batch_id: string | null
          raw_material_id: string
          wastage_quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          production_batch_id: string
          quantity_used?: number
          raw_material_batch_id?: string | null
          raw_material_id: string
          wastage_quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          production_batch_id?: string
          quantity_used?: number
          raw_material_batch_id?: string | null
          raw_material_id?: string
          wastage_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_material_usage_production_batch_id_fkey"
            columns: ["production_batch_id"]
            isOneToOne: false
            referencedRelation: "production_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_material_usage_raw_material_batch_id_fkey"
            columns: ["raw_material_batch_id"]
            isOneToOne: false
            referencedRelation: "raw_material_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_material_usage_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          batch_size: number | null
          category: Database["public"]["Enums"]["product_category"]
          cost_price: number
          created_at: string
          current_stock: number
          description: string | null
          dosage_form: Database["public"]["Enums"]["dosage_form"] | null
          expiry_date: string | null
          id: string
          is_active: boolean
          manufacturing_date: string | null
          min_stock_level: number
          name: string
          rack: string | null
          selling_price: number
          shelf: string | null
          shelf_life_months: number | null
          sku: string
          strength: string | null
          unit: Database["public"]["Enums"]["unit_type"]
          units_per_pack: number
          updated_at: string
          warehouse: string | null
        }
        Insert: {
          batch_size?: number | null
          category?: Database["public"]["Enums"]["product_category"]
          cost_price?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          dosage_form?: Database["public"]["Enums"]["dosage_form"] | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          manufacturing_date?: string | null
          min_stock_level?: number
          name: string
          rack?: string | null
          selling_price?: number
          shelf?: string | null
          shelf_life_months?: number | null
          sku: string
          strength?: string | null
          unit?: Database["public"]["Enums"]["unit_type"]
          units_per_pack?: number
          updated_at?: string
          warehouse?: string | null
        }
        Update: {
          batch_size?: number | null
          category?: Database["public"]["Enums"]["product_category"]
          cost_price?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          dosage_form?: Database["public"]["Enums"]["dosage_form"] | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          manufacturing_date?: string | null
          min_stock_level?: number
          name?: string
          rack?: string | null
          selling_price?: number
          shelf?: string | null
          shelf_life_months?: number | null
          sku?: string
          strength?: string | null
          unit?: Database["public"]["Enums"]["unit_type"]
          units_per_pack?: number
          updated_at?: string
          warehouse?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          purchase_order_id: string
          quantity: number
          raw_material_id: string
          received_quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          purchase_order_id: string
          quantity: number
          raw_material_id: string
          received_quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          purchase_order_id?: string
          quantity?: number
          raw_material_id?: string
          received_quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          discount_amount: number
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          seller_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_percent: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          seller_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_percent?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_amount?: number
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          seller_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_percent?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_material_batches: {
        Row: {
          batch_number: string
          cost_per_unit: number
          created_at: string
          expiry_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          quantity_received: number
          quantity_remaining: number
          raw_material_id: string
          received_date: string
          supplier: string | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          quantity_received?: number
          quantity_remaining?: number
          raw_material_id: string
          received_date?: string
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          quantity_received?: number
          quantity_remaining?: number
          raw_material_id?: string
          received_date?: string
          supplier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_batches_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          category: Database["public"]["Enums"]["material_category"]
          cost_per_unit: number
          created_at: string
          current_stock: number
          description: string | null
          id: string
          is_active: boolean
          min_stock_level: number
          name: string
          sku: string
          supplier: string | null
          unit: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["material_category"]
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock_level?: number
          name: string
          sku: string
          supplier?: string | null
          unit?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["material_category"]
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock_level?: number
          name?: string
          sku?: string
          supplier?: string | null
          unit?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          discount_percent: number
          id: string
          line_total: number
          product_id: string
          production_batch_id: string | null
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number
          id?: string
          line_total: number
          product_id: string
          production_batch_id?: string | null
          quantity: number
          sale_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_percent?: number
          id?: string
          line_total?: number
          product_id?: string
          production_batch_id?: string | null
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_production_batch_id_fkey"
            columns: ["production_batch_id"]
            isOneToOne: false
            referencedRelation: "production_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_date: string
          payment_method: string
          reference_note: string | null
          sale_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_date?: string
          payment_method?: string
          reference_note?: string | null
          sale_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_date?: string
          payment_method?: string
          reference_note?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_returns: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          original_invoice_number: string
          product_id: string
          production_batch_id: string | null
          quantity_returned: number
          reason: string
          restore_to_stock: boolean
          return_date: string
          return_status: string
          sale_id: string
          sale_item_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          original_invoice_number: string
          product_id: string
          production_batch_id?: string | null
          quantity_returned: number
          reason: string
          restore_to_stock?: boolean
          return_date?: string
          return_status?: string
          sale_id: string
          sale_item_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          original_invoice_number?: string
          product_id?: string
          production_batch_id?: string | null
          quantity_returned?: number
          reason?: string
          restore_to_stock?: boolean
          return_date?: string
          return_status?: string
          sale_id?: string
          sale_item_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_returns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_returns_production_batch_id_fkey"
            columns: ["production_batch_id"]
            isOneToOne: false
            referencedRelation: "production_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_returns_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          discount_amount: number
          id: string
          invoice_number: string
          notes: string | null
          paid_amount: number
          payment_status: string
          sale_date: string
          subtotal: number
          tax_amount: number
          tax_percent: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number
          payment_status?: string
          sale_date?: string
          subtotal?: number
          tax_amount?: number
          tax_percent?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number
          payment_status?: string
          sale_date?: string
          subtotal?: number
          tax_amount?: number
          tax_percent?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          is_active: boolean
          name: string
          outstanding_balance: number
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean
          name: string
          outstanding_balance?: number
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean
          name?: string
          outstanding_balance?: number
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_ledger_materials: {
        Row: {
          balance_after: number
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes: string | null
          quantity: number
          raw_material_batch_id: string | null
          raw_material_id: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          balance_after?: number
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          quantity: number
          raw_material_batch_id?: string | null
          raw_material_id: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          balance_after?: number
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          quantity?: number
          raw_material_batch_id?: string | null
          raw_material_id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_ledger_materials_raw_material_batch_id_fkey"
            columns: ["raw_material_batch_id"]
            isOneToOne: false
            referencedRelation: "raw_material_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_materials_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_ledger_products: {
        Row: {
          balance_after: number
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          balance_after?: number
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          balance_after?: number
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_ledger_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          production_batch_id: string | null
          quantity_reserved: number
          raw_material_batch_id: string | null
          raw_material_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          production_batch_id?: string | null
          quantity_reserved?: number
          raw_material_batch_id?: string | null
          raw_material_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          production_batch_id?: string | null
          quantity_reserved?: number
          raw_material_batch_id?: string | null
          raw_material_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_production_batch_id_fkey"
            columns: ["production_batch_id"]
            isOneToOne: false
            referencedRelation: "production_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_raw_material_batch_id_fkey"
            columns: ["raw_material_batch_id"]
            isOneToOne: false
            referencedRelation: "raw_material_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_packaging_units: {
        Args: {
          p_packaging_config_id: string
          p_quantity: number
          p_unit_type: string
        }
        Returns: {
          primary_packs: number
          secondary_packs: number
          tertiary_packs: number
          total_units: number
        }[]
      }
      can_delete_material: {
        Args: { material_id: string }
        Returns: {
          can_delete: boolean
          ledger_count: number
          usage_count: number
        }[]
      }
      check_mrp: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: {
          available_quantity: number
          is_sufficient: boolean
          material_name: string
          material_sku: string
          raw_material_id: string
          required_quantity: number
          unit: string
        }[]
      }
      destroy_damaged_goods: {
        Args: { p_damaged_goods_id: string; p_notes?: string }
        Returns: undefined
      }
      generate_invoice_number: { Args: never; Returns: string }
      generate_po_number: { Args: never; Returns: string }
      get_allowed_role: {
        Args: { check_email: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_available_material_stock: {
        Args: { p_material_id: string }
        Returns: number
      }
      get_batch_traceability: {
        Args: { p_production_batch_id: string }
        Returns: {
          expiry_date: string
          manufacturing_date: string
          product_name: string
          production_batch_number: string
          quantity_produced: number
          quantity_used: number
          rack: string
          raw_material_batch_number: string
          raw_material_name: string
          shelf: string
          warehouse: string
          wastage_quantity: number
        }[]
      }
      get_expanded_bom_materials: {
        Args: { p_bom_id: string; p_production_quantity: number }
        Returns: {
          assembly_name: string
          base_quantity: number
          bom_layer: string
          cost_per_unit: number
          is_from_assembly: boolean
          material_name: string
          material_sku: string
          material_unit: string
          raw_material_id: string
          total_cost: number
          total_required: number
          wastage_percent: number
        }[]
      }
      get_expiry_alerts: {
        Args: { p_days?: number }
        Returns: {
          alert_level: string
          batch_id: string
          batch_number: string
          days_until_expiry: number
          expiry_date: string
          product_id: string
          product_name: string
          product_sku: string
          quantity_available: number
        }[]
      }
      get_hierarchical_bom: {
        Args: {
          p_packaging_config_id: string
          p_product_id: string
          p_production_quantity: number
        }
        Returns: {
          base_quantity_per_unit: number
          bom_item_id: string
          bom_layer: Database["public"]["Enums"]["bom_layer"]
          calculated_quantity: number
          cost_per_unit: number
          material_name: string
          material_sku: string
          material_unit: string
          raw_material_id: string
          scales_with: Database["public"]["Enums"]["packaging_unit"]
          total_cost: number
          wastage_percent: number
        }[]
      }
      get_material_usage: {
        Args: { material_id: string }
        Returns: {
          bom_version: number
          product_name: string
          product_sku: string
          quantity_per_unit: number
          wastage_percent: number
        }[]
      }
      get_near_expiry_products: {
        Args: { p_days?: number }
        Returns: {
          batch_id: string
          batch_number: string
          days_until_expiry: number
          expiry_date: string
          product_name: string
          product_sku: string
          quantity_available: number
        }[]
      }
      get_product_batches: {
        Args: { p_product_id: string }
        Returns: {
          batch_id: string
          batch_number: string
          expiry_date: string
          manufacturing_date: string
          quantity_available: number
        }[]
      }
      get_stock_summary: {
        Args: never
        Returns: {
          available_stock: number
          category: string
          current_stock: number
          item_id: string
          item_name: string
          item_sku: string
          item_type: string
          min_stock_level: number
          reserved_stock: number
          stock_status: string
          stock_value: number
          unit: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
      is_email_allowed: { Args: { check_email: string }; Returns: boolean }
      process_sale_return: {
        Args: {
          p_notes?: string
          p_quantity: number
          p_reason: string
          p_restore_to_stock?: boolean
          p_sale_id: string
          p_sale_item_id: string
        }
        Returns: string
      }
      record_product_damage: {
        Args: {
          p_damage_type: string
          p_notes?: string
          p_product_id: string
          p_production_batch_id: string
          p_quantity: number
        }
        Returns: string
      }
      restore_damaged_goods: {
        Args: { p_damaged_goods_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "accounts" | "it" | "md"
      bom_layer:
        | "api_excipient"
        | "primary_packaging"
        | "secondary_packaging"
        | "tertiary_packaging"
      dosage_form:
        | "tablet"
        | "capsule"
        | "syrup"
        | "suspension"
        | "injection"
        | "cream"
        | "ointment"
        | "powder"
        | "drops"
        | "vial"
        | "other"
      material_category: "herbs" | "chemicals" | "packaging"
      packaging_unit:
        | "strip"
        | "blister"
        | "bottle"
        | "vial"
        | "ampoule"
        | "tube"
        | "jar"
        | "sachet"
        | "box"
        | "carton"
        | "shipper"
      product_category:
        | "capsules"
        | "tablets"
        | "powder"
        | "liquid"
        | "cream"
        | "other"
        | "syrup"
        | "suspension"
        | "injection"
        | "ointment"
        | "drops"
        | "vial"
        | "gel"
        | "lotion"
        | "spray"
      production_status: "planned" | "in_progress" | "completed" | "cancelled"
      stock_movement_type:
        | "opening"
        | "production_in"
        | "production_out"
        | "adjustment_in"
        | "adjustment_out"
        | "sale"
        | "purchase"
        | "wastage"
        | "sale_return"
        | "damage_out"
        | "expired_out"
      unit_type: "kg" | "g" | "l" | "ml" | "pcs" | "box" | "pack"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "accounts", "it", "md"],
      bom_layer: [
        "api_excipient",
        "primary_packaging",
        "secondary_packaging",
        "tertiary_packaging",
      ],
      dosage_form: [
        "tablet",
        "capsule",
        "syrup",
        "suspension",
        "injection",
        "cream",
        "ointment",
        "powder",
        "drops",
        "vial",
        "other",
      ],
      material_category: ["herbs", "chemicals", "packaging"],
      packaging_unit: [
        "strip",
        "blister",
        "bottle",
        "vial",
        "ampoule",
        "tube",
        "jar",
        "sachet",
        "box",
        "carton",
        "shipper",
      ],
      product_category: [
        "capsules",
        "tablets",
        "powder",
        "liquid",
        "cream",
        "other",
        "syrup",
        "suspension",
        "injection",
        "ointment",
        "drops",
        "vial",
        "gel",
        "lotion",
        "spray",
      ],
      production_status: ["planned", "in_progress", "completed", "cancelled"],
      stock_movement_type: [
        "opening",
        "production_in",
        "production_out",
        "adjustment_in",
        "adjustment_out",
        "sale",
        "purchase",
        "wastage",
        "sale_return",
        "damage_out",
        "expired_out",
      ],
      unit_type: ["kg", "g", "l", "ml", "pcs", "box", "pack"],
    },
  },
} as const
