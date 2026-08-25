import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useOrders, useSendOrderToKitchen, useUpdateOrderStatus } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, Package, Truck, CheckCircle, XCircle, Clock, Plus, ChefHat, Download } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { printReceipt } from '@/lib/receipt';
import { OrderInvoiceDetails } from '@/components/orders/OrderInvoiceDetails';
import {
  buildOrdersCsv,
  downloadOrdersCsv,
  getOrderExportRange,
  type ExportOrder,
  type OrderExportPeriod,
} from '@/lib/ordersCsv';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  processing: <Package className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

const CONFIRMERS_STORAGE_KEY = '90s_burger_confirmers';
const DEFAULT_CONFIRMERS = ['Nour Salah', 'Ahmed Wael'];

const loadConfirmers = (): string[] => {
  if (typeof window === 'undefined') return DEFAULT_CONFIRMERS;
  try {
    const stored = window.localStorage.getItem(CONFIRMERS_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as string[]) : [];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore invalid storage
  }
  return DEFAULT_CONFIRMERS;
};

const saveConfirmers = (list: string[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONFIRMERS_STORAGE_KEY, JSON.stringify(list));
};

const buildConfirmationNote = (existing: string | null, confirmer: string) => {
  const cleaned = (existing || '')
    .split('\n')
    .filter((line) => !line.toLowerCase().startsWith('confirmed by:'))
    .join('\n')
    .trim();
  const note = `Confirmed by: ${confirmer}`;
  return cleaned ? `${cleaned}\n${note}` : note;
};

