import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DEFAULT_WEIGHT_INDEX,
  getDefaultWeightIndex,
  getProductWeights,
  calcPrice,
  formatPrice,
  getCategory,
  getRating,
  getUnsplashUrl,
  getFallbackSvg,
} from '../data/products';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product, onShowToast }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedWeight, setSelectedWeight] = useState(() =>
    getDefaultWeightIndex(product)
  );

  const category = getCategory(product.c);
  const categoryName = category?.n || product.categoryName || product.c;
  const categoryPath = category?.path || product.categoryPath || '/mithai';
  const rating = getRating(product.id);
  const units = getProductWeights(product);
  const safeWeight = (units && selectedWeight < units.length) ? selectedWeight : 0;
  const currentPrice = calcPrice(product, safeWeight);
  const wishlisted = isInWishlist(product.id);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, safeWeight, 1);
    if (onShowToast) {
      onShowToast(`Added ${product.n} to your order`);
    }
  };

  const handleToggleHeart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article className="pc group" data-id={product.id}>
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-m-soft">
        <Link
          to={`/product/${product.id}`}
          className="block w-full h-full text-left focus:outline-none"
          aria-label={`View details of ${product.n}`}
        >
          <img
            src={getUnsplashUrl(product.i)}
            alt={product.n}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getFallbackSvg(product.n);
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-106"
          />
        </Link>

        {product.tag && (
          <span className="tag shadow-sm tracking-wider uppercase">
            {product.tag}
          </span>
        )}

        <button
          type="button"
          onClick={handleToggleHeart}
          aria-label={
            wishlisted ? 'Remove from wishlist' : 'Add to wishlist'
          }
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 shadow-md grid place-items-center transition-all active:scale-90 ${
            wishlisted ? 'text-m font-bold' : 'text-stone-400 hover:text-m'
          }`}
        >
          <span className="text-base leading-none">
            {wishlisted ? '♥' : '♡'}
          </span>
        </button>
      </div>

      {/* Product Information */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <Link
            to={categoryPath}
            className="text-[10px] tracking-widest text-g-dark font-semibold uppercase hover:underline"
          >
            {categoryName}
          </Link>
          <span className="text-[11px] text-emerald-700 font-medium">
            Fresh Daily
          </span>
        </div>

        <Link
          to={`/product/${product.id}`}
          className="font-display font-bold text-m-dark mt-1 leading-snug hover:text-m transition-colors text-sm sm:text-base line-clamp-1"
          title={product.n}
        >
          {product.n}
        </Link>

        {/* Rating Stars */}
        <div className="flex items-center gap-1 text-xs text-g mt-1">
          <span>{'★'.repeat(rating.stars)}</span>
          <span className="text-stone-400 text-[11px]">
            ({rating.count})
          </span>
        </div>

        {/* Short Description */}
        <p className="text-xs text-stone-500 mt-1.5 clamp leading-relaxed">
          {product.d}
        </p>

        {/* Weight / Pack Options */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {units.map((unit, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setSelectedWeight(idx);
              }}
              className={`wc ${selectedWeight === idx ? 'on' : ''}`}
            >
              {unit[0]}
            </button>
          ))}
        </div>

        {/* Pricing & Add to Cart */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-stone-100">
          <div>
            <span className="font-bold text-m text-sm sm:text-base block">
              {formatPrice(currentPrice)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="btn btn-m !py-1.5 !px-3 sm:!py-2 sm:!px-4 !text-xs shadow-sm hover:shadow"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
