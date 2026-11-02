import React, { useState, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import BulkQuoteForm from '../components/BulkQuoteForm';
import {
  getCategory,
} from '../data/products';
import { useCatalog } from '../context/CatalogContext';
import { useSiteMedia } from '../context/SiteMediaContext';

export default function CategoryPage({ forcedSlug, onShowToast }) {
  const location = useLocation();
  const { categorySlug } = useParams();
  const { products: PRODUCTS, categories } = useCatalog();
  const { getVideoProps } = useSiteMedia();

  // Resolve category from forcedSlug or URL pathname
  const slug =
    forcedSlug ||
    categorySlug ||
    location.pathname.replace('/', '').trim() ||
    'mithai';

  const category = useMemo(() => {
    return (
      getCategory(slug) ||
      categories.find((c) => c.slug === slug || c.id === slug) ||
      categories[0]
    );
  }, [slug, categories]);

  const isMithai =
    category?.id === 'mithai' ||
    category?.slug === 'mithai' ||
    slug === 'mithai' ||
    category?.n?.toLowerCase().includes('mithai');

  const isNimco =
    category?.id === 'nimco' ||
    category?.slug === 'nimco' ||
    slug === 'nimco' ||
    slug === 'nimkos' ||
    category?.n?.toLowerCase().includes('nimco') ||
    category?.n?.toLowerCase().includes('nimko');

  const isFreshSnacks =
    category?.id === 'snacks' ||
    category?.slug === 'fresh-snacks' ||
    slug === 'fresh-snacks' ||
    slug === 'snacks' ||
    category?.n?.toLowerCase().includes('snack');

  const isFrozen =
    category?.id === 'frozen' ||
    category?.slug === 'frozen-foods' ||
    slug === 'frozen-foods' ||
    slug === 'frozen' ||
    category?.n?.toLowerCase().includes('frozen');

  const isBakery =
    category?.id === 'bakery' ||
    category?.slug === 'bakery' ||
    slug === 'bakery' ||
    category?.n?.toLowerCase().includes('bakery');

  const isCakes =
    category?.id === 'cakes' ||
    category?.slug === 'cakes' ||
    category?.slug === 'cakes-desserts' ||
    slug === 'cakes' ||
    slug === 'cakes-desserts' ||
    category?.n?.toLowerCase().includes('cake');

  const isWedding =
    category?.id === 'wedding' ||
    category?.slug === 'wedding-bulk' ||
    category?.slug === 'wedding-bulk-orders' ||
    slug === 'wedding' ||
    slug === 'wedding-bulk' ||
    slug === 'wedding-bulk-orders' ||
    category?.n?.toLowerCase().includes('wedding') ||
    category?.n?.toLowerCase().includes('bulk');

  const mithaiVideo = getVideoProps('mithai_hero_video', { src: '/videos/mithai-food-video.mp4', poster: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=1600&q=80' });
  const nimcoVideo = getVideoProps('nimco_hero_video', { src: '/videos/nimco-food-video.mp4', poster: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1600&q=80' });
  const snacksVideo = getVideoProps('fresh_snacks_hero_video', { src: '/videos/fresh-snacks-video.mp4', poster: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1600&q=80' });
  const frozenVideo = getVideoProps('frozen_foods_hero_video', { src: '/videos/frozen-foods-video.mp4', poster: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1600&q=80' });
  const bakeryVideo = getVideoProps('bakery_hero_video', { src: '/videos/bakery-video.mp4', poster: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80' });
  const cakesVideo = getVideoProps('cakes_hero_video', { src: '/videos/cakes-video.mp4', poster: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80' });
  const weddingVideo = getVideoProps('wedding_hero_video', { src: '/videos/wedding-video.mp4', poster: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80' });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');

  const filteredAndSortedProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    let list = PRODUCTS.filter((item) => {
      const matchCat =
        item.c === category.id ||
        item.c === category.slug ||
        item.categoryName?.toLowerCase() === category.n?.toLowerCase() ||
        (category.id === 'wedding' && item.c === 'wedding-bulk') ||
        (category.id === 'snacks' && item.c === 'fresh-snacks') ||
        (category.id === 'frozen' && item.c === 'frozen-foods');
      const matchQuery =
        !q || (item.n + ' ' + item.d).toLowerCase().includes(q);
      return matchCat && matchQuery;
    });

    if (sortOption === 'lo') {
      list.sort((a, b) => a.p - b.p);
    } else if (sortOption === 'hi') {
      list.sort((a, b) => b.p - a.p);
    } else if (sortOption === 'az') {
      list.sort((a, b) => a.n.localeCompare(b.n));
    }

    return list;
  }, [category.id, searchQuery, sortOption, PRODUCTS]);

  return (
    <div className="animate-fadeIn">
      {/* Category Hero Banner — Grand Royal Styling with Ambient Video for Mithai & Nimco */}
      <div className="relative min-h-[280px] md:min-h-[360px] bg-gradient-to-br from-[#3b080e] via-m to-[#4d0b13] overflow-hidden flex items-center justify-center border-b border-g/30 shadow-xl">
        {/* Background Video for Mithai */}
        {isMithai && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <video
              key={mithaiVideo.src}
              autoPlay={mithaiVideo.autoPlay}
              loop={mithaiVideo.loop}
              muted={mithaiVideo.muted}
              playsInline
              preload="auto"
              className="w-full h-full object-cover scale-105 filter brightness-[0.55] contrast-[1.08] saturate-[1.1]"
              poster={mithaiVideo.poster}
            >
              <source src={mithaiVideo.src} type="video/mp4" />
              <source src="/videos/hero-food-video.mp4" type="video/mp4" />
            </video>
            {/* Rich Dual-Toned Royal Maroon & Obsidian Gradient Overlay for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-[#4d0b13]/55 to-stone-950/85" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.65)_100%)]" />
          </div>
        )}

        {/* Background Video for Nimco */}
        {isNimco && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <video
              key={nimcoVideo.src}
              autoPlay={nimcoVideo.autoPlay}
              loop={nimcoVideo.loop}
              muted={nimcoVideo.muted}
              playsInline
              preload="auto"
              className="w-full h-full object-cover scale-105 filter brightness-[0.55] contrast-[1.08] saturate-[1.1]"
              poster={nimcoVideo.poster}
            >
              <source src={nimcoVideo.src} type="video/mp4" />
            </video>
            {/* Rich Dual-Toned Royal Maroon & Obsidian Gradient Overlay for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-[#4d0b13]/55 to-stone-950/85" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.65)_100%)]" />
          </div>
        )}

        {/* Background Video for Fresh Snacks */}
        {isFreshSnacks && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <video
              key={snacksVideo.src}
              autoPlay={snacksVideo.autoPlay}
              loop={snacksVideo.loop}
              muted={snacksVideo.muted}
              playsInline
              preload="auto"
              className="w-full h-full object-cover scale-105 filter brightness-[0.55] contrast-[1.08] saturate-[1.1]"
              poster={snacksVideo.poster}
            >
              <source src={snacksVideo.src} type="video/mp4" />
            </video>
            {/* Rich Dual-Toned Royal Maroon & Obsidian Gradient Overlay for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-[#4d0b13]/55 to-stone-950/85" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.65)_100%)]" />
          </div>
        )}

        {/* Background Video for Frozen Foods */}
        {isFrozen && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <video
              key={frozenVideo.src}
              autoPlay={frozenVideo.autoPlay}
              loop={frozenVideo.loop}
              muted={frozenVideo.muted}
              playsInline
              preload="auto"
              className="w-full h-full object-cover scale-105 filter brightness-[0.55] contrast-[1.08] saturate-[1.1]"
              poster={frozenVideo.poster}
            >
              <source src={frozenVideo.src} type="video/mp4" />
            </video>
            {/* Rich Dual-Toned Royal Maroon & Obsidian Gradient Overlay for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-[#4d0b13]/55 to-stone-950/85" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.65)_100%)]" />
          </div>
        )}

        {/* Background Video for Bakery */}
        {isBakery && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <video
              key={bakeryVideo.src}
              autoPlay={bakeryVideo.autoPlay}
              loop={bakeryVideo.loop}
              muted={bakeryVideo.muted}
              playsInline
              preload="auto"
              className="w-full h-full object-cover scale-105 filter brightness-[0.55] contrast-[1.08] saturate-[1.1]"
              poster={bakeryVideo.poster}
            >
              <source src={bakeryVideo.src} type="video/mp4" />
            </video>
            {/* Rich Dual-Toned Royal Maroon & Obsidian Gradient Overlay for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-[#4d0b13]/55 to-stone-950/85" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.65)_100%)]" />
          </div>
        )}

        {/* Background Video for Cakes & Desserts */}
        {isCakes && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <video
              key={cakesVideo.src}
              autoPlay={cakesVideo.autoPlay}
              loop={cakesVideo.loop}
              muted={cakesVideo.muted}
              playsInline
              preload="auto"
              className="w-full h-full object-cover scale-105 filter brightness-[0.55] contrast-[1.08] saturate-[1.1]"
              poster={cakesVideo.poster}
            >
              <source src={cakesVideo.src} type="video/mp4" />
            </video>
            {/* Rich Dual-Toned Royal Maroon & Obsidian Gradient Overlay for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-[#4d0b13]/55 to-stone-950/85" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.65)_100%)]" />
          </div>
        )}

        {/* Background Video for Wedding & Bulk Orders */}
        {isWedding && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <video
              key={weddingVideo.src}
              autoPlay={weddingVideo.autoPlay}
              loop={weddingVideo.loop}
              muted={weddingVideo.muted}
              playsInline
              preload="auto"
              className="w-full h-full object-cover scale-105 filter brightness-[0.55] contrast-[1.08] saturate-[1.1]"
              poster={weddingVideo.poster}
            >
              <source src={weddingVideo.src} type="video/mp4" />
            </video>
            {/* Rich Dual-Toned Royal Maroon & Obsidian Gradient Overlay for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-[#4d0b13]/55 to-stone-950/85" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.65)_100%)]" />
          </div>
        )}

        {/* Subtle Luxury Pattern / Glow Accents */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-g/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-g/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-black/40 blur-3xl pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 md:py-24 text-center space-y-3.5">
          <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-g/50 text-g-light text-[11px] md:text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-[.28em] shadow-xl">
            <span className="text-amber-400">👑</span> Royal Heritage &bull; Fresh Daily
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
            {category.n}
          </h1>

          <p className="text-white/95 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-md font-normal">
            {category.d}
          </p>
        </div>
      </div>

      {/* Special Frozen Alert Banner */}
      {category.id === 'frozen' && (
        <div className="bg-g-light text-m-dark text-sm text-center py-3.5 px-4 font-medium border-b border-g/30 animate-fadeIn">
          ❄️ Frozen items are delivered in insulated, temperature-controlled
          packaging. Please keep refrigerated at -18&deg;C on arrival.
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-8">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${category.n}...`}
            className="sm:max-w-xs !rounded-full text-sm"
          />

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-sm text-stone-500 font-medium whitespace-nowrap">
              {filteredAndSortedProducts.length} items
            </span>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="!w-auto !rounded-full text-sm cursor-pointer"
            >
              <option value="">Featured</option>
              <option value="lo">Price: low to high</option>
              <option value="hi">Price: high to low</option>
              <option value="az">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onShowToast={onShowToast}
            />
          ))}
        </div>

        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center text-stone-500 py-16">
            <p className="text-base font-semibold">
              No products found matching "{searchQuery}".
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Try clearing your search query or explore other categories.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="btn btn-o !text-xs mt-4"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Wedding / Bulk Quote Form */}
        {category.id === 'wedding' && <BulkQuoteForm />}
      </div>
    </div>
  );
}
