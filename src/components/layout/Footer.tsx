import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Facebook, Instagram } from 'lucide-react';
import { getSocialLinks, type SocialLinks } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export function Footer() {
  const [social, setSocial] = useState<SocialLinks>(() => getSocialLinks());
  useEffect(() => { const update = () => setSocial(getSocialLinks()); void (supabase as any).from('site_settings').select('value').eq('key', 'social_links').maybeSingle().then(({ data }: any) => { if (data?.value) setSocial(data.value as SocialLinks); }); window.addEventListener('social-links-updated', update); window.addEventListener('storage', update); return () => { window.removeEventListener('social-links-updated', update); window.removeEventListener('storage', update); }; }, []);
  return <footer className="bg-[#0d0914] text-[#f8f5ff]">
    <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-3">
      <div>
        <img src="/images/90s-burger-neon-logo-128.png" width="128" height="128" loading="lazy" alt="90's Burger" className="h-32 w-32 rounded-2xl object-cover shadow-[0_0_35px_rgba(240,0,143,.18)]" />
        <p className="mt-4 max-w-sm text-sm text-white/60">Good food, loud flavor, zero fuss. Fresh burgers delivered hot.</p>
      </div>
      <div><h4 className="font-black uppercase text-[#00c8f0]">Menu</h4><div className="mt-4 grid gap-2 text-sm text-white/70"><Link to="/shop?category=beef-burgers">Beef Burgers</Link><Link to="/shop?category=chicken-burgers">Chicken Burgers</Link><Link to="/shop?category=sides">Sides</Link><Link to="/shop?category=drinks">Drinks</Link></div></div>
      <div><h4 className="font-black uppercase text-[#00c8f0]">Follow us</h4><div className="mt-4 flex gap-3">{social.instagram && <a href={social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-[#f0008f]"><Instagram className="h-5 w-5" /></a>}{social.facebook && <a href={social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-[#f0008f]"><Facebook className="h-5 w-5" /></a>}{social.tiktok && <a href={social.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-black hover:bg-[#f0008f]">TT</a>}{!social.instagram && !social.facebook && !social.tiktok && <p className="text-sm text-white/60">Social links coming soon.</p>}</div></div>
    </div>
    <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} 90's Burger. Made fresh.</div>
  </footer>;
}
