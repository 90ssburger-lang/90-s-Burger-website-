import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChefHat, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { OrderInvoiceDetails } from '@/components/orders/OrderInvoiceDetails';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Address, Order, OrderStatus } from '@/types';

const allowed: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

export default function KitchenPage() {
  const { user, profile, loading, isStaff, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Order | null>(null);
  const orders = useQuery({
    queryKey: ['kitchen-orders'],
    enabled: !!user && (isStaff || profile?.role === 'kitchen'),
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').not('sent_to_kitchen_at', 'is', null).neq('status', 'cancelled').order('sent_to_kitchen_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data || []).map(order => ({ ...order, shipping_address: order.shipping_address as Address | null, billing_address: order.billing_address as Address | null })) as Order[];
    },
  });
  const update = useMutation({ mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => { const { error } = await (supabase as any).rpc('kitchen_update_order_status', { _order_id: id, _status: status }); if (error) throw error; }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }); toast.success('Order status updated'); }, onError: (error: Error) => toast.error(error.message) });
  const openDetails = async (order: Order) => { const { data, error } = await supabase.from('order_items').select('*').eq('order_id', order.id); if (error) return toast.error('Could not load order items'); setSelected({ ...order, items: data || [] }); };

  if (loading) return <div className="grid min-h-screen place-items-center">Loading…</div>;
  if (!user || (!isStaff && profile?.role !== 'kitchen')) return <Navigate to="/login" replace />;

  const content = <div className="space-y-6">
    {!isStaff && <div className="flex items-center justify-between rounded-xl bg-[#0d0914] p-4 text-white"><div className="flex items-center gap-3"><ChefHat /><div><p className="font-bold">Kitchen orders</p><p className="text-xs text-white/60">Updates every 15 seconds</p></div></div><Button variant="outline" className="text-black" onClick={() => signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></div>}
    <div><h1 className="text-2xl font-bold">Kitchen board</h1><p className="text-muted-foreground">Only orders sent by an admin or manager appear here.</p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {orders.isLoading ? <p>Loading orders…</p> : !orders.data?.length ? <p className="col-span-full rounded-xl border bg-card p-10 text-center text-muted-foreground">No orders have been sent to the kitchen.</p> : orders.data.map(order => <article key={order.id} className="rounded-xl border bg-card p-5"><div className="flex justify-between"><div><p className="font-mono text-sm">#{order.id.slice(0,8).toUpperCase()}</p><p className="mt-1 font-semibold">{order.customer_name || 'Guest'}</p></div><span className="text-sm font-bold">{order.total.toFixed(2)} L.E.</span></div><p className="mt-3 text-sm text-muted-foreground">{order.shipping_address?.phone || order.customer_email}</p><div className="mt-4"><Label>Status</Label><Select value={order.status} onValueChange={status => update.mutate({ id: order.id, status: status as OrderStatus })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{allowed.map(status => <SelectItem key={status} value={status}><span className="capitalize">{status}</span></SelectItem>)}</SelectContent></Select></div><Button className="mt-4 w-full" variant="outline" onClick={() => openDetails(order)}>Full order details</Button></article>)}
    </div>
    <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>Kitchen order details</DialogTitle></DialogHeader>{selected && <OrderInvoiceDetails order={selected} />}</DialogContent></Dialog>
  </div>;
  return isStaff ? <AdminLayout>{content}</AdminLayout> : <main className="min-h-screen bg-muted p-4 lg:p-8">{content}</main>;
}
