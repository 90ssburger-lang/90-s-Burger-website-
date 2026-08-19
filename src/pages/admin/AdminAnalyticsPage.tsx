import { useState } from 'react';
import { format, formatDistanceStrict } from 'date-fns';
import { Activity, Eye, MousePointerClick, ShoppingCart, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAnalytics, AnalyticsRange } from '@/hooks/useAnalytics';

const duration = (seconds: number) => seconds ? formatDistanceStrict(0, seconds * 1000) : '< 1 minute';

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>(30);
  const [selected, setSelected] = useState<NonNullable<ReturnType<typeof useAnalytics>['data']>['visitors'][number] | null>(null);
  const { data, isLoading, error } = useAnalytics(range);

  return <AdminLayout><div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-bold">Visitor analytics</h2><p className="text-sm text-muted-foreground">First-party website activity and Meta Pixel commerce events.</p></div>
      <div className="flex gap-2">{([7, 30, 90] as AnalyticsRange[]).map(days => <Button key={days} size="sm" variant={range === days ? 'default' : 'outline'} onClick={() => setRange(days)}>{days} days</Button>)}</div>
    </div>
    {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Analytics could not load. Apply the latest Supabase migration and confirm this account is staff.</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard title="Sessions" value={isLoading ? '...' : data?.totals.sessions || 0} icon={Users} iconColor="text-blue-600" />
      <StatCard title="Page views" value={isLoading ? '...' : data?.totals.pageViews || 0} icon={Eye} iconColor="text-violet-600" />
      <StatCard title="Add to carts" value={isLoading ? '...' : data?.totals.addToCarts || 0} icon={ShoppingCart} iconColor="text-amber-600" />
      <StatCard title="Purchases" value={isLoading ? '...' : data?.totals.purchases || 0} icon={MousePointerClick} iconColor="text-green-600" />
      <StatCard title="Conversion" value={isLoading ? '...' : `${(data?.conversionRate || 0).toFixed(1)}%`} icon={Activity} iconColor="text-pink-600" />
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      {[['Top pages', data?.pages], ['Traffic sources', data?.sources], ['Devices', data?.devices]].map(([title, rows]) => <div key={title as string} className="rounded-xl border bg-card p-5"><h3 className="font-semibold">{title as string}</h3><div className="mt-4 space-y-3">{(rows as {name:string,value:number}[] | undefined)?.map(row => <div key={row.name} className="flex justify-between gap-3 text-sm"><span className="truncate text-muted-foreground">{row.name}</span><span className="font-medium">{row.value}</span></div>) || <span className="text-sm text-muted-foreground">No data yet</span>}</div></div>)}
    </div>
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-5"><h3 className="font-semibold">Visitor sessions</h3><p className="text-sm text-muted-foreground">Registered customers are identified from their account; guests remain anonymous.</p></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/40 text-left text-muted-foreground"><th className="p-4">Visitor</th><th className="p-4">Started</th><th className="p-4">Source</th><th className="p-4">Device</th><th className="p-4">Pages</th><th className="p-4">Duration</th><th className="p-4"></th></tr></thead><tbody>
        {isLoading ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading analytics…</td></tr> : !data?.visitors.length ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No visits in this period.</td></tr> : data.visitors.map(visitor => <tr key={visitor.session_id} className="border-b last:border-0"><td className="p-4"><div className="font-medium">{visitor.name}</div><div className="text-xs text-muted-foreground">{visitor.email || `Guest · ${visitor.session_id.slice(0, 8)}`}</div></td><td className="p-4 whitespace-nowrap">{format(new Date(visitor.started_at), 'MMM d, HH:mm')}</td><td className="p-4">{visitor.source}</td><td className="p-4"><Badge variant="outline">{visitor.device}</Badge></td><td className="p-4">{visitor.pageViews}</td><td className="p-4 whitespace-nowrap">{duration(visitor.durationSeconds)}</td><td className="p-4"><Button size="sm" variant="ghost" onClick={() => setSelected(visitor)}>Details</Button></td></tr>)}
      </tbody></table></div>
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={open => !open && setSelected(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Session details</DialogTitle></DialogHeader>{selected && <div className="space-y-4 text-sm"><div className="grid gap-3 sm:grid-cols-2"><div><span className="text-muted-foreground">Visitor</span><div className="font-medium">{selected.name}</div></div><div><span className="text-muted-foreground">Entry page</span><div className="font-medium break-all">{selected.path || '/'}</div></div><div><span className="text-muted-foreground">Referrer</span><div className="font-medium break-all">{selected.referrer || 'Direct'}</div></div><div><span className="text-muted-foreground">Browser / device</span><div className="font-medium">{selected.device}</div></div></div><div><h4 className="mb-2 font-semibold">Activity timeline</h4><div className="max-h-72 space-y-2 overflow-y-auto">{selected.events.length ? selected.events.map(event => <div key={event.id} className="flex items-start justify-between gap-4 rounded-lg bg-muted/50 p-3"><div><div className="font-medium">{event.event_type}</div><div className="text-xs text-muted-foreground break-all">{event.path || '/'}</div></div><time className="whitespace-nowrap text-xs text-muted-foreground">{format(new Date(event.occurred_at), 'HH:mm:ss')}</time></div>) : <p className="text-muted-foreground">No detailed events were recorded for this older session.</p>}</div></div></div>}</DialogContent></Dialog>
  </div></AdminLayout>;
}
