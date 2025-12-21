import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useStockSummary, useNearExpiryProducts, useMRPCheck, useBatchTraceability } from '@/hooks/useReports';
import { useProducts } from '@/hooks/useProducts';
import { useProductionBatches } from '@/hooks/useProduction';
import { FileText, Package, AlertTriangle, Calculator, Search, ClipboardList, CheckCircle, XCircle } from 'lucide-react';

function StockStatusBadge({ status }: { status: string }) {
  if (status === 'Out of Stock') return <Badge variant="destructive">Out of Stock</Badge>;
  if (status === 'Low') return <Badge className="bg-yellow-500">Low</Badge>;
  return <Badge className="bg-primary">OK</Badge>;
}

function StockSummaryReport() {
  const { data: stockSummary, isLoading } = useStockSummary();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredData = stockSummary?.filter(item => {
    const matchesFilter = filter === 'all' || 
      (filter === 'raw' && item.item_type === 'Raw Material') ||
      (filter === 'finished' && item.item_type === 'Finished Goods') ||
      (filter === 'low' && (item.stock_status === 'Low' || item.stock_status === 'Out of Stock'));
    const matchesSearch = item.item_name.toLowerCase().includes(search.toLowerCase()) ||
      item.item_sku.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatCurrency = (value: number) => `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="raw">Raw Materials</SelectItem>
            <SelectItem value="finished">Finished Goods</SelectItem>
            <SelectItem value="low">Low/Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData?.map((item) => (
              <TableRow key={item.item_id}>
                <TableCell className="font-medium">{item.item_name}</TableCell>
                <TableCell>{item.item_sku}</TableCell>
                <TableCell>
                  <Badge variant="outline">{item.item_type}</Badge>
                </TableCell>
                <TableCell className="capitalize">{item.category}</TableCell>
                <TableCell className="text-right">{item.current_stock.toFixed(2)}</TableCell>
                <TableCell className="text-right">{item.reserved_stock.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">{item.available_stock.toFixed(2)}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell><StockStatusBadge status={item.stock_status} /></TableCell>
                <TableCell className="text-right">{formatCurrency(item.stock_value)}</TableCell>
              </TableRow>
            ))}
            {(!filteredData || filteredData.length === 0) && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredData && filteredData.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total Value: <span className="font-bold text-foreground">
              {formatCurrency(filteredData.reduce((sum, item) => sum + item.stock_value, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function NearExpiryReport() {
  const [days, setDays] = useState(90);
  const { data: nearExpiry, isLoading } = useNearExpiryProducts(days);

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Expiry window" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Next 30 days</SelectItem>
            <SelectItem value="60">Next 60 days</SelectItem>
            <SelectItem value="90">Next 90 days</SelectItem>
            <SelectItem value="180">Next 6 months</SelectItem>
            <SelectItem value="365">Next 1 year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Quantity Available</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Days Until Expiry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nearExpiry?.map((item) => (
              <TableRow key={item.batch_id}>
                <TableCell className="font-medium">{item.batch_number}</TableCell>
                <TableCell>{item.product_name}</TableCell>
                <TableCell>{item.product_sku}</TableCell>
                <TableCell className="text-right">{item.quantity_available}</TableCell>
                <TableCell>{new Date(item.expiry_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={item.days_until_expiry <= 30 ? 'destructive' : item.days_until_expiry <= 60 ? 'secondary' : 'outline'}>
                    {item.days_until_expiry} days
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {(!nearExpiry || nearExpiry.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No products expiring within {days} days
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MRPPlanner() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const { data: products } = useProducts();
  const { data: mrpResult, isLoading } = useMRPCheck(selectedProduct, quantity);

  const activeProducts = products?.filter(p => p.is_active);
  const allSufficient = mrpResult?.every(r => r.is_sufficient);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {activeProducts?.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input 
          type="number"
          placeholder="Quantity to produce"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-48"
        />
        <Button variant="outline" disabled={!selectedProduct}>
          <Calculator className="h-4 w-4 mr-2" />
          Calculate Requirements
        </Button>
      </div>

      {selectedProduct && mrpResult && (
        <>
          <Card className={allSufficient ? 'border-primary/50 bg-primary/5' : 'border-destructive/50 bg-destructive/5'}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                {allSufficient ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium">Production Possible - All materials are sufficient</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="font-medium text-destructive">Production Blocked - Insufficient materials</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Required Qty</TableHead>
                  <TableHead className="text-right">Available Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Shortage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mrpResult.map((item) => (
                  <TableRow key={item.raw_material_id}>
                    <TableCell className="font-medium">{item.material_name}</TableCell>
                    <TableCell>{item.material_sku}</TableCell>
                    <TableCell className="text-right">{item.required_quantity.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{item.available_quantity.toFixed(3)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      {item.is_sufficient ? (
                        <Badge className="bg-primary">Sufficient</Badge>
                      ) : (
                        <Badge variant="destructive">Insufficient</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!item.is_sufficient && (
                        <span className="text-destructive font-medium">
                          {(item.required_quantity - item.available_quantity).toFixed(3)} {item.unit}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {isLoading && (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      )}

      {!selectedProduct && (
        <div className="text-center py-8 text-muted-foreground">
          Select a product and quantity to calculate material requirements
        </div>
      )}
    </div>
  );
}

function BatchTraceabilityReport() {
  const [selectedBatch, setSelectedBatch] = useState('');
  const { data: batches } = useProductionBatches();
  const { data: traceability, isLoading } = useBatchTraceability(selectedBatch);

  const completedBatches = batches?.filter(b => b.status === 'completed');
  const batchInfo = traceability?.[0];

  return (
    <div className="space-y-4">
      <Select value={selectedBatch} onValueChange={setSelectedBatch}>
        <SelectTrigger className="w-80">
          <SelectValue placeholder="Select production batch" />
        </SelectTrigger>
        <SelectContent>
          {completedBatches?.map((batch) => (
            <SelectItem key={batch.id} value={batch.id}>
              {batch.batch_number} - {batch.product?.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedBatch && traceability && batchInfo && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Batch Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Batch Number</p>
                  <p className="font-medium">{batchInfo.production_batch_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{batchInfo.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity Produced</p>
                  <p className="font-medium">{batchInfo.quantity_produced}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Manufacturing Date</p>
                  <p className="font-medium">{batchInfo.manufacturing_date ? new Date(batchInfo.manufacturing_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">{batchInfo.expiry_date ? new Date(batchInfo.expiry_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warehouse</p>
                  <p className="font-medium">{batchInfo.warehouse || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rack</p>
                  <p className="font-medium">{batchInfo.rack || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shelf</p>
                  <p className="font-medium">{batchInfo.shelf || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw Materials Used</CardTitle>
            </CardHeader>
            <CardContent>
              {traceability.some(t => t.raw_material_name) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Batch Number</TableHead>
                      <TableHead className="text-right">Quantity Used</TableHead>
                      <TableHead className="text-right">Wastage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {traceability.filter(t => t.raw_material_name).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.raw_material_name}</TableCell>
                        <TableCell>{item.raw_material_batch_number || 'N/A'}</TableCell>
                        <TableCell className="text-right">{item.quantity_used?.toFixed(3) || 0}</TableCell>
                        <TableCell className="text-right">{item.wastage_quantity?.toFixed(3) || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  No material usage recorded for this batch
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      )}

      {!selectedBatch && (
        <div className="text-center py-8 text-muted-foreground">
          Select a production batch to view traceability
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Stock summary, expiry tracking, MRP planning, and batch traceability</p>
        </div>

        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Stock Summary
            </TabsTrigger>
            <TabsTrigger value="expiry" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Near Expiry
            </TabsTrigger>
            <TabsTrigger value="mrp" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              MRP Planner
            </TabsTrigger>
            <TabsTrigger value="traceability" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Batch Traceability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Stock Summary Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StockSummaryReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expiry">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Near Expiry Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NearExpiryReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mrp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Material Requirement Planning (MRP)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MRPPlanner />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traceability">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Batch Traceability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BatchTraceabilityReport />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
