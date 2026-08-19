import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { trackMetaEvent } from '@/lib/analytics';

const extras=[{name:'Extra cheese',price:25},{name:'Beef bacon',price:40},{name:'Jalapeños',price:15},{name:'Extra sauce',price:12}];
export default function ProductPage(){
 const {slug=''}=useParams();const {data:product,isLoading}=useProduct(slug);const {addItem}=useCart();const [qty,setQty]=useState(1);const [selected,setSelected]=useState<string[]>([]);const [combo,setCombo]=useState(false);
 useEffect(()=>{if(product)trackMetaEvent('ViewContent',{content_ids:[product.id],content_name:product.name,value:product.price,currency:'EGP'})},[product?.id]);
 const extraTotal=useMemo(()=>extras.filter(x=>selected.includes(x.name)).reduce((s,x)=>s+x.price,0)+(combo?75:0),[selected,combo]);
 if(isLoading)return <MainLayout><div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-2"><Skeleton className="aspect-square rounded-3xl"/><div className="space-y-5"><Skeleton className="h-14"/><Skeleton className="h-40"/></div></div></MainLayout>;
 if(!product)return <MainLayout><div className="py-24 text-center"><h1 className="text-3xl font-black">ITEM NOT FOUND</h1><Link to="/shop"><Button className="mt-5">Back to menu</Button></Link></div></MainLayout>;
 const toggle=(name:string)=>setSelected(v=>v.includes(name)?v.filter(x=>x!==name):[...v,name]);
 const add=()=>{const customized={...product,price:product.price+extraTotal,description:`${product.description||''}${selected.length?` • Extras: ${selected.join(', ')}`:''}${combo?' • Combo: fries + drink':''}`};addItem(customized,qty);trackMetaEvent('AddToCart',{content_ids:[product.id],content_name:product.name,value:(product.price+extraTotal)*qty,currency:'EGP',num_items:qty})};
 return <MainLayout><div className="container mx-auto px-4 py-8 sm:py-12"><Link to="/shop" className="text-sm font-bold text-muted-foreground">← Back to menu</Link><div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16"><div className="overflow-hidden rounded-[2rem] bg-[#fff7df]"><img src={product.image_url||product.images?.[0]||'/placeholder.svg'} alt={product.name} className="aspect-square h-full w-full object-cover"/></div><div><p className="text-sm font-bold uppercase tracking-[.18em] text-[#ef3e2f]">{product.category?.name||'90’s Burger'}</p><h1 className="mt-2 text-4xl font-black uppercase leading-none sm:text-6xl">{product.name}</h1><p className="mt-4 text-2xl font-black">{formatCurrency(product.price)}</p><p className="mt-5 leading-relaxed text-muted-foreground">{product.description||'Made fresh to order with premium ingredients, our house sauce and a toasted bun.'}</p>
 <div className="mt-8"><h2 className="text-lg font-black uppercase">Make it yours</h2><div className="mt-3 grid grid-cols-2 gap-2">{extras.map(x=><button key={x.name} onClick={()=>toggle(x.name)} className={`flex items-center justify-between rounded-2xl border-2 p-3 text-left text-sm font-bold ${selected.includes(x.name)?'border-[#ef3e2f] bg-red-50':'border-black/10'}`}><span>{x.name}<small className="block font-normal text-muted-foreground">+{formatCurrency(x.price)}</small></span>{selected.includes(x.name)&&<Check className="text-[#ef3e2f]"/>}</button>)}</div></div>
 <button onClick={()=>setCombo(!combo)} className={`mt-4 flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left ${combo?'border-[#f6b73c] bg-[#fff7df]':'border-black/10'}`}><span><strong className="block uppercase">Make it a Combo</strong><small className="text-muted-foreground">Add crispy fries + a soft drink</small></span><strong>+{formatCurrency(75)}</strong></button>
 <div className="mt-6 flex gap-3"><div className="flex items-center rounded-full border"><button className="p-3" onClick={()=>setQty(Math.max(1,qty-1))}><Minus/></button><span className="w-8 text-center font-bold">{qty}</span><button className="p-3" onClick={()=>setQty(qty+1)}><Plus/></button></div><Button onClick={add} disabled={product.stock===0} className="h-auto flex-1 rounded-full bg-[#ef3e2f] text-base text-white hover:bg-[#d92d20]"><ShoppingBag/> Add · {formatCurrency((product.price+extraTotal)*qty)}</Button></div>
 </div></div></div></MainLayout>;
}
