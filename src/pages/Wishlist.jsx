import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { useCatalog } from '../context/CatalogContext';

export default function Wishlist({ onShowToast }) {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { products } = useCatalog();

  const wishlistedProducts = products.filter((p) =>
    wishlist.some((id) => String(id) === String(p.id))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 animate-fadeIn">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-m-dark">
            My Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Your saved royal delicacies ({wishlistedProducts.length} item{wishlistedProducts.length === 1 ? '' : 's'})
          </p>
        </div>
        {wishlistedProducts.length > 0 && (
          <Link to="/mithai" className="btn btn-m !text-xs !py-2 !px-4">
            Discover More
          </Link>
        )}
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 mt-8 shadow-xs p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 text-rose-700 grid place-items-center text-2xl">
            ♥
          </div>
          <h3 className="font-display text-2xl font-bold text-m-dark">
            Your Wishlist is Empty
          </h3>
          <p className="text-stone-500 text-sm mt-2 max-w-sm mx-auto">
            Save your favorite mithai, celebration cakes, and fresh snacks by
            clicking the heart icon on any delicacy card.
          </p>
          <Link to="/mithai" className="btn btn-m mt-6 shadow-sm">
            Explore Royal Mithai
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
          {wishlistedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onShowToast={onShowToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}
