import { Link } from 'react-router-dom';
import { ShoppingBag, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/AuthContext';
import './Navbar.css';

const links = [{label:'Beef',slug:'beef-burgers'},{label:'Chicken',slug:'chicken-burgers'},{label:'Sides',slug:'sides'},{label:'Drinks',slug:'drinks'}];
export function Navbar() {
  const { itemCount } = useCart(); const [open,setOpen]=useState(false);
  const { user } = useAuth();
  return <header className="sticky top-0 z-50 border-b border-black/10 bg-[#fbf8ff]/95 backdrop-blur">
    <nav className="container mx-auto flex h-18 items-center justify-between px-4 py-3">
      <Link to="/" onClick={()=>setOpen(false)} className="flex items-center gap-3" aria-label="90's Burger home"><img src="/images/90s-burger-neon-logo-128.png" width="128" height="128" alt="" className="h-12 w-12 rounded-xl object-cover shadow-[0_0_18px_rgba(240,0,143,.2)] sm:h-14 sm:w-14"/><span className="hidden text-xl font-black uppercase tracking-[-.05em] sm:block">90's Burger</span></Link>
      <div className="hidden items-center gap-7 md:flex"><Link to="/shop" className="text-sm font-bold uppercase">Full Menu</Link>{links.map(l=><Link key={l.slug} to={`/shop?category=${l.slug}`} className="text-sm font-bold uppercase text-muted-foreground hover:text-[#f0008f]">{l.label}</Link>)}</div>
      <div className="flex items-center gap-2">{user ? <Link to="/profile" aria-label="Open my profile"><Button variant="ghost" size="icon" aria-label="Open my profile"><UserRound aria-hidden="true"/></Button></Link> : <Link to="/login" aria-label="Sign in"><Button variant="ghost" aria-label="Sign in" className="hidden rounded-full sm:flex">Sign in</Button></Link>}<Link to="/cart" aria-label={`Open shopping cart${itemCount ? `, ${itemCount} items` : ''}`}><Button aria-label={`Open shopping cart${itemCount ? `, ${itemCount} items` : ''}`} className="relative rounded-full bg-[#0d0914] text-white hover:bg-[#a80062]"><ShoppingBag aria-hidden="true"/> <span className="hidden sm:inline">Cart</span>{itemCount>0&&<span className="ml-1 rounded-full bg-[#00c8f0] px-2 text-xs text-black">{itemCount}</span>}</Button></Link><Button variant="ghost" size="icon" className="md:hidden" onClick={()=>setOpen(!open)} aria-label={open?'Close navigation menu':'Open navigation menu'} aria-expanded={open} aria-controls="mobile-navigation"><span className={`nav-burger nav-burger--squeeze${open?' is-open':''}`} aria-hidden="true"><span className="nav-burger__lines" /></span></Button></div>
    </nav>
    {open&&<div id="mobile-navigation" className="border-t bg-[#fbf8ff] px-4 py-5 md:hidden"><div className="grid gap-4"><Link to="/shop" onClick={()=>setOpen(false)} className="font-bold uppercase">Full Menu</Link>{links.map(l=><Link key={l.slug} to={`/shop?category=${l.slug}`} onClick={()=>setOpen(false)} className="font-bold uppercase">{l.label}</Link>)}<Link to={user?'/profile':'/login'} onClick={()=>setOpen(false)} className="font-bold uppercase">{user?'My Profile':'Sign in'}</Link></div></div>}
  </header>;
}
