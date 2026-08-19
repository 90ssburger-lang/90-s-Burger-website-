import { Link } from 'react-router-dom';
import { Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/AuthContext';

const links = [{label:'Beef',slug:'beef-burgers'},{label:'Chicken',slug:'chicken-burgers'},{label:'Sides',slug:'sides'},{label:'Drinks',slug:'drinks'}];
export function Navbar() {
  const { itemCount } = useCart(); const [open,setOpen]=useState(false);
  const { user } = useAuth();
  return <header className="sticky top-0 z-50 border-b border-black/10 bg-[#fffaf0]/95 backdrop-blur">
    <nav className="container mx-auto flex h-18 items-center justify-between px-4 py-3">
      <Link to="/" onClick={()=>setOpen(false)} className="flex items-center gap-2 text-2xl font-black uppercase tracking-[-.06em]"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#ef3e2f] text-lg text-white">90</span><span>90's Burger</span></Link>
      <div className="hidden items-center gap-7 md:flex"><Link to="/shop" className="text-sm font-bold uppercase">Full Menu</Link>{links.map(l=><Link key={l.slug} to={`/shop?category=${l.slug}`} className="text-sm font-bold uppercase text-muted-foreground hover:text-[#ef3e2f]">{l.label}</Link>)}</div>
      <div className="flex items-center gap-2">{user ? <Link to="/profile"><Button variant="ghost" size="icon" aria-label="My profile"><UserRound/></Button></Link> : <Link to="/login"><Button variant="ghost" className="hidden rounded-full sm:flex">Sign in</Button></Link>}<Link to="/cart"><Button className="relative rounded-full bg-[#17120f] text-white hover:bg-[#ef3e2f]"><ShoppingBag/> <span className="hidden sm:inline">Cart</span>{itemCount>0&&<span className="ml-1 rounded-full bg-[#f6b73c] px-2 text-xs text-black">{itemCount}</span>}</Button></Link><Button variant="ghost" size="icon" className="md:hidden" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</Button></div>
    </nav>
    {open&&<div className="border-t bg-[#fffaf0] px-4 py-5 md:hidden"><div className="grid gap-4"><Link to="/shop" onClick={()=>setOpen(false)} className="font-bold uppercase">Full Menu</Link>{links.map(l=><Link key={l.slug} to={`/shop?category=${l.slug}`} onClick={()=>setOpen(false)} className="font-bold uppercase">{l.label}</Link>)}<Link to={user?'/profile':'/login'} onClick={()=>setOpen(false)} className="font-bold uppercase">{user?'My Profile':'Sign in'}</Link></div></div>}
  </header>;
}
