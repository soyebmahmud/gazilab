import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useExpenses } from '@/hooks/useExpenses';
import { useExpenseByCategory } from '@/hooks/useFinancialReports';
import { Wallet, PieChart } from 'lucide-react';

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

export function ExpenseReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const { data: expenses, isLoading } = useExpenses(dateFrom, dateTo);

  const totalExpense = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          খরচ রিপোর্ট / Expense Report
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
        <Card className="bg-destructive/10">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">মোট খরচ</p>
            <p className="text-3xl font-bold text-destructive">{formatCurrency(totalExpense)}</p>
            <p className="text-sm text-muted-foreground mt-1">{expenses?.length || 0} টি এন্ট্রি</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>ক্যাটাগরি</TableHead>
                  <TableHead>বিবরণ</TableHead>
                  <TableHead>পেমেন্ট মাধ্যম</TableHead>
                  <TableHead>রেফারেন্স</TableHead>
                  <TableHead className="text-right">পরিমাণ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.expense_date).toLocaleDateString('bn-BD')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.category?.name || 'অশ্রেণীবদ্ধ'}</Badge>
                    </TableCell>
                    <TableCell>{expense.description || '-'}</TableCell>
                    <TableCell className="capitalize">{expense.payment_method}</TableCell>
                    <TableCell>{expense.reference_number || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!expenses || expenses.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      নির্বাচিত সময়ে কোন খরচ নেই
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

export function ExpenseCategoryReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const { data: categories, isLoading } = useExpenseByCategory(dateFrom, dateTo);

  const totalExpense = categories?.reduce((sum, c) => sum + c.total_amount, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          ক্যাটাগরি অনুযায়ী খরচ / Expense by Category
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
          <div className="space-y-4">
            {/* Category Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {categories?.map((cat) => (
                <Card key={cat.category_id} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">{cat.category_name}</p>
                    <p className="text-xl font-bold text-destructive">{formatCurrency(cat.total_amount)}</p>
                    <p className="text-xs text-muted-foreground">{cat.count} টি এন্ট্রি</p>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-destructive" 
                        style={{ width: `${(cat.total_amount / totalExpense) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((cat.total_amount / totalExpense) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ক্যাটাগরি</TableHead>
                    <TableHead className="text-right">এন্ট্রি সংখ্যা</TableHead>
                    <TableHead className="text-right">মোট খরচ</TableHead>
                    <TableHead className="text-right">শতাংশ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((cat) => (
                    <TableRow key={cat.category_id}>
                      <TableCell className="font-medium">{cat.category_name}</TableCell>
                      <TableCell className="text-right">{cat.count}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {formatCurrency(cat.total_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {((cat.total_amount / totalExpense) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories && categories.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>মোট</TableCell>
                      <TableCell className="text-right">{categories.reduce((sum, c) => sum + c.count, 0)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(totalExpense)}</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  )}
                  {(!categories || categories.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        নির্বাচিত সময়ে কোন খরচ নেই
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
