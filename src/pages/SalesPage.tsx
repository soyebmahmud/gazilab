import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ModuleManual, SALES_MANUAL } from '@/components/ModuleManual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSales, useCreateSale, useProductBatches } from '@/hooks/useSales';
import { useSalePayments, useAddPayment, useDeletePayment, PAYMENT_METHODS } from '@/hooks/useSalePayments';
import { useProcessSaleReturn, RETURN_REASONS } from '@/hooks/useSalesReturns';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { Plus, X, FileText, CreditCard, Package, Printer, Trash2, Eye, RotateCcw, AlertCircle } from 'lucide-react';
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
  const [manualInvoiceNumber, setManualInvoiceNumber] = useState('');
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
      manual_invoice_number: manualInvoiceNumber || undefined,
      items: validItems
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Invoice # (Optional)</Label>
          <Input 
            value={manualInvoiceNumber} 
            onChange={(e) => setManualInvoiceNumber(e.target.value)}
            placeholder="Auto-generate if empty"
          />
          <p className="text-xs text-muted-foreground">Leave blank for auto: #GLL-YYYY-MM-DD-XXXX</p>
        </div>
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
  const { data: payments } = useSalePayments(saleId);
  const addPayment = useAddPayment();
  const deletePayment = useDeletePayment();
  const processReturn = useProcessSaleReturn();
  const printRef = useRef<HTMLDivElement>(null);

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentNote, setPaymentNote] = useState('');

  // Return form state
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnItemId, setReturnItemId] = useState('');
  const [returnQty, setReturnQty] = useState(0);
  const [returnReason, setReturnReason] = useState('customer_return');
  const [restoreToStock, setRestoreToStock] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: sale ? `Invoice-${sale.invoice_number}` : 'Invoice',
  });

  if (!sale) return null;

  const paidAmount = sale.paid_amount || 0;
  const dueAmount = sale.total_amount - paidAmount;

  const handleAddPayment = async () => {
    if (paymentAmount <= 0) return;
    
    await addPayment.mutateAsync({
      sale_id: saleId,
      amount: paymentAmount,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      reference_note: paymentNote || undefined
    });
    
    setShowPaymentForm(false);
    setPaymentAmount(0);
    setPaymentMethod('cash');
    setPaymentNote('');
  };

  const handleProcessReturn = async () => {
    if (!returnItemId || returnQty <= 0) return;
    
    await processReturn.mutateAsync({
      sale_id: saleId,
      sale_item_id: returnItemId,
      quantity: returnQty,
      reason: returnReason,
      restore_to_stock: restoreToStock,
      notes: returnNotes || undefined
    });
    
    setShowReturnForm(false);
    setReturnItemId('');
    setReturnQty(0);
    setReturnReason('customer_return');
    setRestoreToStock(false);
    setReturnNotes('');
  };

  const getStatusBadge = () => {
    if (sale.payment_status === 'paid') {
      return <Badge className="bg-green-500 text-white">🟢 Paid</Badge>;
    } else if (sale.payment_status === 'partial') {
      return <Badge className="bg-yellow-500 text-white">🟡 Partial Paid</Badge>;
    }
    return <Badge className="bg-red-500 text-white">🔴 Unpaid</Badge>;
  };

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoice {sale.invoice_number}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Header Info */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-accent rounded-lg">
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
            {getStatusBadge()}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Amount</p>
            <p className={`font-bold ${dueAmount > 0 ? 'text-destructive' : 'text-green-600'}`}>
              ৳{dueAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Items</h4>
            <Button size="sm" variant="outline" onClick={() => setShowReturnForm(!showReturnForm)}>
              <RotateCcw className="h-3 w-3 mr-1" /> Process Return
            </Button>
          </div>

          {showReturnForm && (
            <div className="p-4 border rounded-lg space-y-3 bg-orange-50 dark:bg-orange-950/20">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Process Sales Return</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Select Item</Label>
                  <Select value={returnItemId} onValueChange={(v) => {
                    setReturnItemId(v);
                    const item = sale.items?.find(i => i.id === v);
                    if (item) setReturnQty(item.quantity);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select item to return" /></SelectTrigger>
                    <SelectContent>
                      {sale.items?.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.product?.name} (Qty: {item.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Return Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={returnQty}
                    onChange={(e) => setReturnQty(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reason</Label>
                  <Select value={returnReason} onValueChange={setReturnReason}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RETURN_REASONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    placeholder="Optional"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="restoreStock"
                  checked={restoreToStock}
                  onChange={(e) => setRestoreToStock(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="restoreStock" className="text-sm">
                  Restore to sellable stock immediately (otherwise goes to Damaged Goods for review)
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowReturnForm(false)}>Cancel</Button>
                <Button 
                  size="sm" 
                  onClick={handleProcessReturn} 
                  disabled={!returnItemId || returnQty <= 0 || processReturn.isPending}
                >
                  Process Return
                </Button>
              </div>
            </div>
          )}

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
        </div>

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
          <div className="flex justify-between text-sm text-green-600">
            <span>Paid</span>
            <span>৳{paidAmount.toFixed(2)}</span>
          </div>
          <div className={`flex justify-between font-bold ${dueAmount > 0 ? 'text-destructive' : 'text-green-600'}`}>
            <span>Due</span>
            <span>৳{dueAmount.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        {/* Payment History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Payment History</h4>
            {dueAmount > 0 && (
              <Button size="sm" onClick={() => {
                setPaymentAmount(dueAmount);
                setShowPaymentForm(true);
              }}>
                <Plus className="h-3 w-3 mr-1" /> Add Payment
              </Button>
            )}
          </div>

          {showPaymentForm && (
            <div className="p-4 border rounded-lg space-y-3 bg-accent/50">
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    max={dueAmount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reference</Label>
                  <Input
                    placeholder="Optional"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowPaymentForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddPayment} disabled={addPayment.isPending || paymentAmount <= 0}>
                  Record Payment
                </Button>
              </div>
            </div>
          )}

          {payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.reference_note || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">৳{payment.amount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deletePayment.mutate({ paymentId: payment.id, saleId })}
                        disabled={deletePayment.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet</p>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => handlePrint()}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Hidden print component */}
      <div className="hidden">
        <InvoicePrint ref={printRef} sale={sale} />
      </div>
    </DialogContent>
  );
}

const getPaymentStatusBadge = (status: string, dueAmount: number) => {
  if (status === 'paid') {
    return <Badge className="bg-green-500 text-white">🟢 Paid</Badge>;
  } else if (status === 'partial') {
    return <Badge className="bg-yellow-500 text-white">🟡 Partial</Badge>;
  }
  return <Badge className="bg-red-500 text-white">🔴 Unpaid</Badge>;
};

export default function SalesPage() {
  const { data: sales, isLoading } = useSales();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewSaleId, setViewSaleId] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className="space-y-6">
        <ModuleManual {...SALES_MANUAL} />
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
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales?.map((sale) => {
                    const paidAmount = sale.paid_amount || 0;
                    const dueAmount = sale.total_amount - paidAmount;
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-sm">{sale.invoice_number}</TableCell>
                        <TableCell className="font-medium">{sale.customer?.name || 'Walk-in'}</TableCell>
                        <TableCell>{format(new Date(sale.sale_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right font-medium">৳{sale.total_amount}</TableCell>
                        <TableCell className="text-right text-green-600">৳{paidAmount.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-medium ${dueAmount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                          ৳{dueAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(sale.payment_status, dueAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => setViewSaleId(sale.id)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
