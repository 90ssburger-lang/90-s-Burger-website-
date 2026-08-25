import type { Order } from '@/types';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const money = (value: unknown) => `${Number(value || 0).toFixed(2)} L.E.`;

export function printReceipt(order: Order) {
  const receiptFrame = document.createElement('iframe');
  receiptFrame.setAttribute('aria-hidden', 'true');
  receiptFrame.style.position = 'fixed';
  receiptFrame.style.width = '0';
  receiptFrame.style.height = '0';
  receiptFrame.style.border = '0';
  receiptFrame.style.visibility = 'hidden';
  document.body.appendChild(receiptFrame);

  const receiptWindow = receiptFrame.contentWindow;
  if (!receiptWindow) {
    receiptFrame.remove();
    throw new Error('Could not prepare the receipt for printing.');
  }

  const address = order.shipping_address;
  const addressText = address
    ? [address.address1, address.address2, address.city, address.state, address.zip]
        .filter(Boolean)
        .join(', ')
    : 'Not provided';
  const paymentMethod = order.payment_method === 'cod'
    ? 'Cash on Delivery'
    : order.payment_method === 'card'
      ? 'Card'
      : order.payment_method || 'Not set';
  const itemRows = (order.items || []).map((item) => `
    <div class="item">
      <div class="item-name">${escapeHtml(item.product_name)}</div>
      <div class="item-line">
        <span>${item.quantity} x ${money(item.unit_price)}</span>
        <strong>${money(item.total_price)}</strong>
      </div>
    </div>`).join('');

  receiptWindow.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Receipt #${escapeHtml(order.id.slice(0, 8))}</title>
<style id="receipt-page-size">
  @page { size: 80mm 200mm; margin: 3mm; }
  * { box-sizing: border-box; }
  body { width: 74mm; margin: 0 auto; color: #000; background: #fff; font: 12px/1.35 Arial, sans-serif; }
  h1, p { margin: 0; }
  .center { text-align: center; }
  .brand { font-size: 22px; font-weight: 900; letter-spacing: 1px; }
  .muted { font-size: 10px; }
  .rule { border-top: 1px dashed #000; margin: 8px 0; }
  .row, .item-line { display: flex; justify-content: space-between; gap: 8px; }
  .row span:first-child { color: #222; }
  .item { margin: 7px 0; }
  .item-name { font-weight: 700; overflow-wrap: anywhere; }
  .total { font-size: 16px; font-weight: 900; }
  .details { overflow-wrap: anywhere; }
  @media screen { body { padding: 12px 0; } }
</style></head><body>
  <header class="center">
    <h1 class="brand">90'S BURGER</h1>
    <p>Order Receipt</p>
  </header>
  <div class="rule"></div>
  <div class="row"><strong>Order</strong><strong>#${escapeHtml(order.id.slice(0, 8).toUpperCase())}</strong></div>
  <div class="row"><span>Date</span><span>${escapeHtml(new Date(order.created_at).toLocaleString())}</span></div>
  <div class="row"><span>Status</span><span>${escapeHtml(order.status.toUpperCase())}</span></div>
  <div class="rule"></div>
  <div class="details">
    <strong>${escapeHtml(order.customer_name || 'Guest')}</strong><br>
    ${escapeHtml(address?.phone || order.customer_email || 'No contact provided')}<br>
    ${escapeHtml(addressText)}
  </div>
  <div class="rule"></div>
  ${itemRows || '<p class="center">No items found</p>'}
  <div class="rule"></div>
  <div class="row"><span>Subtotal</span><span>${money(order.subtotal)}</span></div>
  <div class="row"><span>Delivery</span><span>${money(order.shipping_cost)}</span></div>
  ${Number(order.discount_amount || 0) > 0 ? `<div class="row"><span>Discount${order.coupon_code ? ` (${escapeHtml(order.coupon_code)})` : ''}</span><span>-${money(order.discount_amount)}</span></div>` : ''}
  <div class="row total"><span>TOTAL</span><span>${money(order.total)}</span></div>
  <div class="rule"></div>
  <div class="row"><span>Payment</span><span>${escapeHtml(paymentMethod)}</span></div>
  <div class="row"><span>Payment status</span><span>${escapeHtml((order.payment_status || 'unpaid').toUpperCase())}</span></div>
  ${order.notes ? `<div class="rule"></div><div><strong>Notes</strong><br>${escapeHtml(order.notes)}</div>` : ''}
  <div class="rule"></div>
  <p class="center">Thank you!</p>
  <p class="center muted">90's Burger</p>
</body></html>`);
  receiptWindow.document.close();

  const removeFrame = () => receiptFrame.remove();
  receiptWindow.addEventListener('afterprint', removeFrame, { once: true });
  window.setTimeout(() => {
    // CSS paged media does not reliably support an automatic page height.
    // Measure this receipt and set an exact 80 mm page with no long blank tail.
    const contentHeightPx = receiptWindow.document.documentElement.scrollHeight;
    const contentHeightMm = Math.ceil((contentHeightPx * 25.4) / 96 + 6);
    const pageHeightMm = Math.max(80, contentHeightMm);
    const pageSizeStyle = receiptWindow.document.getElementById('receipt-page-size');
    if (pageSizeStyle) {
      pageSizeStyle.textContent = `
        @page { size: 80mm ${pageHeightMm}mm; margin: 3mm; }
        * { box-sizing: border-box; }
        body { width: 74mm; margin: 0 auto; color: #000; background: #fff; font: 12px/1.35 Arial, sans-serif; }
        h1, p { margin: 0; }
        .center { text-align: center; }
        .brand { font-size: 22px; font-weight: 900; letter-spacing: 1px; }
        .muted { font-size: 10px; }
        .rule { border-top: 1px dashed #000; margin: 8px 0; }
        .row, .item-line { display: flex; justify-content: space-between; gap: 8px; }
        .row span:first-child { color: #222; }
        .item { margin: 7px 0; }
        .item-name { font-weight: 700; overflow-wrap: anywhere; }
        .total { font-size: 16px; font-weight: 900; }
        .details { overflow-wrap: anywhere; }
      `;
    }
    receiptWindow.focus();
    receiptWindow.print();
    window.setTimeout(removeFrame, 60_000);
  }, 100);
}
