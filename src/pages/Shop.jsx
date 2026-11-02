import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import BulkQuoteForm from '../components/BulkQuoteForm';
import {
  getCategory,
} from '../data/products';
import { useCatalog } from '../context/CatalogContext';

export default function Shop({
  currentCategory,
  initialQuery = '',
  wishlist,
  onToggleWishlist,
  onOpenModal,
  onAddToCart,
}) {
  const { products: PRODUCTS, categories } = useCatalog();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortOption, setSortOption] = useState('');

  // Update searchQuery when initialQuery changes (e.g. from header search form)
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  const categoryMeta = useMemo(() => {
    if (currentCategory === 'all') {
      return {
        n: 'All Delicacies',
        d: 'Everything fresh from the Gulfam kitchen, in one place.',
      };
    }
    const found = getCategory(currentCategory) || categories.find(
      (category) => category.id === currentCategory || category.slug === currentCategory
    );
    return (
      found || {
        n: 'Our Delicacies',
        d: 'Finest sweets and fresh treats handcrafted daily.',
      }
    );
  }, [currentCategory, categories]);

  const filteredAndSortedProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    let list = PRODUCTS.filter((item) => {
      const matchCat =
        currentCategory === 'all' || item.c === currentCategory;
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
  }, [currentCategory, searchQuery, sortOption, PRODUCTS]);

  return (
    <div className="animate-fadeIn">
      {/* Category Hero Banner */}
      <div className="bg-m relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-g text-xs tracking-[.25em] uppercase font-semibold">
            HOME / {categoryMeta.n}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mt-2">
            {categoryMeta.n}
          </h1>
          <p className="text-white/80 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
            {categoryMeta.d}
          </p>
        </div>
      </div>

      {/* Special Frozen Alert Banner */}
      {currentCategory === 'frozen' && (
        <div className="bg-g-light text-m-dark text-sm text-center py-3.5 px-4 font-medium border-b border-g/30 animate-fadeIn">
          ❄️ Frozen items are delivered in insulated, temperature-controlled
          packaging. Please keep refrigerated at -18&deg;C on arrival.
        </div>
      )}

      {/* Main Shop Container */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-8">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in this category..."
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
              isWishlisted={wishlist.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onOpenModal={onOpenModal}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>

        {filteredAndSortedProducts.length === 0 && (
          <p className="text-center text-stone-500 py-16 text-base">
            No products found. Try a different search.
          </p>
        )}

        {/* Wedding / Bulk Quote Form */}
        {currentCategory === 'wedding' && <BulkQuoteForm />}
      </div>
    </div>
  );
}
