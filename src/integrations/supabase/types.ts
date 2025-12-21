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
          created_at: string
          id: string
          quantity_per_unit: number
          raw_material_id: string
          wastage_percent: number
        }
        Insert: {
          bom_id: string
          created_at?: string
          id?: string
          quantity_per_unit?: number
          raw_material_id: string
          wastage_percent?: number
        }
        Update: {
          bom_id?: string
          created_at?: string
          id?: string
          quantity_per_unit?: number
          raw_material_id?: string
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
      production_batches: {
        Row: {
          batch_number: string
          bom_id: string
          created_at: string
          expiry_date: string | null
          id: string
          manufacturing_date: string | null
          notes: string | null
          product_id: string
          quantity_planned: number
          quantity_produced: number
          status: Database["public"]["Enums"]["production_status"]
          updated_at: string
        }
        Insert: {
          batch_number: string
          bom_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          notes?: string | null
          product_id: string
          quantity_planned: number
          quantity_produced?: number
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
        }
        Update: {
          batch_number?: string
          bom_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          notes?: string | null
          product_id?: string
          quantity_planned?: number
          quantity_produced?: number
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
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
            foreignKeyName: "production_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          cost_price: number
          created_at: string
          current_stock: number
          description: string | null
          expiry_date: string | null
          id: string
          is_active: boolean
          manufacturing_date: string | null
          min_stock_level: number
          name: string
          selling_price: number
          sku: string
          unit: Database["public"]["Enums"]["unit_type"]
          units_per_pack: number
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["product_category"]
          cost_price?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          manufacturing_date?: string | null
          min_stock_level?: number
          name: string
          selling_price?: number
          sku: string
          unit?: Database["public"]["Enums"]["unit_type"]
          units_per_pack?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          cost_price?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          manufacturing_date?: string | null
          min_stock_level?: number
          name?: string
          selling_price?: number
          sku?: string
          unit?: Database["public"]["Enums"]["unit_type"]
          units_per_pack?: number
          updated_at?: string
        }
        Relationships: []
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
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          discount_amount: number
          id: string
          invoice_number: string
          notes: string | null
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
          raw_material_id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_delete_material: {
        Args: { material_id: string }
        Returns: {
          can_delete: boolean
          ledger_count: number
          usage_count: number
        }[]
      }
      generate_invoice_number: { Args: never; Returns: string }
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
    }
    Enums: {
      material_category: "herbs" | "chemicals" | "packaging"
      product_category:
        | "capsules"
        | "tablets"
        | "powder"
        | "liquid"
        | "cream"
        | "other"
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
      material_category: ["herbs", "chemicals", "packaging"],
      product_category: [
        "capsules",
        "tablets",
        "powder",
        "liquid",
        "cream",
        "other",
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
      ],
      unit_type: ["kg", "g", "l", "ml", "pcs", "box", "pack"],
    },
  },
} as const
