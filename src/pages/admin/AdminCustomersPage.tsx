import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, UserPlus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCustomers, type CustomerRecord } from '@/hooks/useCustomers';
import { formatCurrency } from '@/lib/utils';

export default function AdminCustomersPage() {
  const { data: customers = [], isLoading, error } = useCustomers();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CustomerRecord | null>(null);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? customers.filter(c => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(term)) : customers;
  }, [customers, search]);

  return <AdminLayout><div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold">Customers</h1><p className="text-muted-foreground">Registered and historical guest customers in one place.</p></div><Button asChild><Link to="/admin/orders/new"><UserPlus className="mr-2 h-4 w-4" />Create customer order</Link></Button></div>
    <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Total customers</p><p className="mt-1 text-2xl font-bold">{customers.length}</p></div><div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Returning customers</p><p className="mt-1 text-2xl font-bold">{customers.filter(c => c.orderCount > 1).length}</p></div><div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Customer revenue</p><p className="mt-1 text-2xl font-bold">{formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}</p></div></div>
    <div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, or phone…" className="pl-9" /></div>
    <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/40 text-left text-muted-foreground"><th className="p-4">Customer</th><th className="p-4">Phone</th><th className="p-4">Orders</th><th className="p-4">Total spent</th><th className="p-4">Last order</th><th className="p-4"></th></tr></thead><tbody>
      {isLoading ? <tr><td colSpan={6} className="p-8 text-center">Loading customers…</td></tr> : error ? <tr><td colSpan={6} className="p-8 text-center text-destructive">Could not load customer data.</td></tr> : !filtered.length ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No customers found.</td></tr> : filtered.map(customer => <tr key={customer.key} className="border-b last:border-0"><td className="p-4"><div className="font-medium">{customer.name}</div><div className="text-xs text-muted-foreground">{customer.email || 'No email'}</div>{customer.userId && <Badge variant="outline" className="mt-1">Registered</Badge>}</td><td className="p-4">{customer.phone || '—'}</td><td className="p-4">{customer.orderCount}</td><td className="p-4 font-medium">{formatCurrency(customer.totalSpent)}</td><td className="p-4">{customer.lastOrderAt ? format(new Date(customer.lastOrderAt), 'MMM d, yyyy') : 'Never'}</td><td className="p-4"><Button size="sm" variant="ghost" onClick={() => setSelected(customer)}>View</Button></td></tr>)}
    </tbody></table></div></div>
    <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>{selected && <div className="space-y-5"><div className="grid gap-3 text-sm sm:grid-cols-2"><div><span className="text-muted-foreground">Email</span><p className="font-medium">{selected.email || '—'}</p></div><div><span className="text-muted-foreground">Phone</span><p className="font-medium">{selected.phone || '—'}</p></div><div className="sm:col-span-2"><span className="text-muted-foreground">Latest address</span><p className="font-medium">{selected.address ? [selected.address.address1, selected.address.address2, selected.address.state, selected.address.city].filter(Boolean).join(', ') : '—'}</p></div></div><Button asChild><Link to={`/admin/orders/new?customer=${encodeURIComponent(selected.key)}`}>Create order for this customer</Link></Button><div><h3 className="mb-2 font-semibold">Order history</h3><div className="max-h-72 space-y-2 overflow-auto">{selected.orders.map(order => <Link key={order.id} to={`/admin/orders/${order.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"><div><p className="font-mono text-xs">#{order.id.slice(0, 8).toUpperCase()}</p><p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM d, yyyy')}</p></div><div className="text-right"><p className="font-medium">{formatCurrency(Number(order.total))}</p><p className="text-xs capitalize text-muted-foreground">{order.status}</p></div></Link>)}</div></div></div>}</DialogContent></Dialog>
  </div></AdminLayout>;
}
