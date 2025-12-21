import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BackupData {
  version: string;
  exportedAt: string;
  raw_materials: any[];
  products: any[];
  bom: any[];
  bom_items: any[];
  production_batches: any[];
  stock_ledger_materials: any[];
  stock_ledger_products: any[];
  customers: any[];
  sellers: any[];
  sales: any[];
  sale_items: any[];
}

export function useBackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const exportData = async (): Promise<BackupData | null> => {
    setIsExporting(true);
    try {
      const [
        rawMaterials,
        products,
        bom,
        bomItems,
        productionBatches,
        stockLedgerMaterials,
        stockLedgerProducts,
        customers,
        sellers,
        sales,
        saleItems
      ] = await Promise.all([
        supabase.from('raw_materials').select('*'),
        supabase.from('products').select('*'),
        supabase.from('bom').select('*'),
        supabase.from('bom_items').select('*'),
        supabase.from('production_batches').select('*'),
        supabase.from('stock_ledger_materials').select('*'),
        supabase.from('stock_ledger_products').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('sellers').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('sale_items').select('*')
      ]);

      const backup: BackupData = {
        version: "1.1",
        exportedAt: new Date().toISOString(),
        raw_materials: rawMaterials.data || [],
        products: products.data || [],
        bom: bom.data || [],
        bom_items: bomItems.data || [],
        production_batches: productionBatches.data || [],
        stock_ledger_materials: stockLedgerMaterials.data || [],
        stock_ledger_products: stockLedgerProducts.data || [],
        customers: customers.data || [],
        sellers: sellers.data || [],
        sales: sales.data || [],
        sale_items: saleItems.data || []
      };

      return backup;
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Could not export database. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBackup = async () => {
    const data = await exportData();
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erp-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup Downloaded",
      description: "Your database backup has been saved."
    });
  };

  const validateBackup = (data: any): data is BackupData => {
    return (
      data &&
      typeof data.version === 'string' &&
      typeof data.exportedAt === 'string' &&
      Array.isArray(data.raw_materials) &&
      Array.isArray(data.products) &&
      Array.isArray(data.bom) &&
      Array.isArray(data.bom_items) &&
      Array.isArray(data.production_batches) &&
      Array.isArray(data.stock_ledger_materials) &&
      Array.isArray(data.stock_ledger_products) &&
      Array.isArray(data.customers) &&
      Array.isArray(data.sellers)
      // sales and sale_items are optional for backward compatibility
    );
  };

  const restoreData = async (data: BackupData): Promise<boolean> => {
    setIsImporting(true);
    try {
      // Delete existing data in correct order (respecting foreign keys)
      await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('stock_ledger_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('stock_ledger_materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('production_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('bom_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('bom').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('raw_materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('sellers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert data in correct order (respecting foreign keys)
      if (data.raw_materials.length > 0) {
        const { error } = await supabase.from('raw_materials').insert(data.raw_materials);
        if (error) throw error;
      }

      if (data.products.length > 0) {
        const { error } = await supabase.from('products').insert(data.products);
        if (error) throw error;
      }

      if (data.bom.length > 0) {
        const { error } = await supabase.from('bom').insert(data.bom);
        if (error) throw error;
      }

      if (data.bom_items.length > 0) {
        const { error } = await supabase.from('bom_items').insert(data.bom_items);
        if (error) throw error;
      }

      if (data.production_batches.length > 0) {
        const { error } = await supabase.from('production_batches').insert(data.production_batches);
        if (error) throw error;
      }

      if (data.stock_ledger_materials.length > 0) {
        const { error } = await supabase.from('stock_ledger_materials').insert(data.stock_ledger_materials);
        if (error) throw error;
      }

      if (data.stock_ledger_products.length > 0) {
        const { error } = await supabase.from('stock_ledger_products').insert(data.stock_ledger_products);
        if (error) throw error;
      }

      if (data.customers.length > 0) {
        const { error } = await supabase.from('customers').insert(data.customers);
        if (error) throw error;
      }

      if (data.sellers.length > 0) {
        const { error } = await supabase.from('sellers').insert(data.sellers);
        if (error) throw error;
      }

      // Sales data (optional for backward compatibility)
      if (data.sales && data.sales.length > 0) {
        const { error } = await supabase.from('sales').insert(data.sales);
        if (error) throw error;
      }

      if (data.sale_items && data.sale_items.length > 0) {
        const { error } = await supabase.from('sale_items').insert(data.sale_items);
        if (error) throw error;
      }

      toast({
        title: "Restore Complete",
        description: "Database has been restored from backup."
      });

      return true;
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Restore Failed",
        description: "Could not restore database. Data may be partially restored.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isExporting,
    isImporting,
    downloadBackup,
    validateBackup,
    restoreData
  };
}
