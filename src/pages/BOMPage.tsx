import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ModuleManual, BOM_MANUAL } from '@/components/ModuleManual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useBOMs, useBOM, useCreateBOM, useProductsWithoutBOM } from '@/hooks/useBOM';
import { useProducts } from '@/hooks/useProducts';
import { useRawMaterials } from '@/hooks/useRawMaterials';
import { Plus, Eye, X, Copy, Search, Package, Beaker, Box, Truck } from 'lucide-react';
import { BOMLayer, BOM_LAYER_LABELS, BOM_LAYER_DESCRIPTIONS } from '@/types/packaging';

interface BOMItemForm {
  raw_material_id: string;
  quantity_per_unit: number;
  wastage_percent: number;
  bom_layer: BOMLayer;
}

const LAYER_ICONS: Record<BOMLayer, React.ReactNode> = {
  api_excipient: <Beaker className="h-4 w-4" />,
  primary_packaging: <Package className="h-4 w-4" />,
  secondary_packaging: <Box className="h-4 w-4" />,
  tertiary_packaging: <Truck className="h-4 w-4" />,
};

const LAYER_COLORS: Record<BOMLayer, string> = {
  api_excipient: 'bg-blue-500/10 border-blue-500/30',
  primary_packaging: 'bg-green-500/10 border-green-500/30',
  secondary_packaging: 'bg-orange-500/10 border-orange-500/30',
  tertiary_packaging: 'bg-purple-500/10 border-purple-500/30',
};

