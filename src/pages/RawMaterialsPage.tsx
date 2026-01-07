import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ModuleManual, RAW_MATERIALS_MANUAL } from '@/components/ModuleManual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRawMaterials, useCreateRawMaterial, useUpdateRawMaterial, useDeleteRawMaterial, useMaterialUsage, useCanDeleteMaterial, useDeletedRawMaterials, useRestoreRawMaterial } from '@/hooks/useRawMaterials';
import { RawMaterial, MaterialCategory, UnitType } from '@/types/database';
import { Plus, Pencil, Trash2, Eye, AlertTriangle, RotateCcw, Archive, PackagePlus, Search, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { AddStockDialog } from '@/components/AddStockDialog';

const CATEGORIES: MaterialCategory[] = ['herbs', 'chemicals', 'packaging'];
const UNITS: UnitType[] = ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'pack'];

function MaterialForm({ material, onClose }: { material?: RawMaterial; onClose: () => void }) {
  const createMaterial = useCreateRawMaterial();
  const updateMaterial = useUpdateRawMaterial();
  const [formData, setFormData] = useState({
    name: material?.name || '',
    sku: material?.sku || '',
    category: material?.category || 'herbs' as MaterialCategory,
    unit: material?.unit || 'kg' as UnitType,
    cost_per_unit: material?.cost_per_unit || 0,
    min_stock_level: material?.min_stock_level || 0,
    opening_stock: 0,
    description: material?.description || '',
    supplier: material?.supplier || '',
    is_active: material?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (material) {
      // Exclude opening_stock when updating - it's only for create
      const { opening_stock, ...updateData } = formData;
      await updateMaterial.mutateAsync({ id: material.id, ...updateData });
    } else {
      await createMaterial.mutateAsync(formData);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>SKU *</Label>
          <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as MaterialCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v as UnitType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cost per Unit</Label>
          <Input type="number" step="0.01" value={formData.cost_per_unit} onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Min Stock Level</Label>
          <Input type="number" step="0.001" value={formData.min_stock_level} onChange={(e) => setFormData({ ...formData, min_stock_level: parseFloat(e.target.value) || 0 })} />
        </div>
        {!material && (
          <div className="space-y-2">
            <Label>Opening Stock</Label>
            <Input type="number" step="0.001" value={formData.opening_stock} onChange={(e) => setFormData({ ...formData, opening_stock: parseFloat(e.target.value) || 0 })} />
          </div>
        )}
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Input value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMaterial.isPending || updateMaterial.isPending}>
          {material ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function MaterialUsageDialog({ materialId, materialName }: { materialId: string; materialName: string }) {
  const { data: usage, isLoading } = useMaterialUsage(materialId);
  const { data: canDelete } = useCanDeleteMaterial(materialId);

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Usage: {materialName}</DialogTitle>
      </DialogHeader>
      {isLoading ? (
        <p>Loading...</p>
      ) : usage && usage.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>BOM Version</TableHead>
              <TableHead>Qty/Unit</TableHead>
              <TableHead>Wastage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usage.map((u, i) => (
              <TableRow key={i}>
                <TableCell>{u.product_name}</TableCell>
                <TableCell>v{u.bom_version}</TableCell>
                <TableCell>{u.quantity_per_unit}</TableCell>
                <TableCell>{u.wastage_percent}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground">This material is not used in any BOM</p>
      )}
      {canDelete && !canDelete.can_delete && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">Used in {canDelete.usage_count} BOM(s), {canDelete.ledger_count} ledger entries</span>
        </div>
      )}
    </DialogContent>
  );
}

export default function RawMaterialsPage() {
  const { data: materials, isLoading } = useRawMaterials();
  const { data: deletedMaterials } = useDeletedRawMaterials();
  const deleteMaterial = useDeleteRawMaterial();
  const restoreMaterial = useRestoreRawMaterial();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<RawMaterial | undefined>();
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [addStockMaterial, setAddStockMaterial] = useState<RawMaterial | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleEdit = (material: RawMaterial) => {
    setEditMaterial(material);
    setDialogOpen(true);
  };

  const handleDelete = async (material: RawMaterial) => {
    if (confirm(`Delete ${material.name}?`)) {
      deleteMaterial.mutate(material.id);
    }
  };

  const handleViewUsage = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setUsageDialogOpen(true);
  };

  // Filter materials based on search
  const filteredMaterials = useMemo(() => {
    const sourceList = showDeleted ? deletedMaterials : materials;
    if (!sourceList) return [];
    if (!searchQuery.trim()) return sourceList;
    const search = searchQuery.toLowerCase();
    return sourceList.filter(m => 
      m.name.toLowerCase().includes(search) || 
      m.sku.toLowerCase().includes(search) ||
      m.category.toLowerCase().includes(search)
    );
  }, [materials, deletedMaterials, showDeleted, searchQuery]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <ModuleManual {...RAW_MATERIALS_MANUAL} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Raw Materials</h1>
            <p className="text-muted-foreground">Manage herbs, chemicals, and packaging</p>
          </div>
          <div className="flex gap-2">
            <Button variant={showDeleted ? "default" : "outline"} onClick={() => setShowDeleted(!showDeleted)}>
              <Archive className="h-4 w-4 mr-2" />
              {showDeleted ? 'Show Active' : `Deleted (${deletedMaterials?.length || 0})`}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditMaterial(undefined); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Add Material</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editMaterial ? 'Edit Material' : 'Add New Material'}</DialogTitle>
                </DialogHeader>
                <MaterialForm material={editMaterial} onClose={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, SKU, or category..."
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
            ) : filteredMaterials.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? 'No materials match your search.' : 'No raw materials yet. Add one to get started.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => {
                    const isOutOfStock = material.current_stock <= 0;
                    const isLowStock = !isOutOfStock && material.current_stock <= material.min_stock_level;
                    
                    return (
                      <TableRow 
                        key={material.id}
                        className={
                          showDeleted ? '' :
                          isOutOfStock ? 'bg-destructive/10 hover:bg-destructive/15' :
                          isLowStock ? 'bg-yellow-500/10 hover:bg-yellow-500/15' : ''
                        }
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isOutOfStock && !showDeleted && (
                              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                            {isLowStock && !showDeleted && (
                              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                            )}
                            {material.name}
                          </div>
                        </TableCell>
                        <TableCell>{material.sku}</TableCell>
                        <TableCell><Badge variant="outline">{material.category}</Badge></TableCell>
                        <TableCell className={isOutOfStock ? 'text-destructive font-semibold' : isLowStock ? 'text-yellow-600 font-semibold' : ''}>
                          {material.current_stock.toFixed(2)}
                        </TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>৳{material.cost_per_unit}</TableCell>
                        <TableCell>
                          {showDeleted ? (
                            <Badge variant="secondary">Deleted</Badge>
                          ) : isOutOfStock ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge className="bg-yellow-500 text-yellow-950">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-primary">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {showDeleted ? (
                              <Button size="icon" variant="ghost" onClick={() => restoreMaterial.mutate(material.id)} title="Restore">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  variant={isOutOfStock || isLowStock ? "default" : "outline"}
                                  onClick={() => setAddStockMaterial(material)}
                                  className={isOutOfStock ? 'bg-destructive hover:bg-destructive/90' : isLowStock ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-950' : ''}
                                >
                                  <PackagePlus className="h-4 w-4 mr-1" />
                                  {isOutOfStock ? 'স্টক যোগ করুন' : 'Receive'}
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleViewUsage(material)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleEdit(material)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(material)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
          {selectedMaterial && <MaterialUsageDialog materialId={selectedMaterial.id} materialName={selectedMaterial.name} />}
        </Dialog>

        <AddStockDialog 
          open={!!addStockMaterial} 
          onOpenChange={(open) => !open && setAddStockMaterial(null)} 
          material={addStockMaterial} 
        />
      </div>
    </MainLayout>
  );
}
