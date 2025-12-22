import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useItemWiseSalesReport, useItemWisePurchaseReport, useStockMovementReport } from '@/hooks/useFinancialReports';
import { Package, ShoppingCart, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

const formatCurrency = (value: number) => `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

function DateRangeFilter({ 
  dateFrom, 
  dateTo, 
  onDateFromChange, 
  onDateToChange,
  onQuickSelect 
}: {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onQuickSelect: (from: string, to: string) => void;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const lastWeek = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const lastMonth = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Input 
        type="date" 
        value={dateFrom} 
        onChange={(e) => onDateFromChange(e.target.value)}
        className="w-40"
      />
      <span className="text-muted-foreground">থেকে</span>
      <Input 
        type="date" 
        value={dateTo} 
        onChange={(e) => onDateToChange(e.target.value)}
        className="w-40"
      />
      <div className="flex gap-1 ml-2">
        <Button size="sm" variant="outline" onClick={() => onQuickSelect(today, today)}>আজ</Button>
        <Button size="sm" variant="outline" onClick={() => onQuickSelect(lastWeek, today)}>৭ দিন</Button>
        <Button size="sm" variant="outline" onClick={() => onQuickSelect(monthStart, monthEnd)}>এই মাস</Button>
        <Button size="sm" variant="outline" onClick={() => onQuickSelect(lastMonth, today)}>৩০ দিন</Button>
      </div>
    </div>
  );
}

export function ItemWiseSalesReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const { data: items, isLoading } = useItemWiseSalesReport(dateFrom, dateTo);

  const totals = items?.reduce((acc, item) => ({
    quantity: acc.quantity + item.quantity_sold,
    revenue: acc.revenue + item.total_revenue,
  }), { quantity: 0, revenue: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          আইটেম অনুযায়ী বিক্রয় / Item-wise Sales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DateRangeFilter 
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onQuickSelect={(from, to) => { setDateFrom(from); setDateTo(to); }}
        />

        {/* Summary */}
        {totals && items && items.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">মোট আইটেম</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">মোট বিক্রিত পরিমাণ</p>
                <p className="text-2xl font-bold">{totals.quantity}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/10">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">মোট বিক্রয়</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totals.revenue)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>পণ্য</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>ক্যাটাগরি</TableHead>
                  <TableHead className="text-right">বিক্রিত পরিমাণ</TableHead>
                  <TableHead className="text-right">গড় মূল্য</TableHead>
                  <TableHead className="text-right">মোট বিক্রয়</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{item.product_sku}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{item.category}</Badge></TableCell>
                    <TableCell className="text-right">{item.quantity_sold}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.avg_price)}</TableCell>
                    <TableCell className="text-right font-medium text-primary">{formatCurrency(item.total_revenue)}</TableCell>
                  </TableRow>
                ))}
                {(!items || items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      নির্বাচিত সময়ে কোন বিক্রয় নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ItemWisePurchaseReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const { data: items, isLoading } = useItemWisePurchaseReport(dateFrom, dateTo);

  const totals = items?.reduce((acc, item) => ({
    ordered: acc.ordered + item.quantity_ordered,
    received: acc.received + item.quantity_received,
    cost: acc.cost + item.total_cost,
  }), { ordered: 0, received: 0, cost: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          আইটেম অনুযায়ী ক্রয় / Item-wise Purchase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DateRangeFilter 
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onQuickSelect={(from, to) => { setDateFrom(from); setDateTo(to); }}
        />

        {/* Summary */}
        {totals && items && items.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">মোট আইটেম</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">অর্ডারকৃত</p>
                <p className="text-2xl font-bold">{totals.ordered}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">প্রাপ্ত</p>
                <p className="text-2xl font-bold">{totals.received}</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/10">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">মোট খরচ</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totals.cost)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>কাঁচামাল</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>ক্যাটাগরি</TableHead>
                  <TableHead className="text-right">অর্ডারকৃত</TableHead>
                  <TableHead className="text-right">প্রাপ্ত</TableHead>
                  <TableHead className="text-right">গড় মূল্য</TableHead>
                  <TableHead className="text-right">মোট খরচ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.material_id}>
                    <TableCell className="font-medium">{item.material_name}</TableCell>
                    <TableCell>{item.material_sku}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{item.category}</Badge></TableCell>
                    <TableCell className="text-right">{item.quantity_ordered}</TableCell>
                    <TableCell className="text-right">{item.quantity_received}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.avg_price)}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">{formatCurrency(item.total_cost)}</TableCell>
                  </TableRow>
                ))}
                {(!items || items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      নির্বাচিত সময়ে কোন ক্রয় নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const movementTypeLabels: Record<string, string> = {
  'opening': 'প্রারম্ভিক',
  'production_in': 'উৎপাদন থেকে',
  'production_out': 'উৎপাদনে ব্যবহার',
  'adjustment_in': 'সমন্বয় (যোগ)',
  'adjustment_out': 'সমন্বয় (বিয়োগ)',
  'sale': 'বিক্রয়',
  'purchase': 'ক্রয়',
  'wastage': 'অপচয়',
  'sale_return': 'বিক্রয় ফেরত',
  'damage_out': 'ক্ষতি',
  'expired_out': 'মেয়াদ উত্তীর্ণ',
};

export function StockMovementReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [itemType, setItemType] = useState<'material' | 'product'>('product');
  
  const { data: movements, isLoading } = useStockMovementReport(dateFrom, dateTo, itemType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5" />
          স্টক মুভমেন্ট / Stock Movement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <DateRangeFilter 
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onQuickSelect={(from, to) => { setDateFrom(from); setDateTo(to); }}
          />
        </div>

        <Tabs value={itemType} onValueChange={(v) => setItemType(v as 'material' | 'product')}>
          <TabsList>
            <TabsTrigger value="product">তৈরি পণ্য</TabsTrigger>
            <TabsTrigger value="material">কাঁচামাল</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>আইটেম</TableHead>
                  <TableHead>ধরন</TableHead>
                  <TableHead className="text-right">পরিমাণ</TableHead>
                  <TableHead className="text-right">ব্যালেন্স</TableHead>
                  <TableHead>নোট</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements?.map((movement: any) => {
                  const isInward = ['opening', 'production_in', 'adjustment_in', 'purchase', 'sale_return'].includes(movement.movement_type);
                  const itemName = itemType === 'product' ? movement.product?.name : movement.raw_material?.name;
                  
                  return (
                    <TableRow key={movement.id}>
                      <TableCell>{new Date(movement.created_at).toLocaleDateString('bn-BD')}</TableCell>
                      <TableCell className="font-medium">{itemName || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={isInward ? 'default' : 'destructive'} className="flex items-center gap-1 w-fit">
                          {isInward ? <ArrowDownToLine className="h-3 w-3" /> : <ArrowUpFromLine className="h-3 w-3" />}
                          {movementTypeLabels[movement.movement_type] || movement.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${isInward ? 'text-primary' : 'text-destructive'}`}>
                        {isInward ? '+' : '-'}{movement.quantity}
                      </TableCell>
                      <TableCell className="text-right">{movement.balance_after}</TableCell>
                      <TableCell className="text-muted-foreground">{movement.notes || '-'}</TableCell>
                    </TableRow>
                  );
                })}
                {(!movements || movements.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      নির্বাচিত সময়ে কোন স্টক মুভমেন্ট নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
