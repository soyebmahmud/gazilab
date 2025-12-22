import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfitLossReport, useProductProfitReport, useCashSummary, useBalanceSheet } from '@/hooks/useFinancialReports';
import { DollarSign, TrendingUp, TrendingDown, Wallet, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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

export function ProfitLossReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const { data: plData, isLoading } = useProfitLossReport(dateFrom, dateTo);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          লাভ-ক্ষতি হিসাব / Profit & Loss Statement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DateRangeFilter 
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onQuickSelect={(from, to) => { setDateFrom(from); setDateTo(to); }}
        />

        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : plData ? (
          <div className="space-y-6">
            {/* Net Profit/Loss Highlight */}
            <Card className={plData.net_profit >= 0 ? 'border-primary/50 bg-primary/5' : 'border-destructive/50 bg-destructive/5'}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">নিট {plData.net_profit >= 0 ? 'লাভ' : 'ক্ষতি'}</p>
                    <p className={`text-4xl font-bold ${plData.net_profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {formatCurrency(Math.abs(plData.net_profit))}
                    </p>
                  </div>
                  {plData.net_profit >= 0 ? (
                    <TrendingUp className="h-12 w-12 text-primary/50" />
                  ) : (
                    <TrendingDown className="h-12 w-12 text-destructive/50" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* P&L Breakdown */}
            <div className="rounded-lg border p-6 space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                  মোট বিক্রয় (Revenue)
                </span>
                <span className="text-xl font-bold text-primary">{formatCurrency(plData.total_sales)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b pl-6">
                <span className="text-muted-foreground">বিক্রয় সংখ্যা</span>
                <span>{plData.sales_count} টি</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                  পণ্য খরচ (COGS)
                </span>
                <span className="text-xl font-bold text-destructive">({formatCurrency(plData.total_cost_of_goods)})</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b bg-muted/30 px-4 -mx-4">
                <span className="font-bold">গ্রস প্রফিট</span>
                <span className={`text-xl font-bold ${plData.gross_profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(plData.gross_profit)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                  খরচ (Expenses)
                </span>
                <span className="text-lg text-destructive">({formatCurrency(plData.total_expenses)})</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                  ক্ষতি/অপচয় (Damage/Wastage)
                </span>
                <span className="text-lg text-destructive">({formatCurrency(plData.total_damage_loss)})</span>
              </div>

              {plData.returns_count > 0 && (
                <div className="flex justify-between items-center py-3 border-b pl-6">
                  <span className="text-muted-foreground">রিটার্ন ({plData.returns_count} টি)</span>
                  <span className="text-destructive">{formatCurrency(plData.returns_value)}</span>
                </div>
              )}

              <div className={`flex justify-between items-center py-4 px-4 -mx-4 ${plData.net_profit >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                <span className="text-lg font-bold">নিট {plData.net_profit >= 0 ? 'লাভ' : 'ক্ষতি'}</span>
                <span className={`text-2xl font-bold ${plData.net_profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(plData.net_profit)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            তারিখ নির্বাচন করুন
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductProfitReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const { data: products, isLoading } = useProductProfitReport(dateFrom, dateTo);

  const totals = products?.reduce((acc, p) => ({
    revenue: acc.revenue + p.total_revenue,
    cost: acc.cost + p.total_cost,
    profit: acc.profit + p.gross_profit,
  }), { revenue: 0, cost: 0, profit: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          পণ্য অনুযায়ী লাভ-ক্ষতি / Product-wise Profit
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

        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <>
            {/* Summary */}
            {totals && products && products.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">মোট বিক্রয়</p>
                    <p className="text-xl font-bold">{formatCurrency(totals.revenue)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">মোট খরচ</p>
                    <p className="text-xl font-bold text-destructive">{formatCurrency(totals.cost)}</p>
                  </CardContent>
                </Card>
                <Card className={totals.profit >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">মোট লাভ</p>
                    <p className={`text-xl font-bold ${totals.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {formatCurrency(totals.profit)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>পণ্য</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">বিক্রিত পরিমাণ</TableHead>
                    <TableHead className="text-right">বিক্রয় মূল্য</TableHead>
                    <TableHead className="text-right">খরচ</TableHead>
                    <TableHead className="text-right">লাভ</TableHead>
                    <TableHead className="text-right">মার্জিন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell>{product.product_sku}</TableCell>
                      <TableCell className="text-right">{product.quantity_sold}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.total_revenue)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(product.total_cost)}</TableCell>
                      <TableCell className={`text-right font-medium ${product.gross_profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatCurrency(product.gross_profit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={product.profit_margin >= 20 ? 'default' : product.profit_margin >= 10 ? 'secondary' : 'destructive'}>
                          {product.profit_margin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!products || products.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        নির্বাচিত সময়ে কোন বিক্রয় নেই
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function CashSummaryReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const { data: cashData, isLoading } = useCashSummary(dateFrom, dateTo);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          ক্যাশ সারাংশ / Cash Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DateRangeFilter 
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onQuickSelect={(from, to) => { setDateFrom(from); setDateTo(to); }}
        />

        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : cashData ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-primary/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">ক্যাশ ইন</p>
                </div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(cashData.cash_in)}</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-muted-foreground">ক্যাশ আউট</p>
                </div>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(cashData.cash_out)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">ব্যাংক জমা</p>
                <p className="text-2xl font-bold">{formatCurrency(cashData.bank_deposits)}</p>
              </CardContent>
            </Card>
            <Card className={cashData.closing_cash >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">নিট ক্যাশ ফ্লো</p>
                <p className={`text-2xl font-bold ${cashData.closing_cash >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(cashData.closing_cash)}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            তারিখ নির্বাচন করুন
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BalanceSheetReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [asOfDate, setAsOfDate] = useState(today);
  
  const { data: balanceSheet, isLoading } = useBalanceSheet(asOfDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ব্যালেন্স শীট / Balance Sheet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">তারিখ:</span>
          <Input 
            type="date" 
            value={asOfDate} 
            onChange={(e) => setAsOfDate(e.target.value)}
            className="w-48"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : balanceSheet ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Assets */}
            <Card>
              <CardHeader className="bg-primary/10">
                <CardTitle className="text-lg">সম্পদ (Assets)</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">কাঁচামাল স্টক</span>
                  <span className="font-medium">{formatCurrency(balanceSheet.assets.inventory_raw_materials)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">তৈরি পণ্য স্টক</span>
                  <span className="font-medium">{formatCurrency(balanceSheet.assets.inventory_finished_goods)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">মোট স্টক মূল্য</span>
                  <span className="font-bold">{formatCurrency(balanceSheet.assets.total_inventory)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">পাওনা (Receivables)</span>
                  <span className="font-medium">{formatCurrency(balanceSheet.assets.accounts_receivable)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">ব্যাংক ব্যালেন্স</span>
                  <span className="font-medium">{formatCurrency(balanceSheet.assets.bank_balance)}</span>
                </div>
                <div className="flex justify-between py-3 bg-primary/10 px-3 -mx-3 rounded">
                  <span className="font-bold">মোট সম্পদ</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(balanceSheet.assets.total_current_assets)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Liabilities & Equity */}
            <Card>
              <CardHeader className="bg-destructive/10">
                <CardTitle className="text-lg">দায় ও মালিকানা (Liabilities & Equity)</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">দেনা (Payables)</span>
                  <span className="font-medium text-destructive">{formatCurrency(balanceSheet.liabilities.accounts_payable)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">মোট দায়</span>
                  <span className="font-bold text-destructive">{formatCurrency(balanceSheet.liabilities.total_current_liabilities)}</span>
                </div>
                <div className="flex justify-between py-3 bg-primary/10 px-3 -mx-3 rounded mt-6">
                  <span className="font-bold">মালিকানা / Equity</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(balanceSheet.equity.total_equity)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            তারিখ নির্বাচন করুন
          </div>
        )}
      </CardContent>
    </Card>
  );
}
