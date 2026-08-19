import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Flame, MapPin, Star } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';

const categories = [
  { name: 'Beef Burgers', slug: 'beef-burgers', emoji: '🍔', copy: 'Smashed fresh, crispy at the edges.' },
  { name: 'Chicken Burgers', slug: 'chicken-burgers', emoji: '🍗', copy: 'Crunchy chicken, soft toasted buns.' },
  { name: 'Sides', slug: 'sides', emoji: '🍟', copy: 'Golden sides made for sharing.' },
  { name: 'Drinks', slug: 'drinks', emoji: '🥤', copy: 'Ice-cold refreshment for every bite.' },
];

export default function HomePage() {
  const { data: featured = [], isLoading } = useProducts({ featured: true });
  const { data: all = [] } = useProducts({});
  const products = featured.length ? featured.slice(0, 8) : all.slice(0, 8);

  return <MainLayout>
    <section className="relative overflow-hidden bg-[#17120f] text-[#fff7df]">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#f6b73c_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="container relative mx-auto grid min-h-[620px] items-center gap-10 px-4 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#f6b73c]/40 bg-[#f6b73c]/10 px-4 py-2 text-xs font-bold uppercase tracking-[.2em] text-[#f6b73c]">
            <Flame className="h-4 w-4" /> Cairo's smash burger
          </div>
          <h1 className="text-balance text-6xl font-black uppercase leading-[.88] tracking-[-.06em] sm:text-7xl lg:text-8xl">Big flavor.<br/><span className="text-[#ef3e2f]">90's attitude.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#fff7df]/70">Hot, juicy burgers stacked to order. Pick your favorite, load the extras, and we'll bring the good stuff to your door.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop"><Button size="lg" className="h-14 rounded-full bg-[#ef3e2f] px-8 text-base text-white hover:bg-[#d92d20]">Order now <ArrowRight /></Button></Link>
            <Link to="/shop?category=beef-burgers"><Button size="lg" variant="outline" className="h-14 rounded-full border-white/25 bg-transparent px-8 text-[#fff7df] hover:bg-white/10">Explore burgers</Button></Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-[#fff7df]/70">
            <span className="flex items-center gap-2"><Clock3 className="text-[#f6b73c]"/> Fast delivery</span>
            <span className="flex items-center gap-2"><Star className="fill-[#f6b73c] text-[#f6b73c]"/> Made fresh</span>
            <span className="flex items-center gap-2"><MapPin className="text-[#f6b73c]"/> Cairo</span>
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-xl">
          <div className="absolute inset-[8%] rounded-full bg-[#f6b73c]" />
          <img className="relative h-full w-full rotate-[-3deg] object-cover [clip-path:circle(43%)] drop-shadow-2xl" src={products[0]?.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85'} alt="90's Burger signature burger" />
          <span className="absolute bottom-[10%] right-[2%] rotate-6 rounded-xl bg-[#ef3e2f] px-5 py-3 text-xl font-black uppercase shadow-xl">Fresh. Fast. Fire.</span>
        </div>
      </div>
    </section>

    <section className="bg-[#fff7df] py-16">
      <div className="container mx-auto px-4">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-[#ef3e2f]">Pick your mood</p>
        <h2 className="mt-2 text-4xl font-black uppercase sm:text-5xl">The menu</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {categories.map(c => <Link key={c.slug} to={`/shop?category=${c.slug}`} className="group rounded-3xl border-2 border-[#17120f]/10 bg-white p-5 transition hover:-translate-y-1 hover:border-[#ef3e2f] hover:shadow-xl">
            <div className="text-5xl transition group-hover:scale-110">{c.emoji}</div><h3 className="mt-5 text-xl font-black uppercase">{c.name}</h3><p className="mt-2 text-sm text-muted-foreground">{c.copy}</p>
          </Link>)}
        </div>
      </div>
    </section>

    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-[#ef3e2f]">Crowd favorites</p><h2 className="mt-2 text-4xl font-black uppercase sm:text-5xl">Most wanted</h2></div><Link to="/shop" className="hidden font-bold sm:flex">Full menu <ArrowRight className="ml-2"/></Link></div>
        <ProductGrid products={products} loading={isLoading} />
      </div>
    </section>
  </MainLayout>;
}
