import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSales, useCreateSale, useProductBatches, useUpdatePaymentStatus } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { Plus, X, FileText, Eye, CreditCard, Package, Printer } from 'lucide-react';
import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { InvoicePrint } from '@/components/InvoicePrint';
import { useReactToPrint } from 'react-to-print';

interface SaleItemForm {
  product_id: string;
  production_batch_id?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
}

function BatchSelector({ productId, value, onChange }: { productId: string; value?: string; onChange: (v: string) => void }) {
  const { data: batches, isLoading } = useProductBatches(productId);
  
  if (!productId) return null;
  
  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? "Loading..." : "Select batch (FIFO)"} />
      </SelectTrigger>
      <SelectContent>
        {batches?.map(batch => (
          <SelectItem key={batch.batch_id} value={batch.batch_id}>
            <div className="flex items-center gap-2">
              <span>{batch.batch_number}</span>
              <Badge variant="outline" className="text-xs">{batch.quantity_available} avail</Badge>
              {batch.expiry_date && (
                <span className="text-xs text-muted-foreground">
                  Exp: {format(new Date(batch.expiry_date), 'dd/MM/yy')}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
        {batches?.length === 0 && (
          <div className="p-2 text-sm text-muted-foreground text-center">No batches available</div>
        )}
      </SelectContent>
    </Select>
  );
}

function CreateSaleDialog({ onClose }: { onClose: () => void }) {
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const createSale = useCreateSale();
  
  const [customerId, setCustomerId] = useState<string>('');
  const [saleDate, setSaleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SaleItemForm[]>([]);

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, discount_percent: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleItemForm, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill price when product selected
    if (field === 'product_id' && typeof value === 'string') {
      const product = products?.find(p => p.id === value);
      if (product) {
        updated[index].unit_price = product.selling_price;
      }
    }
    
    setItems(updated);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price * (1 - item.discount_percent / 100));
  }, 0);
  const taxAmount = (subtotal - discountAmount) * (taxPercent / 100);
  const total = subtotal - discountAmount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(item => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      return;
    }
    
    await createSale.mutateAsync({
      customer_id: customerId || undefined,
      sale_date: saleDate,
      discount_amount: discountAmount,
      tax_percent: taxPercent,
      notes: notes || undefined,
      items: validItems
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Customer (Optional)</Label>
          <Select value={customerId} onValueChange={(v) => setCustomerId(v === 'walk-in' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Walk-in customer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="walk-in">Walk-in Customer</SelectItem>
              {customers?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sale Date</Label>
          <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
        </div>
      </div>

      {/* Line Items */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Items</Label>
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </div>
        
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add products to the invoice
          </p>
        )}
        
        {items.map((item, index) => {
          const product = products?.find(p => p.id === item.product_id);
          const lineTotal = item.quantity * item.unit_price * (1 - item.discount_percent / 100);
          
          return (
            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-accent/50 rounded-lg">
              <div className="col-span-3">
                <Label className="text-xs">Product</Label>
                <Select value={item.product_id} onValueChange={(v) => updateItem(index, 'product_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {products?.filter(p => p.current_stock > 0).map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          <Badge variant="outline" className="text-xs">{p.current_stock} in stock</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Batch</Label>
                <BatchSelector 
                  productId={item.product_id} 
                  value={item.production_batch_id}
                  onChange={(v) => updateItem(index, 'production_batch_id', v)}
                />
              </div>
              <div className="col-span-1">
                <Label className="text-xs">Qty</Label>
                <Input 
                  type="number" 
                  min="1"
                  value={item.quantity} 
                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Price</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={item.unit_price} 
                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-1">
                <Label className="text-xs">Disc %</Label>
                <Input 
                  type="number" 
                  min="0" max="100"
                  value={item.discount_percent} 
                  onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-1 text-right">
                <Label className="text-xs">Total</Label>
                <p className="font-medium py-2">৳{lineTotal.toFixed(2)}</p>
              </div>
              <div className="col-span-1">
                <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Discount (৳)</Label>
          <Input 
            type="number" 
            step="0.01"
            value={discountAmount} 
            onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label>Tax (%)</Label>
          <Input 
            type="number" 
            step="0.01"
            value={taxPercent} 
            onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Input 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-accent rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>৳{subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-destructive">
            <span>Discount</span>
            <span>-৳{discountAmount.toFixed(2)}</span>
          </div>
        )}
        {taxPercent > 0 && (
          <div className="flex justify-between text-sm">
            <span>Tax ({taxPercent}%)</span>
            <span>৳{taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total</span>
          <span>৳{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={items.length === 0 || createSale.isPending}>
          <FileText className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>
    </form>
  );
}

function SaleDetailsDialog({ saleId, onClose }: { saleId: string; onClose: () => void }) {
  const { data: sales } = useSales();
  const sale = sales?.find(s => s.id === saleId);
  const updatePayment = useUpdatePaymentStatus();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: sale ? `Invoice-${sale.invoice_number}` : 'Invoice',
  });

  if (!sale) return null;

  const handleMarkPaid = () => {
    updatePayment.mutate({ saleId, status: 'paid' });
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoice {sale.invoice_number}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Header Info */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-accent rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium">{sale.customer?.name || 'Walk-in'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">{format(new Date(sale.sale_date), 'dd MMM yyyy')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className={
              sale.payment_status === 'paid' ? 'bg-primary' :
              sale.payment_status === 'partial' ? 'bg-yellow-500' : 'bg-secondary'
            }>
              {sale.payment_status}
            </Badge>
          </div>
        </div>

        {/* Items */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product?.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.production_batch?.batch_number || '-'}
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">৳{item.unit_price}</TableCell>
                <TableCell className="text-right font-medium">৳{item.line_total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>৳{sale.subtotal}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-destructive">
              <span>Discount</span>
              <span>-৳{sale.discount_amount}</span>
            </div>
          )}
          {sale.tax_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax ({sale.tax_percent}%)</span>
              <span>৳{sale.tax_amount}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>৳{sale.total_amount}</span>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => handlePrint()}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
          {sale.payment_status !== 'paid' && (
            <Button onClick={handleMarkPaid} disabled={updatePayment.isPending}>
              <CreditCard className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Hidden print component */}
      <div className="hidden">
        <InvoicePrint ref={printRef} sale={sale} />
      </div>
    </DialogContent>
  );
}

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-secondary',
  partial: 'bg-yellow-500',
  paid: 'bg-primary'
};

export default function SalesPage() {
  const { data: sales, isLoading } = useSales();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewSaleId, setViewSaleId] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales</h1>
            <p className="text-muted-foreground">Manage invoices and sales</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Sale</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader><DialogTitle>Create New Sale</DialogTitle></DialogHeader>
              <CreateSaleDialog onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : sales?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No sales yet. Create your first invoice.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales?.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm">{sale.invoice_number}</TableCell>
                      <TableCell className="font-medium">{sale.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell>{format(new Date(sale.sale_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right">{sale.items?.length || 0}</TableCell>
                      <TableCell className="text-right font-medium">৳{sale.total_amount}</TableCell>
                      <TableCell>
                        <Badge className={paymentStatusColors[sale.payment_status]}>
                          {sale.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setViewSaleId(sale.id)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Sale Dialog */}
        <Dialog open={!!viewSaleId} onOpenChange={(open) => !open && setViewSaleId(null)}>
          {viewSaleId && <SaleDetailsDialog saleId={viewSaleId} onClose={() => setViewSaleId(null)} />}
        </Dialog>
      </div>
    </MainLayout>
  );
}
