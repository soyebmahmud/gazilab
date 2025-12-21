import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDamagedGoods, usePendingDamagedGoods, useRestoreDamagedGoods, useDestroyDamagedGoods, useRecordProductDamage, DAMAGE_TYPES } from '@/hooks/useDamagedGoods';
import { useProducts } from '@/hooks/useProducts';
import { useProductBatches } from '@/hooks/useSales';
import { format } from 'date-fns';
import { RotateCcw, Trash2, Package, AlertTriangle, CheckCircle, Plus, Download } from 'lucide-react';

function RecordDamageDialog({ onClose }: { onClose: () => void }) {
  const { data: products } = useProducts();
  const recordDamage = useRecordProductDamage();
  
  const [productId, setProductId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [damageType, setDamageType] = useState('handling');
  const [notes, setNotes] = useState('');
  
  const { data: batches } = useProductBatches(productId);
  const selectedProduct = products?.find(p => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) return;
    
    await recordDamage.mutateAsync({
      product_id: productId,
      production_batch_id: batchId || undefined,
      quantity,
      damage_type: damageType,
      notes: notes || undefined
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Product *</Label>
        <Select value={productId} onValueChange={(v) => { setProductId(v); setBatchId(''); }}>
          <SelectTrigger>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products?.filter(p => p.current_stock > 0).map(p => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center gap-2">
                  <span>{p.name}</span>
                  <Badge variant="outline" className="text-xs">{p.current_stock} in stock</Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {productId && batches && batches.length > 0 && (
        <div className="space-y-2">
          <Label>Batch (Optional)</Label>
          <Select value={batchId} onValueChange={setBatchId}>
            <SelectTrigger>
              <SelectValue placeholder="Select batch (optional)" />
            </SelectTrigger>
            <SelectContent>
              {batches.map(batch => (
                <SelectItem key={batch.batch_id} value={batch.batch_id}>
                  <div className="flex items-center gap-2">
                    <span>{batch.batch_number}</span>
                    <Badge variant="outline" className="text-xs">{batch.quantity_available} avail</Badge>
                    {batch.expiry_date && (
                      <span className="text-xs text-muted-foreground">
                        Exp: {format(new Date(batch.expiry_date), 'dd/MM/yy')}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantity *</Label>
          <Input
            type="number"
            min="1"
            max={selectedProduct?.current_stock || 1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
          {selectedProduct && (
            <p className="text-xs text-muted-foreground">Max: {selectedProduct.current_stock}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Damage Type *</Label>
          <Select value={damageType} onValueChange={setDamageType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAMAGE_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about the damage"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!productId || quantity <= 0 || recordDamage.isPending}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Record Damage
        </Button>
      </div>
    </form>
  );
}

export default function DamagedGoodsPage() {
  const { data: allDamagedGoods, isLoading: allLoading } = useDamagedGoods();
  const { data: pendingGoods, isLoading: pendingLoading } = usePendingDamagedGoods();
  const restoreMutation = useRestoreDamagedGoods();
  const destroyMutation = useDestroyDamagedGoods();
  const [destroyNotes, setDestroyNotes] = useState('');
  const [showRecordDialog, setShowRecordDialog] = useState(false);

  const getDamageTypeLabel = (type: string) => {
    return DAMAGE_TYPES.find(t => t.value === type)?.label || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'restored':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Restored</Badge>;
      case 'destroyed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Destroyed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = pendingGoods?.length || 0;
  const restoredCount = allDamagedGoods?.filter(g => g.status === 'restored').length || 0;
  const destroyedCount = allDamagedGoods?.filter(g => g.status === 'destroyed').length || 0;

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id);
  };

  const handleDestroy = (id: string) => {
    destroyMutation.mutate({ id, notes: destroyNotes });
    setDestroyNotes('');
  };

  const exportToCSV = () => {
    if (!allDamagedGoods || allDamagedGoods.length === 0) return;
    
    const headers = ['Product', 'SKU', 'Quantity', 'Damage Type', 'Status', 'Date', 'Notes'];
    const rows = allDamagedGoods.map(item => [
      item.product?.name || 'Unknown',
      item.product?.sku || '',
      item.quantity.toString(),
      getDamageTypeLabel(item.damage_type),
      item.status,
      format(new Date(item.created_at), 'yyyy-MM-dd'),
      item.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `damaged-goods-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const renderTable = (items: typeof allDamagedGoods, showActions: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Damage Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Notes</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items?.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.product?.name || 'Unknown'}</TableCell>
            <TableCell>{item.product?.sku || '-'}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{getDamageTypeLabel(item.damage_type)}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>{format(new Date(item.created_at), 'dd MMM yyyy')}</TableCell>
            <TableCell className="max-w-[200px] truncate">{item.notes || '-'}</TableCell>
            {showActions && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(item.id)}
                    disabled={restoreMutation.isPending}
                    className="text-green-600 hover:text-green-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={destroyMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Destroy
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Destruction</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently mark {item.quantity} units of "{item.product?.name}" as destroyed.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Textarea
                          placeholder="Reason for destruction (optional)"
                          value={destroyNotes}
                          onChange={(e) => setDestroyNotes(e.target.value)}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDestroyNotes('')}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDestroy(item.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Confirm Destroy
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
        {(!items || items.length === 0) && (
          <TableRow>
            <TableCell colSpan={showActions ? 8 : 7} className="text-center py-8 text-muted-foreground">
              No damaged goods found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Damaged Goods Management</h1>
            <p className="text-muted-foreground">Review and process damaged, expired, or returned items</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} disabled={!allDamagedGoods?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Damage
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Damaged Goods</DialogTitle>
                </DialogHeader>
                <RecordDamageDialog onClose={() => setShowRecordDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Items awaiting decision</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Restored</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restoredCount}</div>
              <p className="text-xs text-muted-foreground">Returned to sellable stock</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Destroyed</CardTitle>
              <Package className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{destroyedCount}</div>
              <p className="text-xs text-muted-foreground">Permanently removed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="all">All Records</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Damaged Goods</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : (
                  renderTable(pendingGoods, true)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Damaged Goods History</CardTitle>
              </CardHeader>
              <CardContent>
                {allLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : (
                  renderTable(allDamagedGoods, false)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
