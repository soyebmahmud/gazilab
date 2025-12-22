import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useDailyDamageLoss, 
  useMonthlyDamageLoss, 
  useDamageLossByType, 
  useProductDamageSummary,
  useReturnVsDamageBreakdown,
  useComprehensiveLossReport 
} from '@/hooks/useDamageFinancials';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { AlertTriangle, TrendingDown, RotateCcw, Package, Trash2, ArrowUpDown, Download } from 'lucide-react';

const formatCurrency = (value: number) => `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

export function DamageLossSummaryCards() {
  const { data: dailyLoss, isLoading: dailyLoading } = useDailyDamageLoss();
  const { data: monthlyLoss, isLoading: monthlyLoading } = useMonthlyDamageLoss();

  if (dailyLoading || monthlyLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-16 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">আজকের ক্ষতি</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(dailyLoss?.total_loss_value || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {dailyLoss?.destroyed_count || 0} আইটেম ধ্বংস করা হয়েছে
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">এই মাসের ক্ষতি</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(monthlyLoss?.total_loss_value || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {monthlyLoss?.destroyed_count || 0} আইটেম ধ্বংস করা হয়েছে
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">পেন্ডিং রিভিউ</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(dailyLoss?.pending_count || 0) + (monthlyLoss?.pending_count || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            সিদ্ধান্ত অপেক্ষমাণ
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">পুনরুদ্ধার করা মূল্য</CardTitle>
          <RotateCcw className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(monthlyLoss?.restored_value || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {monthlyLoss?.restored_count || 0} আইটেম পুনরুদ্ধার হয়েছে
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function DamageByTypeReport() {
  const [dateFrom, setDateFrom] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const { data: byType, isLoading } = useDamageLossByType(dateFrom, dateTo);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          ক্ষতির ধরন অনুযায়ী বিশ্লেষণ
        </CardTitle>
        <CardDescription>কোন ধরনের ক্ষতি সবচেয়ে বেশি হচ্ছে</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div>
            <label className="text-sm font-medium">শুরু</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">শেষ</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ক্ষতির ধরন</TableHead>
                  <TableHead className="text-right">সংখ্যা</TableHead>
                  <TableHead className="text-right">পরিমাণ</TableHead>
                  <TableHead className="text-right">ক্ষতির মূল্য</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byType?.map((item) => (
                  <TableRow key={item.damage_type}>
                    <TableCell className="font-medium">{item.damage_type_label}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">{item.total_quantity}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      {formatCurrency(item.total_loss_value)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!byType || byType.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      এই সময়ে কোন ক্ষতি রেকর্ড নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {byType && byType.length > 0 && (
          <div className="flex justify-end">
            <div className="text-sm">
              মোট ক্ষতি: <span className="font-bold text-destructive">
                {formatCurrency(byType.reduce((sum, item) => sum + item.total_loss_value, 0))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductDamageLossReport() {
  const [dateFrom, setDateFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const { data: productSummary, isLoading } = useProductDamageSummary(dateFrom, dateTo);

  const exportToCSV = () => {
    if (!productSummary || productSummary.length === 0) return;
    
    const headers = ['Product', 'SKU', 'Total Damaged', 'Pending', 'Restored', 'Destroyed', 'Loss Value'];
    const rows = productSummary.map(item => [
      item.product_name,
      item.product_sku,
      item.total_damaged.toString(),
      item.pending_count.toString(),
      item.restored_count.toString(),
      item.destroyed_count.toString(),
      item.total_loss_value.toString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `product-damage-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              পণ্য অনুযায়ী ক্ষতি বিশ্লেষণ
            </CardTitle>
            <CardDescription>কোন পণ্যে সবচেয়ে বেশি ক্ষতি হচ্ছে</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!productSummary?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div>
            <label className="text-sm font-medium">শুরু</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">শেষ</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>পণ্য</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">মোট ক্ষতিগ্রস্ত</TableHead>
                  <TableHead className="text-center">পেন্ডিং</TableHead>
                  <TableHead className="text-center">পুনরুদ্ধার</TableHead>
                  <TableHead className="text-center">ধ্বংস</TableHead>
                  <TableHead className="text-right">ক্ষতির মূল্য</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productSummary?.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{item.product_sku}</TableCell>
                    <TableCell className="text-right">{item.total_damaged}</TableCell>
                    <TableCell className="text-center">
                      {item.pending_count > 0 && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                          {item.pending_count}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.restored_count > 0 && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600">
                          {item.restored_count}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.destroyed_count > 0 && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive">
                          {item.destroyed_count}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      {formatCurrency(item.total_loss_value)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!productSummary || productSummary.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      এই সময়ে কোন ক্ষতি রেকর্ড নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {productSummary && productSummary.length > 0 && (
          <div className="flex justify-end">
            <div className="text-sm">
              মোট ক্ষতি: <span className="font-bold text-destructive">
                {formatCurrency(productSummary.reduce((sum, item) => sum + item.total_loss_value, 0))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReturnVsDamageReport() {
  const [dateFrom, setDateFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const { data: breakdown, isLoading } = useReturnVsDamageBreakdown(dateFrom, dateTo);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          রিটার্ন বনাম ড্যামেজ বিশ্লেষণ
        </CardTitle>
        <CardDescription>ফেরত পণ্য এবং সরাসরি ক্ষতির তুলনা</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div>
            <label className="text-sm font-medium">শুরু</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">শেষ</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : breakdown ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  ফেরত → স্টকে পুনরুদ্ধার
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(breakdown.returns_restored)}
                </div>
                <p className="text-xs text-muted-foreground">মূল্য সংরক্ষিত</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">
                  ফেরত → ক্ষতিগ্রস্ত
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(breakdown.returns_damaged)}
                </div>
                <p className="text-xs text-muted-foreground">ফেরত থেকে ক্ষতি</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-destructive">
                  সরাসরি ক্ষতি
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(breakdown.direct_damage)}
                </div>
                <p className="text-xs text-muted-foreground">হ্যান্ডলিং/গুদাম ক্ষতি</p>
              </CardContent>
            </Card>

            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-destructive">
                  মোট নেট ক্ষতি
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(breakdown.total_loss)}
                </div>
                <p className="text-xs text-muted-foreground">লাভ থেকে বাদ যাবে</p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ComprehensiveLossReport() {
  const [dateFrom, setDateFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const { data: report, isLoading } = useComprehensiveLossReport(dateFrom, dateTo);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          সম্পূর্ণ ক্ষতি রিপোর্ট
        </CardTitle>
        <CardDescription>সমস্ত ক্ষতি এবং ফেরতের বিস্তারিত</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div>
            <label className="text-sm font-medium">শুরু</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">শেষ</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">মোট ক্ষতি রেকর্ড</p>
                <p className="text-2xl font-bold">{report.summary.total_damage_records}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">মোট ফেরত রেকর্ড</p>
                <p className="text-2xl font-bold">{report.summary.total_return_records}</p>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg">
                <p className="text-sm text-green-700">পুনরুদ্ধার মূল্য</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(report.summary.total_restored_value + report.summary.return_restored_value)}
                </p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive">নেট ক্ষতি</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(report.summary.net_loss)}
                </p>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="p-3 border rounded-lg">
                <p className="text-muted-foreground">পেন্ডিং</p>
                <p className="text-lg font-semibold">{report.summary.pending_count}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(report.summary.total_pending_value)}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-muted-foreground">পুনরুদ্ধার (ক্ষতি)</p>
                <p className="text-lg font-semibold text-green-600">{report.summary.restored_count}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-muted-foreground">ধ্বংস</p>
                <p className="text-lg font-semibold text-destructive">{report.summary.destroyed_count}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-muted-foreground">ফেরত → স্টক</p>
                <p className="text-lg font-semibold text-green-600">{report.summary.return_restored_count}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-muted-foreground">ফেরত → ক্ষতি</p>
                <p className="text-lg font-semibold text-orange-600">{report.summary.return_damaged_count}</p>
              </div>
            </div>

            {/* Financial Impact Note */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <h4 className="font-medium text-amber-700 mb-2">💡 আর্থিক প্রভাব</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• ধ্বংসকৃত পণ্যের ক্ষতি ({formatCurrency(report.summary.total_destroyed_loss)}) সরাসরি লাভ থেকে বাদ যাবে</li>
                <li>• ফেরত থেকে ক্ষতি ({formatCurrency(report.summary.return_damaged_value)}) COGS-এ যোগ হবে</li>
                <li>• পুনরুদ্ধারকৃত পণ্য ({formatCurrency(report.summary.total_restored_value + report.summary.return_restored_value)}) পুনরায় বিক্রয়যোগ্য</li>
              </ul>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DamageLossReportsTab() {
  return (
    <div className="space-y-6">
      <DamageLossSummaryCards />
      
      <Tabs defaultValue="by-type" className="w-full">
        <TabsList>
          <TabsTrigger value="by-type">ধরন অনুযায়ী</TabsTrigger>
          <TabsTrigger value="by-product">পণ্য অনুযায়ী</TabsTrigger>
          <TabsTrigger value="return-vs-damage">রিটার্ন বনাম ড্যামেজ</TabsTrigger>
          <TabsTrigger value="comprehensive">সম্পূর্ণ রিপোর্ট</TabsTrigger>
        </TabsList>
        
        <TabsContent value="by-type">
          <DamageByTypeReport />
        </TabsContent>
        
        <TabsContent value="by-product">
          <ProductDamageLossReport />
        </TabsContent>
        
        <TabsContent value="return-vs-damage">
          <ReturnVsDamageReport />
        </TabsContent>
        
        <TabsContent value="comprehensive">
          <ComprehensiveLossReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
