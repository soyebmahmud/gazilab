import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ModuleManual, PRODUCTION_MANUAL } from '@/components/ModuleManual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProductionBatches, useCreateProduction, useStartProduction, useCompleteProduction } from '@/hooks/useProduction';
import { useProducts } from '@/hooks/useProducts';
import { useActiveBOM } from '@/hooks/useBOM';
import { useDefaultPackagingConfig, useProductPackagingConfigs, calculatePackagingBreakdown } from '@/hooks/usePackagingConfigs';
import { Plus, Play, CheckCircle, Calendar, AlertTriangle, PackagePlus, Search, X, Package, Beaker, Box, Truck } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { AddStockDialog } from '@/components/AddStockDialog';
import { RawMaterial } from '@/types/database';
import { BOM_LAYER_LABELS, PACKAGING_UNIT_LABELS, ProductPackagingConfig, BOMLayer } from '@/types/packaging';

const LAYER_COLORS: Record<BOMLayer, string> = {
  api_excipient: 'bg-blue-500/10',
  primary_packaging: 'bg-green-500/10',
  secondary_packaging: 'bg-orange-500/10',
  tertiary_packaging: 'bg-purple-500/10',
};

function CreateProductionDialog({ onClose }: { onClose: () => void }) {
  const { data: products } = useProducts();
  const createProduction = useCreateProduction();
  const [productId, setProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const { data: activeBom } = useActiveBOM(productId);
  const { data: packagingConfigs } = useProductPackagingConfigs(productId);
  const { data: defaultPackagingConfig } = useDefaultPackagingConfig(productId);
  
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [inputType, setInputType] = useState<'units' | 'primary' | 'secondary' | 'tertiary'>('primary');
  const [quantity, setQuantity] = useState(0);
  const [manufacturingDate, setManufacturingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [addStockMaterial, setAddStockMaterial] = useState<RawMaterial | null>(null);

  // Auto-select default packaging config
  useEffect(() => {
    if (defaultPackagingConfig && !selectedConfigId) {
      setSelectedConfigId(defaultPackagingConfig.id);
    } else if (packagingConfigs && packagingConfigs.length > 0 && !selectedConfigId) {
      setSelectedConfigId(packagingConfigs[0].id);
    }
  }, [defaultPackagingConfig, packagingConfigs, selectedConfigId]);

  // Reset config when product changes
  useEffect(() => {
    setSelectedConfigId('');
  }, [productId]);

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

  // Get selected product and config
  const selectedProduct = products?.find(p => p.id === productId);
  const selectedConfig = packagingConfigs?.find(c => c.id === selectedConfigId);
  
  // Calculate packaging breakdown
  const packagingCalc = useMemo(() => {
    if (!selectedConfig || quantity <= 0) return null;
    return calculatePackagingBreakdown(selectedConfig, quantity, inputType);
  }, [selectedConfig, quantity, inputType]);

  const totalUnits = packagingCalc?.total_units || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBom || totalUnits <= 0) return;
    await createProduction.mutateAsync({ 
      product_id: productId, 
      bom_id: activeBom.id, 
      quantity_planned: totalUnits,
      manufacturing_date: manufacturingDate || undefined,
      expiry_date: expiryDate || undefined,
      notes: notes || undefined,
      packaging_config_id: selectedConfigId || undefined
    });
    onClose();
  };

  // Calculate material requirements based on total units with layer awareness
  const materialRequirements = useMemo(() => {
    if (!activeBom?.items || totalUnits <= 0 || !selectedConfig) return [];
    
    const primaryPacks = packagingCalc?.primary_packs || 0;
    const secondaryPacks = packagingCalc?.secondary_packs || 0;
    const tertiaryPacks = packagingCalc?.tertiary_packs || 0;
    
    return activeBom.items.map((item: any) => {
      const layer = item.bom_layer || 'api_excipient';
      let scaleFactor = totalUnits;
      
      // Scale based on layer
      switch (layer) {
        case 'primary_packaging':
          scaleFactor = primaryPacks;
          break;
        case 'secondary_packaging':
          scaleFactor = secondaryPacks;
          break;
        case 'tertiary_packaging':
          scaleFactor = tertiaryPacks;
          break;
        default:
          scaleFactor = totalUnits;
      }
      
      const requiredQty = item.quantity_per_unit * (1 + item.wastage_percent / 100) * scaleFactor;
      const available = item.raw_material?.current_stock || 0;
      const isInsufficient = available < requiredQty;
      const cost = requiredQty * (item.raw_material?.cost_per_unit || 0);
      
      return {
        name: item.raw_material?.name,
        unit: item.raw_material?.unit,
        layer,
        required: requiredQty,
        available,
        isInsufficient,
        cost,
        raw_material: item.raw_material as RawMaterial | undefined
      };
    });
  }, [activeBom, totalUnits, packagingCalc, selectedConfig]);

  // Group by layer
  const materialsByLayer = useMemo(() => {
    const grouped: Record<string, typeof materialRequirements> = {
      api_excipient: [],
      primary_packaging: [],
      secondary_packaging: [],
      tertiary_packaging: [],
    };
    materialRequirements.forEach(m => {
      if (grouped[m.layer]) {
        grouped[m.layer].push(m);
      }
    });
    return grouped;
  }, [materialRequirements]);

  const hasInsufficientStock = materialRequirements.some(m => m.isInsufficient);
  const totalEstCost = materialRequirements.reduce((sum, m) => sum + m.cost, 0);

  // Input type options based on packaging config
  const inputOptions = useMemo(() => {
    const opts = [{ value: 'units', label: 'ইউনিট (Units)' }];
    if (selectedConfig) {
      opts.push({ value: 'primary', label: PACKAGING_UNIT_LABELS[selectedConfig.primary_pack_type] });
      if (selectedConfig.secondary_pack_type) {
        opts.push({ value: 'secondary', label: PACKAGING_UNIT_LABELS[selectedConfig.secondary_pack_type] });
      }
      if (selectedConfig.tertiary_pack_type) {
        opts.push({ value: 'tertiary', label: PACKAGING_UNIT_LABELS[selectedConfig.tertiary_pack_type] });
      }
    }
    return opts;
  }, [selectedConfig]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto">
      {/* Product Search & Select */}
      <div className="space-y-2">
        <Label>প্রোডাক্ট *</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="প্রোডাক্ট খুঁজুন..."
            className="pl-9"
          />
        </div>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger><SelectValue placeholder="প্রোডাক্ট নির্বাচন করুন" /></SelectTrigger>
          <SelectContent className="max-h-60">
            {filteredProducts.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">কোন প্রোডাক্ট নেই</div>
            ) : (
              filteredProducts.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <span>{p.name} ({p.sku})</span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* BOM Info */}
      {activeBom && (
        <Card className="bg-accent">
          <CardContent className="py-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">BOM v{activeBom.version}</p>
                <p className="text-sm text-muted-foreground">আনুমানিক খরচ: ৳{Number(activeBom.estimated_cost).toFixed(2)}/ইউনিট</p>
              </div>
              {totalUnits > 0 && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">মোট আনুমানিক খরচ</p>
                  <p className="font-bold text-lg">৳{totalEstCost.toFixed(2)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!activeBom && productId && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-destructive text-sm">এই প্রোডাক্টের কোন Active BOM নেই। প্রথমে BOM তৈরি করুন।</p>
        </div>
      )}

      {/* Packaging Config Selection */}
      {productId && packagingConfigs && packagingConfigs.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Package className="h-4 w-4" /> প্যাকেজিং কনফিগারেশন
          </Label>
          <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
            <SelectTrigger><SelectValue placeholder="কনফিগ নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>
              {packagingConfigs.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.config_name} {c.is_default && '(Default)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedConfig && (
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">
                {selectedConfig.units_per_primary_pack}/{PACKAGING_UNIT_LABELS[selectedConfig.primary_pack_type]}
              </Badge>
              {selectedConfig.secondary_pack_type && (
                <Badge variant="outline">
                  {selectedConfig.primary_packs_per_secondary} → {PACKAGING_UNIT_LABELS[selectedConfig.secondary_pack_type]}
                </Badge>
              )}
              {selectedConfig.tertiary_pack_type && (
                <Badge variant="outline">
                  {selectedConfig.secondary_packs_per_tertiary} → {PACKAGING_UNIT_LABELS[selectedConfig.tertiary_pack_type]}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {productId && (!packagingConfigs || packagingConfigs.length === 0) && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <p className="text-yellow-600 text-sm">কোন প্যাকেজিং কনফিগ নেই। Products পেজ থেকে তৈরি করুন।</p>
        </div>
      )}

      {/* Quantity Input */}
      {selectedConfig && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>পরিমাণ *</Label>
            <Select value={inputType} onValueChange={(v) => setInputType(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {inputOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input 
            type="number" 
            value={quantity} 
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} 
            min="0"
            step="1"
            placeholder={`${inputOptions.find(o => o.value === inputType)?.label} সংখ্যা দিন`}
          />
          
          {/* Packaging Breakdown */}
          {packagingCalc && quantity > 0 && (
            <Card className="bg-accent">
              <CardContent className="py-3">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="font-medium">ব্রেকডাউন:</span>
                  <Badge>{packagingCalc.total_units} ইউনিট</Badge>
                  <span>→</span>
                  <Badge variant="outline">{packagingCalc.primary_packs} {PACKAGING_UNIT_LABELS[selectedConfig.primary_pack_type]}</Badge>
                  {selectedConfig.secondary_pack_type && (
                    <>
                      <span>→</span>
                      <Badge variant="outline">{packagingCalc.secondary_packs} {PACKAGING_UNIT_LABELS[selectedConfig.secondary_pack_type]}</Badge>
                    </>
                  )}
                  {selectedConfig.tertiary_pack_type && (
                    <>
                      <span>→</span>
                      <Badge variant="outline">{packagingCalc.tertiary_packs} {PACKAGING_UNIT_LABELS[selectedConfig.tertiary_pack_type]}</Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Hierarchical Material Requirements */}
      {activeBom && totalUnits > 0 && selectedConfig && (
        <div className="space-y-2">
          <Label className="text-sm">হায়ারার্কিক্যাল ম্যাটেরিয়াল প্রয়োজনীয়তা</Label>
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
              <TabsContent key={layer} value={layer} className="mt-2">
                <div className={`border rounded-lg overflow-hidden ${LAYER_COLORS[layer]}`}>
                  {materialsByLayer[layer]?.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">এই লেয়ারে কোন ম্যাটেরিয়াল নেই</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">ম্যাটেরিয়াল</TableHead>
                          <TableHead className="text-xs text-right">প্রয়োজন</TableHead>
                          <TableHead className="text-xs text-right">আছে</TableHead>
                          <TableHead className="text-xs text-right">খরচ</TableHead>
                          <TableHead className="text-xs text-right">স্ট্যাটাস</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materialsByLayer[layer]?.map((m, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{m.name}</TableCell>
                            <TableCell className="text-sm text-right">{m.required.toFixed(3)} {m.unit}</TableCell>
                            <TableCell className="text-sm text-right">{m.available.toFixed(3)} {m.unit}</TableCell>
                            <TableCell className="text-sm text-right">৳{m.cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {m.isInsufficient ? (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => m.raw_material && setAddStockMaterial(m.raw_material)}
                                  className="h-6 text-xs px-2"
                                  type="button"
                                >
                                  <PackagePlus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              ) : (
                                <Badge className="bg-primary text-xs">OK</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
          
          {hasInsufficientStock && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-xs text-destructive">ব্যাচ তৈরি করা যাবে না: অপর্যাপ্ত ম্যাটেরিয়ালে স্টক যোগ করুন</p>
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
            <Calendar className="h-3 w-3" /> উৎপাদন তারিখ
          </Label>
          <Input 
            type="date" 
            value={manufacturingDate} 
            onChange={(e) => setManufacturingDate(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> মেয়াদ শেষ
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
        <Label>নোট (ঐচ্ছিক)</Label>
        <Input 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="বিশেষ নির্দেশনা..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>বাতিল</Button>
        <Button type="submit" disabled={!activeBom || totalUnits <= 0 || hasInsufficientStock || !selectedConfigId || createProduction.isPending}>
          ব্যাচ তৈরি করুন ({totalUnits} ইউনিট)
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

const statusLabels: Record<string, string> = {
  planned: 'পরিকল্পিত',
  in_progress: 'চলমান',
  completed: 'সম্পন্ন',
  cancelled: 'বাতিল'
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
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((batch: any) => batch.status === statusFilter);
    }
    
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
    const qty = prompt('উৎপাদিত পরিমাণ:', String(planned));
    if (qty) completeProduction.mutate({ batchId: id, quantityProduced: parseFloat(qty) });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd MMM yyyy');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <ModuleManual {...PRODUCTION_MANUAL} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">উৎপাদন (Production)</h1>
            <p className="text-muted-foreground">প্যাকেজিং কনফিগারেশন সহ স্বয়ংক্রিয় ম্যাটেরিয়াল হিসাব</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> নতুন ব্যাচ</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>প্রোডাকশন ব্যাচ তৈরি করুন</DialogTitle>
                <DialogDescription>প্যাকেজিং কনফিগ অনুযায়ী স্বয়ংক্রিয় ম্যাটেরিয়াল হিসাব</DialogDescription>
              </DialogHeader>
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
              placeholder="ব্যাচ নম্বর বা প্রোডাক্ট নাম দিয়ে খুঁজুন..."
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
              <TabsTrigger value="all" className="text-xs">সব</TabsTrigger>
              <TabsTrigger value="planned" className="text-xs">পরিকল্পিত</TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs">চলমান</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">সম্পন্ন</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">লোড হচ্ছে...</div>
            ) : filteredBatches.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? 'কোন ব্যাচ পাওয়া যায়নি।' : 'কোন প্রোডাকশন ব্যাচ নেই। একটি তৈরি করুন।'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ব্যাচ #</TableHead>
                    <TableHead>প্রোডাক্ট</TableHead>
                    <TableHead className="text-right">পরিকল্পিত</TableHead>
                    <TableHead className="text-right">উৎপাদিত</TableHead>
                    <TableHead>উৎপাদন তারিখ</TableHead>
                    <TableHead>মেয়াদ</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
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
                      <TableCell><Badge className={statusColors[batch.status]}>{statusLabels[batch.status] || batch.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {batch.status === 'planned' && (
                          <Button size="sm" variant="outline" onClick={() => handleStart(batch.id)}>
                            <Play className="h-3 w-3 mr-1" /> শুরু
                          </Button>
                        )}
                        {batch.status === 'in_progress' && (
                          <Button size="sm" variant="outline" onClick={() => handleComplete(batch.id, batch.quantity_planned)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> সম্পন্ন
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
