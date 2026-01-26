import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ModuleManual, PURCHASE_ORDERS_MANUAL } from '@/components/ModuleManual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePurchaseOrders, useCreatePurchaseOrder, useReceivePOItems, useUpdatePOStatus } from '@/hooks/usePurchaseOrders';
import { usePurchaseOrderPayments, useAddPOPayment } from '@/hooks/usePurchaseOrderPayments';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useRawMaterials } from '@/hooks/useRawMaterials';
import { useSellers } from '@/hooks/useSellers';
import { Plus, X, FileText, Eye, Package, Truck, CheckCircle, CreditCard, Wallet, Banknote, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

interface POItemForm {
  raw_material_id: string;
  quantity: number;
  unit_price: number;
}

function CreatePODialog({ onClose }: { onClose: () => void }) {
  const { data: materials } = useRawMaterials();
  const { data: sellers } = useSellers();
  const createPO = useCreatePurchaseOrder();
  
  const [sellerId, setSellerId] = useState<string>('');
  const [orderDate, setOrderDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expectedDate, setExpectedDate] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItemForm[]>([]);

  const addItem = () => {
    setItems([...items, { raw_material_id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof POItemForm, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'raw_material_id' && typeof value === 'string') {
      const material = materials?.find(m => m.id === value);
      if (material) {
        updated[index].unit_price = material.cost_per_unit;
      }
    }
    
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = (subtotal - discountAmount) * (taxPercent / 100);
  const total = subtotal - discountAmount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(item => item.raw_material_id && item.quantity > 0);
    if (validItems.length === 0) return;
    
    await createPO.mutateAsync({
      seller_id: sellerId || undefined,
      order_date: orderDate,
      expected_delivery_date: expectedDate || undefined,
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
          <Label>Seller (Optional)</Label>
          <Select value={sellerId} onValueChange={(v) => setSellerId(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Select seller" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Seller</SelectItem>
              {sellers?.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Order Date</Label>
          <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Expected Delivery</Label>
          <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Items</Label>
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </div>
        
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add raw materials to the purchase order
          </p>
        )}
        
        {items.map((item, index) => {
          const material = materials?.find(m => m.id === item.raw_material_id);
          const lineTotal = item.quantity * item.unit_price;
          
          return (
            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-accent/50 rounded-lg">
              <div className="col-span-5">
                <Label className="text-xs">Material</Label>
                <Select value={item.raw_material_id} onValueChange={(v) => updateItem(index, 'raw_material_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {materials?.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
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
              <div className="col-span-2 text-right">
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
        <Button type="submit" disabled={items.length === 0 || createPO.isPending}>
          <FileText className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </div>
    </form>
  );
}

function ReceiveItemsDialog({ po, onClose }: { po: any; onClose: () => void }) {
  const receiveItems = useReceivePOItems();
  const [receivingData, setReceivingData] = useState<Record<string, {
    batch_number: string;
    expiry_date: string;
    quantity: number;
    cost_per_unit: number;
  }>>({});

  const updateReceiving = (itemId: string, field: string, value: any) => {
    setReceivingData(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const handleReceive = async () => {
    const items = po.items
      ?.filter((item: any) => receivingData[item.id]?.batch_number && receivingData[item.id]?.quantity > 0)
      .map((item: any) => ({
        item_id: item.id,
        raw_material_id: item.raw_material_id,
        quantity: receivingData[item.id].quantity,
        batch_number: receivingData[item.id].batch_number,
        expiry_date: receivingData[item.id].expiry_date || undefined,
        cost_per_unit: receivingData[item.id].cost_per_unit || item.unit_price
      }));

    if (items.length === 0) return;

    await receiveItems.mutateAsync({ poId: po.id, items });
    onClose();
  };

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Receive Items - {po.order_number}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {po.items?.map((item: any) => (
          <div key={item.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{item.raw_material?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Ordered: {item.quantity} {item.raw_material?.unit} @ ৳{item.unit_price}
                </p>
              </div>
              <Badge variant={item.received_quantity > 0 ? 'default' : 'secondary'}>
                {item.received_quantity > 0 ? 'Received' : 'Pending'}
              </Badge>
            </div>
            
            {item.received_quantity === 0 && (
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Batch Number *</Label>
                  <Input 
                    value={receivingData[item.id]?.batch_number || ''}
                    onChange={(e) => updateReceiving(item.id, 'batch_number', e.target.value)}
                    placeholder="e.g., RM-001"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input 
                    type="number"
                    value={receivingData[item.id]?.quantity || item.quantity}
                    onChange={(e) => updateReceiving(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cost/Unit</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={receivingData[item.id]?.cost_per_unit || item.unit_price}
                    onChange={(e) => updateReceiving(item.id, 'cost_per_unit', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Expiry Date</Label>
                  <Input 
                    type="date"
                    value={receivingData[item.id]?.expiry_date || ''}
                    onChange={(e) => updateReceiving(item.id, 'expiry_date', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleReceive} disabled={receiveItems.isPending}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Receive Items
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// Payment Dialog Component
function POPaymentDialog({ po, onClose }: { po: any; onClose: () => void }) {
  const { data: payments, isLoading: loadingPayments } = usePurchaseOrderPayments(po.id);
  const { data: bankAccounts } = useBankAccounts();
  const addPayment = useAddPOPayment();
  
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const totalPaid = Number(po.paid_amount) || 0;
  const dueAmount = Number(po.total_amount) - totalPaid;

  const handleAddPayment = async () => {
    if (paymentAmount <= 0) return;
    
    await addPayment.mutateAsync({
      purchase_order_id: po.id,
      amount: paymentAmount,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      bank_account_id: paymentMethod === 'bank' ? bankAccountId || undefined : undefined,
      reference_note: paymentNote || undefined
    });
    
    setPaymentAmount(0);
    setPaymentNote('');
  };

  const paymentMethodIcons: Record<string, any> = {
    cash: Banknote,
    bank: CreditCard,
    mobile: Smartphone,
    credit: Wallet
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment - {po.order_number}
        </DialogTitle>
        <DialogDescription>
          Record and track payments for this purchase order
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Payment Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-accent/50 text-center">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-xl font-bold">৳{Number(po.total_amount).toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10 text-center">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-xl font-bold text-primary">৳{totalPaid.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg text-center ${dueAmount > 0 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
            <p className="text-sm text-muted-foreground">Due Amount</p>
            <p className={`text-xl font-bold ${dueAmount > 0 ? 'text-destructive' : 'text-green-500'}`}>
              ৳{dueAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Seller Info */}
        {po.seller && (
          <div className="p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Seller</p>
            <p className="font-medium">{po.seller.name}</p>
            {po.seller.phone && <p className="text-sm text-muted-foreground">{po.seller.phone}</p>}
          </div>
        )}

        {/* Add Payment Form */}
        {dueAmount > 0 && (
          <div className="p-4 border rounded-lg space-y-4 bg-accent/30">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Record Payment
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (৳)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPaymentAmount(dueAmount)}
                  className="w-full"
                >
                  Pay Full Due (৳{dueAmount.toLocaleString()})
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <span className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" /> Cash
                      </span>
                    </SelectItem>
                    <SelectItem value="bank">
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Bank Transfer
                      </span>
                    </SelectItem>
                    <SelectItem value="mobile">
                      <span className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" /> Mobile Banking
                      </span>
                    </SelectItem>
                    <SelectItem value="credit">
                      <span className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> Credit
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              
              {paymentMethod === 'bank' && (
                <div className="space-y-2">
                  <Label>Bank Account</Label>
                  <Select value={bankAccountId} onValueChange={setBankAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts?.map(bank => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.bank_name} - {bank.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="col-span-2 space-y-2">
                <Label>Reference/Note</Label>
                <Input
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Transaction ID, cheque no, etc."
                />
              </div>
            </div>
            
            <Button 
              onClick={handleAddPayment} 
              disabled={paymentAmount <= 0 || addPayment.isPending}
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
        )}

        {/* Payment History */}
        <div className="space-y-3">
          <h4 className="font-medium">Payment History</h4>
          
          {loadingPayments ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : payments?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
              No payments recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {payments?.map((payment) => {
                const Icon = paymentMethodIcons[payment.payment_method] || Wallet;
                return (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">৳{Number(payment.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.payment_date), 'dd MMM yyyy')} • {payment.payment_method}
                        </p>
                        {payment.reference_note && (
                          <p className="text-xs text-muted-foreground">{payment.reference_note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </DialogContent>
  );
}

const statusColors: Record<string, string> = {
  pending: 'bg-secondary',
  approved: 'bg-blue-500',
  received: 'bg-primary',
  cancelled: 'bg-destructive'
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-destructive text-destructive-foreground',
  partial: 'bg-amber-500 text-white',
  paid: 'bg-green-500 text-white'
};

export default function PurchaseOrdersPage() {
  const { data: orders, isLoading } = usePurchaseOrders();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiveDialogPO, setReceiveDialogPO] = useState<any>(null);
  const [paymentDialogPO, setPaymentDialogPO] = useState<any>(null);

  return (
    <MainLayout>
      <div className="space-y-6">
        <ModuleManual {...PURCHASE_ORDERS_MANUAL} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground">Track raw material purchases from sellers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Purchase Order</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
              <CreatePODialog onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : orders?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No purchase orders yet. Create your first one.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order: any) => {
                    const paidAmount = Number(order.paid_amount) || 0;
                    const totalAmount = Number(order.total_amount) || 0;
                    const dueAmount = totalAmount - paidAmount;
                    const paymentStatus = order.payment_status || 'pending';
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.seller?.name || 'No Seller'}</TableCell>
                        <TableCell>{format(new Date(order.order_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right font-medium">৳{totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-primary font-medium">৳{paidAmount.toLocaleString()}</TableCell>
                        <TableCell className={`text-right font-medium ${dueAmount > 0 ? 'text-destructive' : 'text-green-500'}`}>
                          ৳{dueAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status] || 'bg-secondary'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentStatusColors[paymentStatus]}>
                            {paymentStatus === 'paid' ? 'Paid' : paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setPaymentDialogPO(order)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Payment
                            </Button>
                            {order.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setReceiveDialogPO(order)}
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                Receive
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!receiveDialogPO} onOpenChange={(open) => !open && setReceiveDialogPO(null)}>
          {receiveDialogPO && <ReceiveItemsDialog po={receiveDialogPO} onClose={() => setReceiveDialogPO(null)} />}
        </Dialog>

        <Dialog open={!!paymentDialogPO} onOpenChange={(open) => !open && setPaymentDialogPO(null)}>
          {paymentDialogPO && <POPaymentDialog po={paymentDialogPO} onClose={() => setPaymentDialogPO(null)} />}
        </Dialog>
      </div>
    </MainLayout>
  );
}
