import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useCatalog } from '../context/CatalogContext';

export default function SearchResults({ onShowToast }) {
  const { products: PRODUCTS, categories: CATEGORIES } = useCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawQuery = searchParams.get('q') || '';

  const [inputQuery, setInputQuery] = useState(rawQuery);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(inputQuery.trim() ? { q: inputQuery.trim() } : {});
  };

  const results = useMemo(() => {
    const q = (searchParams.get('q') || '').toLowerCase().trim();

    let list = PRODUCTS.filter((item) => {
      const matchCat =
        selectedCategory === 'all' || item.c === selectedCategory;
      const matchQuery =
        !q ||
        (item.n + ' ' + item.d + ' ' + (item.tag || '')).toLowerCase().includes(q);
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
  }, [searchParams, selectedCategory, sortOption, PRODUCTS]);

  const popularSearches = [
    'Gulab Jamun',
    'Samosa',
    'Ras Malai',
    'Nan Khatai',
    'Kaju Katli',
    'Nimco',
  ];

  return (
    <div className="animate-fadeIn">
      {/* Search Header Banner */}
      <div className="bg-m text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-g text-xs tracking-[.25em] font-semibold uppercase">
            CATALOG SEARCH
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">
            Search Our Delicacies
          </h1>
          <form
            onSubmit={handleSearchSubmit}
            className="mt-6 flex gap-2 max-w-xl mx-auto"
          >
            <input
              type="search"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Search samosas, gulab jamun, frozen foods..."
              className="!rounded-full text-stone-900 !py-3 !px-5 text-sm sm:text-base shadow-lg"
            />
            <button
              type="submit"
              className="btn btn-g shrink-0 !px-6 shadow-md"
            >
              Search
            </button>
          </form>

          {/* Popular search tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-stone-300">
            <span>Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setInputQuery(term);
                  setSearchParams({ q: term });
                }}
                className="hover:text-g transition-colors underline underline-offset-2"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Container */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pb-6 border-b border-stone-200">
          <div>
            <h2 className="font-display text-xl font-bold text-m-dark">
              {rawQuery ? (
                <>
                  Results for "<span className="text-g-dark">{rawQuery}</span>"
                </>
              ) : (
                'All Royal Delicacies'
              )}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Found {results.length} delicacy{results.length === 1 ? '' : 'ies'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="!w-auto !rounded-full text-xs font-medium cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.n}
                </option>
              ))}
            </select>

            {/* Sort filter */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="!w-auto !rounded-full text-xs font-medium cursor-pointer"
            >
              <option value="">Featured</option>
              <option value="lo">Price: low to high</option>
              <option value="hi">Price: high to low</option>
              <option value="az">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
          {results.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onShowToast={onShowToast}
            />
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 mt-6 shadow-xs p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cream grid place-items-center text-g-dark">
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-bold text-m-dark">
              No matching delicacies found
            </h3>
            <p className="text-stone-500 text-sm mt-2 max-w-md mx-auto">
              We couldn't find anything matching your exact search. Check your
              spelling or browse our categories.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => {
                  setInputQuery('');
                  setSelectedCategory('all');
                  setSearchParams({});
                }}
                className="btn btn-o !text-xs"
              >
                Reset Search
              </button>
              <Link to="/mithai" className="btn btn-m !text-xs">
                Browse Mithai
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
