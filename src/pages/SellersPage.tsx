import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSellers, useCreateSeller, useUpdateSeller, useDeleteSeller } from '@/hooks/useSellers';
import { Seller } from '@/types/database';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

function SellerForm({ seller, onClose }: { seller?: Seller; onClose: () => void }) {
  const createSeller = useCreateSeller();
  const updateSeller = useUpdateSeller();
  const [formData, setFormData] = useState({
    name: seller?.name || '',
    email: seller?.email || '',
    phone: seller?.phone || '',
    address: seller?.address || '',
    city: seller?.city || '',
    state: seller?.state || '',
    gst_number: seller?.gst_number || '',
    is_active: seller?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seller) {
      await updateSeller.mutateAsync({ id: seller.id, ...formData });
    } else {
      await createSeller.mutateAsync(formData);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>GST Number</Label>
          <Input value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">{seller ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}

export default function SellersPage() {
  const { data: sellers, isLoading } = useSellers();
  const deleteSeller = useDeleteSeller();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSeller, setEditSeller] = useState<Seller | undefined>();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sellers / Suppliers</h1>
            <p className="text-muted-foreground">Manage your suppliers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditSeller(undefined); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Seller</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>{editSeller ? 'Edit Seller' : 'Add New Seller'}</DialogTitle></DialogHeader>
              <SellerForm seller={editSeller} onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellers?.map((seller) => (
                    <TableRow key={seller.id}>
                      <TableCell className="font-medium">{seller.name}</TableCell>
                      <TableCell>{seller.phone || '-'}</TableCell>
                      <TableCell>{seller.city || '-'}</TableCell>
                      <TableCell>{seller.gst_number || '-'}</TableCell>
                      <TableCell>₹{seller.outstanding_balance}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => { setEditSeller(seller); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => confirm(`Delete ${seller.name}?`) && deleteSeller.mutate(seller.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
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
