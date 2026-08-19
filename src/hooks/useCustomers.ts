import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Address, Order } from '@/types';

export type CustomerRecord = {
  key: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  address: Address | null;
  orders: Order[];
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  registeredAt: string | null;
};

const normalizeEmail = (value: string | null | undefined) => (value || '').trim().toLowerCase();

export function useCustomers() {
  return useQuery({
    queryKey: ['erp-customers'],
    queryFn: async (): Promise<CustomerRecord[]> => {
      const [profilesResult, ordersResult] = await Promise.all([
        supabase.from('profiles').select('id,email,full_name,created_at,role').eq('role', 'customer'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (ordersResult.error) throw ordersResult.error;

      const records = new Map<string, CustomerRecord>();
      for (const profile of profilesResult.data || []) {
        const email = normalizeEmail(profile.email);
        records.set(email || profile.id, { key: email || profile.id, userId: profile.id, name: profile.full_name || email.split('@')[0] || 'Customer', email, phone: '', address: null, orders: [], orderCount: 0, totalSpent: 0, lastOrderAt: null, registeredAt: profile.created_at });
      }
      for (const raw of ordersResult.data || []) {
        const order = raw as unknown as Order;
        const email = normalizeEmail(order.customer_email);
        const key = email || order.user_id || `order:${order.id}`;
        const address = order.shipping_address && typeof order.shipping_address === 'object' ? order.shipping_address as Address : null;
        const existing = records.get(key) || { key, userId: order.user_id, name: order.customer_name || 'Guest customer', email, phone: '', address: null, orders: [], orderCount: 0, totalSpent: 0, lastOrderAt: null, registeredAt: null };
        existing.orders.push({ ...order, shipping_address: address, billing_address: order.billing_address as Address | null });
        existing.orderCount += 1;
        if (order.status !== 'cancelled') existing.totalSpent += Number(order.total || 0);
        if (!existing.lastOrderAt || order.created_at > existing.lastOrderAt) {
          existing.lastOrderAt = order.created_at;
          existing.name = order.customer_name || existing.name;
          existing.address = address || existing.address;
          existing.phone = address?.phone || existing.phone;
        }
        if (!existing.userId && order.user_id) existing.userId = order.user_id;
        records.set(key, existing);
      }
      return [...records.values()].sort((a, b) => (b.lastOrderAt || b.registeredAt || '').localeCompare(a.lastOrderAt || a.registeredAt || ''));
    },
  });
}
