import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankAccounts, useBankTransactions } from '@/hooks/useBankAccounts';
import { Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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

export function BankTransactionReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [selectedBank, setSelectedBank] = useState('all');
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const { data: bankAccounts, isLoading: loadingAccounts } = useBankAccounts();
  const { data: transactions, isLoading: loadingTransactions } = useBankTransactions(
    selectedBank === 'all' ? undefined : selectedBank, 
    dateFrom, 
    dateTo
  );

  const totalBalance = bankAccounts?.reduce((sum, b) => sum + b.current_balance, 0) || 0;
  const totalDeposits = transactions?.filter(t => t.transaction_type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalWithdrawals = transactions?.filter(t => t.transaction_type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          ব্যাংক ট্রানজ্যাকশন / Bank Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank Accounts Summary */}
        {bankAccounts && bankAccounts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {bankAccounts.map((bank) => (
              <Card key={bank.id} className="bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">{bank.bank_name}</p>
                  <p className="font-medium">{bank.account_name}</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(bank.current_balance)}</p>
                </CardContent>
              </Card>
            ))}
            <Card className="bg-primary/10">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">মোট ব্যাংক ব্যালেন্স</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalBalance)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {(!bankAccounts || bankAccounts.length === 0) && !loadingAccounts && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4 text-center">
              <p className="text-muted-foreground">কোন ব্যাংক অ্যাকাউন্ট নেই</p>
              <p className="text-sm text-muted-foreground mt-1">প্রথমে ব্যাংক অ্যাকাউন্ট যোগ করুন</p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="সব ব্যাংক" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ব্যাংক</SelectItem>
              {bankAccounts?.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.bank_name} - {bank.account_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DateRangeFilter 
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onQuickSelect={(from, to) => { setDateFrom(from); setDateTo(to); }}
          />
        </div>

        {/* Transaction Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-primary/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">জমা</p>
              </div>
              <p className="text-xl font-bold text-primary">{formatCurrency(totalDeposits)}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-5 w-5 text-destructive" />
                <p className="text-sm text-muted-foreground">উত্তোলন</p>
              </div>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totalWithdrawals)}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">নিট</p>
              <p className={`text-xl font-bold ${totalDeposits - totalWithdrawals >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(totalDeposits - totalWithdrawals)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        {loadingTransactions ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>ব্যাংক</TableHead>
                  <TableHead>ধরন</TableHead>
                  <TableHead>বিবরণ</TableHead>
                  <TableHead className="text-right">পরিমাণ</TableHead>
                  <TableHead className="text-right">ব্যালেন্স</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.transaction_date).toLocaleDateString('bn-BD')}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tx.bank_account?.bank_name}</p>
                        <p className="text-xs text-muted-foreground">{tx.bank_account?.account_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.transaction_type === 'deposit' ? 'default' : 'destructive'}>
                        {tx.transaction_type === 'deposit' ? 'জমা' : 
                         tx.transaction_type === 'withdrawal' ? 'উত্তোলন' : 'ট্রান্সফার'}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.description || '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.transaction_type === 'deposit' ? 'text-primary' : 'text-destructive'}`}>
                      {tx.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(tx.balance_after)}</TableCell>
                  </TableRow>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      নির্বাচিত সময়ে কোন ট্রানজ্যাকশন নেই
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
