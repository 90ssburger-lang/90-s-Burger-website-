import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';

export function ProductCard({ product }: { product: Product; featured?: boolean }) {
  const { addItem } = useCart();
  return <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
    <Link to={`/product/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-[#f8f5ff]">
      <img src={product.image_url || product.images?.[0] || '/placeholder.svg'} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      {product.is_featured && <span className="absolute left-2 top-2 rounded-full bg-[#00c8f0] px-2 py-1 text-[10px] font-black uppercase sm:left-3 sm:top-3 sm:px-3 sm:text-xs">Fan favorite</span>}
    </Link>
    <div className="flex flex-1 flex-col p-3 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-[#f0008f]">{product.category?.name || '90’s Burger'}</p>
      <Link to={`/product/${product.slug}`}><h3 className="mt-2 text-base font-black uppercase leading-tight sm:text-xl">{product.name}</h3></Link>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground">{product.description || 'Freshly made with premium ingredients and our signature sauce.'}</p>
      <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between"><span className="whitespace-nowrap text-base font-black sm:text-lg">{formatCurrency(product.price)}</span><Button onClick={() => addItem(product)} disabled={product.stock === 0} size="sm" className="w-full rounded-full bg-[#f0008f] px-3 text-white hover:bg-[#c60076] sm:w-auto sm:px-4"><Plus className="h-4 w-4"/> Add<span className="hidden lg:inline"> to Cart</span></Button></div>
    </div>
  </article>;
}