function CreateBOMDialog({ onClose, existingProductId }: { onClose: () => void; existingProductId?: string }) {
  const { data: products } = useProducts();
  const { data: productsWithoutBOM } = useProductsWithoutBOM();
  const { data: materials } = useRawMaterials();
  const createBOM = useCreateBOM();
  
  const [productId, setProductId] = useState(existingProductId || '');
  const [notes, setNotes] = useState('');
  const [bomItems, setBomItems] = useState<BOMItemForm[]>([]);
  const [activeLayer, setActiveLayer] = useState<BOMLayer>('api_excipient');

  const isNewVersion = !!existingProductId;
  const availableProducts = isNewVersion ? products : productsWithoutBOM;

  // Filter materials by category for better UX
  const materialsByCategory = useMemo(() => {
    if (!materials) return { packaging: [], nonPackaging: [] };
    return {
      packaging: materials.filter(m => m.category === 'packaging'),
      nonPackaging: materials.filter(m => m.category !== 'packaging'),
    };
  }, [materials]);

  // Get materials for current layer
  const layerMaterials = activeLayer === 'api_excipient' 
    ? materialsByCategory.nonPackaging 
    : materialsByCategory.packaging;

  const addBomItem = (layer: BOMLayer) => {
    setBomItems([...bomItems, { 
      raw_material_id: '', 
      quantity_per_unit: 0, 
      wastage_percent: 0,
      bom_layer: layer 
    }]);
  };

  const removeBomItem = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const updateBomItem = (index: number, field: keyof BOMItemForm, value: string | number) => {
    const updated = [...bomItems];
    updated[index] = { ...updated[index], [field]: value };
    setBomItems(updated);
  };

  const itemsByLayer = useMemo(() => {
    const grouped: Record<BOMLayer, BOMItemForm[]> = {
      api_excipient: [],
      primary_packaging: [],
      secondary_packaging: [],
      tertiary_packaging: [],
    };
    bomItems.forEach((item, index) => {
      grouped[item.bom_layer].push({ ...item, _index: index } as any);
    });
    return grouped;
  }, [bomItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = bomItems.filter(item => item.raw_material_id && item.quantity_per_unit > 0);
    if (validItems.length === 0) {
      return;
    }
    await createBOM.mutateAsync({
      product_id: productId,
      notes,
      items: validItems.map(item => ({
        raw_material_id: item.raw_material_id,
        quantity_per_unit: item.quantity_per_unit,
        wastage_percent: item.wastage_percent,
        bom_layer: item.bom_layer,
      }))
    });
    onClose();
  };

  const selectedProduct = products?.find(p => p.id === productId);

  const renderLayerItems = (layer: BOMLayer) => {
    const items = itemsByLayer[layer];
    const mats = layer === 'api_excipient' ? materialsByCategory.nonPackaging : materialsByCategory.packaging;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {LAYER_ICONS[layer]}
            <span className="font-medium text-sm">{BOM_LAYER_LABELS[layer]}</span>
            <Badge variant="outline" className="text-xs">{items.length} items</Badge>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => addBomItem(layer)}>
            <Plus className="h-3 w-3 mr-1" /> যোগ করুন
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{BOM_LAYER_DESCRIPTIONS[layer]}</p>
        
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3 border rounded-lg text-center border-dashed">
            এই লেয়ারে কোন ম্যাটেরিয়াল নেই
          </p>
        ) : (
          items.map((item: any) => (
            <div key={item._index} className={`flex gap-2 items-end p-3 border rounded-lg ${LAYER_COLORS[layer]}`}>
              <div className="flex-1">
                <Label className="text-xs">Material</Label>
                <Select value={item.raw_material_id} onValueChange={(v) => updateBomItem(item._index, 'raw_material_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                  <SelectContent>
                    {mats?.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label className="text-xs">Qty/Unit</Label>
                <Input type="number" step="0.0001" value={item.quantity_per_unit} onChange={(e) => updateBomItem(item._index, 'quantity_per_unit', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="w-20">
                <Label className="text-xs">Wastage %</Label>
                <Input type="number" step="0.01" value={item.wastage_percent} onChange={(e) => updateBomItem(item._index, 'wastage_percent', parseFloat(e.target.value) || 0)} />
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeBomItem(item._index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto">
      {/* Product Selection */}
      {!isNewVersion ? (
        <div className="space-y-2">
          <Label>প্রোডাক্ট নির্বাচন করুন *</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger><SelectValue placeholder="প্রোডাক্ট নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>
              {availableProducts?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
            </SelectContent>
          </Select>
          {availableProducts?.length === 0 && (
            <p className="text-sm text-muted-foreground">সব প্রোডাক্টের ইতিমধ্যে BOM আছে</p>
          )}
        </div>
      ) : (
        <div className="p-3 bg-accent rounded-lg">
          <p className="text-sm font-medium">প্রোডাক্ট: {selectedProduct?.name}</p>
          <p className="text-xs text-muted-foreground">SKU: {selectedProduct?.sku}</p>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label>নোট</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="এই BOM ভার্সনের জন্য নোট (ঐচ্ছিক)" />
      </div>

      {/* Hierarchical BOM Layers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base">হায়ারার্কিক্যাল BOM *</Label>
          <Badge variant="secondary" className="text-xs">৩ স্তরের প্যাকেজিং সাপোর্ট</Badge>
        </div>
        
        <Accordion type="multiple" defaultValue={['api_excipient']} className="space-y-2">
          {(['api_excipient', 'primary_packaging', 'secondary_packaging', 'tertiary_packaging'] as BOMLayer[]).map((layer) => (
            <AccordionItem key={layer} value={layer} className={`border rounded-lg ${LAYER_COLORS[layer]}`}>
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  {LAYER_ICONS[layer]}
                  <span>{BOM_LAYER_LABELS[layer]}</span>
                  <Badge variant="outline" className="ml-2">{itemsByLayer[layer].length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {renderLayerItems(layer)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>বাতিল</Button>
        <Button type="submit" disabled={createBOM.isPending || !productId || bomItems.length === 0}>
          {isNewVersion ? 'নতুন ভার্সন তৈরি করুন' : 'BOM তৈরি করুন'}
        </Button>
      </div>
    </form>
  );
}

function BOMDetailsDialog({ bomId }: { bomId: string }) {
  const { data: bom, isLoading } = useBOM(bomId);

  // Group items by layer - must be before any conditional returns
  const itemsByLayer = useMemo(() => {
    if (!bom?.items) {
      return {
        api_excipient: [],
        primary_packaging: [],
        secondary_packaging: [],
        tertiary_packaging: [],
      };
    }
    const grouped: Record<string, typeof bom.items> = {
      api_excipient: [],
      primary_packaging: [],
      secondary_packaging: [],
      tertiary_packaging: [],
    };
    bom.items?.forEach((item: any) => {
      const layer = item.bom_layer || 'api_excipient';
      if (grouped[layer]) {
        grouped[layer].push(item);
      }
    });
    return grouped;
  }, [bom?.items]);

  // Calculate cost by layer - must be before any conditional returns
  const costByLayer = useMemo(() => {
    const costs: Record<string, number> = {};
    Object.entries(itemsByLayer).forEach(([layer, items]) => {
      costs[layer] = items.reduce((sum, item: any) => {
        const effectiveQty = item.quantity_per_unit * (1 + item.wastage_percent / 100);
        return sum + effectiveQty * (item.raw_material?.cost_per_unit || 0);
      }, 0);
    });
    return costs;
  }, [itemsByLayer]);

  if (isLoading) {
    return (
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>BOM বিস্তারিত লোড হচ্ছে...</DialogTitle>
        </DialogHeader>
        <div className="p-8 text-center">লোড হচ্ছে...</div>
      </DialogContent>
    );
  }

  if (!bom) {
    return (
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>BOM বিস্তারিত</DialogTitle>
        </DialogHeader>
        <div className="p-8 text-center text-muted-foreground">BOM পাওয়া যায়নি</div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>BOM বিস্তারিত - {bom.product?.name} (v{bom.version})</DialogTitle>
        <DialogDescription>হায়ারার্কিক্যাল বিল অব ম্যাটেরিয়ালস</DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-accent rounded-lg">
            <p className="text-xs text-muted-foreground">মোট খরচ</p>
            <p className="text-lg font-bold">৳{Number(bom.estimated_cost).toFixed(2)}</p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <p className="text-xs text-muted-foreground">API & Excipient</p>
            <p className="text-lg font-bold">৳{costByLayer.api_excipient?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <p className="text-xs text-muted-foreground">প্যাকেজিং</p>
            <p className="text-lg font-bold">৳{((costByLayer.primary_packaging || 0) + (costByLayer.secondary_packaging || 0) + (costByLayer.tertiary_packaging || 0)).toFixed(2)}</p>
          </div>
          <div className="p-3 bg-accent rounded-lg">
            <p className="text-xs text-muted-foreground">স্ট্যাটাস</p>
            <Badge className={bom.is_active ? 'bg-primary' : ''}>{bom.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</Badge>
          </div>
        </div>

        {/* Hierarchical BOM Display */}
        <Tabs defaultValue="api_excipient" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api_excipient" className="text-xs">
              <Beaker className="h-3 w-3 mr-1" />API
            </TabsTrigger>
            <TabsTrigger value="primary_packaging" className="text-xs">
              <Package className="h-3 w-3 mr-1" />Primary
            </TabsTrigger>
            <TabsTrigger value="secondary_packaging" className="text-xs">
              <Box className="h-3 w-3 mr-1" />Secondary
            </TabsTrigger>
            <TabsTrigger value="tertiary_packaging" className="text-xs">
              <Truck className="h-3 w-3 mr-1" />Tertiary
            </TabsTrigger>
          </TabsList>
          
          {(['api_excipient', 'primary_packaging', 'secondary_packaging', 'tertiary_packaging'] as const).map((layer) => (
            <TabsContent key={layer} value={layer} className="mt-4">
              <Card className={LAYER_COLORS[layer]}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {LAYER_ICONS[layer]}
                    {BOM_LAYER_LABELS[layer]}
                  </CardTitle>
                  <CardDescription className="text-xs">{BOM_LAYER_DESCRIPTIONS[layer]}</CardDescription>
                </CardHeader>
                <CardContent>
                  {itemsByLayer[layer]?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">এই লেয়ারে কোন আইটেম নেই</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ম্যাটেরিয়াল</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">পরিমাণ/ইউনিট</TableHead>
                          <TableHead className="text-right">Wastage</TableHead>
                          <TableHead className="text-right">খরচ/ইউনিট</TableHead>
                          <TableHead className="text-right">মোট খরচ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemsByLayer[layer]?.map((item: any) => {
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {bom.notes && (
          <div className="text-sm p-3 bg-accent rounded-lg">
            <span className="text-muted-foreground">নোট:</span> {bom.notes}
          </div>
        )}
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
        <ModuleManual {...BOM_MANUAL} />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">বিল অব ম্যাটেরিয়ালস (BOM)</h1>
            <p className="text-muted-foreground">হায়ারার্কিক্যাল BOM - API, প্রাইমারি, সেকেন্ডারি ও টার্শিয়ারি প্যাকেজিং সহ</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) handleCloseCreate(); else setCreateDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> BOM তৈরি করুন</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{newVersionProductId ? 'নতুন BOM ভার্সন তৈরি করুন' : 'নতুন BOM তৈরি করুন'}</DialogTitle>
                <DialogDescription>৩-স্তরের প্যাকেজিং সহ হায়ারার্কিক্যাল BOM</DialogDescription>
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
            placeholder="প্রোডাক্ট নাম বা SKU দিয়ে খুঁজুন..."
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
              <div className="p-8 text-center">লোড হচ্ছে...</div>
            ) : filteredBoms?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? 'কোন BOM পাওয়া যায়নি।' : 'কোন BOM নেই। শুরু করতে একটি তৈরি করুন।'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>প্রোডাক্ট</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>ভার্সন</TableHead>
                    <TableHead>আনুমানিক খরচ</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead>নোট</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
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
                        <Badge className={bom.is_active ? 'bg-primary' : ''}>{bom.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{bom.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setDetailsBomId(bom.id)} title="বিস্তারিত দেখুন">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {bom.is_active && (
                            <Button size="icon" variant="ghost" onClick={() => handleCreateNewVersion(bom.product_id)} title="নতুন ভার্সন তৈরি করুন">
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
