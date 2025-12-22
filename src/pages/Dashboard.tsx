import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats, useInventoryInsights, useManufacturingInsights, useAlerts, useSalesTrends, useProductionTrends, useWeeklySales, useInventoryTrends, useTopSellingProducts, useProfitMargins, useMaterialConsumption, useSalesByCustomer, useTodayProfit, useMonthProfit, useProfitTrends, useTopProfitableProducts } from '@/hooks/useDashboard';
import { useProductionFeasibility } from '@/hooks/useProductionFeasibility';
import { Package, Leaf, DollarSign, Factory, AlertTriangle, TrendingUp, Boxes, Ban, ShoppingCart, Activity, Calendar, Warehouse, Trophy, Percent, FlaskConical, Users, CheckCircle, XCircle, TrendingDown, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, Area, AreaChart, ComposedChart } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function StatCard({ title, value, icon: Icon, subtitle }: { title: string; value: string | number; icon: React.ElementType; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StockStatusBadge({ current, min }: { current: number; min: number }) {
  if (current <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
  if (current <= min) return <Badge className="bg-yellow-500">Low Stock</Badge>;
  return <Badge className="bg-primary">In Stock</Badge>;
}

export default function Dashboard() {
  const [profitPeriod, setProfitPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: inventory } = useInventoryInsights();
  const { data: manufacturing } = useManufacturingInsights();
  const { data: alerts } = useAlerts();
  const { data: salesTrends } = useSalesTrends();
  const { data: productionTrends } = useProductionTrends();
  const { data: weeklySales } = useWeeklySales();
  const { data: inventoryTrends } = useInventoryTrends();
  const { data: topProducts } = useTopSellingProducts();
  const { data: profitMargins } = useProfitMargins();
  const { data: materialConsumption } = useMaterialConsumption();
  const { data: salesByCustomer } = useSalesByCustomer();
  const { data: feasibility } = useProductionFeasibility();
  const { data: todayProfit } = useTodayProfit();
  const { data: monthProfit } = useMonthProfit();
  const { data: profitTrends } = useProfitTrends(profitPeriod);
  const { data: topProfitableProducts } = useTopProfitableProducts();

  if (statsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  const formatCurrency = (value: number) => `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your manufacturing operations</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Products" value={stats?.totalProducts || 0} icon={Package} />
          <StatCard title="Raw Materials" value={stats?.totalMaterials || 0} icon={Leaf} />
          <StatCard title="Total Receivable" value={formatCurrency(stats?.totalReceivable || 0)} icon={DollarSign} />
          <StatCard title="Inventory Value" value={formatCurrency(stats?.inventoryValue || 0)} icon={Boxes} />
        </div>

        {/* Net Profit Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Today's Profit */}
          <Card className={`${(todayProfit?.netProfit || 0) >= 0 ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">আজকের নেট লাভ</p>
                  <p className={`text-2xl font-bold ${(todayProfit?.netProfit || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(todayProfit?.netProfit || 0)}
                  </p>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <p>বিক্রয়: {formatCurrency(todayProfit?.totalSales || 0)}</p>
                    <p>খরচ: {formatCurrency(todayProfit?.totalExpenses || 0)}</p>
                  </div>
                </div>
                <div className={`rounded-full p-3 ${(todayProfit?.netProfit || 0) >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                  {(todayProfit?.netProfit || 0) >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-primary" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Sales */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">আজকের বিক্রয়</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(todayProfit?.totalSales || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">COGS: {formatCurrency(todayProfit?.cogs || 0)}</p>
                </div>
                <div className="rounded-full bg-chart-1/10 p-3">
                  <ShoppingCart className="h-6 w-6 text-chart-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Expenses */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">আজকের খরচ</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(todayProfit?.totalExpenses || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Gross Profit: {formatCurrency(todayProfit?.grossProfit || 0)}</p>
                </div>
                <div className="rounded-full bg-destructive/10 p-3">
                  <Wallet className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month's Profit */}
          <Card className={`${(monthProfit?.netProfit || 0) >= 0 ? 'border-chart-2/30 bg-chart-2/5' : 'border-destructive/30 bg-destructive/5'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">এই মাসের নেট লাভ</p>
                  <p className={`text-2xl font-bold ${(monthProfit?.netProfit || 0) >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                    {formatCurrency(monthProfit?.netProfit || 0)}
                  </p>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <p>বিক্রয়: {formatCurrency(monthProfit?.totalSales || 0)}</p>
                    <p>খরচ: {formatCurrency(monthProfit?.totalExpenses || 0)}</p>
                  </div>
                </div>
                <div className={`rounded-full p-3 ${(monthProfit?.netProfit || 0) >= 0 ? 'bg-chart-2/10' : 'bg-destructive/10'}`}>
                  <Calendar className="h-6 w-6 text-chart-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profit Trend Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                লাভ-ক্ষতি ট্রেন্ড
              </CardTitle>
              <Tabs value={profitPeriod} onValueChange={(v) => setProfitPeriod(v as 'daily' | 'monthly' | 'yearly')}>
                <TabsList>
                  <TabsTrigger value="daily">দৈনিক</TabsTrigger>
                  <TabsTrigger value="monthly">মাসিক</TabsTrigger>
                  <TabsTrigger value="yearly">বাৎসরিক</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {profitTrends && profitTrends.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={profitTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      interval={profitPeriod === 'daily' ? 4 : 0}
                    />
                    <YAxis 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                      tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = {
                          sales: 'বিক্রয়',
                          expenses: 'খরচ',
                          cogs: 'পণ্য খরচ',
                          grossProfit: 'গ্রস লাভ',
                          netProfit: 'নেট লাভ'
                        };
                        return [`৳${value.toLocaleString()}`, labels[name] || name];
                      }}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend 
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          sales: 'বিক্রয়',
                          expenses: 'খরচ',
                          netProfit: 'নেট লাভ'
                        };
                        return labels[value] || value;
                      }}
                    />
                    <Bar 
                      dataKey="sales" 
                      fill="hsl(var(--chart-1))" 
                      radius={[4, 4, 0, 0]}
                      name="sales"
                    />
                    <Bar 
                      dataKey="expenses" 
                      fill="hsl(var(--chart-3))" 
                      radius={[4, 4, 0, 0]}
                      name="expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="netProfit" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2 }}
                      name="netProfit"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No profit data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Profitable Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              টপ ৫ লাভজনক প্রোডাক্ট
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProfitableProducts && topProfitableProducts.length > 0 ? (
              <div className="space-y-3">
                {topProfitableProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku} • {product.unitsSold} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">৳{product.totalProfit.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</p>
                      <p className="text-xs text-muted-foreground">{product.profitMargin.toFixed(1)}% margin</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No sales data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Value Breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Raw Material Value" value={formatCurrency(stats?.rawMaterialValue || 0)} icon={Leaf} />
          <StatCard title="Finished Goods Value" value={formatCurrency(stats?.finishedGoodsValue || 0)} icon={Package} />
          <StatCard title="Manufacturing Value" value={formatCurrency(stats?.manufacturingValue || 0)} icon={Factory} />
        </div>

        {/* Blocked Products Alert - PROMINENT */}
        {alerts?.blockedProducts && alerts.blockedProducts.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Ban className="h-5 w-5" />
                Blocked for Production ({alerts.blockedProducts.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These products cannot be manufactured due to insufficient raw materials
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.blockedProducts.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Blocked by: <span className="text-destructive font-medium">{item.material?.name}</span>
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>Required: <span className="font-medium">{item.required.toFixed(3)} {item.material?.unit}</span></p>
                      <p>Available: <span className="text-destructive font-medium">{item.available.toFixed(3)} {item.material?.unit}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Production Feasibility Widget */}
        {feasibility && feasibility.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                Production Feasibility Status
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Which products can be manufactured with current stock
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {feasibility.slice(0, 9).map((item) => (
                  <div 
                    key={item.productId} 
                    className={`p-3 rounded-lg border ${
                      item.canProduce 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-destructive/10 border-destructive/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.productSku}</p>
                      </div>
                      {item.canProduce ? (
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                      )}
                    </div>
                    <div className="mt-2 text-xs">
                      {item.canProduce ? (
                        <span className="text-primary font-medium">
                          Can produce up to {item.maxProducibleQuantity.toLocaleString()} units
                        </span>
                      ) : (
                        <span className="text-destructive">
                          Blocked by: {item.blockingMaterials.map(m => m.name).slice(0, 2).join(', ')}
                          {item.blockingMaterials.length > 2 && ` +${item.blockingMaterials.length - 2} more`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {feasibility.length > 9 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Showing 9 of {feasibility.length} products with BOMs
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Products by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Products by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.productsByCategory && stats.productsByCategory.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.productsByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="count"
                        nameKey="category"
                        label={({ category, count }) => `${category}: ${count}`}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {stats.productsByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No products yet</p>
              )}
            </CardContent>
          </Card>

          {/* Manufacturing Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Manufacturing Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                <span className="text-sm">Costliest Product</span>
                <span className="font-semibold">{manufacturing?.costliestProduct?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                <span className="text-sm">Avg Manufacturing Cost</span>
                <span className="font-semibold">{formatCurrency(manufacturing?.averageCost || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                <span className="text-sm">Production Efficiency</span>
                <span className="font-semibold">{(manufacturing?.productionEfficiency || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                <span className="text-sm">Completed Batches</span>
                <span className="font-semibold">{manufacturing?.completedBatches || 0} / {manufacturing?.totalBatches || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Trends & Production Trends */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sales Trends Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Sales Trends (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesTrends && salesTrends.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Sales']}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar 
                        dataKey="total" 
                        fill="hsl(var(--chart-1))" 
                        radius={[4, 4, 0, 0]}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No sales data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Production Trends Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Production Trends (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productionTrends && productionTrends.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={productionTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="produced" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--chart-2))' }}
                        name="Units Produced"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="batches" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--chart-3))' }}
                        name="Batches"
                        animationBegin={200}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No production data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Sales & Inventory Trends */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Sales Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                This Week's Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklySales && weeklySales.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklySales}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="day" 
                        className="text-xs" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                        tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`} 
                      />
                      <Tooltip 
                        formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Sales']}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar 
                        dataKey="total" 
                        fill="hsl(var(--chart-4))" 
                        radius={[4, 4, 0, 0]}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No sales this week</p>
              )}
            </CardContent>
          </Card>

          {/* Inventory Value Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Inventory Value Trends (Last 14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryTrends && inventoryTrends.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={inventoryTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                        tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`৳${value.toLocaleString()}`, '']}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="products" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--chart-1))' }}
                        name="Finished Goods"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="materials" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--chart-2))' }}
                        name="Raw Materials"
                        animationBegin={200}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="hsl(var(--chart-5))" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: 'hsl(var(--chart-5))' }}
                        name="Total Value"
                        animationBegin={400}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No inventory data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Profit Margins */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts && topProducts.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number" 
                        className="text-xs" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        className="text-xs" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        width={100}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? `৳${value.toLocaleString()}` : value.toLocaleString(),
                          name === 'revenue' ? 'Revenue' : 'Qty Sold'
                        ]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="revenue" 
                        fill="hsl(var(--chart-1))" 
                        radius={[0, 4, 4, 0]}
                        name="Revenue"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No sales data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Profit Margins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Profit Margins by Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profitMargins && profitMargins.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitMargins}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        className="text-xs" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        className="text-xs" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `৳${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `৳${value.toFixed(2)}`,
                          name === 'cost' ? 'Mfg Cost' : name === 'price' ? 'Selling Price' : 'Profit'
                        ]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="cost" 
                        fill="hsl(var(--chart-3))" 
                        name="Mfg Cost"
                        stackId="a"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                      <Bar 
                        dataKey="profit" 
                        fill="hsl(var(--chart-2))" 
                        name="Profit"
                        stackId="a"
                        animationBegin={200}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No product data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Low Stock Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Low Stock Products ({stats?.lowStockProducts?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{product.current_stock} / {product.min_stock_level}</p>
                        <StockStatusBadge current={product.current_stock} min={product.min_stock_level} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">All products have sufficient stock</p>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Low Stock Materials ({stats?.lowStockMaterials?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.lowStockMaterials && stats.lowStockMaterials.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.lowStockMaterials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-xs text-muted-foreground">{material.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{material.current_stock} {material.unit}</p>
                        <StockStatusBadge current={material.current_stock} min={material.min_stock_level} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">All materials have sufficient stock</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Material Consumption & Sales by Customer */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Material Consumption Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Material Consumption in Production
              </CardTitle>
            </CardHeader>
            <CardContent>
              {materialConsumption && materialConsumption.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={materialConsumption} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number) => [value.toFixed(2), '']}
                      />
                      <Legend />
                      <Bar 
                        dataKey="used" 
                        stackId="a"
                        fill="hsl(var(--chart-1))" 
                        name="Used"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                      <Bar 
                        dataKey="wastage" 
                        stackId="a"
                        fill="hsl(var(--chart-3))" 
                        name="Wastage"
                        animationBegin={200}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No production data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Sales by Customer Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Customers by Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesByCustomer && salesByCustomer.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByCustomer} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number, name: string) => [
                          name === 'total' ? `৳${value.toLocaleString()}` : value,
                          name === 'total' ? 'Sales' : 'Orders'
                        ]}
                      />
                      <Bar 
                        dataKey="total" 
                        fill="hsl(var(--chart-4))" 
                        radius={[0, 4, 4, 0]}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No customer sales data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Out of Stock Materials */}
        {alerts?.outOfStock && alerts.outOfStock.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Out of Stock Materials ({alerts.outOfStock.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {alerts.outOfStock.map((material: any) => (
                  <Badge key={material.id} variant="destructive">
                    {material.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
