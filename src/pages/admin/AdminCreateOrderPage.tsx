import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronsUpDown, Minus, Package, Plus, Trash2, User, UserPlus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCustomers, type CustomerRecord } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { useCreateOrder } from '@/hooks/useOrders';
import { cn, formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from 'sonner';

type Line = { productId: string; quantity: number };
const NEW = '__new__';

function CustomerPicker({ customers, value, onChange }: { customers: CustomerRecord[]; value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = customers.find(c => c.key === value);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal"><span className="flex min-w-0 items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">{selected ? <User className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}</span><span className="truncate">{selected ? `${selected.name} — ${selected.phone || selected.email}` : 'New / guest customer'}</span></span><ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" /></Button></PopoverTrigger>
    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0"><Command><CommandInput placeholder="Search name, phone, or email…" /><CommandList><CommandEmpty>No customer found.</CommandEmpty><CommandGroup>
      <CommandItem value="new guest customer" onSelect={() => { onChange(NEW); setOpen(false); }}><UserPlus className="mr-2 h-4 w-4" />New / guest customer<Check className={cn('ml-auto h-4 w-4', value === NEW ? 'opacity-100' : 'opacity-0')} /></CommandItem>
      {customers.map(c => <CommandItem key={c.key} value={`${c.name} ${c.phone} ${c.email} ${c.key}`} onSelect={() => { onChange(c.key); setOpen(false); }}><span className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10"><User className="h-3.5 w-3.5 text-primary" /></span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{c.name}</span><span className="block truncate text-xs text-muted-foreground">{c.phone || 'No phone'} · {c.email || 'No email'}</span></span><Check className={cn('ml-2 h-4 w-4', value === c.key ? 'opacity-100' : 'opacity-0')} /></CommandItem>)}
    </CommandGroup></CommandList></Command></PopoverContent>
  </Popover>;
}

function ProductPicker({ products, value, onChange }: { products: Product[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = products.find(p => p.id === value);
  const icon = (product?: Product, large = false) => product?.image_url ? <img src={product.image_url} alt="" className="h-full w-full object-cover" /> : <Package className={large ? 'h-4 w-4' : 'h-3.5 w-3.5'} />;
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button type="button" variant="outline" role="combobox" className="min-w-0 flex-1 justify-between font-normal"><span className="flex min-w-0 items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">{icon(selected)}</span><span className="truncate">{selected ? `${selected.name} — ${formatCurrency(selected.price)}` : 'Type to search products'}</span></span><ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" /></Button></PopoverTrigger>
    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0"><Command><CommandInput placeholder="Type a product name…" /><CommandList><CommandEmpty>No product found.</CommandEmpty><CommandGroup>{products.map(p => <CommandItem key={p.id} value={`${p.name} ${p.slug}`} onSelect={() => { onChange(p.id); setOpen(false); }}><span className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">{icon(p, true)}</span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.name}</span><span className="text-xs text-muted-foreground">{formatCurrency(p.price)}</span></span><Check className={cn('ml-2 h-4 w-4', value === p.id ? 'opacity-100' : 'opacity-0')} /></CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
  </Popover>;
}

export default function AdminCreateOrderPage() {
  const navigate = useNavigate(); const [params] = useSearchParams();
  const { data: customers = [] } = useCustomers(); const { data: products = [] } = useProducts(); const { data: zones = [] } = useDeliveryZones(); const createOrder = useCreateOrder();
  const [customerKey, setCustomerKey] = useState(NEW); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState(''); const [address2, setAddress2] = useState(''); const [zoneId, setZoneId] = useState(''); const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod'); const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid'); const [productId, setProductId] = useState(''); const [lines, setLines] = useState<Line[]>([]);

  const chooseCustomer = (key: string) => { setCustomerKey(key); if (key === NEW) { setName(''); setEmail(''); setPhone(''); setAddress1(''); setAddress2(''); setZoneId(''); return; } const c = customers.find(x => x.key === key); if (!c) return; setName(c.name); setEmail(c.email); setPhone(c.phone); setAddress1(c.address?.address1 || ''); setAddress2(c.address?.address2 || ''); setZoneId(c.address?.deliveryZoneId || ''); };
  useEffect(() => { const key = params.get('customer'); if (key && customers.some(c => c.key === key)) chooseCustomer(key); }, [customers, params]);
  const addProduct = () => { if (!productId) return; setLines(current => current.some(l => l.productId === productId) ? current.map(l => l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l) : [...current, { productId, quantity: 1 }]); setProductId(''); };
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + Number(products.find(p => p.id === l.productId)?.price || 0) * l.quantity, 0), [lines, products]);
  const selectedZone = zones.find(z => z.id === zoneId); const total = subtotal + Number(selectedZone?.delivery_fee || 0);
  const submit = async () => { if (!name.trim() || !email.trim() || !phone.trim() || !address1.trim() || !zoneId) { toast.error('Complete the customer and delivery details.'); return; } if (!lines.length) { toast.error('Add at least one product.'); return; } const customer = customers.find(c => c.key === customerKey); try { const order = await createOrder.mutateAsync({ customerUserId: customer?.userId || null, customerName: name.trim(), customerEmail: email.trim(), notes: [notes.trim(), 'Created by admin'].filter(Boolean).join('\n'), paymentMethod, paymentStatus, deliveryZoneId: zoneId, shippingAddress: { firstName: name.trim(), lastName: '', address1: address1.trim(), address2: address2.trim(), city: 'Alexandria', state: selectedZone?.name || '', zip: '', country: 'Egypt', phone: phone.trim(), deliveryZoneId: zoneId, deliveryZoneName: selectedZone?.name }, items: lines.map(l => ({ product_id: l.productId, quantity: l.quantity })) }); navigate(`/admin/orders/${order.id}`); } catch { /* mutation shows error */ } };

  return <AdminLayout><div className="mx-auto max-w-5xl space-y-6"><div><h1 className="text-2xl font-bold">Create customer order</h1><p className="text-muted-foreground">Enter a phone, walk-in, or manually requested order.</p></div><div className="grid gap-6 lg:grid-cols-2">
    <section className="space-y-4 rounded-xl border bg-card p-6"><h2 className="font-semibold">Customer</h2><div className="space-y-2"><Label>Existing customer</Label><CustomerPicker customers={customers} value={customerKey} onChange={chooseCustomer} /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Name *"><Input value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Email *"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field><Field label="Phone *"><Input value={phone} onChange={e => setPhone(e.target.value)} /></Field><Field label="Delivery zone *"><Select value={zoneId} onValueChange={setZoneId}><SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger><SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name} — {formatCurrency(z.delivery_fee)}</SelectItem>)}</SelectContent></Select></Field></div><Field label="Address *"><Input value={address1} onChange={e => setAddress1(e.target.value)} /></Field><Field label="Address details"><Input value={address2} onChange={e => setAddress2(e.target.value)} /></Field><Field label="Internal / customer notes"><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></Field></section>
    <section className="space-y-4 rounded-xl border bg-card p-6"><h2 className="font-semibold">Order items</h2><div className="flex gap-2"><ProductPicker products={products} value={productId} onChange={setProductId} /><Button type="button" onClick={addProduct} disabled={!productId} aria-label="Add selected product"><Plus className="h-4 w-4" /></Button></div><div className="space-y-2">{!lines.length && <p className="rounded-lg bg-muted p-6 text-center text-sm text-muted-foreground">No products added.</p>}{lines.map(line => { const p = products.find(x => x.id === line.productId); return <div key={line.productId} className="flex items-center gap-3 rounded-lg border p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">{p?.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <Package className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate font-medium">{p?.name}</p><p className="text-xs text-muted-foreground">{formatCurrency(Number(p?.price || 0))} each</p></div><Button size="icon" variant="outline" onClick={() => setLines(v => v.map(l => l.productId === line.productId ? {...l, quantity: Math.max(1, l.quantity - 1)} : l))}><Minus className="h-3 w-3" /></Button><span className="w-6 text-center">{line.quantity}</span><Button size="icon" variant="outline" onClick={() => setLines(v => v.map(l => l.productId === line.productId ? {...l, quantity: l.quantity + 1} : l))}><Plus className="h-3 w-3" /></Button><Button size="icon" variant="ghost" onClick={() => setLines(v => v.filter(l => l.productId !== line.productId))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>; })}</div><div className="grid gap-4 sm:grid-cols-2"><Field label="Payment method"><Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as 'cod'|'card')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cod">Cash on delivery</SelectItem><SelectItem value="card">Card / POS</SelectItem></SelectContent></Select></Field><Field label="Payment status"><Select value={paymentStatus} onValueChange={v => setPaymentStatus(v as 'paid'|'unpaid')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unpaid">Unpaid</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select></Field></div><div className="space-y-2 border-t pt-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div><div className="flex justify-between"><span>Delivery</span><span>{formatCurrency(Number(selectedZone?.delivery_fee || 0))}</span></div><div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div></div><Button className="w-full" size="lg" onClick={submit} disabled={createOrder.isPending}>{createOrder.isPending ? 'Creating order…' : 'Create order'}</Button></section>
  </div></div></AdminLayout>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
