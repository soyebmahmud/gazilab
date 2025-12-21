import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateRawMaterialBatch } from '@/hooks/useRawMaterialBatches';
import { RawMaterial, UnitType } from '@/types/database';
import { useState } from 'react';
import { format } from 'date-fns';
import { Package, Calendar, FileText, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: RawMaterial | null;
}

export function AddStockDialog({ open, onOpenChange, material }: AddStockDialogProps) {
  const createBatch = useCreateRawMaterialBatch();
  const [formData, setFormData] = useState({
    quantity: '',
    batch_number: '',
    expiry_date: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material) return;

    const quantity = parseFloat(formData.quantity);
    if (quantity <= 0) return;

    // Generate batch number if not provided
    const batchNumber = formData.batch_number || `BATCH-${Date.now()}`;

    await createBatch.mutateAsync({
      raw_material_id: material.id,
      batch_number: batchNumber,
      quantity_received: quantity,
      cost_per_unit: material.cost_per_unit,
      received_date: format(new Date(), 'yyyy-MM-dd'),
      expiry_date: formData.expiry_date || undefined,
      notes: formData.notes || `Stock added via Quick Add`,
    });

    // Reset form and close
    setFormData({
      quantity: '',
      batch_number: '',
      expiry_date: '',
      notes: '',
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    setFormData({
      quantity: '',
      batch_number: '',
      expiry_date: '',
      notes: '',
    });
    onOpenChange(false);
  };

  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Receive Stock
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 bg-accent rounded-lg space-y-1">
          <p className="font-medium">{material.name}</p>
          <p className="text-sm text-muted-foreground">SKU: {material.sku}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm">Current Stock:</span>
            {material.current_stock <= 0 ? (
              <Badge variant="destructive">Out of Stock</Badge>
            ) : material.current_stock <= material.min_stock_level ? (
              <Badge className="bg-yellow-500">{material.current_stock} {material.unit}</Badge>
            ) : (
              <Badge className="bg-primary">{material.current_stock} {material.unit}</Badge>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Quantity ({material.unit}) *
            </Label>
            <Input
              type="number"
              step="0.001"
              min="0.001"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder={`Enter quantity in ${material.unit}`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Batch Number
            </Label>
            <Input
              value={formData.batch_number}
              onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
              placeholder="Auto-generated if empty"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Expiry Date (Optional)
            </Label>
            <Input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Notes (Optional)
            </Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Purchase reference, supplier info..."
            />
          </div>

          <div className="text-xs text-muted-foreground p-2 bg-muted rounded-lg">
            This will create a <strong>purchase</strong> entry in the stock ledger. 
            Stock is updated automatically via ledger movement only.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBatch.isPending || !formData.quantity}>
              {createBatch.isPending ? 'Adding...' : 'Add Stock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
