import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBOMs, useBOM, useCreateBOM, useProductsWithoutBOM } from '@/hooks/useBOM';
import { useProducts } from '@/hooks/useProducts';
import { useRawMaterials } from '@/hooks/useRawMaterials';
import { Plus, Eye, X, Copy, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

interface BOMItemForm {
  raw_material_id: string;
  quantity_per_unit: number;
  wastage_percent: number;
}

function CreateBOMDialog({ onClose, existingProductId }: { onClose: () => void; existingProductId?: string }) {
  const { data: products } = useProducts();
  const { data: productsWithoutBOM } = useProductsWithoutBOM();
  const { data: materials } = useRawMaterials();
  const createBOM = useCreateBOM();
  
  const [productId, setProductId] = useState(existingProductId || '');
  const [notes, setNotes] = useState('');
  const [bomItems, setBomItems] = useState<BOMItemForm[]>([]);

  // If existingProductId is provided, we're creating a new version
  const isNewVersion = !!existingProductId;
  const availableProducts = isNewVersion ? products : productsWithoutBOM;

  const addBomItem = () => {
    setBomItems([...bomItems, { raw_material_id: '', quantity_per_unit: 0, wastage_percent: 0 }]);
  };

  const removeBomItem = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const updateBomItem = (index: number, field: keyof BOMItemForm, value: string | number) => {
    const updated = [...bomItems];
    updated[index] = { ...updated[index], [field]: value };
    setBomItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = bomItems.filter(item => item.raw_material_id && item.quantity_per_unit > 0);
    if (validItems.length === 0) {
      return;
    }
    await createBOM.mutateAsync({
      product_id: productId,
      notes,
      items: validItems
    });
    onClose();
  };

  const selectedProduct = products?.find(p => p.id === productId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Product Selection */}
      {!isNewVersion ? (
        <div className="space-y-2">
          <Label>Product *</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent>
              {availableProducts?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
            </SelectContent>
          </Select>
          {availableProducts?.length === 0 && (
            <p className="text-sm text-muted-foreground">All products already have a BOM</p>
          )}
        </div>
      ) : (
        <div className="p-3 bg-accent rounded-lg">
          <p className="text-sm font-medium">Product: {selectedProduct?.name}</p>
          <p className="text-xs text-muted-foreground">SKU: {selectedProduct?.sku}</p>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notes</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for this BOM version" />
      </div>

      {/* BOM Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Raw Materials *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addBomItem}>
            <Plus className="h-3 w-3 mr-1" /> Add Material
          </Button>
        </div>
        
        {bomItems.length === 0 && (
          <p className="text-sm text-muted-foreground p-4 border rounded-lg text-center">
            Add at least one raw material to create the BOM
          </p>
        )}

        {bomItems.map((item, index) => (
          <div key={index} className="flex gap-2 items-end p-3 border rounded-lg">
            <div className="flex-1">
              <Label className="text-xs">Material</Label>
              <Select value={item.raw_material_id} onValueChange={(v) => updateBomItem(index, 'raw_material_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                <SelectContent>
                  {materials?.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Label className="text-xs">Qty/Unit</Label>
              <Input type="number" step="0.0001" value={item.quantity_per_unit} onChange={(e) => updateBomItem(index, 'quantity_per_unit', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="w-20">
              <Label className="text-xs">Wastage %</Label>
              <Input type="number" step="0.01" value={item.wastage_percent} onChange={(e) => updateBomItem(index, 'wastage_percent', parseFloat(e.target.value) || 0)} />
            </div>
            <Button type="button" size="icon" variant="ghost" onClick={() => removeBomItem(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createBOM.isPending || !productId || bomItems.length === 0}>
          {isNewVersion ? 'Create New Version' : 'Create BOM'}
        </Button>
      </div>
    </form>
  );
}

function BOMDetailsDialog({ bomId }: { bomId: string }) {
  const { data: bom, isLoading } = useBOM(bomId);

  if (isLoading) {
    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Loading BOM Details</DialogTitle>
        </DialogHeader>
        <div className="p-8 text-center">Loading...</div>
      </DialogContent>
    );
  }

  if (!bom) {
    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>BOM Details</DialogTitle>
        </DialogHeader>
        <div className="p-8 text-center text-muted-foreground">BOM not found</div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>BOM Details - {bom.product?.name} (v{bom.version})</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* Product Info */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Product Information</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {bom.product?.name}</div>
              <div><span className="text-muted-foreground">SKU:</span> {bom.product?.sku}</div>
              <div><span className="text-muted-foreground">Category:</span> {bom.product?.category}</div>
              <div><span className="text-muted-foreground">Unit:</span> {bom.product?.unit}</div>
            </div>
          </CardContent>
        </Card>

        {/* BOM Info */}
        <div className="flex gap-4 text-sm">
          <div className="p-3 bg-accent rounded-lg flex-1">
            <p className="text-muted-foreground">Est. Manufacturing Cost</p>
            <p className="text-xl font-bold">৳{Number(bom.estimated_cost).toFixed(2)}</p>
          </div>
          <div className="p-3 bg-accent rounded-lg flex-1">
            <p className="text-muted-foreground">Status</p>
            <Badge className={bom.is_active ? 'bg-primary' : ''}>{bom.is_active ? 'Active' : 'Inactive'}</Badge>
          </div>
        </div>

        {bom.notes && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notes:</span> {bom.notes}
          </div>
        )}

        {/* Materials List */}
        <div>
          <h4 className="font-medium mb-2">Raw Materials</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty/Unit</TableHead>
                <TableHead className="text-right">Wastage</TableHead>
                <TableHead className="text-right">Cost/Unit</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bom.items?.map((item) => {
                const effectiveQty = item.quantity_per_unit * (1 + item.wastage_percent / 100);
                const itemCost = effectiveQty * (item.raw_material?.cost_per_unit || 0);
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.raw_material?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.raw_material?.sku}</TableCell>
                    <TableCell className="text-right">{item.quantity_per_unit} {item.raw_material?.unit}</TableCell>
                    <TableCell className="text-right">{item.wastage_percent}%</TableCell>
                    <TableCell className="text-right">৳{item.raw_material?.cost_per_unit}</TableCell>
                    <TableCell className="text-right font-medium">৳{itemCost.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </DialogContent>
  );
}

export default function BOMPage() {
  const { data: boms, isLoading } = useBOMs();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newVersionProductId, setNewVersionProductId] = useState<string | undefined>();
  const [detailsBomId, setDetailsBomId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter BOMs based on search
  const filteredBoms = useMemo(() => {
    if (!boms) return [];
    if (!searchQuery.trim()) return boms;
    const search = searchQuery.toLowerCase();
    return boms.filter((bom: any) => 
      bom.product?.name?.toLowerCase().includes(search) ||
      bom.product?.sku?.toLowerCase().includes(search)
    );
  }, [boms, searchQuery]);

  const handleCreateNewVersion = (productId: string) => {
    setNewVersionProductId(productId);
    setCreateDialogOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateDialogOpen(false);
    setNewVersionProductId(undefined);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bill of Materials</h1>
            <p className="text-muted-foreground">View and manage product formulations</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) handleCloseCreate(); else setCreateDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Create BOM</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{newVersionProductId ? 'Create New BOM Version' : 'Create BOM'}</DialogTitle>
              </DialogHeader>
              <CreateBOMDialog onClose={handleCloseCreate} existingProductId={newVersionProductId} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or SKU..."
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

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : filteredBoms?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? 'No BOMs match your search.' : 'No BOMs found. Create one for a product to get started.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Est. Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBoms?.map((bom) => (
                    <TableRow key={bom.id}>
                      <TableCell className="font-medium">{bom.product?.name}</TableCell>
                      <TableCell className="text-muted-foreground">{bom.product?.sku}</TableCell>
                      <TableCell>v{bom.version}</TableCell>
                      <TableCell>৳{Number(bom.estimated_cost).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={bom.is_active ? 'bg-primary' : ''}>{bom.is_active ? 'Active' : 'Inactive'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{bom.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setDetailsBomId(bom.id)} title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {bom.is_active && (
                            <Button size="icon" variant="ghost" onClick={() => handleCreateNewVersion(bom.product_id)} title="Create New Version">
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* BOM Details Dialog */}
        <Dialog open={!!detailsBomId} onOpenChange={(open) => !open && setDetailsBomId(null)}>
          {detailsBomId && <BOMDetailsDialog bomId={detailsBomId} />}
        </Dialog>
      </div>
    </MainLayout>
  );
}
