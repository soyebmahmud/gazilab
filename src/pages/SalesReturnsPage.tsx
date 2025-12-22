import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ModuleManual, SALES_RETURNS_MANUAL } from '@/components/ModuleManual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSalesReturns, RETURN_REASONS } from '@/hooks/useSalesReturns';
import { format } from 'date-fns';
import { Filter, RotateCcw, Package, AlertTriangle, Download } from 'lucide-react';

export default function SalesReturnsPage() {
  const { data: returns, isLoading } = useSalesReturns();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReturns = useMemo(() => {
    if (!returns) return [];
    
    return returns.filter(item => {
      // Date filter
      if (dateFrom) {
        const returnDate = new Date(item.return_date);
        const fromDate = new Date(dateFrom);
        if (returnDate < fromDate) return false;
      }
      if (dateTo) {
        const returnDate = new Date(item.return_date);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59);
        if (returnDate > toDate) return false;
      }
      
      // Reason filter
      if (reasonFilter !== 'all' && item.reason !== reasonFilter) return false;
      
      // Status filter
      if (statusFilter !== 'all' && item.return_status !== statusFilter) return false;
      
      return true;
    });
  }, [returns, dateFrom, dateTo, reasonFilter, statusFilter]);

  const getReasonLabel = (reason: string) => {
    return RETURN_REASONS.find(r => r.value === reason)?.label || reason;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'restored':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Restored to Stock</Badge>;
      case 'damaged':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">Marked Damaged</Badge>;
      case 'destroyed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Destroyed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setReasonFilter('all');
    setStatusFilter('all');
  };

  const exportToCSV = () => {
    if (filteredReturns.length === 0) return;
    
    const headers = ['Invoice No', 'Return Date', 'Product', 'SKU', 'Quantity', 'Reason', 'Status', 'Notes'];
    const rows = filteredReturns.map(item => [
      item.original_invoice_number,
      format(new Date(item.return_date), 'yyyy-MM-dd'),
      item.product?.name || 'Unknown',
      item.product?.sku || '',
      item.quantity_returned.toString(),
      getReasonLabel(item.reason),
      item.return_status,
      item.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales-returns-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Summary stats
  const totalReturns = filteredReturns.length;
  const totalQuantity = filteredReturns.reduce((sum, r) => sum + r.quantity_returned, 0);
  const restoredCount = filteredReturns.filter(r => r.return_status === 'restored').length;
  const pendingCount = filteredReturns.filter(r => r.return_status === 'pending').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <ModuleManual {...SALES_RETURNS_MANUAL} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Returns Report</h1>
            <p className="text-muted-foreground">View and analyze all sales returns with filters</p>
          </div>
          <Button variant="outline" onClick={exportToCSV} disabled={filteredReturns.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReturns}</div>
              <p className="text-xs text-muted-foreground">Return transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantity}</div>
              <p className="text-xs text-muted-foreground">Units returned</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Restored</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{restoredCount}</div>
              <p className="text-xs text-muted-foreground">Back to stock</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting decision</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Reason</label>
                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    {RETURN_REASONS.map(reason => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="restored">Restored</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="destroyed">Destroyed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Returns ({filteredReturns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.original_invoice_number}</TableCell>
                      <TableCell>{format(new Date(item.return_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="font-medium">{item.product?.name || 'Unknown'}</TableCell>
                      <TableCell>{item.product?.sku || '-'}</TableCell>
                      <TableCell>{item.quantity_returned}</TableCell>
                      <TableCell>{getReasonLabel(item.reason)}</TableCell>
                      <TableCell>{getStatusBadge(item.return_status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {filteredReturns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No returns found matching the filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
