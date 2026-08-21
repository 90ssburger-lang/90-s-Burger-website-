import { describe, expect, it } from 'vitest';
import { buildOrdersCsv, getOrderExportRange, type ExportOrder } from './ordersCsv';

const baseOrder: ExportOrder = {
  id: '12345678-aaaa-bbbb-cccc-123456789012',
  user_id: null,
  status: 'delivered',
  payment_method: 'card',
  payment_status: 'paid',
  transaction_id: '=unsafe-formula',
  paid_at: '2026-08-10T12:00:00.000Z',
  total_amount_cents: 125000,
  total: 1250,
  subtotal: 1100,
  shipping_cost: 150,
  discount_amount: 0,
  shipping_address: {
    firstName: 'Mona', lastName: 'Ali', address1: '12 Sea Rd', city: 'Alexandria', state: 'Alexandria',
    zip: '21500', country: 'EG', phone: '01000000000', deliveryZoneName: 'Smouha',
  },
  billing_address: null,
  customer_email: 'mona@example.com',
  customer_name: 'Mona, Ali',
  notes: 'Call on arrival\nConfirmed by: Nour',
  coupon_id: null,
  coupon_code: null,
  created_at: '2026-08-10T12:00:00.000Z',
  updated_at: '2026-08-10T12:00:00.000Z',
  items: [{
    id: 'item-1', order_id: '12345678-aaaa-bbbb-cccc-123456789012', product_id: 'product-1',
    product_name: 'Double Burger', product_image: null, quantity: 2, unit_price: 550, total_price: 1100,
    created_at: '2026-08-10T12:00:00.000Z',
  }],
};

describe('getOrderExportRange', () => {
  it('includes complete selected months', () => {
    const range = getOrderExportRange('custom', new Date('2026-08-21T12:00:00'), '2026-05', '2026-07');
    expect(range.start.getMonth()).toBe(4);
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getMonth()).toBe(6);
    expect(range.end.getDate()).toBe(31);
  });

  it('rejects a reversed custom range', () => {
    expect(() => getOrderExportRange('custom', new Date(), '2026-08', '2026-02')).toThrow();
  });
});

describe('buildOrdersCsv', () => {
  it('includes summaries, item details, UTF-8 support, and formula-injection protection', () => {
    const cancelled = { ...baseOrder, id: '87654321-aaaa-bbbb-cccc-123456789012', status: 'cancelled' as const, total: 300 };
    const range = getOrderExportRange('month', new Date('2026-08-21T12:00:00'));
    const csv = buildOrdersCsv([baseOrder, cancelled], range);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Total orders",2');
    expect(csv).toContain('"Revenue (excluding cancelled orders)",1250');
    expect(csv).toContain('"Cancelled order value",300');
    expect(csv).toContain('"Mona, Ali"');
    expect(csv).toContain("\"'=unsafe-formula\"");
    expect(csv).toContain('"Double Burger",2,550,1100');
  });
});
