import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { useCreateOrder } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

type Line = { productId: string; quantity: number };
const NEW = '__new__';

export default function AdminCreateOrderPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: zones = [] } = useDeliveryZones();
  const createOrder = useCreateOrder();
  const [customerKey, setCustomerKey] = useState(NEW);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState(''); const [address2, setAddress2] = useState(''); const [zoneId, setZoneId] = useState('');
  const [notes, setNotes] = useState(''); const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod'); const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [productId, setProductId] = useState(''); const [lines, setLines] = useState<Line[]>([]);

  const chooseCustomer = (key: string) => {
    setCustomerKey(key);
    if (key === NEW) { setName(''); setEmail(''); setPhone(''); setAddress1(''); setAddress2(''); setZoneId(''); return; }
    const customer = customers.find(c => c.key === key); if (!customer) return;
    setName(customer.name); setEmail(customer.email); setPhone(customer.phone); setAddress1(customer.address?.address1 || ''); setAddress2(customer.address?.address2 || ''); setZoneId(customer.address?.deliveryZoneId || '');
  };
  useEffect(() => { const key = params.get('customer'); if (key && customers.some(c => c.key === key)) chooseCustomer(key); }, [customers, params]);

  const addProduct = () => { if (!productId) return; setLines(current => { const found = current.find(l => l.productId === productId); return found ? current.map(l => l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l) : [...current, { productId, quantity: 1 }]; }); setProductId(''); };
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + Number(products.find(p => p.id === line.productId)?.price || 0) * line.quantity, 0), [lines, products]);
  const selectedZone = zones.find(z => z.id === zoneId); const total = subtotal + Number(selectedZone?.delivery_fee || 0);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !address1.trim() || !zoneId) { toast.error('Complete the customer and delivery details.'); return; }
    if (!lines.length) { toast.error('Add at least one product.'); return; }
    const customer = customers.find(c => c.key === customerKey);
    try {
      const order = await createOrder.mutateAsync({ customerUserId: customer?.userId || null, customerName: name.trim(), customerEmail: email.trim(), notes: [notes.trim(), 'Created by admin'].filter(Boolean).join('\n'), paymentMethod, paymentStatus, deliveryZoneId: zoneId, shippingAddress: { firstName: name.trim(), lastName: '', address1: address1.trim(), address2: address2.trim(), city: 'Alexandria', state: selectedZone?.name || '', zip: '', country: 'Egypt', phone: phone.trim(), deliveryZoneId: zoneId, deliveryZoneName: selectedZone?.name }, items: lines.map(l => ({ product_id: l.productId, quantity: l.quantity })) });
      navigate(`/admin/orders/${order.id}`);
    } catch { /* mutation displays the API error */ }
  };

  return <AdminLayout><div className="mx-auto max-w-5xl space-y-6"><div><h1 className="text-2xl font-bold">Create customer order</h1><p className="text-muted-foreground">Enter a phone, walk-in, or manually requested order.</p></div>
    <div className="grid gap-6 lg:grid-cols-2"><section className="space-y-4 rounded-xl border bg-card p-6"><h2 className="font-semibold">Customer</h2><div className="space-y-2"><Label>Existing customer</Label><Select value={customerKey} onValueChange={chooseCustomer}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NEW}>New / guest customer</SelectItem>{customers.map(c => <SelectItem key={c.key} value={c.key}>{c.name} — {c.email || c.phone}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div><div className="space-y-2"><Label>Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div><div className="space-y-2"><Label>Phone *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div><div className="space-y-2"><Label>Delivery zone *</Label><Select value={zoneId} onValueChange={setZoneId}><SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger><SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name} — {formatCurrency(z.delivery_fee)}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label>Address *</Label><Input value={address1} onChange={e => setAddress1(e.target.value)} /></div><div className="space-y-2"><Label>Address details</Label><Input value={address2} onChange={e => setAddress2(e.target.value)} /></div><div className="space-y-2"><Label>Internal / customer notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div></section>
    <section className="space-y-4 rounded-xl border bg-card p-6"><h2 className="font-semibold">Order items</h2><div className="flex gap-2"><Select value={productId} onValueChange={setProductId}><SelectTrigger className="flex-1"><SelectValue placeholder="Select a product" /></SelectTrigger><SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</SelectItem>)}</SelectContent></Select><Button type="button" onClick={addProduct}><Plus className="h-4 w-4" /></Button></div><div className="space-y-2">{!lines.length && <p className="rounded-lg bg-muted p-6 text-center text-sm text-muted-foreground">No products added.</p>}{lines.map(line => { const product = products.find(p => p.id === line.productId); return <div key={line.productId} className="flex items-center gap-3 rounded-lg border p-3"><div className="min-w-0 flex-1"><p className="truncate font-medium">{product?.name}</p><p className="text-xs text-muted-foreground">{formatCurrency(Number(product?.price || 0))} each</p></div><Button size="icon" variant="outline" onClick={() => setLines(v => v.map(l => l.productId === line.productId ? {...l, quantity: Math.max(1, l.quantity - 1)} : l))}><Minus className="h-3 w-3" /></Button><span className="w-6 text-center">{line.quantity}</span><Button size="icon" variant="outline" onClick={() => setLines(v => v.map(l => l.productId === line.productId ? {...l, quantity: l.quantity + 1} : l))}><Plus className="h-3 w-3" /></Button><Button size="icon" variant="ghost" onClick={() => setLines(v => v.filter(l => l.productId !== line.productId))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>; })}</div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Payment method</Label><Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as 'cod'|'card')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cod">Cash on delivery</SelectItem><SelectItem value="card">Card / POS</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Payment status</Label><Select value={paymentStatus} onValueChange={v => setPaymentStatus(v as 'paid'|'unpaid')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unpaid">Unpaid</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select></div></div><div className="space-y-2 border-t pt-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div><div className="flex justify-between"><span>Delivery</span><span>{formatCurrency(Number(selectedZone?.delivery_fee || 0))}</span></div><div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div></div><Button className="w-full" size="lg" onClick={submit} disabled={createOrder.isPending}>{createOrder.isPending ? 'Creating order…' : 'Create order'}</Button></section></div>
  </div></AdminLayout>;
}
