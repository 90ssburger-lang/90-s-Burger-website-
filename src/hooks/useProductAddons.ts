import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProductAddon } from '@/types';

export function useProductAddons(productId?: string) {
  return useQuery({
    queryKey: ['product-addons', productId], enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase.from('product_addons').select('*').eq('product_id', productId!).order('sort_order');
      if (error) throw error;
      return data as ProductAddon[];
    },
  });
}

export function useReplaceProductAddons() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async ({ productId, addons }:{productId:string;addons:Array<Pick<ProductAddon,'name'|'price'|'is_enabled'>>}) => {
    const { error: deleteError } = await supabase.from('product_addons').delete().eq('product_id', productId);
    if (deleteError) throw deleteError;
    if (addons.length) {
      const { error } = await supabase.from('product_addons').insert(addons.map((a,index)=>({...a,product_id:productId,sort_order:index})));
      if (error) throw error;
    }
  }, onSuccess:(_,v)=>queryClient.invalidateQueries({queryKey:['product-addons',v.productId]}) });
}
