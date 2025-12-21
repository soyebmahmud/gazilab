import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useBOMs } from '@/hooks/useBOM';

export default function BOMPage() {
  const { data: boms, isLoading } = useBOMs();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bill of Materials</h1>
          <p className="text-muted-foreground">View and manage product formulations</p>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Est. Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boms?.map((bom) => (
                    <TableRow key={bom.id}>
                      <TableCell className="font-medium">{bom.product?.name}</TableCell>
                      <TableCell>v{bom.version}</TableCell>
                      <TableCell>₹{Number(bom.estimated_cost).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={bom.is_active ? 'bg-primary' : ''}>{bom.is_active ? 'Active' : 'Inactive'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{bom.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
