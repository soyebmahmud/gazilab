import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useExpenses, useExpenseCategories, useCreateExpense, useDeleteExpense, ExpenseCategory } from '@/hooks/useExpenses';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Wallet, Plus, Trash2, Receipt, TrendingDown, Tag } from 'lucide-react';

const formatCurrency = (value: number) => `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: category, error } = await supabase
        .from('expense_categories')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });
}

export default function ExpensesPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  const { data: expenses, isLoading: expensesLoading } = useExpenses(dateFrom, dateTo);
  const { data: categories } = useExpenseCategories();
  const { data: bankAccounts } = useBankAccounts();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const createCategory = useCreateExpenseCategory();

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({
    category_id: '',
    amount: 0,
    expense_date: today,
    payment_method: 'cash',
    bank_account_id: '',
    description: '',
    reference_number: '',
    notes: '',
  });

  // Category Form
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  const handleCreateExpense = () => {
    if (!expenseForm.category_id || expenseForm.amount <= 0) return;
    createExpense.mutate({
      ...expenseForm,
      bank_account_id: expenseForm.payment_method === 'bank' ? expenseForm.bank_account_id || null : null,
    }, {
      onSuccess: () => {
        setIsExpenseDialogOpen(false);
        setExpenseForm({
          category_id: '',
          amount: 0,
          expense_date: today,
          payment_method: 'cash',
          bank_account_id: '',
          description: '',
          reference_number: '',
          notes: '',
        });
      },
    });
  };

  const handleCreateCategory = () => {
    if (!categoryForm.name) return;
    createCategory.mutate(categoryForm, {
      onSuccess: () => {
        setIsCategoryDialogOpen(false);
        setCategoryForm({ name: '', description: '' });
      },
    });
  };

  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const cashExpenses = expenses?.filter(e => e.payment_method === 'cash').reduce((sum, e) => sum + e.amount, 0) || 0;
  const bankExpenses = expenses?.filter(e => e.payment_method === 'bank').reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">খরচ / Expenses</h1>
            <p className="text-muted-foreground">খরচ রেকর্ড ও ক্যাটাগরি ম্যানেজমেন্ট</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Tag className="h-4 w-4" />
                  নতুন ক্যাটাগরি
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>নতুন খরচের ক্যাটাগরি</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>ক্যাটাগরির নাম *</Label>
                    <Input
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="যেমন: অফিস খরচ, যাতায়াত"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>বিবরণ</Label>
                    <Textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="ক্যাটাগরির বিবরণ..."
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateCategory}
                    disabled={createCategory.isPending}
                  >
                    {createCategory.isPending ? 'সেভ হচ্ছে...' : 'ক্যাটাগরি তৈরি করুন'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  নতুন খরচ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>নতুন খরচ রেকর্ড / New Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ক্যাটাগরি *</Label>
                      <Select
                        value={expenseForm.category_id}
                        onValueChange={(v) => setExpenseForm({ ...expenseForm, category_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="ক্যাটাগরি নির্বাচন" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>পরিমাণ *</Label>
                      <Input
                        type="number"
                        value={expenseForm.amount || ''}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>তারিখ *</Label>
                      <Input
                        type="date"
                        value={expenseForm.expense_date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>পেমেন্ট মেথড *</Label>
                      <Select
                        value={expenseForm.payment_method}
                        onValueChange={(v) => setExpenseForm({ ...expenseForm, payment_method: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">ক্যাশ / Cash</SelectItem>
                          <SelectItem value="bank">ব্যাংক / Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {expenseForm.payment_method === 'bank' && (
                    <div className="space-y-2">
                      <Label>ব্যাংক অ্যাকাউন্ট *</Label>
                      <Select
                        value={expenseForm.bank_account_id}
                        onValueChange={(v) => setExpenseForm({ ...expenseForm, bank_account_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="অ্যাকাউন্ট নির্বাচন" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts?.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.account_name} - {acc.bank_name} ({formatCurrency(acc.current_balance)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>বিবরণ</Label>
                    <Input
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="খরচের বিবরণ"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>রেফারেন্স নম্বর</Label>
                      <Input
                        value={expenseForm.reference_number}
                        onChange={(e) => setExpenseForm({ ...expenseForm, reference_number: e.target.value })}
                        placeholder="ভাউচার/বিল নম্বর"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>নোট</Label>
                      <Input
                        value={expenseForm.notes}
                        onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                        placeholder="অতিরিক্ত নোট"
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateExpense}
                    disabled={createExpense.isPending}
                  >
                    {createExpense.isPending ? 'সেভ হচ্ছে...' : 'খরচ সেভ করুন'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">মোট খরচ</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
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
                  <p className="text-sm text-muted-foreground">ক্যাশ খরচ</p>
                  <p className="text-2xl font-bold">{formatCurrency(cashExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ব্যাংক খরচ</p>
                  <p className="text-2xl font-bold">{formatCurrency(bankExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ক্যাটাগরি</p>
                  <p className="text-2xl font-bold">{categories?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Filter */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
              <span className="text-muted-foreground">থেকে</span>
              <Input 
                type="date" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
              <Button size="sm" variant="outline" onClick={() => { setDateFrom(today); setDateTo(today); }}>আজ</Button>
              <Button size="sm" variant="outline" onClick={() => { setDateFrom(monthStart); setDateTo(format(endOfMonth(new Date()), 'yyyy-MM-dd')); }}>এই মাস</Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="expenses">খরচ তালিকা</TabsTrigger>
            <TabsTrigger value="categories">ক্যাটাগরি তালিকা</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>খরচ রেকর্ড</CardTitle>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>তারিখ</TableHead>
                          <TableHead>ক্যাটাগরি</TableHead>
                          <TableHead>বিবরণ</TableHead>
                          <TableHead>পেমেন্ট মেথড</TableHead>
                          <TableHead>রেফারেন্স</TableHead>
                          <TableHead className="text-right">পরিমাণ</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses?.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{new Date(expense.expense_date).toLocaleDateString('bn-BD')}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{expense.category?.name || '-'}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{expense.description || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={expense.payment_method === 'cash' ? 'default' : 'secondary'}>
                                {expense.payment_method === 'cash' ? 'ক্যাশ' : 'ব্যাংক'}
                              </Badge>
                              {expense.bank_account && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({expense.bank_account.account_name})
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{expense.reference_number || '-'}</TableCell>
                            <TableCell className="text-right font-bold text-destructive">
                              {formatCurrency(expense.amount)}
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>খরচ মুছে ফেলুন?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      এই খরচ রেকর্ড মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteExpense.mutate(expense.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      মুছে ফেলুন
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!expenses || expenses.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>খরচের ক্যাটাগরি</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ক্যাটাগরি নাম</TableHead>
                        <TableHead>বিবরণ</TableHead>
                        <TableHead>স্ট্যাটাস</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories?.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          <TableCell className="text-muted-foreground">{cat.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={cat.is_active ? 'default' : 'secondary'}>
                              {cat.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!categories || categories.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            কোন ক্যাটাগরি নেই। উপরে "নতুন ক্যাটাগরি" বাটনে ক্লিক করুন।
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
