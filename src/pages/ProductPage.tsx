import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { trackMetaEvent } from '@/lib/analytics';
import { useProductAddons } from '@/hooks/useProductAddons';
import type { ProductAddon } from '@/types';

export default function ProductPage(){
 const {slug=''}=useParams();const {data:product,isLoading}=useProduct(slug);const {data:addons=[]}=useProductAddons(product?.id);const {data:sideProducts=[]}=useProducts({categorySlug:'sides'});const {addItem}=useCart();const [qty,setQty]=useState(1);const [selected,setSelected]=useState<ProductAddon[]>([]);const [sideQuantities,setSideQuantities]=useState<Record<string,number>>({});
 useEffect(()=>{if(product)trackMetaEvent('ViewContent',{content_ids:[product.id],content_name:product.name,value:product.price,currency:'EGP'})},[product?.id]);
 const addonsTotal=useMemo(()=>selected.reduce((s,x)=>s+Number(x.price),0),[selected]);
 const sidesTotal=useMemo(()=>sideProducts.reduce((sum,side)=>sum+Number(side.price)*(sideQuantities[side.id]||0),0),[sideProducts,sideQuantities]);
 if(isLoading)return <MainLayout><div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-2"><Skeleton className="aspect-square rounded-3xl"/><div className="space-y-5"><Skeleton className="h-14"/><Skeleton className="h-40"/></div></div></MainLayout>;
 if(!product)return <MainLayout><div className="py-24 text-center"><h1 className="text-3xl font-black">ITEM NOT FOUND</h1><Link to="/shop"><Button className="mt-5">Back to menu</Button></Link></div></MainLayout>;
 const toggle=(addon:ProductAddon)=>setSelected(v=>{
  if(v.some(x=>x.id===addon.id))return v.filter(x=>x.id!==addon.id);
  const isPattyOption=['double','triple'].includes(addon.name.toLowerCase());
  return isPattyOption?[...v.filter(x=>!['double','triple'].includes(x.name.toLowerCase())),addon]:[...v,addon];
 });
 const changeSideQuantity=(sideId:string,change:number)=>setSideQuantities(current=>({...current,[sideId]:Math.max(0,(current[sideId]||0)+change)}));
 const selectedSides=sideProducts.filter(side=>(sideQuantities[side.id]||0)>0);
 const add=()=>{addItem(product,qty,selected);selectedSides.forEach(side=>addItem(side,sideQuantities[side.id]));trackMetaEvent('AddToCart',{content_ids:[product.id,...selectedSides.map(side=>side.id)],content_name:product.name,value:(product.price+addonsTotal)*qty+sidesTotal,currency:'EGP',num_items:qty+selectedSides.reduce((sum,side)=>sum+sideQuantities[side.id],0)})};
 return <MainLayout><div className="container mx-auto px-4 py-8 sm:py-12"><Link to="/shop" className="text-sm font-bold text-muted-foreground">← Back to menu</Link><div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16"><div className="overflow-hidden rounded-[2rem] bg-[#f8f5ff]"><img src={product.image_url||product.images?.[0]||'/placeholder.svg'} alt={product.name} className="aspect-square h-full w-full object-cover"/></div><div><p className="text-sm font-bold uppercase tracking-[.18em] text-[#f0008f]">{product.category?.name||'90’s Burger'}</p><h1 className="mt-2 text-4xl font-black uppercase leading-none sm:text-6xl">{product.name}</h1><p className="mt-4 text-2xl font-black">{formatCurrency(product.price)}</p><p className="mt-5 leading-relaxed text-muted-foreground">{product.description||'Made fresh to order with premium ingredients, our house sauce and a toasted bun.'}</p>
 {addons.length>0&&<div className="mt-8"><h2 className="text-lg font-black uppercase">Choose your sides &amp; extras</h2><div className="mt-3 grid grid-cols-2 gap-2">{addons.filter(x=>x.is_enabled).map(x=><button key={x.id} onClick={()=>toggle(x)} className={`flex items-center justify-between rounded-2xl border-2 p-3 text-left text-sm font-bold ${selected.some(a=>a.id===x.id)?'border-[#f0008f] bg-fuchsia-50':'border-black/10'}`}><span>{x.name}<small className="block font-normal text-muted-foreground">+{formatCurrency(Number(x.price))}</small></span>{selected.some(a=>a.id===x.id)&&<Check className="text-[#f0008f]"/>}</button>)}</div></div>}
 {product.category?.slug!=='sides'&&sideProducts.length>0&&<div className="mt-8"><h2 className="text-lg font-black uppercase">Add a side</h2><div className="mt-3 grid grid-cols-2 gap-2">{sideProducts.map(side=>{const sideQty=sideQuantities[side.id]||0;return <div key={side.id} className={`flex items-center justify-between gap-2 rounded-2xl border-2 p-3 text-left text-sm font-bold ${sideQty>0?'border-[#f0008f] bg-fuchsia-50':'border-black/10'}`}><span>{side.name}<small className="block font-normal text-muted-foreground">+{formatCurrency(Number(side.price))}</small></span><span className="flex shrink-0 items-center rounded-full border bg-white"><button type="button" className="p-2 disabled:opacity-30" onClick={()=>changeSideQuantity(side.id,-1)} disabled={sideQty===0} aria-label={`Remove one ${side.name}`}><Minus className="h-4 w-4"/></button><span className="w-6 text-center">{sideQty}</span><button type="button" className="p-2 disabled:opacity-30" onClick={()=>changeSideQuantity(side.id,1)} disabled={side.stock===0||sideQty>=side.stock} aria-label={`Add one ${side.name}`}><Plus className="h-4 w-4"/></button></span></div>})}</div></div>}
 <div className="mt-6 flex gap-3"><div className="flex items-center rounded-full border"><button className="p-3" onClick={()=>setQty(Math.max(1,qty-1))}><Minus/></button><span className="w-8 text-center font-bold">{qty}</span><button className="p-3" onClick={()=>setQty(qty+1)}><Plus/></button></div><Button onClick={add} disabled={product.stock===0} className="h-auto flex-1 rounded-full bg-[#f0008f] text-base text-white hover:bg-[#c60076]"><ShoppingBag/> Add · {formatCurrency((product.price+addonsTotal)*qty+sidesTotal)}</Button></div>
 </div></div></div></MainLayout>;
}
