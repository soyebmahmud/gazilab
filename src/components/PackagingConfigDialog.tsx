import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Package, Box, Truck, Star, Edit2 } from 'lucide-react';
import { 
  useProductPackagingConfigs, 
  useCreatePackagingConfig, 
  useUpdatePackagingConfig, 
  useDeletePackagingConfig,
  calculatePackagingBreakdown
} from '@/hooks/usePackagingConfigs';
import { 
  PackagingUnit, 
  PACKAGING_UNIT_LABELS, 
  PRIMARY_PACKAGING_MAP,
  DosageForm,
  ProductPackagingConfig
} from '@/types/packaging';
import { toast } from 'sonner';

interface PackagingConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  dosageForm?: DosageForm;
}

const ALL_PRIMARY_UNITS: PackagingUnit[] = ['strip', 'blister', 'bottle', 'vial', 'ampoule', 'tube', 'jar', 'sachet'];
const SECONDARY_UNITS: PackagingUnit[] = ['box', 'carton'];
const TERTIARY_UNITS: PackagingUnit[] = ['carton', 'shipper'];

export function PackagingConfigDialog({ 
  open, 
  onOpenChange, 
  productId, 
  productName,
  dosageForm = 'tablet'
}: PackagingConfigDialogProps) {
  const { data: configs, isLoading } = useProductPackagingConfigs(productId);
  const createConfig = useCreatePackagingConfig();
  const updateConfig = useUpdatePackagingConfig();
  const deleteConfig = useDeletePackagingConfig();
  
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ProductPackagingConfig | null>(null);
  
  // Form state
  const [configName, setConfigName] = useState('Default');
  const [isDefault, setIsDefault] = useState(true);
  const [primaryPackType, setPrimaryPackType] = useState<PackagingUnit>('strip');
  const [unitsPerPrimary, setUnitsPerPrimary] = useState(10);
  const [secondaryPackType, setSecondaryPackType] = useState<PackagingUnit | ''>('box');
  const [primaryPerSecondary, setPrimaryPerSecondary] = useState(10);
  const [tertiaryPackType, setTertiaryPackType] = useState<PackagingUnit | ''>('carton');
  const [secondaryPerTertiary, setSecondaryPerTertiary] = useState(20);

  // Suggested primary packaging based on dosage form
  const suggestedPrimary = PRIMARY_PACKAGING_MAP[dosageForm] || ALL_PRIMARY_UNITS;

  const resetForm = () => {
    setConfigName('Default');
    setIsDefault(!configs || configs.length === 0);
    setPrimaryPackType(suggestedPrimary[0] || 'strip');
    setUnitsPerPrimary(10);
    setSecondaryPackType('box');
    setPrimaryPerSecondary(10);
    setTertiaryPackType('carton');
    setSecondaryPerTertiary(20);
    setEditingConfig(null);
  };

  const handleEdit = (config: ProductPackagingConfig) => {
    setEditingConfig(config);
    setConfigName(config.config_name);
    setIsDefault(config.is_default);
    setPrimaryPackType(config.primary_pack_type);
    setUnitsPerPrimary(config.units_per_primary_pack);
    setSecondaryPackType(config.secondary_pack_type || '');
    setPrimaryPerSecondary(config.primary_packs_per_secondary || 10);
    setTertiaryPackType(config.tertiary_pack_type || '');
    setSecondaryPerTertiary(config.secondary_packs_per_tertiary || 20);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      product_id: productId,
      config_name: configName,
      is_default: isDefault,
      primary_pack_type: primaryPackType,
      units_per_primary_pack: unitsPerPrimary,
      secondary_pack_type: secondaryPackType || null,
      primary_packs_per_secondary: secondaryPackType ? primaryPerSecondary : null,
      tertiary_pack_type: tertiaryPackType || null,
      secondary_packs_per_tertiary: tertiaryPackType ? secondaryPerTertiary : null,
    };

    if (editingConfig) {
      await updateConfig.mutateAsync({ 
        id: editingConfig.id, 
        productId,
        ...data 
      });
    } else {
      await createConfig.mutateAsync(data as any);
    }
    
    setShowForm(false);
    resetForm();
  };

  const handleDelete = async (config: ProductPackagingConfig) => {
    if (confirm(`"${config.config_name}" কনফিগারেশন মুছে ফেলতে চান?`)) {
      await deleteConfig.mutateAsync({ id: config.id, productId });
    }
  };

  // Preview calculation
  const previewConfig = useMemo(() => {
    if (!showForm) return null;
    return {
      units_per_primary_pack: unitsPerPrimary,
      primary_packs_per_secondary: secondaryPackType ? primaryPerSecondary : 1,
      secondary_packs_per_tertiary: tertiaryPackType ? secondaryPerTertiary : 1,
    } as ProductPackagingConfig;
  }, [unitsPerPrimary, primaryPerSecondary, secondaryPerTertiary, secondaryPackType, tertiaryPackType, showForm]);

  const previewCalc = previewConfig ? calculatePackagingBreakdown(previewConfig, 1, 'tertiary') : null;

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          প্যাকেজিং কনফিগারেশন - {productName}
        </DialogTitle>
        <DialogDescription>
          প্রাইমারি, সেকেন্ডারি ও টার্শিয়ারি প্যাকেজিং স্তর সংজ্ঞায়িত করুন
        </DialogDescription>
      </DialogHeader>

      {!showForm ? (
        <div className="space-y-4">
          {/* Existing Configs */}
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">লোড হচ্ছে...</div>
          ) : configs && configs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead>প্রাইমারি</TableHead>
                  <TableHead>সেকেন্ডারি</TableHead>
                  <TableHead>টার্শিয়ারি</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {config.is_default && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                        <span className="font-medium">{config.config_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {config.units_per_primary_pack} / {PACKAGING_UNIT_LABELS[config.primary_pack_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {config.secondary_pack_type ? (
                        <Badge variant="outline">
                          {config.primary_packs_per_secondary} {PACKAGING_UNIT_LABELS[config.primary_pack_type].split(' ')[0]} / {PACKAGING_UNIT_LABELS[config.secondary_pack_type]}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {config.tertiary_pack_type ? (
                        <Badge variant="outline">
                          {config.secondary_packs_per_tertiary} / {PACKAGING_UNIT_LABELS[config.tertiary_pack_type]}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(config)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(config)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>কোন প্যাকেজিং কনফিগারেশন নেই</p>
                <p className="text-sm">নিচের বাটনে ক্লিক করে একটি তৈরি করুন</p>
              </CardContent>
            </Card>
          )}

          <Button onClick={() => { resetForm(); setShowForm(true); }} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> নতুন কনফিগারেশন যোগ করুন
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Config Name & Default */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>কনফিগারেশন নাম</Label>
              <Input 
                value={configName} 
                onChange={(e) => setConfigName(e.target.value)} 
                placeholder="Default, Export, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>ডিফল্ট হিসেবে সেট করুন</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                <span className="text-sm text-muted-foreground">
                  {isDefault ? 'হ্যাঁ' : 'না'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Packaging */}
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" /> প্রাইমারি প্যাকেজিং (Primary)
              </CardTitle>
              <CardDescription className="text-xs">সরাসরি সংস্পর্শে আসে - স্ট্রিপ, বোতল, ভায়াল</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">প্যাক টাইপ</Label>
                  <Select value={primaryPackType} onValueChange={(v) => setPrimaryPackType(v as PackagingUnit)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {suggestedPrimary.map(u => (
                        <SelectItem key={u} value={u}>{PACKAGING_UNIT_LABELS[u]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">ইউনিট প্রতি প্যাক</Label>
                  <Input 
                    type="number" 
                    min="1"
                    value={unitsPerPrimary} 
                    onChange={(e) => setUnitsPerPrimary(parseInt(e.target.value) || 1)} 
                  />
                  <p className="text-xs text-muted-foreground">
                    যেমন: ১০ ট্যাবলেট/স্ট্রিপ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Packaging */}
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Box className="h-4 w-4" /> সেকেন্ডারি প্যাকেজিং (Secondary)
              </CardTitle>
              <CardDescription className="text-xs">বক্স - বিক্রয় প্যাকেজিং</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">প্যাক টাইপ</Label>
                  <Select value={secondaryPackType} onValueChange={(v) => setSecondaryPackType(v as PackagingUnit)}>
                    <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ব্যবহার করবেন না</SelectItem>
                      {SECONDARY_UNITS.map(u => (
                        <SelectItem key={u} value={u}>{PACKAGING_UNIT_LABELS[u]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {secondaryPackType && (
                  <div className="space-y-2">
                    <Label className="text-xs">প্রাইমারি প্রতি সেকেন্ডারি</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={primaryPerSecondary} 
                      onChange={(e) => setPrimaryPerSecondary(parseInt(e.target.value) || 1)} 
                    />
                    <p className="text-xs text-muted-foreground">
                      যেমন: ১০ স্ট্রিপ/বক্স
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tertiary Packaging */}
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" /> টার্শিয়ারি প্যাকেজিং (Tertiary)
              </CardTitle>
              <CardDescription className="text-xs">কার্টন/শিপার - পরিবহন প্যাকেজিং</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">প্যাক টাইপ</Label>
                  <Select value={tertiaryPackType} onValueChange={(v) => setTertiaryPackType(v as PackagingUnit)}>
                    <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ব্যবহার করবেন না</SelectItem>
                      {TERTIARY_UNITS.map(u => (
                        <SelectItem key={u} value={u}>{PACKAGING_UNIT_LABELS[u]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {tertiaryPackType && (
                  <div className="space-y-2">
                    <Label className="text-xs">সেকেন্ডারি প্রতি টার্শিয়ারি</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={secondaryPerTertiary} 
                      onChange={(e) => setSecondaryPerTertiary(parseInt(e.target.value) || 1)} 
                    />
                    <p className="text-xs text-muted-foreground">
                      যেমন: ২০ বক্স/কার্টন
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {previewCalc && (
            <Card className="bg-accent">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">প্রিভিউ: ১ টার্শিয়ারি প্যাক =</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <Badge variant="secondary">{previewCalc.total_units} ইউনিট</Badge>
                  <span>→</span>
                  <Badge variant="outline">{previewCalc.primary_packs} {PACKAGING_UNIT_LABELS[primaryPackType]}</Badge>
                  {secondaryPackType && (
                    <>
                      <span>→</span>
                      <Badge variant="outline">{previewCalc.secondary_packs} {PACKAGING_UNIT_LABELS[secondaryPackType]}</Badge>
                    </>
                  )}
                  {tertiaryPackType && (
                    <>
                      <span>→</span>
                      <Badge variant="outline">{previewCalc.tertiary_packs} {PACKAGING_UNIT_LABELS[tertiaryPackType]}</Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
              বাতিল
            </Button>
            <Button type="submit" disabled={createConfig.isPending || updateConfig.isPending}>
              {editingConfig ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      )}
    </DialogContent>
  );
}
