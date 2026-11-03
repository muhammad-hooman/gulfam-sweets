import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const CatalogContext = createContext(null);

const CATEGORY_ALIASES = {
  'cakes-desserts': 'cakes',
  'wedding-bulk-orders': 'wedding-bulk',
  'wedding': 'wedding-bulk',
  'snacks': 'fresh-snacks',
  'frozen': 'frozen-foods',
};

function mapDatabaseProduct(row) {
  const legacyProduct = PRODUCTS.find((product) => String(product.id) === String(row.legacy_id));
  const category = row.categories;
  const canonicalSlug = CATEGORY_ALIASES[category?.slug] || category?.slug;
  const staticCategory = CATEGORIES.find(
    (item) => item.slug === canonicalSlug || item.id === canonicalSlug || item.slug === category?.slug || item.id === category?.slug
  );
  const images = [...(row.product_images || [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return Number(a.sort_order || 0) - Number(b.sort_order || 0);
  });
  const variants = [...(row.product_variants || [])]
    .filter((variant) => variant.is_available !== false)
    .sort((a, b) => {
      const byWeight = Number(a.weight_value || 0) - Number(b.weight_value || 0);
      return byWeight || String(a.name).localeCompare(String(b.name));
    });

  const basePrice = Number(row.base_price) > 0 ? Number(row.base_price) : (legacyProduct?.p ? Number(legacyProduct.p) : 0);
  const resolvedVariants = variants.length > 0 ? variants : (
    basePrice > 0 ? [{
      id: null,
      product_id: row.id,
      name: 'Standard',
      price: basePrice,
      is_available: true,
      stock_quantity: 100,
    }] : []
  );

  return {
    ...legacyProduct,
    id: legacyProduct?.id ?? row.legacy_id ?? row.id,
    productUuid: row.id,
    legacyId: row.legacy_id,
    c: staticCategory?.id || canonicalSlug || 'uncategorized',
    categoryName: staticCategory?.n || category?.name || 'Other',
    categoryPath: staticCategory?.path || (canonicalSlug ? `/category/${canonicalSlug}` : '/'),
    n: row.name,
    d: row.description || '',
    p: basePrice,
    salePrice: row.sale_price == null ? null : Number(row.sale_price),
    tag: row.is_featured ? 'Featured' : legacyProduct?.tag || '',
    i: images[0]?.public_url || row.image_url || legacyProduct?.i || '',
    w: resolvedVariants[0]?.weight_unit === 'piece' ? 'pc' : resolvedVariants[0]?.weight_unit || legacyProduct?.w || 'kg',
    ingredients: row.ingredients || legacyProduct?.ingredients || '',
    shelfLife: row.storage_instructions || legacyProduct?.shelfLife || '',
    sku: row.sku || legacyProduct?.sku || '',
    inStock: resolvedVariants.length ? resolvedVariants.some((variant) => Number(variant.stock_quantity) > 0) : true,
    variants: resolvedVariants,
    isDatabaseProduct: true,
  };
}

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(PRODUCTS);
  const [categories, setCategories] = useState(CATEGORIES);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState('');

  const refreshCatalog = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from('products')
        .select('*,categories(id,slug,name,description),product_images(*),product_variants(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    ]);

    if (productsResult.error || categoriesResult.error) {
      const queryError = productsResult.error || categoriesResult.error;
      console.error('Loading the Supabase storefront catalog failed:', queryError);
      setError('Some live catalog changes could not be loaded. Existing storefront listings remain available.');
      setLoading(false);
      return;
    }

    const liveProducts = (productsResult.data || []).map(mapDatabaseProduct);
    const liveIds = new Set(liveProducts.map((product) => String(product.id)));
    setProducts([
      ...liveProducts,
      ...PRODUCTS.filter((product) => !liveIds.has(String(product.id))),
    ]);

    const rawMapped = (categoriesResult.data || []).map((category) => {
      const canonicalSlug = CATEGORY_ALIASES[category.slug] || category.slug;
      const staticCategory = CATEGORIES.find(
        (item) => item.slug === canonicalSlug || item.id === canonicalSlug || item.slug === category.slug || item.id === category.slug
      );
      return {
        id: staticCategory?.id || canonicalSlug,
        slug: staticCategory?.slug || canonicalSlug,
        n: staticCategory?.n || category.name,
        t: staticCategory?.t || category.name,
        d: category.description || staticCategory?.d || '',
        path: staticCategory?.path || (canonicalSlug ? `/category/${canonicalSlug}` : '/'),
        i: staticCategory?.i || category.image_url || '',
        databaseId: category.id,
      };
    });

    // Deduplicate categories by id and slug to eliminate any repeats
    const seen = new Set();
    const cleanCategories = [];
    for (const cat of rawMapped) {
      const key = cat.id || cat.slug;
      if (!seen.has(key)) {
        seen.add(key);
        cleanCategories.push(cat);
      }
    }

    // Ensure all 7 canonical categories are always included
    for (const staticCat of CATEGORIES) {
      if (!seen.has(staticCat.id) && !seen.has(staticCat.slug)) {
        seen.add(staticCat.id);
        cleanCategories.push(staticCat);
      }
    }

    setCategories(cleanCategories);
    setError('');
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  return (
    <CatalogContext.Provider value={{ products, categories, loading, error, refreshCatalog }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used within a CatalogProvider');
  return context;
}
