import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DeliveryZone } from '@/types';
import { toast } from 'sonner';

export function useDeliveryZones(options: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: ['delivery-zones', options.includeInactive],
    queryFn: async () => {
      let query = supabase.from('delivery_zones').select('*').order('sort_order').order('name');
      if (!options.includeInactive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return data as DeliveryZone[];
    },
  });
}

export function useSaveDeliveryZone() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (zone: Partial<DeliveryZone> & Pick<DeliveryZone, 'name' | 'delivery_fee'>) => {
      const payload = { name: zone.name.trim(), delivery_fee: Number(zone.delivery_fee), is_active: zone.is_active ?? true, sort_order: Number(zone.sort_order ?? 0) };
      const request = zone.id
        ? supabase.from('delivery_zones').update(payload).eq('id', zone.id)
        : supabase.from('delivery_zones').insert(payload);
      const { data, error } = await request.select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { client.invalidateQueries({ queryKey: ['delivery-zones'] }); toast.success('Delivery zone saved'); },
    onError: (error) => toast.error(`Could not save zone: ${error.message}`),
  });
}

export function useDeleteDeliveryZone() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { client.invalidateQueries({ queryKey: ['delivery-zones'] }); toast.success('Delivery zone deleted'); },
    onError: (error) => toast.error(`Could not delete zone: ${error.message}`),
  });
}
