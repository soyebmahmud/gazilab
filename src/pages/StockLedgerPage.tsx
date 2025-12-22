import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModuleManual, STOCK_LEDGER_MANUAL } from '@/components/ModuleManual';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useMaterialStockLedger, useProductStockLedger } from '@/hooks/useStockLedger';
import { format } from 'date-fns';

const movementColors: Record<string, string> = {
  opening: 'bg-primary',
  production_in: 'bg-chart-2',
  production_out: 'bg-chart-1',
  adjustment_in: 'bg-chart-3',
  adjustment_out: 'bg-chart-4',
  sale: 'bg-destructive',
  purchase: 'bg-primary',
  wastage: 'bg-destructive'
};

export default function StockLedgerPage() {
  const { data: materialLedger, isLoading: materialLoading } = useMaterialStockLedger();
  const { data: productLedger, isLoading: productLoading } = useProductStockLedger();

  return (
    <MainLayout>
      <div className="space-y-6">
        <ModuleManual {...STOCK_LEDGER_MANUAL} />
        <div>
          <h1 className="text-3xl font-bold">Stock Ledger</h1>
          <p className="text-muted-foreground">Complete stock movement history</p>
        </div>

        <Tabs defaultValue="materials">
          <TabsList>
            <TabsTrigger value="materials">Raw Materials</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="materials">
            <Card>
              <CardContent className="p-0">
                {materialLoading ? (
                  <div className="p-8 text-center">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialLedger?.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell>{format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>{entry.raw_material?.name}</TableCell>
                          <TableCell><Badge className={movementColors[entry.movement_type]}>{entry.movement_type}</Badge></TableCell>
                          <TableCell className={entry.movement_type.includes('out') || entry.movement_type === 'wastage' ? 'text-destructive' : 'text-primary'}>
                            {entry.movement_type.includes('out') || entry.movement_type === 'wastage' ? '-' : '+'}{entry.quantity}
                          </TableCell>
                          <TableCell>{entry.balance_after}</TableCell>
                          <TableCell className="text-muted-foreground">{entry.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardContent className="p-0">
                {productLoading ? (
                  <div className="p-8 text-center">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productLedger?.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell>{format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>{entry.product?.name}</TableCell>
                          <TableCell><Badge className={movementColors[entry.movement_type]}>{entry.movement_type}</Badge></TableCell>
                          <TableCell className={entry.movement_type.includes('out') || entry.movement_type === 'sale' ? 'text-destructive' : 'text-primary'}>
                            {entry.movement_type.includes('out') || entry.movement_type === 'sale' ? '-' : '+'}{entry.quantity}
                          </TableCell>
                          <TableCell>{entry.balance_after}</TableCell>
                          <TableCell className="text-muted-foreground">{entry.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
