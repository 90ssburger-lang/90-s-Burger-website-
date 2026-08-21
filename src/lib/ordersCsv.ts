import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { Address, Order, OrderItem, OrderStatus } from '@/types';

export type OrderExportPeriod = 'today' | 'week' | 'month' | 'custom';
export type ExportOrder = Order & { items?: OrderItem[] };

export type OrderExportRange = {
  start: Date;
  end: Date;
  label: string;
};

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

export function getOrderExportRange(
  period: OrderExportPeriod,
  now = new Date(),
  fromMonth?: string,
  toMonth?: string,
): OrderExportRange {
  if (period === 'today') {
    return { start: startOfDay(now), end: endOfDay(now), label: format(now, 'MMMM d, yyyy') };
  }
  if (period === 'week') {
    const start = startOfWeek(now, WEEK_OPTIONS);
    const end = endOfWeek(now, WEEK_OPTIONS);
    return { start, end, label: `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}` };
  }
  if (period === 'month') {
    return { start: startOfMonth(now), end: endOfMonth(now), label: format(now, 'MMMM yyyy') };
  }

  if (!fromMonth || !toMonth) throw new Error('Select both the first and last month.');
  const firstMonth = parse(fromMonth, 'yyyy-MM', new Date());
  const lastMonth = parse(toMonth, 'yyyy-MM', new Date());
  if (Number.isNaN(firstMonth.getTime()) || Number.isNaN(lastMonth.getTime())) {
    throw new Error('The selected month range is invalid.');
  }
  const start = startOfMonth(firstMonth);
  const end = endOfMonth(lastMonth);
  if (isAfter(start, end)) throw new Error('The first month must be before the last month.');
  return { start, end, label: `${format(start, 'MMMM yyyy')} - ${format(end, 'MMMM yyyy')}` };
}

const excelSafeText = (value: unknown) => {
  const text = value == null ? '' : String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const csvCell = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  const safe = excelSafeText(value);
  return `"${safe.replace(/"/g, '""')}"`;
};

const row = (values: unknown[]) => values.map(csvCell).join(',');

const addressText = (address: Address | null) =>
  address
    ? [address.address1, address.address2, address.city, address.state, address.zip, address.country]
        .filter(Boolean)
        .join(', ')
    : '';

const statusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

export function buildOrdersCsv(orders: ExportOrder[], range: OrderExportRange) {
  const activeOrders = orders.filter((order) => order.status !== 'cancelled');
  const revenue = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const paidRevenue = activeOrders
    .filter((order) => order.payment_status === 'paid')
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const statusCounts = orders.reduce<Record<OrderStatus, number>>(
    (counts, order) => ({ ...counts, [order.status]: counts[order.status] + 1 }),
    { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
  );

  const lines = [
    row(["90's Burger - Orders Report"]),
    row(['Selected period', range.label]),
    row(['Period start', format(range.start, 'yyyy-MM-dd HH:mm')]),
    row(['Period end', format(range.end, 'yyyy-MM-dd HH:mm')]),
    row(['Generated at', format(new Date(), 'yyyy-MM-dd HH:mm')]),
    '',
    row(['SUMMARY']),
    row(['Total orders', orders.length]),
    row(['Revenue (excluding cancelled orders)', revenue]),
    row(['Paid revenue', paidRevenue]),
    row(['Average order value', activeOrders.length ? revenue / activeOrders.length : 0]),
    row(['Cancelled order value', orders.filter((order) => order.status === 'cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0)]),
    row(['Pending orders', statusCounts.pending]),
    row(['Processing orders', statusCounts.processing]),
    row(['Shipped orders', statusCounts.shipped]),
    row(['Delivered orders', statusCounts.delivered]),
    row(['Cancelled orders', statusCounts.cancelled]),
    row(['Currency', 'EGP']),
    '',
    row(['ORDER DETAILS - one row per item']),
    row([
      'Order Number', 'Full Order ID', 'Order Date', 'Order Time', 'Customer Name', 'Customer Email',
      'Phone', 'Status', 'Payment Method', 'Payment Status', 'Transaction ID', 'Product', 'Quantity',
      'Unit Price (EGP)', 'Item Total (EGP)', 'Subtotal (EGP)', 'Delivery (EGP)', 'Discount (EGP)',
      'Order Total (EGP)', 'Coupon', 'Delivery Zone', 'Delivery Address', 'Notes', 'Confirmed By',
    ]),
  ];

  for (const order of orders) {
    const orderItems = order.items?.length ? order.items : [undefined];
    const confirmedBy = order.notes?.match(/Confirmed by:\s*(.+)$/im)?.[1]?.trim() || '';
    for (const item of orderItems) {
      lines.push(row([
        `#${order.id.slice(0, 8).toUpperCase()}`,
        order.id,
        format(new Date(order.created_at), 'yyyy-MM-dd'),
        format(new Date(order.created_at), 'HH:mm:ss'),
        order.customer_name || 'Guest',
        order.customer_email || '',
        order.shipping_address?.phone || '',
        statusLabel(order.status),
        order.payment_method === 'card' ? 'Card / VISA' : order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method || '',
        statusLabel(order.payment_status || ''),
        order.transaction_id || '',
        item?.product_name || '',
        item?.quantity ?? '',
        item ? Number(item.unit_price) : '',
        item ? Number(item.total_price) : '',
        Number(order.subtotal || 0),
        Number(order.shipping_cost || 0),
        Number(order.discount_amount || 0),
        Number(order.total || 0),
        order.coupon_code || '',
        order.shipping_address?.deliveryZoneName || '',
        addressText(order.shipping_address),
        order.notes || '',
        confirmedBy,
      ]));
    }
  }

  // UTF-8 BOM makes Arabic and other non-ASCII customer data display correctly in Excel.
  return `\uFEFF${lines.join('\r\n')}`;
}

export function downloadOrdersCsv(csv: string, range: OrderExportRange) {
  const filenameRange = `${format(range.start, 'yyyy-MM-dd')}_to_${format(range.end, 'yyyy-MM-dd')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `90s-burger-orders_${filenameRange}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
