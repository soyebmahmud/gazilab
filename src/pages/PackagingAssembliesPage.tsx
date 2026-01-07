import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  usePackagingAssemblies, 
  useCreatePackagingAssembly, 
  useUpdatePackagingAssembly,
  useDeletePackagingAssembly,
  calculateAssemblyCost,
  PackagingAssembly 
} from '@/hooks/usePackagingAssemblies';
import { useRawMaterials } from '@/hooks/useRawMaterials';
import { Plus, X, Search, Package, Eye, Edit, Trash2, Layers } from 'lucide-react';

const PACKAGING_LEVELS = [
  { value: 'primary', label: 'প্রাইমারি (Primary)' },
  { value: 'secondary', label: 'সেকেন্ডারি (Secondary)' },
  { value: 'tertiary', label: 'টার্শিয়ারি (Tertiary)' },
];

interface ComponentForm {
  raw_material_id: string;
  quantity_per_assembly: number;
  is_optional: boolean;
  notes: string;
}

function AssemblyFormDialog({ 
  open, 
  onOpenChange, 
  editingAssembly 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  editingAssembly?: PackagingAssembly | null;
}) {
  const { data: materials } = useRawMaterials();
  const createAssembly = useCreatePackagingAssembly();
  const updateAssembly = useUpdatePackagingAssembly();
  
  const [name, setName] = useState(editingAssembly?.name || '');
  const [sku, setSku] = useState(editingAssembly?.sku || '');
  const [description, setDescription] = useState(editingAssembly?.description || '');
  const [packagingLevel, setPackagingLevel] = useState(editingAssembly?.packaging_level || 'primary');
  const [components, setComponents] = useState<ComponentForm[]>(
    editingAssembly?.components?.map(c => ({
      raw_material_id: c.raw_material_id,
      quantity_per_assembly: c.quantity_per_assembly,
      is_optional: c.is_optional,
      notes: c.notes || ''
    })) || []
  );

  // Filter only packaging materials
  const packagingMaterials = useMemo(() => {
    return materials?.filter(m => m.category === 'packaging') || [];
  }, [materials]);

  const addComponent = () => {
    setComponents([...components, { raw_material_id: '', quantity_per_assembly: 1, is_optional: false, notes: '' }]);
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: keyof ComponentForm, value: any) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validComponents = components.filter(c => c.raw_material_id && c.quantity_per_assembly > 0);
    const componentsData = validComponents.map(c => ({
      raw_material_id: c.raw_material_id,
      quantity_per_assembly: c.quantity_per_assembly,
      is_optional: c.is_optional,
      notes: c.notes || undefined
    }));
    
    if (editingAssembly) {
      await updateAssembly.mutateAsync({
        id: editingAssembly.id,
        name,
        sku,
        description: description || undefined,
        packaging_level: packagingLevel,
        components: componentsData
      });
    } else {
      await createAssembly.mutateAsync({
        name,
        sku,
        description: description || undefined,
        packaging_level: packagingLevel,
        components: componentsData
      });
    }
    
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setSku('');
    setDescription('');
    setPackagingLevel('primary');
    setComponents([]);
  };

  // Calculate total cost preview
  const totalCost = useMemo(() => {
    return components.reduce((sum, comp) => {
      const material = packagingMaterials.find(m => m.id === comp.raw_material_id);
      return sum + (comp.quantity_per_assembly * (material?.cost_per_unit || 0));
    }, 0);
  }, [components, packagingMaterials]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {editingAssembly ? 'অ্যাসেম্বলি এডিট করুন' : 'নতুন প্যাকেজিং অ্যাসেম্বলি'}
          </DialogTitle>
          <DialogDescription>
            একটি কমপ্লিট প্যাকেজিং আইটেম তৈরি করুন যেমন "100ml Syrup Bottle Complete" 
            যার মধ্যে বোতল, ক্যাপ, সিল, লেবেল ইত্যাদি থাকবে।
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>নাম *</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="100ml Syrup Bottle Complete"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input 
                value={sku} 
                onChange={(e) => setSku(e.target.value)} 
                placeholder="PKG-SYR-100ML"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>প্যাকেজিং লেভেল</Label>
            <Select value={packagingLevel} onValueChange={setPackagingLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PACKAGING_LEVELS.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>বিবরণ</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="এই অ্যাসেম্বলির বিবরণ..."
            />
          </div>

          {/* Components Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">কম্পোনেন্টস (উপাদান)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                <Plus className="h-3 w-3 mr-1" /> উপাদান যোগ
              </Button>
            </div>

            {components.length === 0 ? (
              <div className="p-4 border rounded-lg border-dashed text-center text-muted-foreground">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>কোন উপাদান যোগ করা হয়নি</p>
                <p className="text-xs">উপরের বাটনে ক্লিক করে বোতল, ক্যাপ, সিল ইত্যাদি যোগ করুন</p>
              </div>
            ) : (
              <div className="space-y-2">
                {components.map((comp, index) => (
                  <div key={index} className="flex gap-2 items-end p-3 border rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <Label className="text-xs">ম্যাটেরিয়াল</Label>
                      <Select 
                        value={comp.raw_material_id} 
                        onValueChange={(v) => updateComponent(index, 'raw_material_id', v)}
                      >
                        <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                        <SelectContent>
                          {packagingMaterials.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} ({m.unit}) - ৳{m.cost_per_unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">পরিমাণ</Label>
                      <Input 
                        type="number" 
                        min="0.001" 
                        step="0.001"
                        value={comp.quantity_per_assembly}
                        onChange={(e) => updateComponent(index, 'quantity_per_assembly', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <Label className="text-xs">ঐচ্ছিক?</Label>
                        <Switch 
                          checked={comp.is_optional}
                          onCheckedChange={(v) => updateComponent(index, 'is_optional', v)}
                        />
                      </div>
                    </div>
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeComponent(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cost Preview */}
          {components.length > 0 && (
            <Card className="bg-primary/5">
              <CardContent className="py-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">প্রতি অ্যাসেম্বলি মোট খরচ:</span>
                  <span className="text-lg font-bold">৳{totalCost.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              বাতিল
            </Button>
            <Button 
              type="submit" 
              disabled={createAssembly.isPending || updateAssembly.isPending || !name || !sku || components.length === 0}
            >
              {editingAssembly ? 'আপডেট করুন' : 'তৈরি করুন'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssemblyDetailsDialog({ assembly }: { assembly: PackagingAssembly }) {
  const totalCost = calculateAssemblyCost(assembly);

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {assembly.name}
        </DialogTitle>
        <DialogDescription>SKU: {assembly.sku}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Badge>{PACKAGING_LEVELS.find(l => l.value === assembly.packaging_level)?.label}</Badge>
          <Badge variant="outline">৳{totalCost.toFixed(2)}/unit</Badge>
        </div>

        {assembly.description && (
          <p className="text-sm text-muted-foreground">{assembly.description}</p>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">কম্পোনেন্টস ({assembly.components?.length || 0})</Label>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>উপাদান</TableHead>
                <TableHead className="text-right">পরিমাণ</TableHead>
                <TableHead className="text-right">খরচ</TableHead>
                <TableHead>ঐচ্ছিক</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assembly.components?.map((comp) => (
                <TableRow key={comp.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{comp.raw_material?.name}</p>
                      <p className="text-xs text-muted-foreground">{comp.raw_material?.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {comp.quantity_per_assembly} {comp.raw_material?.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    ৳{(comp.quantity_per_assembly * (comp.raw_material?.cost_per_unit || 0)).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {comp.is_optional ? <Badge variant="outline">ঐচ্ছিক</Badge> : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DialogContent>
  );
}

export default function PackagingAssembliesPage() {
  const { data: assemblies, isLoading } = usePackagingAssemblies();
  const deleteAssembly = useDeletePackagingAssembly();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState<PackagingAssembly | null>(null);
  const [viewingAssembly, setViewingAssembly] = useState<PackagingAssembly | null>(null);

  const filteredAssemblies = useMemo(() => {
    if (!assemblies) return [];
    if (!searchQuery.trim()) return assemblies;
    const search = searchQuery.toLowerCase();
    return assemblies.filter(a => 
      a.name.toLowerCase().includes(search) || 
      a.sku.toLowerCase().includes(search)
    );
  }, [assemblies, searchQuery]);

  const handleEdit = (assembly: PackagingAssembly) => {
    setEditingAssembly(assembly);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি নিশ্চিত এই অ্যাসেম্বলি মুছে ফেলতে চান?')) {
      await deleteAssembly.mutateAsync(id);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8" />
              প্যাকেজিং অ্যাসেম্বলি
            </h1>
            <p className="text-muted-foreground">
              কম্পোজিট প্যাকেজিং আইটেম যেমন Complete Bottle (বোতল + ক্যাপ + সিল + লেবেল)
            </p>
          </div>
          <Button onClick={() => { setEditingAssembly(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            নতুন অ্যাসেম্বলি
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="অ্যাসেম্বলি খুঁজুন..."
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">লোড হচ্ছে...</div>
            ) : filteredAssemblies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>কোন প্যাকেজিং অ্যাসেম্বলি নেই</p>
                <p className="text-sm">উপরের বাটনে ক্লিক করে নতুন অ্যাসেম্বলি তৈরি করুন</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>নাম</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>লেভেল</TableHead>
                    <TableHead className="text-center">উপাদান</TableHead>
                    <TableHead className="text-right">খরচ/ইউনিট</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssemblies.map((assembly) => {
                    const totalCost = calculateAssemblyCost(assembly);
                    return (
                      <TableRow key={assembly.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{assembly.name}</p>
                            {assembly.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{assembly.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{assembly.sku}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {PACKAGING_LEVELS.find(l => l.value === assembly.packaging_level)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{assembly.components?.length || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">৳{totalCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => setViewingAssembly(assembly)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <AssemblyDetailsDialog assembly={assembly} />
                            </Dialog>
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(assembly)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleDelete(assembly.id)}
                              disabled={deleteAssembly.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      </div>

      <AssemblyFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen}
        editingAssembly={editingAssembly}
      />
    </MainLayout>
  );
}
