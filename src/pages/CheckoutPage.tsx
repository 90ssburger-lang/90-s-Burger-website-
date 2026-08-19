import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Check, CreditCard, MapPin, Wallet } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCart } from '@/contexts/CartContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { trackMetaEvent } from '@/lib/analytics';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { items, subtotal, discount, appliedCoupon } = useCart();
  const createOrder = useCreateOrder();
  const { data: zones = [], isLoading: zonesLoading } = useDeliveryZones();
  const [method, setMethod] = useState<'cod' | 'card'>('cod');
  const [orderId, setOrderId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const selectedZone = zones.find(zone => zone.id === zoneId);
  const delivery = selectedZone ? Number(selectedZone.delivery_fee) : 0;
  const total = Math.max(0, subtotal + delivery - discount);

  useEffect(() => {
    if (items.length) trackMetaEvent('InitiateCheckout', { content_ids: items.map(i => i.product.id), num_items: items.reduce((sum, item) => sum + item.quantity, 0), value: total, currency: 'EGP' });
  }, []);

  const shippingAddress = selectedZone ? { firstName: form.name, lastName: '', address1: form.address, city: 'Alexandria', state: selectedZone.name, zip: '', country: 'EG', phone: form.phone, deliveryZoneId: selectedZone.id, deliveryZoneName: selectedZone.name } : null;
  const itemTotal = (item: typeof items[number]) => (Number(item.product.price) + (item.addons || []).reduce((sum, addon) => sum + Number(addon.price), 0)) * item.quantity;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.phone || !form.address || !shippingAddress) {
      toast.error('Please enter your details and select a delivery zone');
      return;
    }
    try {
      if (method === 'cod') {
        const order = await createOrder.mutateAsync({ shippingAddress, customerName: form.name, customerEmail: 'guest@90sburger.local', notes: form.notes, paymentMethod: 'cod', shippingCost: delivery, deliveryZoneId: selectedZone.id, couponCode: appliedCoupon?.code || null });
        setOrderId(order.id);
        trackMetaEvent('Purchase', { content_ids: items.map(i => i.product.id), value: total, currency: 'EGP', order_id: order.id });
        return;
      }
      const id = crypto.randomUUID();
      localStorage.setItem('90s_burger_pending_payment', JSON.stringify({ orderId: id, customerEmail: 'guest@90sburger.local', customerName: form.name, shippingAddress, billingAddress: null, shippingCost: delivery, deliveryZoneId: selectedZone.id, couponCode: appliedCoupon?.code || null, notes: form.notes, items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity, selected_addon_ids: (i.addons || []).map(a => a.id) })) }));
      const response = await fetch('/api/paymob/create-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchantOrderId: id, billingData: { first_name: form.name, last_name: 'Guest', email: 'guest@90sburger.local', phone_number: form.phone, city: 'Alexandria', state: selectedZone.name, street: form.address, postal_code: 'NA', country: 'EG', apartment: 'NA', floor: 'NA', building: 'NA', shipping_method: 'NA' }, items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity, selected_addon_ids: (i.addons || []).map(a => a.id) })), deliveryZoneId: selectedZone.id, couponCode: appliedCoupon?.code || null, orderPayload: { userId: null, customerEmail: 'guest@90sburger.local', customerName: form.name, notes: form.notes, shippingAddress } }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Payment setup failed');
      location.href = data.iframeUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not place order');
    }
  };

  if (orderId) return <MainLayout><div className="container mx-auto px-4 py-20"><div className="mx-auto max-w-lg rounded-3xl border bg-white p-8 text-center shadow-xl"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100"><Check className="h-10 w-10 text-green-600"/></div><h1 className="mt-6 text-4xl font-black uppercase">Order confirmed!</h1><p className="mt-3 text-muted-foreground">We're firing up the grill. Keep this order ID for your reference.</p><div className="mt-6 rounded-2xl bg-[#f8f5ff] p-4"><small className="font-bold uppercase text-muted-foreground">Order ID</small><p className="mt-1 break-all font-mono font-bold">{orderId}</p></div><Link to="/shop"><Button className="mt-7 rounded-full bg-[#f0008f] px-8 text-white">Back to menu</Button></Link></div></div></MainLayout>;
  if (!items.length) return <Navigate to="/cart" replace/>;

  return <MainLayout showFooter={false}><div className="container mx-auto px-4 py-8"><Link to="/cart" className="text-sm font-bold">← Back to cart</Link><h1 className="mt-5 text-4xl font-black uppercase">Fast checkout</h1><p className="mt-2 text-muted-foreground">Choose your Alexandria delivery zone and tell us where to bring it.</p><form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]"><div className="space-y-6 rounded-3xl border bg-white p-5 sm:p-7"><div><Label htmlFor="name">Name</Label><Input id="name" required className="mt-2 h-12" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/></div><div><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" required className="mt-2 h-12" placeholder="01xxxxxxxxx" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/></div><div><Label>Delivery zone</Label><Select value={zoneId} onValueChange={setZoneId} required disabled={zonesLoading || zones.length === 0}><SelectTrigger className="mt-2 h-12"><SelectValue placeholder={zonesLoading ? 'Loading zones…' : 'Select your area'}/></SelectTrigger><SelectContent>{zones.map(zone => <SelectItem key={zone.id} value={zone.id}>{zone.name} — {formatCurrency(zone.delivery_fee)}</SelectItem>)}</SelectContent></Select>{!zonesLoading && zones.length === 0 && <p className="mt-2 text-sm text-destructive">Delivery zones are not available yet. Please contact the restaurant.</p>}{selectedZone && <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4"/>Delivering to {selectedZone.name}, Alexandria</p>}</div><div><Label htmlFor="address">Detailed address</Label><Textarea id="address" required className="mt-2" placeholder="Street, building, floor and apartment" value={form.address} onChange={e => setForm({...form, address: e.target.value})}/></div><div><Label htmlFor="notes">Delivery notes</Label><Textarea id="notes" className="mt-2" placeholder="Landmark, gate instructions, allergies…" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}/></div><div><Label>Payment method</Label><RadioGroup value={method} onValueChange={value => setMethod(value as 'cod' | 'card')} className="mt-2 grid gap-3 sm:grid-cols-2"><label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4"><RadioGroupItem value="cod"/><Wallet/><span><strong className="block">Cash on delivery</strong><small className="text-muted-foreground">Pay at your door</small></span></label><label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4"><RadioGroupItem value="card"/><CreditCard/><span><strong className="block">Card</strong><small className="text-muted-foreground">Secure online payment</small></span></label></RadioGroup></div></div><aside className="h-fit rounded-3xl bg-[#0d0914] p-6 text-[#f8f5ff] lg:sticky lg:top-24"><h2 className="text-2xl font-black uppercase">Your order</h2><div className="mt-5 max-h-64 space-y-4 overflow-auto">{items.map((item, index) => <div key={`${item.product.id}-${index}`} className="border-b border-white/10 pb-3 last:border-0 last:pb-0"><div className="flex justify-between gap-3 text-sm"><span>{item.quantity}× {item.product.name}</span><strong>{formatCurrency(itemTotal(item))}</strong></div>{!!item.addons?.length && <div className="mt-2 space-y-1 pl-4 text-xs text-white/65">{item.addons.map(addon => <div key={addon.id} className="flex justify-between gap-3"><span>+ {addon.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</span><span>{formatCurrency(Number(addon.price) * item.quantity)}</span></div>)}</div>}</div>)}</div><div className="mt-5 space-y-2 border-t border-white/15 pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div><div className="flex justify-between"><span>Delivery{selectedZone ? ` · ${selectedZone.name}` : ''}</span><span>{selectedZone ? formatCurrency(delivery) : 'Select zone'}</span></div>{discount > 0 && <div className="flex justify-between text-[#00c8f0]"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}<div className="flex justify-between pt-3 text-xl font-black"><span>Total</span><span>{formatCurrency(total)}</span></div></div><Button type="submit" disabled={createOrder.isPending || !selectedZone} className="mt-6 h-14 w-full rounded-full bg-[#f0008f] text-base text-white hover:bg-[#c60076]">{createOrder.isPending ? 'Placing order…' : method === 'cod' ? 'Place order' : 'Continue to payment'}</Button></aside></form></div></MainLayout>;
}
