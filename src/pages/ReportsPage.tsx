import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { ModuleManual, REPORTS_MANUAL } from '@/components/ModuleManual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Package, AlertTriangle, Calculator, ClipboardList,
  DollarSign, TrendingUp, TrendingDown, CreditCard, Users, 
  ShoppingCart, Building2, Wallet, BarChart3, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';

// Report Components
import { StockSummaryReport, NearExpiryReport, MRPPlanner, BatchTraceabilityReport } from '@/components/reports/InventoryReports';
import { SalesReport, PurchaseReport, DailySalesReport } from '@/components/reports/TransactionReports';
import { ProfitLossReport, ProductProfitReport, CashSummaryReport, BalanceSheetReport } from '@/components/reports/FinancialReports';
import { ExpenseReport, ExpenseCategoryReport } from '@/components/reports/ExpenseReports';
import { PartyListReport, PartyStatementReport, PartyProfitReport } from '@/components/reports/PartyReports';
import { StockMovementReport, ItemWiseSalesReport, ItemWisePurchaseReport } from '@/components/reports/ItemReports';
import { BankTransactionReport } from '@/components/reports/BankReports';
import { DamageLossReportsTab } from '@/components/reports/DamageLossReports';

export default function ReportsPage() {
  const [activeCategory, setActiveCategory] = useState('sales');
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const reportCategories = [
    { id: 'sales', label: 'বিক্রয় রিপোর্ট', icon: ShoppingCart, labelEn: 'Sales Reports' },
    { id: 'inventory', label: 'স্টক রিপোর্ট', icon: Package, labelEn: 'Inventory Reports' },
    { id: 'financial', label: 'আর্থিক রিপোর্ট', icon: DollarSign, labelEn: 'Financial Reports' },
    { id: 'party', label: 'পার্টি রিপোর্ট', icon: Users, labelEn: 'Party Reports' },
    { id: 'expense', label: 'খরচ রিপোর্ট', icon: Wallet, labelEn: 'Expense Reports' },
    { id: 'damage', label: 'ক্ষতি রিপোর্ট', icon: AlertTriangle, labelEn: 'Damage/Loss Reports' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <ModuleManual {...REPORTS_MANUAL} />
        <div>
          <h1 className="text-3xl font-bold">রিপোর্টস / Reports</h1>
          <p className="text-muted-foreground">সম্পূর্ণ রিপোর্টিং সিস্টেম - বিক্রয়, ক্রয়, স্টক, লাভ-ক্ষতি সব এক জায়গায়</p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {reportCategories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-2"
            >
              <cat.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{cat.label}</span>
              <span className="sm:hidden">{cat.labelEn}</span>
            </Button>
          ))}
        </div>

        {/* Sales Reports */}
        {activeCategory === 'sales' && (
          <Tabs defaultValue="sales" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="sales">বিক্রয় রিপোর্ট</TabsTrigger>
              <TabsTrigger value="purchase">ক্রয় রিপোর্ট</TabsTrigger>
              <TabsTrigger value="daily">দৈনিক বিক্রয়</TabsTrigger>
              <TabsTrigger value="item-sales">আইটেম অনুযায়ী বিক্রয়</TabsTrigger>
              <TabsTrigger value="item-purchase">আইটেম অনুযায়ী ক্রয়</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sales">
              <SalesReport />
            </TabsContent>
            <TabsContent value="purchase">
              <PurchaseReport />
            </TabsContent>
            <TabsContent value="daily">
              <DailySalesReport />
            </TabsContent>
            <TabsContent value="item-sales">
              <ItemWiseSalesReport />
            </TabsContent>
            <TabsContent value="item-purchase">
              <ItemWisePurchaseReport />
            </TabsContent>
          </Tabs>
        )}

        {/* Inventory Reports */}
        {activeCategory === 'inventory' && (
          <Tabs defaultValue="stock" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="stock">স্টক সারাংশ</TabsTrigger>
              <TabsTrigger value="movement">স্টক মুভমেন্ট</TabsTrigger>
              <TabsTrigger value="expiry">মেয়াদ উত্তীর্ণ</TabsTrigger>
              <TabsTrigger value="mrp">MRP প্ল্যানার</TabsTrigger>
              <TabsTrigger value="traceability">ব্যাচ ট্রেসেবিলিটি</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stock">
              <StockSummaryReport />
            </TabsContent>
            <TabsContent value="movement">
              <StockMovementReport />
            </TabsContent>
            <TabsContent value="expiry">
              <NearExpiryReport />
            </TabsContent>
            <TabsContent value="mrp">
              <MRPPlanner />
            </TabsContent>
            <TabsContent value="traceability">
              <BatchTraceabilityReport />
            </TabsContent>
          </Tabs>
        )}

        {/* Financial Reports */}
        {activeCategory === 'financial' && (
          <Tabs defaultValue="profitloss" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="profitloss">লাভ-ক্ষতি</TabsTrigger>
              <TabsTrigger value="product-profit">পণ্য অনুযায়ী লাভ-ক্ষতি</TabsTrigger>
              <TabsTrigger value="cash">ক্যাশ সারাংশ</TabsTrigger>
              <TabsTrigger value="bank">ব্যাংক ট্রানজ্যাকশন</TabsTrigger>
              <TabsTrigger value="balance">ব্যালেন্স শীট</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profitloss">
              <ProfitLossReport />
            </TabsContent>
            <TabsContent value="product-profit">
              <ProductProfitReport />
            </TabsContent>
            <TabsContent value="cash">
              <CashSummaryReport />
            </TabsContent>
            <TabsContent value="bank">
              <BankTransactionReport />
            </TabsContent>
            <TabsContent value="balance">
              <BalanceSheetReport />
            </TabsContent>
          </Tabs>
        )}

        {/* Party Reports */}
        {activeCategory === 'party' && (
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="list">সকল পার্টি</TabsTrigger>
              <TabsTrigger value="statement">পার্টি স্টেটমেন্ট</TabsTrigger>
              <TabsTrigger value="profit">পার্টি অনুযায়ী লাভ-ক্ষতি</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <PartyListReport />
            </TabsContent>
            <TabsContent value="statement">
              <PartyStatementReport />
            </TabsContent>
            <TabsContent value="profit">
              <PartyProfitReport />
            </TabsContent>
          </Tabs>
        )}

        {/* Expense Reports */}
        {activeCategory === 'expense' && (
          <Tabs defaultValue="expense" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="expense">খরচ রিপোর্ট</TabsTrigger>
              <TabsTrigger value="category">ক্যাটাগরি অনুযায়ী খরচ</TabsTrigger>
            </TabsList>
            
            <TabsContent value="expense">
              <ExpenseReport />
            </TabsContent>
            <TabsContent value="category">
              <ExpenseCategoryReport />
            </TabsContent>
          </Tabs>
        )}

        {/* Damage/Loss Reports */}
        {activeCategory === 'damage' && (
          <DamageLossReportsTab />
        )}
      </div>
    </MainLayout>
  );
}
