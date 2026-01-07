import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRawMaterials } from '@/hooks/useRawMaterials';
import { useProducts } from '@/hooks/useProducts';
import { Search, Leaf, Package, IndianRupee } from 'lucide-react';

export default function PriceListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: rawMaterials = [], isLoading: materialsLoading } = useRawMaterials();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const filteredMaterials = rawMaterials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMaterialValue = rawMaterials.reduce((sum, m) => sum + (m.cost_per_unit * m.current_stock), 0);
  const totalProductValue = products.reduce((sum, p) => sum + (p.selling_price * p.current_stock), 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">মূল্য তালিকা / Price List</h1>
          <p className="text-muted-foreground mt-1">সব Raw Materials এবং Finished Products এর দাম দেখুন</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rawMaterials.length}</div>
              <p className="text-xs text-muted-foreground">
                মোট মূল্য: ৳{totalMaterialValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finished Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                মোট মূল্য: ৳{totalProductValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">সর্বমোট মূল্য</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ৳{(totalMaterialValue + totalProductValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Raw Materials + Products</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="নাম বা SKU দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="raw-materials" className="space-y-4">
          <TabsList>
            <TabsTrigger value="raw-materials" className="gap-2">
              <Leaf className="h-4 w-4" />
              Raw Materials ({filteredMaterials.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Finished Products ({filteredProducts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="raw-materials">
            <Card>
              <CardHeader>
                <CardTitle>Raw Materials মূল্য তালিকা</CardTitle>
              </CardHeader>
              <CardContent>
                {materialsLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>নাম</TableHead>
                        <TableHead>ক্যাটাগরি</TableHead>
                        <TableHead>ইউনিট</TableHead>
                        <TableHead className="text-right">প্রতি ইউনিট দাম</TableHead>
                        <TableHead className="text-right">বর্তমান স্টক</TableHead>
                        <TableHead className="text-right">মোট মূল্য</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaterials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-mono text-sm">{material.sku}</TableCell>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{material.category}</Badge>
                          </TableCell>
                          <TableCell>{material.unit}</TableCell>
                          <TableCell className="text-right font-semibold">
                            ৳{material.cost_per_unit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            {material.current_stock.toLocaleString('en-IN')} {material.unit}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            ৳{(material.cost_per_unit * material.current_stock).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredMaterials.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            কোনো Raw Material পাওয়া যায়নি
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Finished Products মূল্য তালিকা</CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>নাম</TableHead>
                        <TableHead>ক্যাটাগরি</TableHead>
                        <TableHead className="text-right">ক্রয় মূল্য</TableHead>
                        <TableHead className="text-right">বিক্রয় মূল্য</TableHead>
                        <TableHead className="text-right">লাভ</TableHead>
                        <TableHead className="text-right">বর্তমান স্টক</TableHead>
                        <TableHead className="text-right">মোট মূল্য</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const profit = product.selling_price - product.cost_price;
                        const profitPercent = product.cost_price > 0 ? ((profit / product.cost_price) * 100).toFixed(1) : 0;
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{product.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              ৳{product.cost_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ৳{product.selling_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={profit >= 0 ? 'text-green-600' : 'text-destructive'}>
                                ৳{profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({profitPercent}%)
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {product.current_stock.toLocaleString('en-IN')} {product.unit}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-primary">
                              ৳{(product.selling_price * product.current_stock).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            কোনো Product পাওয়া যায়নি
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
