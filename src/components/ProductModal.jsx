import React, { useState, useEffect } from 'react';
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

export default function ProductModal({ product, onClose, onAddToCart }) {
  if (!product) return null;

  const [selectedWeight, setSelectedWeight] = useState(() =>
    getDefaultWeightIndex(product)
  );

  useEffect(() => {
    setSelectedWeight(getDefaultWeightIndex(product));
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const category = getCategory(product.c);
  const categoryName = category?.n || product.categoryName || product.c;
  const rating = getRating(product.id);
  const units = getProductWeights(product);
  const safeWeight = (units && selectedWeight < units.length) ? selectedWeight : 0;
  const currentPrice = calcPrice(product, safeWeight);

  const handleAdd = () => {
    onAddToCart(product, safeWeight);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full grid md:grid-cols-2 overflow-hidden relative max-h-[90vh] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-3xl text-stone-700 md:text-m z-10 w-9 h-9 rounded-full bg-white/80 md:bg-transparent grid place-items-center hover:scale-110 transition-transform"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Modal Image */}
        <div className="h-64 md:h-full bg-m-soft relative">
          <img
            src={getUnsplashUrl(product.i)}
            alt={product.n}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getFallbackSvg(product.n);
            }}
            className="w-full h-full object-cover"
          />
          {product.tag && (
            <span className="tag shadow-sm">{product.tag}</span>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8 flex flex-col justify-center overflow-y-auto">
          <p className="text-[10px] tracking-widest text-g-dark font-semibold uppercase">
            {categoryName}
          </p>

          <h3 className="font-display text-2xl md:text-3xl font-bold text-m-dark mt-1">
            {product.n}
          </h3>

          <div className="flex items-center gap-1.5 text-g text-sm mt-1.5">
            <span>{'★'.repeat(rating.stars)}</span>
            <span className="text-stone-400 text-xs">({rating.count} reviews)</span>
          </div>

          <p className="text-sm text-stone-600 mt-3.5 leading-relaxed">
            {product.d} Made fresh, packed with care.
          </p>

          {/* Unit selection */}
          <div className="mt-5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
              Select Quantity / Weight
            </span>
            <div className="flex flex-wrap gap-2">
              {units.map((unit, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedWeight(idx)}
                  className={`wc !text-xs !py-1 !px-3 ${
                    selectedWeight === idx ? 'on' : ''
                  }`}
                >
                  {unit[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Price and Add button */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-stone-100">
            <div>
              <span className="text-[11px] text-stone-400 block">Total</span>
              <span className="font-bold text-m text-2xl">
                {formatPrice(currentPrice)}
              </span>
            </div>

            <button
              onClick={handleAdd}
              className="btn btn-m !py-2.5 !px-6 shadow-md hover:shadow-lg"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
