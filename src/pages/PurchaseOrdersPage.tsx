import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePurchaseOrders, useCreatePurchaseOrder, useReceivePOItems, useUpdatePOStatus } from '@/hooks/usePurchaseOrders';
import { useRawMaterials } from '@/hooks/useRawMaterials';
import { useSellers } from '@/hooks/useSellers';
import { Plus, X, FileText, Eye, Package, Truck, CheckCircle } from 'lucide-react';
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

const statusColors: Record<string, string> = {
  pending: 'bg-secondary',
  approved: 'bg-blue-500',
  received: 'bg-primary',
  cancelled: 'bg-destructive'
};

export default function PurchaseOrdersPage() {
  const { data: orders, isLoading } = usePurchaseOrders();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiveDialogPO, setReceiveDialogPO] = useState<any>(null);

  return (
    <MainLayout>
      <div className="space-y-6">
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
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.seller?.name || 'No Seller'}</TableCell>
                      <TableCell>{format(new Date(order.order_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right">{order.items?.length || 0}</TableCell>
                      <TableCell className="text-right font-medium">৳{Number(order.total_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || 'bg-secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!receiveDialogPO} onOpenChange={(open) => !open && setReceiveDialogPO(null)}>
          {receiveDialogPO && <ReceiveItemsDialog po={receiveDialogPO} onClose={() => setReceiveDialogPO(null)} />}
        </Dialog>
      </div>
    </MainLayout>
  );
}
