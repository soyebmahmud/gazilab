import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProductionBatches, useCreateProduction, useStartProduction, useCompleteProduction } from '@/hooks/useProduction';
import { useProducts } from '@/hooks/useProducts';
import { useActiveBOM } from '@/hooks/useBOM';
import { Plus, Play, CheckCircle, Calendar, AlertTriangle, PackagePlus, Search, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { AddStockDialog } from '@/components/AddStockDialog';
import { RawMaterial } from '@/types/database';

function CreateProductionDialog({ onClose }: { onClose: () => void }) {
  const { data: products } = useProducts();
  const createProduction = useCreateProduction();
  const [productId, setProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const { data: activeBom } = useActiveBOM(productId);
  const [packsQuantity, setPacksQuantity] = useState(0);
  const [manufacturingDate, setManufacturingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [addStockMaterial, setAddStockMaterial] = useState<RawMaterial | null>(null);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!productSearch.trim()) return products;
    const search = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.sku.toLowerCase().includes(search)
    );
  }, [products, productSearch]);

  // Get selected product
  const selectedProduct = products?.find(p => p.id === productId);
  const unitsPerPack = selectedProduct?.units_per_pack || 1;
  
  // Calculate total units from packs
  const totalUnits = packsQuantity * unitsPerPack;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBom) return;
    await createProduction.mutateAsync({ 
      product_id: productId, 
      bom_id: activeBom.id, 
      quantity_planned: totalUnits,
      manufacturing_date: manufacturingDate || undefined,
      expiry_date: expiryDate || undefined,
      notes: notes || undefined
    });
    onClose();
  };

  // Calculate material requirements based on total units
  const materialRequirements = activeBom?.items?.map(item => {
    const requiredQty = item.quantity_per_unit * (1 + item.wastage_percent / 100) * totalUnits;
    const available = item.raw_material?.current_stock || 0;
    const isInsufficient = available < requiredQty;
    return {
      name: item.raw_material?.name,
      unit: item.raw_material?.unit,
      required: requiredQty,
      available,
      isInsufficient,
      raw_material: item.raw_material as RawMaterial | undefined
    };
  }) || [];

  const hasInsufficientStock = materialRequirements.some(m => m.isInsufficient);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="space-y-2">
        <Label>Product *</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="pl-9"
          />
          {productSearch && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setProductSearch('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent className="max-h-60">
            {filteredProducts.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">No products found</div>
            ) : (
              filteredProducts.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span>{p.name}</span>
                    <span className="text-xs text-muted-foreground">({p.sku})</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {activeBom && (
        <div className="p-3 bg-accent rounded-lg text-sm">
          <p className="font-medium">BOM v{activeBom.version}</p>
          <p className="text-muted-foreground">Est. Cost: ৳{Number(activeBom.estimated_cost).toFixed(2)} per unit</p>
        </div>
      )}

      {!activeBom && productId && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-destructive text-sm">No active BOM found for this product. Please create a BOM first.</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Quantity (Packs/Strips) *</Label>
        <Input 
          type="number" 
          value={packsQuantity} 
          onChange={(e) => setPacksQuantity(parseFloat(e.target.value) || 0)} 
          min="0"
          step="1"
          placeholder={`Enter number of ${unitsPerPack > 1 ? 'strips/packs' : 'units'}`}
        />
        {unitsPerPack > 1 && packsQuantity > 0 && (
          <div className="flex items-center gap-2 p-2 bg-accent rounded-md text-sm">
            <span className="font-medium">{packsQuantity} strips × {unitsPerPack} =</span>
            <span className="text-primary font-bold">{totalUnits} tablets</span>
          </div>
        )}
      </div>

      {/* Material Requirements Preview */}
      {activeBom && totalUnits > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Material Requirements</Label>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Material</TableHead>
                  <TableHead className="text-xs text-right">Required</TableHead>
                  <TableHead className="text-xs text-right">Available</TableHead>
                  <TableHead className="text-xs text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialRequirements.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{m.name}</TableCell>
                    <TableCell className="text-sm text-right">{m.required.toFixed(3)} {m.unit}</TableCell>
                    <TableCell className="text-sm text-right">{m.available.toFixed(3)} {m.unit}</TableCell>
                    <TableCell className="text-right">
                      {m.isInsufficient ? (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => m.raw_material && setAddStockMaterial(m.raw_material)}
                          className="h-6 text-xs px-2"
                        >
                          <PackagePlus className="h-3 w-3 mr-1" />
                          Add Stock
                        </Button>
                      ) : (
                        <Badge className="bg-primary text-xs">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {hasInsufficientStock && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-xs text-destructive">Cannot create batch: Add stock to insufficient materials</p>
            </div>
          )}
        </div>
      )}

      {/* Add Stock Dialog */}
      <AddStockDialog 
        open={!!addStockMaterial} 
        onOpenChange={(open) => !open && setAddStockMaterial(null)} 
        material={addStockMaterial} 
      />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Manufacturing Date
          </Label>
          <Input 
            type="date" 
            value={manufacturingDate} 
            onChange={(e) => setManufacturingDate(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Expiry Date
          </Label>
          <Input 
            type="date" 
            value={expiryDate} 
            onChange={(e) => setExpiryDate(e.target.value)}
            min={manufacturingDate}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notes (Optional)</Label>
        <Input 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Any special instructions..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!activeBom || totalUnits <= 0 || hasInsufficientStock || createProduction.isPending}>
          Create Batch ({totalUnits} units)
        </Button>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter batches based on search and status
  const filteredBatches = useMemo(() => {
    if (!batches) return [];
    let filtered = batches;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((batch: any) => batch.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter((batch: any) => 
        batch.batch_number.toLowerCase().includes(search) ||
        batch.product?.name?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [batches, searchQuery, statusFilter]);

  const handleStart = (id: string) => startProduction.mutate(id);
  const handleComplete = (id: string, planned: number) => {
    const qty = prompt('Quantity produced:', String(planned));
    if (qty) completeProduction.mutate({ batchId: id, quantityProduced: parseFloat(qty) });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd MMM yyyy');
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
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Create Production Batch</DialogTitle></DialogHeader>
              <CreateProductionDialog onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by batch number or product name..."
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Status Filter Tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
            <TabsList>
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="planned" className="text-xs">Planned</TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs">In Progress</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : filteredBatches.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? 'No batches match your search.' : 'No production batches yet. Create one to get started.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Planned</TableHead>
                    <TableHead className="text-right">Produced</TableHead>
                    <TableHead>Mfg Date</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch: any) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono text-sm">{batch.batch_number}</TableCell>
                      <TableCell className="font-medium">{batch.product?.name}</TableCell>
                      <TableCell className="text-right">{batch.quantity_planned}</TableCell>
                      <TableCell className="text-right">{batch.quantity_produced}</TableCell>
                      <TableCell className="text-sm">{formatDate(batch.manufacturing_date)}</TableCell>
                      <TableCell className="text-sm">{formatDate(batch.expiry_date)}</TableCell>
                      <TableCell><Badge className={statusColors[batch.status]}>{batch.status.replace('_', ' ')}</Badge></TableCell>
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