const extractConfirmedBy = (notes: string | null) => {
  if (!notes) return null;
  const match = notes.match(/Confirmed by:\s*(.+)$/im);
  return match ? match[1].trim() : null;
};

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const { data: orders = [], isLoading } = useOrders(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );
  const updateStatus = useUpdateOrderStatus();
  const sendToKitchen = useSendOrderToKitchen();
  const [confirmers, setConfirmers] = useState<string[]>(() => loadConfirmers());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [selectedConfirmer, setSelectedConfirmer] = useState('');
  const [newConfirmer, setNewConfirmer] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<OrderExportPeriod>('today');
  const [fromMonth, setFromMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [toMonth, setToMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isExporting, setIsExporting] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateStatus.mutate({ id: orderId, status });
  };

  const handlePopupStatusChange = (status: OrderStatus) => {
    if (!detailsOrder || status === detailsOrder.status) return;
    if (status === 'processing') {
      openProcessingDialog(detailsOrder.id);
      return;
    }

    updateStatus.mutate(
      { id: detailsOrder.id, status },
      {
        onSuccess: () => {
          setDetailsOrder((current) => current ? { ...current, status } : current);
        },
      }
    );
  };

  const openProcessingDialog = (orderId: string) => {
    setProcessingOrderId(orderId);
    setSelectedConfirmer('');
    setNewConfirmer('');
    setConfirmDialogOpen(true);
  };

  const handleAddConfirmer = () => {
    const name = newConfirmer.trim();
    if (!name) {
      toast.error('Enter a name to add.');
      return;
    }
    const exists = confirmers.some((c) => c.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast.error('That person already exists.');
      return;
    }
    const updated = [...confirmers, name];
    setConfirmers(updated);
    saveConfirmers(updated);
    setNewConfirmer('');
    toast.success('Person added.');
  };

  const handleConfirmProcessing = () => {
    if (!processingOrderId) return;
    if (!selectedConfirmer) {
      toast.error('Select who confirmed this order.');
      return;
    }
    const order = orders.find((o) => o.id === processingOrderId);
    const updatedNotes = buildConfirmationNote(order?.notes ?? null, selectedConfirmer);
    updateStatus.mutate(
      { id: processingOrderId, status: 'processing', notes: updatedNotes },
      {
        onSuccess: () => {
          setDetailsOrder((current) =>
            current?.id === processingOrderId
              ? { ...current, status: 'processing', notes: updatedNotes }
              : current
          );
        },
      }
    );
    setConfirmDialogOpen(false);
    setProcessingOrderId(null);
  };

  const handlePrintReceipt = async (orderId: string) => {
    try {
      const order = orders.find((candidate) => candidate.id === orderId);
      if (!order) throw new Error('Order not found.');

      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      printReceipt({ ...order, items: items || [] });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to print receipt.');
    }
  };

  const handleViewDetails = async (orderId: string) => {
    const order = orders.find((candidate) => candidate.id === orderId);
    if (!order) return toast.error('Order not found.');

    setDetailsOrder({ ...order, items: [] });
    setDetailsLoading(true);
    try {
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      setDetailsOrder({ ...order, items: items || [] });
    } catch (error: unknown) {
      setDetailsOrder(null);
      toast.error(error instanceof Error ? error.message : 'Failed to load order details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const range = getOrderExportRange(exportPeriod, new Date(), fromMonth, toMonth);
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', range.start.toISOString())
        .lte('created_at', range.end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      const exportOrders = (data || []).map((order) => ({
        ...order,
        shipping_address: order.shipping_address as ExportOrder['shipping_address'],
        billing_address: order.billing_address as ExportOrder['billing_address'],
        items: order.order_items || [],
      })) as unknown as ExportOrder[];
      downloadOrdersCsv(buildOrdersCsv(exportOrders, range), range);
      setExportDialogOpen(false);
      toast.success(`Exported ${exportOrders.length} orders.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Could not export orders.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage customer orders</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />Export CSV
            </Button>
            <Button onClick={() => navigate('/admin/orders/new')}><Plus className="mr-2 h-4 w-4" />Create order</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-mono text-sm">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer_name || 'Guest'}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        <span className="flex items-center gap-1">
                          {statusIcons[order.status]}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </Badge>
                      {extractConfirmedBy(order.notes) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Confirmed by: {extractConfirmedBy(order.notes)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {order.payment_method === 'card'
                          ? 'VISA'
                          : order.payment_method === 'cod'
                          ? 'Cash on Delivery'
                          : '—'}
                      </div>
                      {order.payment_status && (
                        <div className="text-xs text-muted-foreground">
                          {order.payment_status.toUpperCase()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(order.total))}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleViewDetails(order.id)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handlePrintReceipt(order.id)}>
                            Print Receipt
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => sendToKitchen.mutate(order.id)} disabled={Boolean(order.sent_to_kitchen_at)}>
                            <ChefHat className="mr-2 h-4 w-4" />
                            {order.sent_to_kitchen_at ? 'Sent to Kitchen' : 'Send to Kitchen'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order.id, 'pending')}
                            disabled={order.status === 'pending'}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openProcessingDialog(order.id)}
                            disabled={order.status === 'processing'}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order.id, 'shipped')}
                            disabled={order.status === 'shipped'}
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            Shipped
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order.id, 'delivered')}
                            disabled={order.status === 'delivered'}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Delivered
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                            disabled={order.status === 'cancelled'}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog
          open={Boolean(detailsOrder)}
          onOpenChange={(open) => {
            if (!open) setDetailsOrder(null);
          }}
        >
          <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                {detailsOrder ? `Order #${detailsOrder.id.slice(0, 8).toUpperCase()}` : ''}
              </DialogDescription>
            </DialogHeader>
            {detailsLoading ? (
              <div className="py-12 text-center text-muted-foreground">Loading order details...</div>
            ) : detailsOrder ? (
              <>
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="w-full space-y-2 sm:max-w-xs">
                    <Label htmlFor="popup-order-status">Update Status</Label>
                    <Select
                      value={detailsOrder.status}
                      onValueChange={(value) => handlePopupStatusChange(value as OrderStatus)}
                      disabled={updateStatus.isPending}
                    >
                      <SelectTrigger id="popup-order-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={Boolean(detailsOrder.sent_to_kitchen_at) || sendToKitchen.isPending}
                      onClick={() => {
                        sendToKitchen.mutate(detailsOrder.id, {
                          onSuccess: () => {
                            setDetailsOrder((current) =>
                              current ? { ...current, sent_to_kitchen_at: new Date().toISOString() } : current
                            );
                          },
                        });
                      }}
                    >
                      <ChefHat className="mr-2 h-4 w-4" />
                      {detailsOrder.sent_to_kitchen_at ? 'Sent to Kitchen' : 'Send to Kitchen'}
                    </Button>
                    <Button onClick={() => printReceipt(detailsOrder)}>Print Receipt</Button>
                  </div>
                </div>
                <OrderInvoiceDetails order={detailsOrder} />
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export orders to CSV</DialogTitle>
              <DialogDescription>
                Download an Excel-friendly report with period totals, revenue, customer information, and every order item.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-period">Order period</Label>
                <Select value={exportPeriod} onValueChange={(value) => setExportPeriod(value as OrderExportPeriod)}>
                  <SelectTrigger id="export-period"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today's orders</SelectItem>
                    <SelectItem value="week">This week's orders</SelectItem>
                    <SelectItem value="month">This month's orders</SelectItem>
                    <SelectItem value="custom">Select multiple months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {exportPeriod === 'custom' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="export-from-month">First month</Label>
                    <Input id="export-from-month" type="month" value={fromMonth} onChange={(event) => setFromMonth(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="export-to-month">Last month</Label>
                    <Input id="export-to-month" type="month" value={toMonth} onChange={(event) => setToMonth(event.target.value)} />
                  </div>
                </div>
              )}
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Revenue excludes cancelled orders. Paid revenue and cancelled value are shown separately in the summary.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialogOpen(false)} disabled={isExporting}>Cancel</Button>
              <Button onClick={handleExportCsv} disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />{isExporting ? 'Preparing…' : 'Download CSV'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Processing</DialogTitle>
              <DialogDescription>
                Select who confirmed this order before setting it to processing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmed-by">Confirmed by</Label>
                <Select value={selectedConfirmer} onValueChange={setSelectedConfirmer}>
                  <SelectTrigger id="confirmed-by">
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {confirmers.map((confirmer) => (
                      <SelectItem key={confirmer} value={confirmer}>
                        {confirmer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-confirmer">Add another person</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    id="new-confirmer"
                    value={newConfirmer}
                    onChange={(event) => setNewConfirmer(event.target.value)}
                    placeholder="Enter a name"
                  />
                  <Button type="button" variant="outline" onClick={handleAddConfirmer}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmProcessing}>
                Set to Processing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
