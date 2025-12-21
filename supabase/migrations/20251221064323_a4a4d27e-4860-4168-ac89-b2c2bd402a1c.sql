-- Create only the stock recalculation triggers (these are the critical ones)
-- Using IF NOT EXISTS pattern with DO block

DO $$
BEGIN
  -- Trigger for stock_ledger_materials
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_recalculate_material_stock') THEN
    CREATE TRIGGER trigger_recalculate_material_stock
    AFTER INSERT OR UPDATE OR DELETE ON public.stock_ledger_materials
    FOR EACH ROW
    EXECUTE FUNCTION public.recalculate_material_stock();
  END IF;

  -- Trigger for stock_ledger_products
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_recalculate_product_stock') THEN
    CREATE TRIGGER trigger_recalculate_product_stock
    AFTER INSERT OR UPDATE OR DELETE ON public.stock_ledger_products
    FOR EACH ROW
    EXECUTE FUNCTION public.recalculate_product_stock();
  END IF;

  -- Trigger for bom_items
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_calculate_bom_cost') THEN
    CREATE TRIGGER trigger_calculate_bom_cost
    AFTER INSERT OR UPDATE OR DELETE ON public.bom_items
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_bom_cost();
  END IF;
END $$;