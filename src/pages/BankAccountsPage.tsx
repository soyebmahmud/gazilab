import { useState } from 'react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useBankAccounts, useBankTransactions, useCreateBankAccount, useCreateBankTransaction } from '@/hooks/useBankAccounts';
import { Building2, Plus, ArrowDownToLine, ArrowUpFromLine, Wallet, CreditCard } from 'lucide-react';

const formatCurrency = (value: number) => `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

export default function BankAccountsPage() {
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  
  const { data: accounts, isLoading: accountsLoading } = useBankAccounts();
  const { data: transactions, isLoading: transactionsLoading } = useBankTransactions(
    selectedAccountId || undefined
  );
  const createAccount = useCreateBankAccount();
  const createTransaction = useCreateBankTransaction();

  // New Account Form
  const [accountForm, setAccountForm] = useState({
    account_name: '',
    bank_name: '',
    account_number: '',
    branch: '',
    opening_balance: 0,
  });

  // New Transaction Form
  const [transactionForm, setTransactionForm] = useState({
    bank_account_id: '',
    transaction_type: 'deposit' as 'deposit' | 'withdrawal',
    amount: 0,
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });

  const handleCreateAccount = () => {
    if (!accountForm.account_name || !accountForm.bank_name) return;
    createAccount.mutate(accountForm, {
      onSuccess: () => {
        setIsAccountDialogOpen(false);
        setAccountForm({
          account_name: '',
          bank_name: '',
          account_number: '',
          branch: '',
          opening_balance: 0,
        });
      },
    });
  };

  const handleCreateTransaction = () => {
    if (!transactionForm.bank_account_id || transactionForm.amount <= 0) return;
    createTransaction.mutate(transactionForm, {
      onSuccess: () => {
        setIsTransactionDialogOpen(false);
        setTransactionForm({
          bank_account_id: '',
          transaction_type: 'deposit',
          amount: 0,
          transaction_date: format(new Date(), 'yyyy-MM-dd'),
          description: '',
        });
      },
    });
  };

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">ব্যাংক অ্যাকাউন্ট / Bank Accounts</h1>
            <p className="text-muted-foreground">ব্যাংক অ্যাকাউন্ট ম্যানেজমেন্ট ও ট্রানজ্যাকশন</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ArrowDownToLine className="h-4 w-4" />
                  নতুন ট্রানজ্যাকশন
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>নতুন ট্রানজ্যাকশন / New Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>অ্যাকাউন্ট *</Label>
                    <Select
                      value={transactionForm.bank_account_id}
                      onValueChange={(v) => setTransactionForm({ ...transactionForm, bank_account_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="অ্যাকাউন্ট নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.account_name} - {acc.bank_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ট্রানজ্যাকশন টাইপ *</Label>
                    <Select
                      value={transactionForm.transaction_type}
                      onValueChange={(v) => setTransactionForm({ ...transactionForm, transaction_type: v as 'deposit' | 'withdrawal' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">জমা / Deposit</SelectItem>
                        <SelectItem value="withdrawal">উত্তোলন / Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>পরিমাণ *</Label>
                    <Input
                      type="number"
                      value={transactionForm.amount || ''}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>তারিখ</Label>
                    <Input
                      type="date"
                      value={transactionForm.transaction_date}
                      onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>বিবরণ</Label>
                    <Textarea
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                      placeholder="ট্রানজ্যাকশনের বিবরণ..."
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateTransaction}
                    disabled={createTransaction.isPending}
                  >
                    {createTransaction.isPending ? 'সেভ হচ্ছে...' : 'ট্রানজ্যাকশন সেভ করুন'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  নতুন অ্যাকাউন্ট
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>নতুন ব্যাংক অ্যাকাউন্ট / New Bank Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>অ্যাকাউন্টের নাম *</Label>
                    <Input
                      value={accountForm.account_name}
                      onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                      placeholder="যেমন: Main Operating Account"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ব্যাংকের নাম *</Label>
                    <Input
                      value={accountForm.bank_name}
                      onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                      placeholder="যেমন: Sonali Bank, DBBL"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>অ্যাকাউন্ট নম্বর</Label>
                      <Input
                        value={accountForm.account_number}
                        onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                        placeholder="123456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ব্রাঞ্চ</Label>
                      <Input
                        value={accountForm.branch}
                        onChange={(e) => setAccountForm({ ...accountForm, branch: e.target.value })}
                        placeholder="Motijheel"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>প্রারম্ভিক ব্যালেন্স</Label>
                    <Input
                      type="number"
                      value={accountForm.opening_balance || ''}
                      onChange={(e) => setAccountForm({ ...accountForm, opening_balance: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateAccount}
                    disabled={createAccount.isPending}
                  >
                    {createAccount.isPending ? 'সেভ হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">মোট অ্যাকাউন্ট</p>
                  <p className="text-2xl font-bold">{accounts?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">মোট ব্যালেন্স</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">সাম্প্রতিক ট্রানজ্যাকশন</p>
                  <p className="text-2xl font-bold">{transactions?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="accounts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="accounts">অ্যাকাউন্টসমূহ</TabsTrigger>
            <TabsTrigger value="transactions">ট্রানজ্যাকশন হিস্টোরি</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>ব্যাংক অ্যাকাউন্ট তালিকা</CardTitle>
              </CardHeader>
              <CardContent>
                {accountsLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>অ্যাকাউন্ট নাম</TableHead>
                          <TableHead>ব্যাংক</TableHead>
                          <TableHead>অ্যাকাউন্ট নম্বর</TableHead>
                          <TableHead>ব্রাঞ্চ</TableHead>
                          <TableHead className="text-right">প্রারম্ভিক ব্যালেন্স</TableHead>
                          <TableHead className="text-right">বর্তমান ব্যালেন্স</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accounts?.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.account_name}</TableCell>
                            <TableCell>{account.bank_name}</TableCell>
                            <TableCell>{account.account_number || '-'}</TableCell>
                            <TableCell>{account.branch || '-'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(account.opening_balance)}</TableCell>
                            <TableCell className="text-right font-bold">
                              <span className={account.current_balance >= 0 ? 'text-primary' : 'text-destructive'}>
                                {formatCurrency(account.current_balance)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!accounts || accounts.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              কোন ব্যাংক অ্যাকাউন্ট নেই। উপরে "নতুন অ্যাকাউন্ট" বাটনে ক্লিক করুন।
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>ট্রানজ্যাকশন হিস্টোরি</CardTitle>
                  <Select
                    value={selectedAccountId || 'all'}
                    onValueChange={(v) => setSelectedAccountId(v === 'all' ? '' : v)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="সব অ্যাকাউন্ট" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সব অ্যাকাউন্ট</SelectItem>
                      {accounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>তারিখ</TableHead>
                          <TableHead>অ্যাকাউন্ট</TableHead>
                          <TableHead>টাইপ</TableHead>
                          <TableHead className="text-right">পরিমাণ</TableHead>
                          <TableHead className="text-right">ব্যালেন্স পরে</TableHead>
                          <TableHead>বিবরণ</TableHead>
                          <TableHead>রেফারেন্স</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions?.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{new Date(tx.transaction_date).toLocaleDateString('bn-BD')}</TableCell>
                            <TableCell>
                              {tx.bank_account?.account_name} - {tx.bank_account?.bank_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant={tx.transaction_type === 'deposit' ? 'default' : 'destructive'}>
                                {tx.transaction_type === 'deposit' ? (
                                  <><ArrowDownToLine className="h-3 w-3 mr-1" /> জমা</>
                                ) : (
                                  <><ArrowUpFromLine className="h-3 w-3 mr-1" /> উত্তোলন</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${tx.transaction_type === 'deposit' ? 'text-primary' : 'text-destructive'}`}>
                              {tx.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(tx.balance_after)}</TableCell>
                            <TableCell className="max-w-xs truncate">{tx.description || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{tx.reference_type || 'manual'}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!transactions || transactions.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              কোন ট্রানজ্যাকশন নেই
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
