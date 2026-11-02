import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import {
  CATEGORIES,
  TESTIMONIALS,
  getUnsplashUrl,
  getFallbackSvg,
} from '../data/products';
import { useCatalog } from '../context/CatalogContext';
import { useSiteMedia } from '../context/SiteMediaContext';

export default function Home({ onShowToast }) {
  const { products: PRODUCTS, categories: catalogCategories } = useCatalog();
  const { getVideoProps, getMedia } = useSiteMedia();
  const categories = catalogCategories.length ? catalogCategories : CATEGORIES;
  const [selectedPill, setSelectedPill] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const heroVideo = getVideoProps('home_hero_circle_video', {
    src: '/videos/gulfam-commercial.mp4',
    poster: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80',
  });

  const displayedProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (selectedPill === 'all' && !q) {
      // Curated bestseller highlights
      const curatedIds = [1, 2, 3, 9, 17, 21, 13, 25];
      return curatedIds
        .map((id) => PRODUCTS.find((p) => p.id === id))
        .filter(Boolean);
    }

    return PRODUCTS.filter((item) => {
      const matchCat = selectedPill === 'all' || item.c === selectedPill;
      const matchQuery =
        !q || (item.n + ' ' + item.d).toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [selectedPill, searchQuery, PRODUCTS]);

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-[11px] tracking-[.25em] text-g-dark font-semibold">
            DECADES OF ROYAL CONFECTIONERY HERITAGE
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-m-dark leading-[1.1] mt-4">
            Delicious Mithai &amp; Fresh Delights for{' '}
            <em className="text-g-dark italic">Every Occasion</em>
          </h1>
          <p className="mt-5 text-stone-600 leading-relaxed max-w-lg text-sm md:text-base">
            Handcrafted with 100% pure desi ghee, saffron and hand-picked dry
            fruits. Order online for fast delivery, fresh from our kitchen since
            1990.
          </p>
          <div className="flex flex-wrap gap-3.5 mt-8">
            <Link
              to="/mithai"
              className="btn btn-m shadow-md hover:shadow-lg"
            >
              Shop Mithai
            </Link>
            <Link
              to="/wedding-bulk"
              className="btn btn-g shadow-md hover:shadow-lg"
            >
              Wedding &amp; Bulk Orders
            </Link>
          </div>
        </div>

        {/* Hero Circular Visual with Golden Ring */}
        <div className="relative max-w-md mx-auto w-full">
          <div className="aspect-square rounded-full gold-ring overflow-hidden shadow-2xl relative bg-stone-950 group">
            <video
              key={heroVideo.src}
              autoPlay={heroVideo.autoPlay}
              loop={heroVideo.loop}
              muted={heroVideo.muted}
              playsInline
              preload="auto"
              poster={heroVideo.poster}
              className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-700"
            >
              <source src={heroVideo.src} type="video/mp4" />
              <source src="/videos/hero-food-video.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="absolute -bottom-2 -left-2 md:-left-8 bg-white rounded-2xl shadow-xl px-5 py-3 border border-g-light animate-fadeIn">
            <p className="text-xs text-stone-500 font-medium">
              Festive favourite
            </p>
            <p className="font-display text-m font-bold text-base md:text-lg">
              25 Assorted Mithai
            </p>
          </div>
        </div>
      </div>

      {/* Shop by Category Circles */}
      <div className="max-w-7xl mx-auto px-4 pb-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-m-dark">
          Shop by <em className="text-g-dark italic">Category</em>
        </h2>
        <p className="text-sm text-stone-500 mt-2">
          Explore our freshly made catalog of royal delicacies.
        </p>

        <div className="flex md:justify-center gap-6 md:gap-9 overflow-x-auto hide-sb mt-10 pb-4 px-2">
          {categories.map((cat) => {
            const catImage = getMedia('home_cat_' + cat.id, getUnsplashUrl(cat.i)).url;
            return (
              <Link
                key={cat.id}
                to={cat.path}
                className="cc text-center shrink-0 w-24 md:w-28 group"
              >
                <div className="gold-ring rounded-full aspect-square overflow-hidden bg-white shadow-md">
                  <img
                    src={catImage}
                    alt={cat.n}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getFallbackSvg(cat.n);
                    }}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-m-dark group-hover:text-m transition-colors">
                  {cat.n}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Delicacies Filter Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          {/* Category Pills Bar */}
          <div className="flex gap-2 overflow-x-auto hide-sb pb-2">
            <button
              onClick={() => setSelectedPill('all')}
              className={`pill ${selectedPill === 'all' ? 'on' : ''}`}
            >
              All Delicacies
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedPill(cat.id)}
                className={`pill ${selectedPill === cat.id ? 'on' : ''}`}
              >
                {cat.n}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search samosas, gulab jamun, nan khatai..."
            className="md:max-w-xs !rounded-full text-sm"
          />
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onShowToast={onShowToast}
            />
          ))}
        </div>

        {displayedProducts.length === 0 && (
          <p className="text-center text-stone-500 py-16 text-base">
            No delicacies match your search.
          </p>
        )}

        <div className="text-center mt-12">
          <Link
            to="/mithai"
            className="btn btn-o !px-8 !py-3 hover:shadow-md"
          >
            Explore Complete Menu
          </Link>
        </div>
      </div>

      {/* Celebration & Bulk Banner */}
      <div className="bg-m my-6">
        <div className="max-w-7xl mx-auto px-4 py-14 grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <p className="text-g text-xs tracking-[.25em] font-semibold">
              WEDDINGS, EVENTS &amp; CORPORATE GIFTING
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-white font-bold mt-2">
              Planning a celebration?{' '}
              <em className="text-g italic">We cater to 10 or 10,000.</em>
            </h2>
            <p className="text-white/80 text-sm mt-3 max-w-xl leading-relaxed">
              Custom mithai thaals, dry-fruit hampers and bulk orders with free
              tasting and delivery coordination.
            </p>
          </div>
          <div>
            <Link
              to="/wedding-bulk"
              className="btn btn-g shadow-xl hover:shadow-2xl whitespace-nowrap"
            >
              Get a Bulk Quote
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-m-dark">
          Loved by <em className="text-g-dark italic">Families</em>
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mt-10 text-left">
          {TESTIMONIALS.map(([author, quote], idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-g-light p-6 shadow-sm hover:shadow transition-shadow"
            >
              <div className="text-g text-base tracking-wider">★★★★★</div>
              <p className="text-sm text-stone-600 mt-2.5 leading-relaxed">
                "{quote}"
              </p>
              <p className="font-display font-bold text-m mt-4 text-base">
                {author}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
