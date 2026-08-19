import { useState } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDeleteDeliveryZone, useDeliveryZones, useSaveDeliveryZone } from '@/hooks/useDeliveryZones';
import type { DeliveryZone } from '@/types';
import { formatCurrency } from '@/lib/utils';

const emptyForm = { name: '', delivery_fee: '0', sort_order: '0', is_active: true };

export default function AdminDeliveryZonesPage() {
  const { data: zones = [], isLoading } = useDeliveryZones({ includeInactive: true });
  const saveZone = useSaveDeliveryZone();
  const deleteZone = useDeleteDeliveryZone();
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const showForm = (zone?: DeliveryZone) => {
    setEditing(zone ?? null);
    setForm(zone ? { name: zone.name, delivery_fee: String(zone.delivery_fee), sort_order: String(zone.sort_order), is_active: zone.is_active } : emptyForm);
    setOpen(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    saveZone.mutate({ id: editing?.id, name: form.name, delivery_fee: Number(form.delivery_fee), sort_order: Number(form.sort_order), is_active: form.is_active }, { onSuccess: () => setOpen(false) });
  };

  return <AdminLayout><div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold">Delivery zones</h1><p className="text-muted-foreground">Set Alexandria areas and their checkout delivery fees.</p></div><Button onClick={() => showForm()}><Plus className="mr-2 h-4 w-4"/>Add zone</Button></div>
    <div className="overflow-hidden rounded-xl border bg-card"><Table><TableHeader><TableRow><TableHead>Zone</TableHead><TableHead>Fee</TableHead><TableHead>Order</TableHead><TableHead>Status</TableHead><TableHead className="w-28"/></TableRow></TableHeader><TableBody>
      {isLoading ? <TableRow><TableCell colSpan={5} className="py-10 text-center">Loading…</TableCell></TableRow> : zones.length === 0 ? <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No delivery zones yet. Add the first Alexandria zone.</TableCell></TableRow> : zones.map(zone => <TableRow key={zone.id}><TableCell className="font-medium"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary"/>{zone.name}</span></TableCell><TableCell>{formatCurrency(zone.delivery_fee)}</TableCell><TableCell>{zone.sort_order}</TableCell><TableCell><span className={zone.is_active ? 'text-green-600' : 'text-muted-foreground'}>{zone.is_active ? 'Active' : 'Hidden'}</span></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => showForm(zone)} aria-label={`Edit ${zone.name}`}><Pencil className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => window.confirm(`Delete ${zone.name}?`) && deleteZone.mutate(zone.id)} aria-label={`Delete ${zone.name}`}><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>)}
    </TableBody></Table></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>{editing ? 'Edit delivery zone' : 'Add delivery zone'}</DialogTitle><DialogDescription>Customers will see active zones during checkout.</DialogDescription></DialogHeader><div className="space-y-4 py-5"><div><Label htmlFor="zone-name">Zone name</Label><Input id="zone-name" required placeholder="e.g. Smouha" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/></div><div><Label htmlFor="zone-fee">Delivery fee (EGP)</Label><Input id="zone-fee" type="number" min="0" step="0.01" required value={form.delivery_fee} onChange={e => setForm({...form, delivery_fee: e.target.value})}/></div><div><Label htmlFor="zone-order">Display order</Label><Input id="zone-order" type="number" min="0" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})}/></div><div className="flex items-center justify-between rounded-lg border p-3"><Label htmlFor="zone-active">Available at checkout</Label><Switch id="zone-active" checked={form.is_active} onCheckedChange={is_active => setForm({...form, is_active})}/></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saveZone.isPending}>Save zone</Button></DialogFooter></form></DialogContent></Dialog>
  </div></AdminLayout>;
}
