import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExpiryAlerts } from '@/hooks/useExpiryAlerts';
import { AlertTriangle, Clock, AlertCircle, Info, Calendar } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

const alertLevelConfig = {
  expired: { color: 'bg-destructive', icon: AlertTriangle, label: 'Expired' },
  critical: { color: 'bg-red-500', icon: AlertCircle, label: 'Critical (< 30 days)' },
  warning: { color: 'bg-yellow-500', icon: Clock, label: 'Warning (30-60 days)' },
  info: { color: 'bg-blue-500', icon: Info, label: 'Info (60-90 days)' }
};

export default function ExpiryAlertsPage() {
  const [daysFilter, setDaysFilter] = useState(90);
  const { data: alerts, isLoading } = useExpiryAlerts(daysFilter);

  const alertCounts = {
    expired: alerts?.filter(a => a.alert_level === 'expired').length || 0,
    critical: alerts?.filter(a => a.alert_level === 'critical').length || 0,
    warning: alerts?.filter(a => a.alert_level === 'warning').length || 0,
    info: alerts?.filter(a => a.alert_level === 'info').length || 0
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Expiry Alerts</h1>
            <p className="text-muted-foreground">Monitor batch expiry dates for finished products</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show alerts for:</span>
            <Select value={daysFilter.toString()} onValueChange={(v) => setDaysFilter(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className={alertCounts.expired > 0 ? 'border-destructive' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expired</p>
                  <p className="text-3xl font-bold text-destructive">{alertCounts.expired}</p>
                </div>
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={alertCounts.critical > 0 ? 'border-red-500' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical (&lt; 30 days)</p>
                  <p className="text-3xl font-bold text-red-500">{alertCounts.critical}</p>
                </div>
                <div className="rounded-full bg-red-500/10 p-3">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={alertCounts.warning > 0 ? 'border-yellow-500' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Warning (30-60 days)</p>
                  <p className="text-3xl font-bold text-yellow-500">{alertCounts.warning}</p>
                </div>
                <div className="rounded-full bg-yellow-500/10 p-3">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming (60-90 days)</p>
                  <p className="text-3xl font-bold text-blue-500">{alertCounts.info}</p>
                </div>
                <div className="rounded-full bg-blue-500/10 p-3">
                  <Info className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Batch Expiry Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : alerts?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No expiring batches found within {daysFilter} days</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-right">Qty Available</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Days Left</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts?.map((alert) => {
                    const config = alertLevelConfig[alert.alert_level];
                    const Icon = config.icon;
                    
                    return (
                      <TableRow key={alert.batch_id} className={alert.alert_level === 'expired' ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium">{alert.product_name}</TableCell>
                        <TableCell className="text-muted-foreground">{alert.product_sku}</TableCell>
                        <TableCell className="font-mono">{alert.batch_number}</TableCell>
                        <TableCell className="text-right">{alert.quantity_available}</TableCell>
                        <TableCell>{format(new Date(alert.expiry_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <span className={alert.days_until_expiry <= 0 ? 'text-destructive font-bold' : ''}>
                            {alert.days_until_expiry <= 0 ? 'EXPIRED' : `${alert.days_until_expiry} days`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
