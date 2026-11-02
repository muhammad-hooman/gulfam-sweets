import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getCategory,
  DEFAULT_WEIGHT_INDEX,
  getDefaultWeightIndex,
  getProductWeights,
  calcPrice,
  formatPrice,
  getRating,
  getUnsplashUrl,
  getFallbackSvg,
} from '../data/products';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCatalog } from '../context/CatalogContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetails({ onShowToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, categories } = useCatalog();
  const product = products.find((item) => String(item.id) === String(id));

  const { addToCart, openCartDrawer } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedWeight, setSelectedWeight] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (product) {
      setSelectedWeight(getDefaultWeightIndex(product));
      setQuantity(1);
      setActiveImageIndex(0);
      window.scrollTo(0, 0);
    }
  }, [id, product]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-3xl font-bold text-m-dark">
          Delicacy Not Found
        </h2>
        <p className="text-stone-600 mt-2 text-sm">
          The requested product may have been updated or moved.
        </p>
        <Link to="/mithai" className="btn btn-m mt-6">
          Browse Royal Mithai
        </Link>
      </div>
    );
  }

  const category = getCategory(product.c) || categories.find(
    (item) => item.id === product.c || item.slug === product.c
  );
  const rating = getRating(product.id);
  const units = getProductWeights(product);
  const safeWeight = (units && selectedWeight < units.length) ? selectedWeight : 0;
  const currentUnitPrice = calcPrice(product, safeWeight);
  const totalPrice = currentUnitPrice * quantity;
  const wishlisted = isInWishlist(product.id);
  const relatedProducts = products
    .filter((item) => item.c === product.c && String(item.id) !== String(product.id))
    .slice(0, 4);

  // Gallery images (main + detail angles)
  const galleryImages = [
    getUnsplashUrl(product.i),
    getUnsplashUrl('1599599810769-bcde5a160d32'),
    getUnsplashUrl('1589301760014-d929f3979dbc'),
  ];

  const handleAddToCart = () => {
    addToCart(product, safeWeight, quantity);
    if (onShowToast) {
      onShowToast(`Added ${quantity} x ${product.n} to cart!`);
    }
  };

  const handleBuyNow = () => {
    addToCart(product, safeWeight, quantity);
    openCartDrawer();
  };

  return (
    <div className="animate-fadeIn">
      {/* Breadcrumb Navigation */}
      <div className="bg-cream/60 border-b border-g-light/40 py-3">
        <div className="max-w-7xl mx-auto px-4 text-xs text-stone-500 flex items-center gap-2">
          <Link to="/" className="hover:text-m">
            Home
          </Link>
          <span>/</span>
          {category && (
            <>
              <Link to={category.path} className="hover:text-m">
                {category.n}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-m font-semibold truncate">{product.n}</span>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Images Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-m-soft shadow-xl border border-stone-200 relative group">
              <img
                src={galleryImages[activeImageIndex]}
                alt={product.n}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getFallbackSvg(product.n);
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {product.tag && (
                <span className="tag shadow-md uppercase tracking-wider">
                  {product.tag}
                </span>
              )}
            </div>

            {/* Thumbnail selector */}
            <div className="flex gap-3 overflow-x-auto hide-sb pb-1">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-m shadow-md scale-102'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.n} preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details & Actions */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-g-dark uppercase tracking-widest">
                {category ? category.n : product.c}
              </span>
              <span className="text-xs font-medium text-stone-400">
                SKU: {product.sku}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-m-dark mt-2 leading-tight">
              {product.n}
            </h1>

            {/* Rating & Stock */}
            <div className="flex items-center gap-4 mt-3 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-1.5 text-g text-sm">
                <span>{'★'.repeat(rating.stars)}</span>
                <span className="text-stone-500 text-xs font-medium">
                  {rating.stars}.0 ({rating.count} Customer Reviews)
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                ● Fresh Daily Batch
              </span>
            </div>

            {/* Price Display */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-3xl sm:text-4xl font-bold text-m">
                {formatPrice(totalPrice)}
              </span>
              {quantity > 1 && (
                <span className="text-xs text-stone-500">
                  ({formatPrice(currentUnitPrice)} per unit)
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mt-4 text-sm text-stone-600 leading-relaxed">
              {product.d} Made fresh daily with 100% pure ingredients and
              traditional recipe perfected over decades.
            </p>

            {/* Weight / Pack Options */}
            <div className="mt-6">
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-2.5">
                Select Pack / Weight
              </label>
              <div className="flex flex-wrap gap-2">
                {units.map((unit, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedWeight(idx)}
                    className={`wc !text-xs !py-1.5 !px-3.5 ${
                      selectedWeight === idx ? 'on shadow-xs font-semibold' : ''
                    }`}
                  >
                    {unit[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="mt-8 space-y-4 pt-6 border-t border-stone-200">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center border border-g-dark/40 rounded-full bg-white px-2 py-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-full text-stone-700 font-bold hover:bg-g-light flex items-center justify-center transition-colors text-base"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-m-dark">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-7 h-7 rounded-full text-stone-700 font-bold hover:bg-g-light flex items-center justify-center transition-colors text-base"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn btn-m flex-1 shadow-md hover:shadow-lg py-3 text-sm"
                >
                  Add to Cart &bull; {formatPrice(totalPrice)}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="btn btn-g flex-1 shadow-md hover:shadow-lg py-3 text-sm"
                >
                  Order Now (Instant Checkout)
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-12 h-12 rounded-full border border-stone-300 grid place-items-center text-xl transition-all self-center ${
                    wishlisted
                      ? 'bg-m text-white border-m'
                      : 'hover:border-m text-stone-400 hover:text-m'
                  }`}
                  aria-label="Toggle wishlist"
                  title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {wishlisted ? '♥' : '♡'}
                </button>
              </div>
            </div>

            {/* Product Highlights / Specifications */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-cream/70 p-4 rounded-2xl border border-g-light/60">
              <div>
                <b className="text-m block font-semibold mb-0.5">Ingredients</b>
                <span className="text-stone-600">{product.ingredients}</span>
              </div>
              <div>
                <b className="text-m block font-semibold mb-0.5">Shelf Life &amp; Storage</b>
                <span className="text-stone-600">{product.shelfLife}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-10 border-t border-stone-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-m-dark">
                  Related <em className="text-g-dark italic">Delicacies</em>
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  More fresh treats from our {category ? category.n : 'kitchen'} collection.
                </p>
              </div>
              {category && (
                <Link
                  to={category.path}
                  className="text-xs sm:text-sm font-semibold text-m hover:underline"
                >
                  View All &rarr;
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onShowToast={onShowToast}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
