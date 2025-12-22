import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ModuleManual, PRODUCTS_MANUAL } from '@/components/ModuleManual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useRawMaterials } from '@/hooks/useRawMaterials';
import { useActiveBOM } from '@/hooks/useBOM';
import { useProductPackagingConfigs } from '@/hooks/usePackagingConfigs';
import { Product, ProductCategory, UnitType } from '@/types/database';
import { Plus, Pencil, Trash2, X, ClipboardList, Search, Package } from 'lucide-react';
import { useState, useMemo } from 'react';
import { PackagingConfigDialog } from '@/components/PackagingConfigDialog';

const CATEGORIES: ProductCategory[] = ['capsules', 'tablets', 'powder', 'liquid', 'cream', 'other'];
const UNITS: UnitType[] = ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'pack'];

interface BOMItemForm {
  raw_material_id: string;
  quantity_per_unit: number;
  wastage_percent: number;
}

function ProductForm({ product, onClose }: { product?: Product; onClose: () => void }) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: materials } = useRawMaterials();
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || 'capsules' as ProductCategory,
    unit: product?.unit || 'pcs' as UnitType,
    selling_price: product?.selling_price || 0,
    min_stock_level: product?.min_stock_level || 0,
    units_per_pack: product?.units_per_pack || 1,
    opening_stock: 0,
    description: product?.description || '',
    is_active: product?.is_active ?? true
  });
  
  const [bomItems, setBomItems] = useState<BOMItemForm[]>([]);
  const [showBom, setShowBom] = useState(false);

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
    if (product) {
      await updateProduct.mutateAsync({ id: product.id, ...formData });
    } else {
      const validBomItems = bomItems.filter(item => item.raw_material_id && item.quantity_per_unit > 0);
      await createProduct.mutateAsync({ product: formData, bomItems: validBomItems.length > 0 ? validBomItems : undefined });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
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
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as ProductCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v as UnitType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Selling Price</Label>
          <Input type="number" step="0.01" value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Min Stock Level</Label>
          <Input type="number" step="0.001" value={formData.min_stock_level} onChange={(e) => setFormData({ ...formData, min_stock_level: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Units per Pack/Strip</Label>
          <Input 
            type="number" 
            step="1" 
            min="1"
            value={formData.units_per_pack} 
            onChange={(e) => setFormData({ ...formData, units_per_pack: parseInt(e.target.value) || 1 })} 
          />
          <p className="text-xs text-muted-foreground">E.g., 10 for tablets where 1 strip = 10 tablets</p>
        </div>
        {!product && (
          <div className="space-y-2">
            <Label>Opening Stock (in units)</Label>
            <Input type="number" step="0.001" value={formData.opening_stock} onChange={(e) => setFormData({ ...formData, opening_stock: parseFloat(e.target.value) || 0 })} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional product description" />
      </div>

      {!product && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base">Bill of Materials (Optional)</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowBom(!showBom)}>
              {showBom ? 'Hide BOM' : 'Add BOM'}
            </Button>
          </div>
          
          {showBom && (
            <div className="space-y-3">
              {bomItems.length === 0 && (
                <p className="text-sm text-muted-foreground p-3 border rounded-lg text-center">
                  Add raw materials to create a BOM for this product
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
              <Button type="button" variant="outline" size="sm" onClick={addBomItem}>
                <Plus className="h-3 w-3 mr-1" /> Add Material
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
          {product ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function ProductBOMDialog({ productId, productName }: { productId: string; productName: string }) {
  const { data: bom, isLoading } = useActiveBOM(productId);

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Active BOM - {productName}</DialogTitle>
      </DialogHeader>
      
      {isLoading ? (
        <div className="p-8 text-center">Loading...</div>
      ) : !bom ? (
        <div className="p-8 text-center text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No BOM found for this product</p>
          <p className="text-sm mt-1">Create one from the Bill of Materials page</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="p-3 bg-accent rounded-lg flex-1">
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="text-xl font-bold">v{bom.version}</p>
            </div>
            <div className="p-3 bg-accent rounded-lg flex-1">
              <p className="text-sm text-muted-foreground">Est. Cost</p>
              <p className="text-xl font-bold">৳{Number(bom.estimated_cost).toFixed(2)}</p>
            </div>
          </div>

          {bom.notes && (
            <p className="text-sm text-muted-foreground">Notes: {bom.notes}</p>
          )}

          <div>
            <h4 className="font-medium mb-2">Raw Materials</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Qty/Unit</TableHead>
                  <TableHead className="text-right">Wastage</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bom.items?.map((item) => {
                  const effectiveQty = item.quantity_per_unit * (1 + item.wastage_percent / 100);
                  const itemCost = effectiveQty * (item.raw_material?.cost_per_unit || 0);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.raw_material?.name}</p>
                          <p className="text-xs text-muted-foreground">{item.raw_material?.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity_per_unit} {item.raw_material?.unit}</TableCell>
                      <TableCell className="text-right">{item.wastage_percent}%</TableCell>
                      <TableCell className="text-right font-medium">৳{itemCost.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </DialogContent>
  );
}

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [bomDialogProduct, setBomDialogProduct] = useState<{ id: string; name: string } | null>(null);
  const [packagingDialogProduct, setPackagingDialogProduct] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;
    const search = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.sku.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search)
    );
  }, [products, searchQuery]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <ModuleManual {...PRODUCTS_MANUAL} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage finished goods</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditProduct(undefined); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <ProductForm product={editProduct} onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
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
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? 'No products match your search.' : 'No products yet. Add one to get started.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Units/Pack</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                      <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                      <TableCell className="text-right">{product.current_stock}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right">
                        {(product.units_per_pack || 1) > 1 ? (
                          <Badge variant="secondary">{product.units_per_pack}/pack</Badge>
                        ) : (
                          <span className="text-muted-foreground">1</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">৳{product.selling_price}</TableCell>
                      <TableCell>
                        {product.current_stock <= 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : product.current_stock <= product.min_stock_level ? (
                          <Badge className="bg-yellow-500">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-primary">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setPackagingDialogProduct({ id: product.id, name: product.name })} title="Packaging Config">
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setBomDialogProduct({ id: product.id, name: product.name })} title="View BOM">
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => { setEditProduct(product); setDialogOpen(true); }} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => confirm(`Delete ${product.name}?`) && deleteProduct.mutate(product.id)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* BOM Dialog */}
        <Dialog open={!!bomDialogProduct} onOpenChange={(open) => !open && setBomDialogProduct(null)}>
          {bomDialogProduct && <ProductBOMDialog productId={bomDialogProduct.id} productName={bomDialogProduct.name} />}
        </Dialog>

        {/* Packaging Config Dialog */}
        <Dialog open={!!packagingDialogProduct} onOpenChange={(open) => !open && setPackagingDialogProduct(null)}>
          {packagingDialogProduct && (
            <PackagingConfigDialog 
              open={!!packagingDialogProduct}
              onOpenChange={(open) => !open && setPackagingDialogProduct(null)}
              productId={packagingDialogProduct.id}
              productName={packagingDialogProduct.name}
            />
          )}
        </Dialog>
      </div>
    </MainLayout>
  );
}
