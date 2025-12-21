import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useDamagedGoods, usePendingDamagedGoods, useRestoreDamagedGoods, useDestroyDamagedGoods, DAMAGE_TYPES } from '@/hooks/useDamagedGoods';
import { format } from 'date-fns';
import { RotateCcw, Trash2, Package, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DamagedGoodsPage() {
  const { data: allDamagedGoods, isLoading: allLoading } = useDamagedGoods();
  const { data: pendingGoods, isLoading: pendingLoading } = usePendingDamagedGoods();
  const restoreMutation = useRestoreDamagedGoods();
  const destroyMutation = useDestroyDamagedGoods();
  const [destroyNotes, setDestroyNotes] = useState('');

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
        <div>
          <h1 className="text-3xl font-bold">Damaged Goods Management</h1>
          <p className="text-muted-foreground">Review and process damaged, expired, or returned items</p>
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
