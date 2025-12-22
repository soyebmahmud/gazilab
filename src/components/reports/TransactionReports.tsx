import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSalesReport, usePurchaseReport, useDailySales } from '@/hooks/useFinancialReports';
import { ShoppingCart, FileText, Calendar, Download } from 'lucide-react';

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

export function SalesReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const { data: sales, isLoading } = useSalesReport(dateFrom, dateTo);

  const totals = sales?.reduce((acc, sale) => ({
    subtotal: acc.subtotal + sale.subtotal,
    discount: acc.discount + sale.discount_amount,
    tax: acc.tax + sale.tax_amount,
    total: acc.total + sale.total_amount,
    paid: acc.paid + sale.paid_amount,
  }), { subtotal: 0, discount: 0, tax: 0, total: 0, paid: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          বিক্রয় রিপোর্ট / Sales Report
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

        {/* Summary Cards */}
        {totals && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">মোট বিক্রয়</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">সাবটোটাল</p>
                <p className="text-xl font-semibold">{formatCurrency(totals.subtotal)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">ছাড়</p>
                <p className="text-xl font-semibold text-destructive">{formatCurrency(totals.discount)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">ট্যাক্স</p>
                <p className="text-xl font-semibold">{formatCurrency(totals.tax)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">প্রাপ্ত</p>
                <p className="text-xl font-semibold text-primary">{formatCurrency(totals.paid)}</p>
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
                  <TableHead>ইনভয়েস</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>গ্রাহক</TableHead>
                  <TableHead className="text-right">সাবটোটাল</TableHead>
                  <TableHead className="text-right">ছাড়</TableHead>
                  <TableHead className="text-right">ট্যাক্স</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead className="text-right">প্রাপ্ত</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                    <TableCell>{new Date(sale.sale_date).toLocaleDateString('bn-BD')}</TableCell>
                    <TableCell>{sale.customer_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.subtotal)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(sale.discount_amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.tax_amount)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(sale.total_amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.paid_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        sale.payment_status === 'paid' ? 'default' : 
                        sale.payment_status === 'partial' ? 'secondary' : 'destructive'
                      }>
                        {sale.payment_status === 'paid' ? 'পরিশোধিত' : 
                         sale.payment_status === 'partial' ? 'আংশিক' : 'বাকি'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!sales || sales.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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

export function PurchaseReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const { data: purchases, isLoading } = usePurchaseReport(dateFrom, dateTo);

  const totals = purchases?.reduce((acc, po) => ({
    subtotal: acc.subtotal + po.subtotal,
    discount: acc.discount + po.discount_amount,
    tax: acc.tax + po.tax_amount,
    total: acc.total + po.total_amount,
  }), { subtotal: 0, discount: 0, tax: 0, total: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ক্রয় রিপোর্ট / Purchase Report
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

        {/* Summary Cards */}
        {totals && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">মোট ক্রয়</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">সাবটোটাল</p>
                <p className="text-xl font-semibold">{formatCurrency(totals.subtotal)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">ছাড়</p>
                <p className="text-xl font-semibold text-primary">{formatCurrency(totals.discount)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">ট্যাক্স</p>
                <p className="text-xl font-semibold">{formatCurrency(totals.tax)}</p>
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
                  <TableHead>অর্ডার নম্বর</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>বিক্রেতা</TableHead>
                  <TableHead className="text-right">সাবটোটাল</TableHead>
                  <TableHead className="text-right">ছাড়</TableHead>
                  <TableHead className="text-right">ট্যাক্স</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases?.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.order_number}</TableCell>
                    <TableCell>{new Date(po.order_date).toLocaleDateString('bn-BD')}</TableCell>
                    <TableCell>{po.seller_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(po.subtotal)}</TableCell>
                    <TableCell className="text-right text-primary">{formatCurrency(po.discount_amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(po.tax_amount)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(po.total_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        po.status === 'completed' ? 'default' : 
                        po.status === 'partial' ? 'secondary' : 'outline'
                      }>
                        {po.status === 'completed' ? 'সম্পন্ন' : 
                         po.status === 'partial' ? 'আংশিক' : 'পেন্ডিং'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!purchases || purchases.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      নির্বাচিত সময়ে কোন ক্রয় অর্ডার নেই
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

export function DailySalesReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  
  const { data: dailySales, isLoading } = useDailySales(selectedDate);

  const totals = dailySales?.reduce((acc, sale) => ({
    total: acc.total + sale.total_amount,
    paid: acc.paid + sale.paid_amount,
  }), { total: 0, paid: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          দৈনিক বিক্রয় / Day Book
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-48"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedDate(today)}
          >
            আজ
          </Button>
        </div>

        {/* Summary */}
        {totals && dailySales && dailySales.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">মোট ইনভয়েস</p>
                <p className="text-2xl font-bold">{dailySales.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">মোট বিক্রয়</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">প্রাপ্ত পেমেন্ট</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totals.paid)}</p>
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
                  <TableHead>ইনভয়েস</TableHead>
                  <TableHead>গ্রাহক</TableHead>
                  <TableHead>আইটেম</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead className="text-right">প্রাপ্ত</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailySales?.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                    <TableCell>{sale.customer?.name || 'Walk-in'}</TableCell>
                    <TableCell>{sale.sale_items?.length || 0} আইটেম</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(sale.total_amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.paid_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        sale.payment_status === 'paid' ? 'default' : 
                        sale.payment_status === 'partial' ? 'secondary' : 'destructive'
                      }>
                        {sale.payment_status === 'paid' ? 'পরিশোধিত' : 
                         sale.payment_status === 'partial' ? 'আংশিক' : 'বাকি'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!dailySales || dailySales.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {new Date(selectedDate).toLocaleDateString('bn-BD')} তারিখে কোন বিক্রয় নেই
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
