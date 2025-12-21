import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats, useInventoryInsights, useManufacturingInsights, useAlerts } from '@/hooks/useDashboard';
import { Package, Leaf, DollarSign, Factory, AlertTriangle, TrendingUp, Boxes, Ban } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';

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
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: inventory } = useInventoryInsights();
  const { data: manufacturing } = useManufacturingInsights();
  const { data: alerts } = useAlerts();

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
