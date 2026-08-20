import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, MapPin, Star } from 'lucide-react';
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
    <section className="relative overflow-hidden bg-[#0d0914] text-[#f8f5ff]">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#00c8f0_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="container relative mx-auto grid min-h-[620px] items-center gap-10 px-4 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <div className="max-w-2xl">
          <h1 className="text-balance text-6xl font-black uppercase leading-[.88] tracking-[-.06em] sm:text-7xl lg:text-8xl">Big flavor.<br/><span className="text-[#f0008f]">90's attitude.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#f8f5ff]/70">Hot, juicy burgers stacked to order. Pick your favorite, load the extras, and we'll bring the good stuff to your door.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop"><Button size="lg" className="h-14 rounded-full bg-[#f0008f] px-8 text-base text-white hover:bg-[#c60076]">Order now <ArrowRight /></Button></Link>
            <Link to="/shop?category=beef-burgers"><Button size="lg" variant="outline" className="h-14 rounded-full border-white/25 bg-transparent px-8 text-[#f8f5ff] hover:bg-white/10">Explore burgers</Button></Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-[#f8f5ff]/70">
            <span className="flex items-center gap-2"><Clock3 className="text-[#00c8f0]"/> Fast delivery</span>
            <span className="flex items-center gap-2"><Star className="fill-[#00c8f0] text-[#00c8f0]"/> Made fresh</span>
            <span className="flex items-center gap-2"><MapPin className="text-[#00c8f0]"/> Alexandria</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[27rem] px-3 py-4 sm:px-5">
          <div className="absolute inset-[8%] -z-0 rounded-[3rem] bg-[#00c8f0]/35 blur-3xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[2rem] border border-[#00c8f0]/45 bg-[#fbf8ff] p-2 shadow-[0_32px_80px_-30px_rgba(0,0,0,.85)] sm:p-3">
            <picture>
              <source media="(max-width: 639px)" srcSet="/images/burger-exploded-guide-360.jpg" />
              <img
                className="block h-auto w-full rounded-[1.35rem] object-contain"
                src="/images/burger-exploded-guide-640.jpg"
                width="640"
                height="853"
                alt="Exploded double burger showing brioche buns, onions, tomatoes, cheddar cheese, lettuce, and premium beef patties"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
          </div>
          <span className="absolute -bottom-1 left-0 rounded-xl bg-[#f0008f] px-4 py-2 text-base font-black uppercase text-white shadow-xl sm:left-1 sm:px-5 sm:py-3 sm:text-lg">Fresh. Fast. Fire.</span>
        </div>
      </div>
    </section>

    <section className="bg-[#f8f5ff] py-16">
      <div className="container mx-auto px-4">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f0008f]">Pick your mood</p>
        <h2 className="mt-2 text-4xl font-black uppercase sm:text-5xl">The menu</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {categories.map(c => <Link key={c.slug} to={`/shop?category=${c.slug}`} className="group rounded-3xl border-2 border-[#0d0914]/10 bg-white p-5 transition hover:-translate-y-1 hover:border-[#f0008f] hover:shadow-xl">
            <div className="text-5xl transition group-hover:scale-110">{c.emoji}</div><h3 className="mt-5 text-xl font-black uppercase">{c.name}</h3><p className="mt-2 text-sm text-muted-foreground">{c.copy}</p>
          </Link>)}
        </div>
      </div>
    </section>

    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-[#f0008f]">Crowd favorites</p><h2 className="mt-2 text-4xl font-black uppercase sm:text-5xl">Most wanted</h2></div><Link to="/shop" className="hidden font-bold sm:flex">Full menu <ArrowRight className="ml-2"/></Link></div>
        <ProductGrid products={products} loading={isLoading} />
      </div>
    </section>
  </MainLayout>;
}
