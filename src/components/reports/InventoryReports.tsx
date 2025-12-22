import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useStockSummary, useNearExpiryProducts, useMRPCheck, useBatchTraceability } from '@/hooks/useReports';
import { useProducts } from '@/hooks/useProducts';
import { useProductionBatches } from '@/hooks/useProduction';
import { Search, Package, Calculator, CheckCircle, XCircle, AlertTriangle, ClipboardList } from 'lucide-react';

function StockStatusBadge({ status }: { status: string }) {
  if (status === 'Out of Stock') return <Badge variant="destructive">Out of Stock</Badge>;
  if (status === 'Low') return <Badge className="bg-yellow-500 text-white">Low Stock</Badge>;
  return <Badge className="bg-primary">OK</Badge>;
}

const formatCurrency = (value: number) => `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

export function StockSummaryReport() {
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

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          স্টক সারাংশ / Stock Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="নাম বা SKU দিয়ে সার্চ করুন..." 
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
              <SelectItem value="all">সব আইটেম</SelectItem>
              <SelectItem value="raw">কাঁচামাল</SelectItem>
              <SelectItem value="finished">তৈরি পণ্য</SelectItem>
              <SelectItem value="low">কম/শেষ স্টক</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>আইটেম</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>ধরন</TableHead>
                <TableHead className="text-right">বর্তমান স্টক</TableHead>
                <TableHead className="text-right">সংরক্ষিত</TableHead>
                <TableHead className="text-right">উপলব্ধ</TableHead>
                <TableHead>ইউনিট</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead className="text-right">মূল্য</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData?.map((item) => (
                <TableRow key={item.item_id} className={item.stock_status === 'Out of Stock' ? 'bg-destructive/10' : item.stock_status === 'Low' ? 'bg-yellow-500/10' : ''}>
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell>{item.item_sku}</TableCell>
                  <TableCell><Badge variant="outline">{item.item_type}</Badge></TableCell>
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
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    কোন আইটেম পাওয়া যায়নি
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredData && filteredData.length > 0 && (
          <div className="flex justify-end">
            <div className="text-sm text-muted-foreground">
              মোট মূল্য: <span className="font-bold text-foreground">
                {formatCurrency(filteredData.reduce((sum, item) => sum + item.stock_value, 0))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function NearExpiryReport() {
  const [days, setDays] = useState(90);
  const { data: nearExpiry, isLoading } = useNearExpiryProducts(days);

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          মেয়াদ উত্তীর্ণ হতে যাচ্ছে / Near Expiry Products
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="সময়সীমা" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">৩০ দিন</SelectItem>
              <SelectItem value="60">৬০ দিন</SelectItem>
              <SelectItem value="90">৯০ দিন</SelectItem>
              <SelectItem value="180">৬ মাস</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ব্যাচ নম্বর</TableHead>
                <TableHead>পণ্য</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">পরিমাণ</TableHead>
                <TableHead>মেয়াদ শেষ</TableHead>
                <TableHead>বাকি দিন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nearExpiry?.map((item) => (
                <TableRow key={item.batch_id} className={item.days_until_expiry <= 30 ? 'bg-destructive/10' : item.days_until_expiry <= 60 ? 'bg-yellow-500/10' : ''}>
                  <TableCell className="font-medium">{item.batch_number}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.product_sku}</TableCell>
                  <TableCell className="text-right">{item.quantity_available}</TableCell>
                  <TableCell>{new Date(item.expiry_date).toLocaleDateString('bn-BD')}</TableCell>
                  <TableCell>
                    <Badge variant={item.days_until_expiry <= 30 ? 'destructive' : item.days_until_expiry <= 60 ? 'secondary' : 'outline'}>
                      {item.days_until_expiry} দিন
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!nearExpiry || nearExpiry.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {days} দিনের মধ্যে কোন পণ্যের মেয়াদ শেষ হচ্ছে না
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function MRPPlanner() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const { data: products } = useProducts();
  const { data: mrpResult, isLoading } = useMRPCheck(selectedProduct, quantity);

  const activeProducts = products?.filter(p => p.is_active);
  const allSufficient = mrpResult?.every(r => r.is_sufficient);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          MRP প্ল্যানার / Material Requirement Planning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center flex-wrap">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="পণ্য নির্বাচন করুন" />
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
            placeholder="উৎপাদন পরিমাণ"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-48"
          />
        </div>

        {selectedProduct && mrpResult && (
          <>
            <Card className={allSufficient ? 'border-primary/50 bg-primary/5' : 'border-destructive/50 bg-destructive/5'}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  {allSufficient ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="font-medium">উৎপাদন সম্ভব - সব কাঁচামাল পর্যাপ্ত আছে</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="font-medium text-destructive">উৎপাদন সম্ভব নয় - কাঁচামাল কম আছে</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>কাঁচামাল</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">প্রয়োজন</TableHead>
                    <TableHead className="text-right">উপলব্ধ</TableHead>
                    <TableHead>ইউনিট</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead className="text-right">ঘাটতি</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrpResult.map((item) => (
                    <TableRow key={item.raw_material_id} className={!item.is_sufficient ? 'bg-destructive/10' : ''}>
                      <TableCell className="font-medium">{item.material_name}</TableCell>
                      <TableCell>{item.material_sku}</TableCell>
                      <TableCell className="text-right">{item.required_quantity.toFixed(3)}</TableCell>
                      <TableCell className="text-right">{item.available_quantity.toFixed(3)}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        {item.is_sufficient ? (
                          <Badge className="bg-primary">পর্যাপ্ত</Badge>
                        ) : (
                          <Badge variant="destructive">অপর্যাপ্ত</Badge>
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
            কাঁচামাল প্রয়োজনীয়তা দেখতে পণ্য এবং পরিমাণ নির্বাচন করুন
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BatchTraceabilityReport() {
  const [selectedBatch, setSelectedBatch] = useState('');
  const { data: batches } = useProductionBatches();
  const { data: traceability, isLoading } = useBatchTraceability(selectedBatch);

  const completedBatches = batches?.filter(b => b.status === 'completed');
  const batchInfo = traceability?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          ব্যাচ ট্রেসেবিলিটি / Batch Traceability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-80">
            <SelectValue placeholder="প্রোডাকশন ব্যাচ নির্বাচন করুন" />
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
                <CardTitle className="text-lg">ব্যাচ তথ্য</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ব্যাচ নম্বর</p>
                    <p className="font-medium">{batchInfo.production_batch_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">পণ্য</p>
                    <p className="font-medium">{batchInfo.product_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">উৎপাদিত পরিমাণ</p>
                    <p className="font-medium">{batchInfo.quantity_produced}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">উৎপাদন তারিখ</p>
                    <p className="font-medium">{batchInfo.manufacturing_date ? new Date(batchInfo.manufacturing_date).toLocaleDateString('bn-BD') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">মেয়াদ শেষ</p>
                    <p className="font-medium">{batchInfo.expiry_date ? new Date(batchInfo.expiry_date).toLocaleDateString('bn-BD') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">গুদাম</p>
                    <p className="font-medium">{batchInfo.warehouse || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">র‌্যাক</p>
                    <p className="font-medium">{batchInfo.rack || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">শেলফ</p>
                    <p className="font-medium">{batchInfo.shelf || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ব্যবহৃত কাঁচামাল</CardTitle>
              </CardHeader>
              <CardContent>
                {traceability.some(t => t.raw_material_name) ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>কাঁচামাল</TableHead>
                        <TableHead>ব্যাচ নম্বর</TableHead>
                        <TableHead className="text-right">ব্যবহৃত পরিমাণ</TableHead>
                        <TableHead className="text-right">অপচয়</TableHead>
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
                    এই ব্যাচের জন্য কোন কাঁচামাল ব্যবহারের রেকর্ড নেই
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
            ট্রেসেবিলিটি দেখতে একটি প্রোডাকশন ব্যাচ নির্বাচন করুন
          </div>
        )}
      </CardContent>
    </Card>
  );
}
