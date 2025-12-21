import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProductionBatches, useCreateProduction, useStartProduction, useCompleteProduction } from '@/hooks/useProduction';
import { useProducts } from '@/hooks/useProducts';
import { useActiveBOM } from '@/hooks/useBOM';
import { Plus, Play, CheckCircle } from 'lucide-react';
import { useState } from 'react';

function CreateProductionDialog({ onClose }: { onClose: () => void }) {
  const { data: products } = useProducts();
  const createProduction = useCreateProduction();
  const [productId, setProductId] = useState('');
  const { data: activeBom } = useActiveBOM(productId);
  const [quantity, setQuantity] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBom) return;
    await createProduction.mutateAsync({ product_id: productId, bom_id: activeBom.id, quantity_planned: quantity });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Product</Label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent>
            {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {activeBom && (
        <div className="p-3 bg-accent rounded-lg text-sm">
          <p>BOM v{activeBom.version} - Est. Cost: ₹{Number(activeBom.estimated_cost).toFixed(2)}</p>
        </div>
      )}
      {!activeBom && productId && (
        <p className="text-destructive text-sm">No active BOM found for this product</p>
      )}
      <div className="space-y-2">
        <Label>Quantity to Produce</Label>
        <Input type="number" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!activeBom || quantity <= 0}>Create Batch</Button>
      </div>
    </form>
  );
}

const statusColors: Record<string, string> = {
  planned: 'bg-secondary',
  in_progress: 'bg-yellow-500',
  completed: 'bg-primary',
  cancelled: 'bg-destructive'
};

export default function ProductionPage() {
  const { data: batches, isLoading } = useProductionBatches();
  const startProduction = useStartProduction();
  const completeProduction = useCompleteProduction();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleStart = (id: string) => startProduction.mutate(id);
  const handleComplete = (id: string, planned: number) => {
    const qty = prompt('Quantity produced:', String(planned));
    if (qty) completeProduction.mutate({ batchId: id, quantityProduced: parseFloat(qty) });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Production</h1>
            <p className="text-muted-foreground">Manage production batches</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Batch</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Production Batch</DialogTitle></DialogHeader>
              <CreateProductionDialog onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Planned</TableHead>
                    <TableHead>Produced</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches?.map((batch: any) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono">{batch.batch_number}</TableCell>
                      <TableCell>{batch.product?.name}</TableCell>
                      <TableCell>{batch.quantity_planned}</TableCell>
                      <TableCell>{batch.quantity_produced}</TableCell>
                      <TableCell><Badge className={statusColors[batch.status]}>{batch.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {batch.status === 'planned' && (
                          <Button size="sm" variant="outline" onClick={() => handleStart(batch.id)}>
                            <Play className="h-3 w-3 mr-1" /> Start
                          </Button>
                        )}
                        {batch.status === 'in_progress' && (
                          <Button size="sm" variant="outline" onClick={() => handleComplete(batch.id, batch.quantity_planned)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
