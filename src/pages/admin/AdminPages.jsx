import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import MediaLibraryPage from './MediaLibraryPage';
import WebsiteMediaEditorPage from './WebsiteMediaEditorPage';
import {
  PRODUCTS as STOREFRONT_PRODUCTS,
  CATEGORIES as STOREFRONT_CATEGORIES,
  WEIGHT_UNITS,
  getUnsplashUrl,
} from '../../data/products';

const pageConfig = {
  '/admin/categories': {
    title: 'Categories Management',
    description: 'Organize products into storefront categories and custom collections.',
    table: 'categories',
    permission: 'categories.manage',
    columns: ['name', 'slug', 'is_active', 'sort_order', 'created_at'],
    fields: [
      { name: 'name', label: 'Category name', required: true },
      { name: 'slug', label: 'URL slug', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'image_url', label: 'Image URL' },
      { name: 'is_active', label: 'Active on storefront', type: 'checkbox' },
      { name: 'sort_order', label: 'Display order', type: 'number', min: 0 },
    ],
  },
  '/admin/variants': {
    title: 'Product Variants',
    description: 'Set SKU, pack size, price, availability, and stock threshold for each variation.',
    table: 'product_variants',
    permission: 'products.manage',
    columns: ['name', 'sku', 'weight_value', 'weight_unit', 'price', 'sale_price', 'is_available'],
    fields: [
      { name: 'product_id', label: 'Product', type: 'relation', source: 'products', required: true },
      { name: 'name', label: 'Variant label (e.g. 500g)', required: true },
      { name: 'sku', label: 'SKU' },
      { name: 'weight_value', label: 'Size / weight value', type: 'number', min: 0 },
      { name: 'weight_unit', label: 'Unit (g, kg, piece, box)' },
      { name: 'price', label: 'Regular price (PKR)', type: 'number', min: 0, required: true },
      { name: 'sale_price', label: 'Sale price (PKR)', type: 'number', min: 0 },
      { name: 'low_stock_threshold', label: 'Low-stock threshold', type: 'number', min: 0 },
      { name: 'is_available', label: 'Available', type: 'checkbox' },
    ],
  },
  '/admin/coupons': {
    title: 'Coupons & Discounts',
    description: 'Manage coupon codes, discount limits, and validity windows.',
    table: 'coupons',
    permission: 'coupons.manage',
    columns: ['code', 'discount_type', 'discount_value', 'starts_at', 'ends_at', 'is_active'],
    fields: [
      { name: 'code', label: 'Coupon code', required: true },
      { name: 'discount_type', label: 'Discount type', type: 'select', options: ['percentage', 'fixed'] },
      { name: 'discount_value', label: 'Discount amount / percent', type: 'number', min: 0, required: true },
      { name: 'minimum_order_amount', label: 'Minimum order (PKR)', type: 'number', min: 0 },
      { name: 'maximum_discount_amount', label: 'Maximum discount (PKR)', type: 'number', min: 0 },
      { name: 'starts_at', label: 'Starts at', type: 'datetime-local' },
      { name: 'ends_at', label: 'Ends at', type: 'datetime-local' },
      { name: 'usage_limit', label: 'Total usage limit', type: 'number', min: 0 },
      { name: 'per_customer_limit', label: 'Per-customer usage limit', type: 'number', min: 0 },
      { name: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  '/admin/delivery': {
    title: 'Delivery Management',
    description: 'Configure delivery zones, charges, order minimums, and service availability.',
    table: 'delivery_zones',
    permission: 'settings.manage',
    columns: ['name', 'city', 'delivery_fee', 'free_delivery_threshold', 'minimum_order_amount', 'is_active'],
    fields: [
      { name: 'name', label: 'Zone name', required: true },
      { name: 'city', label: 'City', required: true },
      { name: 'region', label: 'Region / Province' },
      { name: 'delivery_fee', label: 'Delivery fee (PKR)', type: 'number', min: 0 },
      { name: 'free_delivery_threshold', label: 'Free delivery threshold (PKR)', type: 'number', min: 0 },
      { name: 'minimum_order_amount', label: 'Minimum order (PKR)', type: 'number', min: 0 },
      { name: 'is_active', label: 'Available', type: 'checkbox' },
    ],
  },
  '/admin/promotions': {
    title: 'Banners & Promotions',
    description: 'Manage public campaigns and promotional banners.',
    table: 'banners',
    permission: 'content.manage',
    columns: ['title', 'image_path', 'target_url', 'starts_at', 'ends_at', 'is_active'],
    fields: [
      { name: 'title', label: 'Heading', required: true },
      { name: 'image_path', label: 'Banner image storage path', required: true },
      { name: 'target_url', label: 'Banner destination' },
      { name: 'starts_at', label: 'Starts at', type: 'datetime-local' },
      { name: 'ends_at', label: 'Ends at', type: 'datetime-local' },
      { name: 'is_active', label: 'Published', type: 'checkbox' },
    ],
  },
};

const pageByPath = {
  '/admin': { type: 'overview', title: 'Dashboard Overview' },
  '/admin/media': { type: 'media', title: 'Media Library' },
  '/admin/website-media': { type: 'website-media', title: 'Website Media Editor' },
  '/admin/products': { type: 'products', title: 'Products Management' },
  '/admin/fresh-food': { type: 'products', title: 'Fresh Food Management', foodFilter: 'fresh' },
  '/admin/frozen-food': { type: 'products', title: 'Frozen Food Management', foodFilter: 'frozen' },
  '/admin/categories': pageConfig['/admin/categories'],
  '/admin/variants': pageConfig['/admin/variants'],
  '/admin/inventory': { type: 'inventory', title: 'Inventory Management' },
  '/admin/stock-movements': { type: 'stock', title: 'Stock Movements' },
  '/admin/orders': { type: 'orders', title: 'Orders Management' },
  '/admin/customers': { type: 'customers', title: 'Customers Management' },
  '/admin/coupons': pageConfig['/admin/coupons'],
  '/admin/delivery': pageConfig['/admin/delivery'],
  '/admin/payments': { type: 'payments', title: 'Payments Management' },
  '/admin/reviews': { type: 'reviews', title: 'Reviews Management' },
  '/admin/promotions': pageConfig['/admin/promotions'],
  '/admin/inquiries': { type: 'inquiries', title: 'Contact Inquiries' },
  '/admin/reports': { type: 'reports', title: 'Reports & Analytics' },
  '/admin/team': { type: 'team', title: 'Admin Users & Roles' },
  '/admin/settings': { type: 'settings', title: 'Store Settings' },
};

export default function AdminPages() {
  const { pathname } = useLocation();
  const page = pageByPath[pathname] || { title: 'Admin' };

  if (page.type === 'overview') return <OverviewPage />;
  if (page.type === 'media') return <MediaLibraryPage />;
  if (page.type === 'website-media') return <WebsiteMediaEditorPage />;
  if (page.type === 'products') return <ProductsManagementPage foodFilter={page.foodFilter} title={page.title} />;
  if (page.type === 'settings') return <SettingsPage />;
  if (page.type === 'inventory') return <InventoryPage />;
  if (page.type === 'stock') return <StockMovementsPage />;
  if (page.type === 'orders') return <OrdersPage />;
  if (page.type === 'customers') return <CustomersPage />;
  if (page.type === 'payments') return <PaymentsPage />;
  if (page.type === 'reviews') return <ReviewsPage />;
  if (page.type === 'inquiries') return <InquiriesPage />;
  if (page.type === 'reports') return <ReportsPage />;
  if (page.type === 'team') return <TeamPage />;
  if (page.table) return <ResourcePage config={page} />;

  return (
    <PageHeader title={page.title} description="This administration page is not configured yet." />
  );
}

function PageHeader({ title, description, children }) {
  return (
    <div className="admin-page-header">
      <div>
        <p className="admin-eyebrow">GULFAM SWEETS / ADMIN</p>
        <h1>{title}</h1>
        {description && <p className="admin-page-description">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function AdminNotice({ message, type = 'error' }) {
  if (!message) return null;
  return <div className={`admin-notice is-${type}`} role="status">{message}</div>;
}

// ==============================================================================
// 1. DASHBOARD OVERVIEW — RESILIENT, NEVER CRASHES ON INDIVIDUAL RPC FAILURES
// ==============================================================================
function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const end = new Date();
    const start = new Date();
    if (range === 'today') start.setHours(0, 0, 0, 0);
    else if (range === 'year') start.setFullYear(start.getFullYear() - 1);
    else start.setDate(start.getDate() - Number(range));

    const results = await Promise.allSettled([
      supabase.rpc('get_admin_dashboard_stats', {
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
      }),
      supabase.from('orders').select('id,order_number,customer_name,total,status,created_at').order('created_at', { ascending: false }).limit(8),
      supabase.rpc('get_best_selling_products', { p_limit: 5 }),
      supabase.rpc('get_sales_report', {
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
      }),
      supabase.from('categories').select('id, name, is_active, sort_order').order('sort_order'),
    ]);

    const [statsRes, orderRes, sellersRes, salesRes, catRes] = results;

    if (statsRes.status === 'fulfilled' && statsRes.value?.data && !statsRes.value?.error) {
      setStats(statsRes.value.data);
    } else {
      // Fallback: Direct table aggregation guarantees stats never display blank dashes
      try {
        const [
          { count: pCount },
          { count: actCount },
          { count: cCount },
          { count: custCount },
          { data: ordersData },
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('categories').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('total, status, created_at'),
        ]);

        const ordersList = ordersData || [];
        const totalSales = ordersList
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        setStats({
          total_products: pCount || 0,
          active_products: actCount ?? pCount ?? 0,
          total_categories: cCount || 0,
          total_customers: custCount || 0,
          total_orders: ordersList.length,
          pending_orders: ordersList.filter((o) => o.status === 'pending').length,
          confirmed_orders: ordersList.filter((o) => o.status === 'confirmed').length,
          processing_orders: ordersList.filter((o) => o.status === 'processing').length,
          delivered_orders: ordersList.filter((o) => o.status === 'delivered').length,
          cancelled_orders: ordersList.filter((o) => o.status === 'cancelled').length,
          total_sales: totalSales,
        });
      } catch (fbErr) {
        console.warn('Stats fallback warning:', fbErr);
        setStats({
          total_products: 0,
          active_products: 0,
          total_categories: 0,
          total_customers: 0,
          total_orders: 0,
          pending_orders: 0,
          confirmed_orders: 0,
          processing_orders: 0,
          delivered_orders: 0,
          cancelled_orders: 0,
          total_sales: 0,
        });
      }
    }

    if (orderRes.status === 'fulfilled' && orderRes.value?.data) {
      setOrders(orderRes.value.data);
    }

    if (sellersRes.status === 'fulfilled' && sellersRes.value?.data) {
      setBestSellers(sellersRes.value.data);
    } else {
      setBestSellers([]);
    }

    if (salesRes.status === 'fulfilled' && salesRes.value?.data) {
      setSales(Array.isArray(salesRes.value.data) ? salesRes.value.data : []);
    }

    if (catRes.status === 'fulfilled' && catRes.value?.data) {
      setCategories(catRes.value.data);
    }

    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  async function handleQuickSeed() {
    setSeeding(true);
    setSeedNotice('');
    setError('');
    try {
      await seedStorefrontCatalog();
      setSeedNotice('Catalog successfully imported! 28 products, categories, variants & settings are live.');
      await load();
    } catch (seedErr) {
      setError(`Seed failed: ${seedErr.message}`);
    } finally {
      setSeeding(false);
    }
  }

  const cards = [
    ['Total products', stats?.total_products],
    ['Active products', stats?.active_products],
    ['Categories', stats?.total_categories],
    ['Customers', stats?.total_customers],
    ['Total orders', stats?.total_orders],
    ['Pending orders', stats?.pending_orders],
    ['Confirmed orders', stats?.confirmed_orders],
    ['Processing orders', stats?.processing_orders],
    ['Delivered orders', stats?.delivered_orders],
    ['Cancelled orders', stats?.cancelled_orders],
    ['Total sales', stats?.total_sales, true],
    ["Today's sales", stats?.today_sales, true],
    ['Monthly sales', stats?.monthly_sales, true],
    ['Low stock', stats?.low_stock_products],
    ['Out of stock', stats?.out_of_stock_products],
  ];

  const isEmptyCatalog = (stats?.total_products ?? 0) === 0 && !loading;

  return (
    <>
      <PageHeader title="Dashboard Overview" description="Live store performance and catalog health from Supabase.">
        <div className="admin-header-controls">
          <label htmlFor="admin-date-range">Period</label>
          <select id="admin-date-range" value={range} onChange={(event) => setRange(event.target.value)}>
            <option value="today">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="year">Last year</option>
          </select>
          <button className="admin-button admin-button-outline" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </PageHeader>

      <AdminNotice message={error} />
      <AdminNotice message={seedNotice} type="success" />

      {isEmptyCatalog && (
        <div className="admin-hero-banner">
          <div>
            <h3>📦 Empty Database Catalog Detected</h3>
            <p>Your Supabase tables do not have the authentic Gulfam Sweets products yet. You can import all 28 products, variants, images, and categories with one click.</p>
          </div>
          <button className="admin-button" onClick={handleQuickSeed} disabled={seeding}>
            {seeding ? 'Importing Products…' : '🚀 Import 28 Products to Database'}
          </button>
        </div>
      )}

      {loading ? <Loading /> : (
        <>
          <section className="admin-stat-grid">
            {cards.map(([label, value, money]) => (
              <article className="admin-stat-card" key={label}>
                <span>{label}</span>
                <strong>{value == null ? '—' : money ? formatMoney(value) : Number(value).toLocaleString()}</strong>
              </article>
            ))}
          </section>

          <div className="admin-two-column">
            <section className="admin-panel">
              <PanelTitle title="Sales trend" />
              <SalesChart rows={sales} />
            </section>
            <section className="admin-panel">
              <PanelTitle title="Recent orders" action={<Link to="/admin/orders">View all</Link>} />
              <DataTable
                columns={['order_number', 'customer_name', 'total', 'status']}
                rows={orders}
                empty="No orders have been placed yet."
              />
            </section>
          </div>

          <div className="admin-two-column admin-dashboard-lower">
            <section className="admin-panel">
              <PanelTitle title="Best-selling products" />
              {bestSellers.length ? (
                <div className="admin-simple-list">
                  {bestSellers.map((item, index) => (
                    <div className="admin-simple-row" key={item.product_id || item.id || index}>
                      <strong>{item.product_name || item.name || 'Product'}</strong>
                      <span>{item.total_sold ?? item.quantity_sold ?? item.total_quantity ?? 0} sold</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="Sales data will appear after completed orders." />}
            </section>
            <section className="admin-panel">
              <PanelTitle title="Orders by status" />
              <StatusSummary stats={stats} />
            </section>
          </div>

          <section className="admin-panel admin-categories-panel">
            <PanelTitle title="Categories Overview" action={<Link to="/admin/categories">Manage categories</Link>} />
            <div className="admin-category-grid">
              {categories.map((cat) => (
                <div className="admin-category-card" key={cat.id}>
                  <strong>{cat.name}</strong>
                  <span className={`admin-status ${cat.is_active ? 'is-active' : 'is-inactive'}`}>
                    {cat.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

// ==============================================================================
// 2. PRODUCTS MANAGEMENT — RICH PRODUCT CARDS, IMAGES, VARIANTS & ONE-CLICK SEED
// ==============================================================================
function ProductsManagementPage({ foodFilter, title = 'Products Management' }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [seeding, setSeeding] = useState(false);

  // Modals state
  const [editingProduct, setEditingProduct] = useState(null);
  const [variantsProduct, setVariantsProduct] = useState(null);
  const [mediaProduct, setMediaProduct] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('products')
        .select(`
          id, name, slug, sku, base_price, sale_price, food_type, status, is_featured,
          description, ingredients, storage_instructions, video_url, category_id, created_at,
          category:categories(id, name),
          product_images(id, storage_path, public_url, is_primary, sort_order),
          product_variants(id, name, sku, price, sale_price, is_available)
        `)
        .order('created_at', { ascending: false });

      if (foodFilter) {
        query = query.eq('food_type', foodFilter);
      }

      const [prodRes, catRes] = await Promise.all([
        query,
        supabase.from('categories').select('id, name').order('name'),
      ]);

      if (prodRes.error) throw prodRes.error;
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Failed to load products catalog:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [foodFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleSeedCatalog() {
    setSeeding(true);
    setError('');
    setNotice('');
    try {
      await seedStorefrontCatalog();
      setNotice('Catalog successfully imported! 28 products, categories, variants & images are now live.');
      await load();
    } catch (err) {
      setError(`Seed error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  }

  async function toggleProductStatus(product, nextStatus) {
    setError('');
    const { error: updateError } = await supabase
      .from('products')
      .update({ status: nextStatus })
      .eq('id', product.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setNotice(`Product marked as ${nextStatus}.`);
      await load();
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"? This will remove its variants and images.`)) return;
    setError('');
    const { error: delError } = await supabase.from('products').delete().eq('id', product.id);
    if (delError) {
      setError(delError.message);
    } else {
      setNotice(`"${product.name}" deleted.`);
      await load();
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search.trim() ||
        `${p.name} ${p.sku || ''} ${p.description || ''} ${p.category?.name || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [products, search, statusFilter, categoryFilter]);

  return (
    <>
      <PageHeader title={title} description="Create, edit, and organize all Gulfam Sweets products, images, videos, and variants.">
        <div className="admin-header-controls">
          <button className="admin-button" onClick={() => setEditingProduct({})}>+ Add Product</button>
        </div>
      </PageHeader>

      <AdminNotice message={error} />
      <AdminNotice message={notice} type="success" />

      {products.length === 0 && !loading && (
        <div className="admin-hero-banner">
          <div>
            <h3>📦 No Products Found in Database</h3>
            <p>Your Supabase database table currently has 0 product records. Import all 28 authentic Gulfam Sweets items with one click.</p>
          </div>
          <button className="admin-button" onClick={handleSeedCatalog} disabled={seeding}>
            {seeding ? 'Importing Products…' : '🚀 Import 28 Storefront Products'}
          </button>
        </div>
      )}

      <section className="admin-panel">
        <div className="admin-table-toolbar">
          <input
            className="admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU, or description…"
          />

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Category filter">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <button className="admin-button admin-button-outline" onClick={load} disabled={loading}>Refresh</button>
        </div>

        {loading ? <Loading /> : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Food Type</th>
                  <th>Price</th>
                  <th>Variants</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const primaryImage = (p.product_images || []).find((img) => img.is_primary) || p.product_images?.[0];
                  const imgUrl = primaryImage?.public_url || getUnsplashUrl(p.legacy_id || '1599599810769-bcde5a160d32');
                  const variantCount = p.product_variants?.length || 0;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-product-row">
                          <img
                            src={imgUrl}
                            alt={p.name}
                            className="admin-prod-thumb"
                            onError={(e) => { e.currentTarget.src = getUnsplashUrl('1599599810769-bcde5a160d32'); }}
                          />
                          <div>
                            <strong>{p.name}</strong>
                            {p.is_featured && <span className="admin-badge admin-badge-active" style={{ marginLeft: 6 }}>Featured</span>}
                            {p.video_url && <span className="admin-badge admin-badge-frozen" style={{ marginLeft: 4 }}>Video</span>}
                          </div>
                        </div>
                      </td>
                      <td><code>{p.sku || '—'}</code></td>
                      <td><span className="admin-badge">{p.category?.name || 'Unassigned'}</span></td>
                      <td>
                        <span className={`admin-badge admin-badge-${p.food_type || 'ambient'}`}>
                          {capitalize(p.food_type || 'ambient')}
                        </span>
                      </td>
                      <td>
                        <div>
                          <strong>{formatMoney(p.base_price)}</strong>
                          {p.sale_price && <small style={{ display: 'block', color: '#a53328', textDecoration: 'line-through' }}>{formatMoney(p.sale_price)}</small>}
                        </div>
                      </td>
                      <td>
                        <button
                          className="admin-button admin-button-small admin-button-outline"
                          onClick={() => setVariantsProduct(p)}
                          title="Manage pack sizes and prices"
                        >
                          {variantCount} variant{variantCount === 1 ? '' : 's'}
                        </button>
                      </td>
                      <td>
                        <span className={`admin-badge admin-badge-${p.status}`}>
                          {capitalize(p.status)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="admin-button admin-button-small admin-button-outline"
                            onClick={() => setMediaProduct(p)}
                            title="Manage images & video preview"
                          >
                            Media ({p.product_images?.length || 0})
                          </button>
                          <button
                            className="admin-button admin-button-small admin-button-outline"
                            onClick={() => setEditingProduct(p)}
                          >
                            Edit
                          </button>
                          {p.status === 'active' ? (
                            <button
                              className="admin-button admin-button-small admin-button-outline"
                              onClick={() => toggleProductStatus(p, 'draft')}
                            >
                              Draft
                            </button>
                          ) : (
                            <button
                              className="admin-button admin-button-small"
                              onClick={() => toggleProductStatus(p, 'active')}
                            >
                              Publish
                            </button>
                          )}
                          <button
                            className="admin-button admin-button-small admin-button-danger"
                            onClick={() => deleteProduct(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredProducts.length && (
                  <tr>
                    <td colSpan="8"><EmptyState message="No products match the selected filters." /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Product Detail Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaved={async () => {
            setEditingProduct(null);
            setNotice('Product saved successfully.');
            await load();
          }}
        />
      )}

      {/* Product Variants Submodal */}
      {variantsProduct && (
        <ProductVariantsModal
          product={variantsProduct}
          onClose={() => setVariantsProduct(null)}
          onUpdated={load}
        />
      )}

      {/* Product Images & Media Submodal */}
      {mediaProduct && (
        <ProductImagesManager
          product={mediaProduct}
          onClose={() => setMediaProduct(null)}
          onUpdated={load}
        />
      )}
    </>
  );
}

// Product Edit/Add Modal
function ProductEditModal({ product, categories, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get('name')?.trim(),
      slug: form.get('slug')?.trim() || form.get('name')?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sku: form.get('sku')?.trim() || null,
      category_id: form.get('category_id') || null,
      food_type: form.get('food_type') || 'ambient',
      status: form.get('status') || 'active',
      base_price: Number(form.get('base_price')) || 0,
      sale_price: form.get('sale_price') ? Number(form.get('sale_price')) : null,
      is_featured: form.get('is_featured') === 'on',
      description: form.get('description')?.trim() || null,
      ingredients: form.get('ingredients')?.trim() || null,
      storage_instructions: form.get('storage_instructions')?.trim() || null,
      video_url: form.get('video_url')?.trim() || null,
    };

    try {
      let res;
      if (product.id) {
        res = await supabase.from('products').update(payload).eq('id', product.id);
      } else {
        res = await supabase.from('products').insert(payload).select().single();
      }
      if (res.error) throw res.error;
      onSaved();
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="admin-modal" role="dialog" aria-modal="true">
        <div className="admin-modal-heading">
          <h2>{product.id ? `Edit: ${product.name}` : 'Add New Product'}</h2>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>
        <AdminNotice message={error} />
        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Product Name *</span>
              <input name="name" defaultValue={product.name || ''} required placeholder="e.g. Shahi Gulab Jamun" />
            </label>
            <label className="admin-field">
              <span>URL Slug</span>
              <input name="slug" defaultValue={product.slug || ''} placeholder="e.g. shahi-gulab-jamun" />
            </label>
            <label className="admin-field">
              <span>Category *</span>
              <select name="category_id" defaultValue={product.category_id || ''} required>
                <option value="">Select category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="admin-field">
              <span>SKU</span>
              <input name="sku" defaultValue={product.sku || ''} placeholder="e.g. GS-MIT-01" />
            </label>
            <label className="admin-field">
              <span>Food Type</span>
              <select name="food_type" defaultValue={product.food_type || 'ambient'}>
                <option value="ambient">Ambient (Mithai / Nimco / Bakery)</option>
                <option value="fresh">Fresh (Snacks / Cakes / Same-day)</option>
                <option value="frozen">Frozen (Ready-to-fry)</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Status</span>
              <select name="status" defaultValue={product.status || 'active'}>
                <option value="active">Active (Visible)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Regular Price (PKR) *</span>
              <input name="base_price" type="number" step="1" min="0" defaultValue={product.base_price || ''} required />
            </label>
            <label className="admin-field">
              <span>Sale Price (PKR)</span>
              <input name="sale_price" type="number" step="1" min="0" defaultValue={product.sale_price || ''} placeholder="Optional" />
            </label>
            <label className="admin-field is-wide">
              <span>Description</span>
              <textarea name="description" rows={3} defaultValue={product.description || ''} placeholder="Authentic description…" />
            </label>
            <label className="admin-field">
              <span>Ingredients</span>
              <input name="ingredients" defaultValue={product.ingredients || ''} placeholder="e.g. Pure Desi Ghee, Khoya, Saffron" />
            </label>
            <label className="admin-field">
              <span>Storage Instructions</span>
              <input name="storage_instructions" defaultValue={product.storage_instructions || ''} placeholder="e.g. Keep refrigerated at 2-4°C" />
            </label>
            <label className="admin-field is-wide">
              <span>Video URL (MP4, YouTube, or Storage)</span>
              <input name="video_url" defaultValue={product.video_url || ''} placeholder="https://… or Supabase Storage public URL" />
            </label>
            <label className="admin-field is-wide" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input name="is_featured" type="checkbox" defaultChecked={product.is_featured || false} />
              <span>Mark as Featured Product on Storefront</span>
            </label>
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-button admin-button-outline" onClick={onClose}>Cancel</button>
            <button className="admin-button" disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

// Product Variants Submodal
function ProductVariantsModal({ product, onClose, onUpdated }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: queryErr } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .order('price', { ascending: true });

    if (queryErr) setError(queryErr.message);
    else setVariants(data || []);
    setLoading(false);
  }, [product.id]);

  useEffect(() => { load(); }, [load]);

  async function handleAddVariant(event) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      product_id: product.id,
      name: form.get('name')?.trim(),
      sku: form.get('sku')?.trim() || `${product.sku}-${form.get('name')?.trim()}`,
      weight_value: form.get('weight_value') ? Number(form.get('weight_value')) : null,
      weight_unit: form.get('weight_unit')?.trim() || 'kg',
      price: Number(form.get('price')) || 0,
      sale_price: form.get('sale_price') ? Number(form.get('sale_price')) : null,
      is_available: form.get('is_available') === 'on',
    };

    const { error: insErr } = await supabase.from('product_variants').insert(payload);
    if (insErr) {
      setError(insErr.message);
    } else {
      event.target.reset();
      setAdding(false);
      await load();
      if (onUpdated) onUpdated();
    }
  }

  async function handleDeleteVariant(id) {
    if (!window.confirm('Delete this variant?')) return;
    const { error: delErr } = await supabase.from('product_variants').delete().eq('id', id);
    if (delErr) setError(delErr.message);
    else {
      await load();
      if (onUpdated) onUpdated();
    }
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="admin-modal" role="dialog" aria-modal="true" style={{ maxWidth: 840 }}>
        <div className="admin-modal-heading">
          <div>
            <h2>Variants & Sizes</h2>
            <p>{product.name} ({variants.length} variations)</p>
          </div>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>

        <AdminNotice message={error} />

        <div style={{ marginBottom: 14 }}>
          <button className="admin-button" onClick={() => setAdding(!adding)}>
            {adding ? 'Cancel' : '+ Add New Variant'}
          </button>
        </div>

        {adding && (
          <form onSubmit={handleAddVariant} className="admin-form-grid" style={{ background: '#fdfaf8', padding: 16, borderRadius: 10, marginBottom: 16 }}>
            <label className="admin-field">
              <span>Variant Name *</span>
              <input name="name" required placeholder="e.g. 500 g, 1 kg, 6 pcs" />
            </label>
            <label className="admin-field">
              <span>SKU</span>
              <input name="sku" placeholder="e.g. GS-MIT-01-500G" />
            </label>
            <label className="admin-field">
              <span>Weight / Size Value</span>
              <input name="weight_value" type="number" step="0.1" placeholder="0.5" />
            </label>
            <label className="admin-field">
              <span>Weight Unit</span>
              <select name="weight_unit" defaultValue="kg">
                <option value="kg">kg (Kilogram)</option>
                <option value="g">g (Gram)</option>
                <option value="piece">piece (pcs)</option>
                <option value="lb">lb (Pound)</option>
                <option value="box">box (Gift Box)</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Regular Price (PKR) *</span>
              <input name="price" type="number" step="1" min="0" required placeholder="900" />
            </label>
            <label className="admin-field">
              <span>Sale Price (PKR)</span>
              <input name="sale_price" type="number" step="1" min="0" placeholder="Optional" />
            </label>
            <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input name="is_available" type="checkbox" defaultChecked />
              <span>Available for Order</span>
            </label>
            <div className="admin-form-actions is-wide">
              <button className="admin-button">Save Variant</button>
            </div>
          </form>
        )}

        {loading ? <Loading /> : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Size / Unit</th>
                  <th>Price</th>
                  <th>Availability</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.name}</strong></td>
                    <td><code>{v.sku || '—'}</code></td>
                    <td>{v.weight_value ? `${v.weight_value} ${v.weight_unit || ''}` : '—'}</td>
                    <td>
                      <strong>{formatMoney(v.price)}</strong>
                      {v.sale_price && <small style={{ display: 'block', color: '#a53328' }}>Sale: {formatMoney(v.sale_price)}</small>}
                    </td>
                    <td>
                      <span className={`admin-badge ${v.is_available ? 'admin-badge-active' : 'admin-badge-draft'}`}>
                        {v.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <button className="admin-button admin-button-small admin-button-danger" onClick={() => handleDeleteVariant(v.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!variants.length && (
                  <tr><td colSpan="6"><EmptyState message="No variants exist for this product. Click '+ Add New Variant' to define pack sizes." /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ==============================================================================
// 3. STORE SETTINGS — STRUCTURED, BEAUTIFUL EDITABLE CARDS FOR ALL 4 SECTIONS
// ==============================================================================
function SettingsPage() {
  const [settings, setSettings] = useState({
    store_info: { name: 'Gulfam Sweets & Dairy', phone: '0300 1234567', email: 'info@gulfamsweets.com', address: 'Main Market, Lahore, Pakistan', opening_hours: '9:00 AM to 11:00 PM' },
    checkout_rules: { allow_guest_checkout: true, cod_enabled: true, bank_transfer_enabled: true, raast_enabled: true },
    currency: { code: 'PKR', symbol: 'Rs.', format: 'Rs. {amount}' },
    delivery_policy: { standard_time_minutes: 60, express_available: true, fresh_food_same_day_only: true, free_delivery_threshold: 3000 },
  });

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: qErr } = await supabase.from('store_settings').select('*');
    if (qErr) {
      console.warn('Store settings query notice:', qErr.message);
    } else if (data && data.length > 0) {
      const merged = { ...settings };
      data.forEach((row) => {
        if (row.key && row.value) {
          merged[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        }
      });
      setSettings(merged);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveSection(key, value) {
    setSavingKey(key);
    setError('');
    setNotice('');
    try {
      const { error: upsertErr } = await supabase
        .from('store_settings')
        .upsert({
          key,
          value,
          is_public: true,
          updated_at: new Date().toISOString(),
        });

      if (upsertErr) throw upsertErr;
      setNotice(`${humanize(key)} settings successfully updated in database.`);
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
      setError(`Save failed: ${err.message}`);
    } finally {
      setSavingKey('');
    }
  }

  return (
    <>
      <PageHeader
        title="Store Settings"
        description="Configure your Gulfam Sweets store identity, payment methods, currency format, and delivery rules."
      >
        <button
          className="admin-button admin-button-outline"
          onClick={() => setShowRawJson(!showRawJson)}
        >
          {showRawJson ? 'Hide Raw JSON' : 'Advanced JSON'}
        </button>
      </PageHeader>

      <AdminNotice message={error} />
      <AdminNotice message={notice} type="success" />

      {loading ? <Loading /> : (
        <>
          <div className="admin-settings-grid">
            {/* 1. Store Information Card */}
            <article className="admin-settings-card">
              <div className="admin-settings-card-header">
                <div className="admin-settings-icon">🏪</div>
                <div>
                  <h3>Store Information</h3>
                  <p>Customer-facing store details shown in headers, footers & receipts.</p>
                </div>
              </div>
              <form
                className="admin-settings-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  saveSection('store_info', {
                    name: fd.get('name'),
                    phone: fd.get('phone'),
                    email: fd.get('email'),
                    address: fd.get('address'),
                    opening_hours: fd.get('opening_hours'),
                  });
                }}
              >
                <label className="admin-field">
                  <span>Store Name</span>
                  <input name="name" defaultValue={settings.store_info?.name || ''} required />
                </label>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Phone Number</span>
                    <input name="phone" defaultValue={settings.store_info?.phone || ''} required />
                  </label>
                  <label className="admin-field">
                    <span>Email Address</span>
                    <input name="email" type="email" defaultValue={settings.store_info?.email || ''} required />
                  </label>
                </div>
                <label className="admin-field">
                  <span>Physical Address</span>
                  <input name="address" defaultValue={settings.store_info?.address || ''} required />
                </label>
                <label className="admin-field">
                  <span>Opening Hours</span>
                  <input name="opening_hours" defaultValue={settings.store_info?.opening_hours || ''} placeholder="e.g. 9:00 AM to 11:00 PM" />
                </label>
                <button className="admin-button" disabled={savingKey === 'store_info'}>
                  {savingKey === 'store_info' ? 'Saving…' : 'Save Store Information'}
                </button>
              </form>
            </article>

            {/* 2. Checkout Rules Card */}
            <article className="admin-settings-card">
              <div className="admin-settings-card-header">
                <div className="admin-settings-icon">💳</div>
                <div>
                  <h3>Checkout & Payment Rules</h3>
                  <p>Enable payment gateways and guest checkout options.</p>
                </div>
              </div>
              <form
                className="admin-settings-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  saveSection('checkout_rules', {
                    allow_guest_checkout: fd.get('allow_guest_checkout') === 'on',
                    cod_enabled: fd.get('cod_enabled') === 'on',
                    bank_transfer_enabled: fd.get('bank_transfer_enabled') === 'on',
                    raast_enabled: fd.get('raast_enabled') === 'on',
                  });
                }}
              >
                <div className="admin-toggle-row">
                  <div className="admin-toggle-label">
                    <strong>Allow Guest Checkout</strong>
                    <small>Permit orders without requiring customer login.</small>
                  </div>
                  <label className="admin-switch">
                    <input name="allow_guest_checkout" type="checkbox" defaultChecked={settings.checkout_rules?.allow_guest_checkout ?? true} />
                    <span className="admin-switch-slider"></span>
                  </label>
                </div>

                <div className="admin-toggle-row">
                  <div className="admin-toggle-label">
                    <strong>Cash on Delivery (COD)</strong>
                    <small>Accept cash payments at the delivery doorstep.</small>
                  </div>
                  <label className="admin-switch">
                    <input name="cod_enabled" type="checkbox" defaultChecked={settings.checkout_rules?.cod_enabled ?? true} />
                    <span className="admin-switch-slider"></span>
                  </label>
                </div>

                <div className="admin-toggle-row">
                  <div className="admin-toggle-label">
                    <strong>Direct Bank Transfer</strong>
                    <small>Provide bank account details for manual wire transfer.</small>
                  </div>
                  <label className="admin-switch">
                    <input name="bank_transfer_enabled" type="checkbox" defaultChecked={settings.checkout_rules?.bank_transfer_enabled ?? true} />
                    <span className="admin-switch-slider"></span>
                  </label>
                </div>

                <div className="admin-toggle-row">
                  <div className="admin-toggle-label">
                    <strong>Raast Instant Payment</strong>
                    <small>Instant state-bank digital payment via Raast ID / QR.</small>
                  </div>
                  <label className="admin-switch">
                    <input name="raast_enabled" type="checkbox" defaultChecked={settings.checkout_rules?.raast_enabled ?? true} />
                    <span className="admin-switch-slider"></span>
                  </label>
                </div>

                <button className="admin-button" disabled={savingKey === 'checkout_rules'}>
                  {savingKey === 'checkout_rules' ? 'Saving…' : 'Save Checkout Rules'}
                </button>
              </form>
            </article>

            {/* 3. Currency & Pricing Card */}
            <article className="admin-settings-card">
              <div className="admin-settings-card-header">
                <div className="admin-settings-icon">₨</div>
                <div>
                  <h3>Currency & Price Display</h3>
                  <p>Standard currency symbols and formatted price representations.</p>
                </div>
              </div>
              <form
                className="admin-settings-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  saveSection('currency', {
                    code: fd.get('code'),
                    symbol: fd.get('symbol'),
                    format: fd.get('format'),
                  });
                }}
              >
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Currency Code</span>
                    <input name="code" defaultValue={settings.currency?.code || 'PKR'} required />
                  </label>
                  <label className="admin-field">
                    <span>Currency Symbol</span>
                    <input name="symbol" defaultValue={settings.currency?.symbol || 'Rs.'} required />
                  </label>
                </div>
                <label className="admin-field">
                  <span>Price Format Pattern</span>
                  <input name="format" defaultValue={settings.currency?.format || 'Rs. {amount}'} required />
                </label>
                <p style={{ margin: 0, fontSize: 11, color: '#887b7c' }}>
                  Preview: <strong>Rs. 2,200</strong> for two thousand two hundred PKR.
                </p>
                <button className="admin-button" disabled={savingKey === 'currency'}>
                  {savingKey === 'currency' ? 'Saving…' : 'Save Currency Settings'}
                </button>
              </form>
            </article>

            {/* 4. Delivery Policy Card */}
            <article className="admin-settings-card">
              <div className="admin-settings-card-header">
                <div className="admin-settings-icon">🚚</div>
                <div>
                  <h3>Delivery Policy</h3>
                  <p>Service lead-times, thresholds, and fresh food restrictions.</p>
                </div>
              </div>
              <form
                className="admin-settings-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  saveSection('delivery_policy', {
                    standard_time_minutes: Number(fd.get('standard_time_minutes')) || 60,
                    free_delivery_threshold: Number(fd.get('free_delivery_threshold')) || 3000,
                    express_available: fd.get('express_available') === 'on',
                    fresh_food_same_day_only: fd.get('fresh_food_same_day_only') === 'on',
                  });
                }}
              >
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Standard Lead Time (mins)</span>
                    <input name="standard_time_minutes" type="number" min="15" defaultValue={settings.delivery_policy?.standard_time_minutes ?? 60} required />
                  </label>
                  <label className="admin-field">
                    <span>Free Delivery Above (PKR)</span>
                    <input name="free_delivery_threshold" type="number" min="0" defaultValue={settings.delivery_policy?.free_delivery_threshold ?? 3000} required />
                  </label>
                </div>

                <div className="admin-toggle-row">
                  <div className="admin-toggle-label">
                    <strong>Express Delivery Available</strong>
                    <small>Provide expedited 30-45 minute dispatch.</small>
                  </div>
                  <label className="admin-switch">
                    <input name="express_available" type="checkbox" defaultChecked={settings.delivery_policy?.express_available ?? true} />
                    <span className="admin-switch-slider"></span>
                  </label>
                </div>

                <div className="admin-toggle-row">
                  <div className="admin-toggle-label">
                    <strong>Fresh Food Same-Day Only</strong>
                    <small>Disallow overnight shipping for hot snacks & fresh ras malai.</small>
                  </div>
                  <label className="admin-switch">
                    <input name="fresh_food_same_day_only" type="checkbox" defaultChecked={settings.delivery_policy?.fresh_food_same_day_only ?? true} />
                    <span className="admin-switch-slider"></span>
                  </label>
                </div>

                <button className="admin-button" disabled={savingKey === 'delivery_policy'}>
                  {savingKey === 'delivery_policy' ? 'Saving…' : 'Save Delivery Policy'}
                </button>
              </form>
            </article>
          </div>

          {/* Advanced Raw JSON View */}
          {showRawJson && (
            <section className="admin-panel">
              <PanelTitle title="Raw Store Settings JSON" />
              <pre className="admin-json-pre">{JSON.stringify(settings, null, 2)}</pre>
            </section>
          )}
        </>
      )}
    </>
  );
}

// ==============================================================================
// 4. CLIENT-SIDE SEEDER FUNCTION — ONE-CLICK SUPABASE POPULATION
// ==============================================================================
async function seedStorefrontCatalog() {
  // 1. Seed Categories
  const categoryMap = new Map();
  for (const cat of STOREFRONT_CATEGORIES) {
    const { data, error } = await supabase
      .from('categories')
      .upsert({
        slug: cat.slug || cat.id,
        name: cat.n,
        description: cat.d,
        is_active: true,
        sort_order: STOREFRONT_CATEGORIES.indexOf(cat) * 10 + 10,
      }, { onConflict: 'slug' })
      .select('id, slug')
      .single();

    if (!error && data) {
      categoryMap.set(cat.id, data.id);
      categoryMap.set(cat.slug, data.id);
    }
  }

  // 2. Seed Products, Variants, Images & Inventory
  for (const p of STOREFRONT_PRODUCTS) {
    const categoryId = categoryMap.get(p.c) || null;
    const slug = p.n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const foodType = p.c === 'snacks' || p.c === 'cakes' ? 'fresh' : p.c === 'frozen' ? 'frozen' : 'ambient';

    const { data: prodData, error: prodErr } = await supabase
      .from('products')
      .upsert({
        name: p.n,
        slug,
        category_id: categoryId,
        sku: p.sku || `GS-${p.c.toUpperCase().slice(0, 3)}-${String(p.id).padStart(2, '0')}`,
        legacy_id: String(p.id),
        food_type: foodType,
        status: 'active',
        base_price: p.p,
        is_featured: Boolean(p.tag),
        description: p.d,
        ingredients: p.ingredients,
        storage_instructions: p.shelfLife,
      }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (prodErr || !prodData) {
      console.warn(`Product upsert warning for ${p.n}:`, prodErr);
      continue;
    }

    const productId = prodData.id;

    // Seed Primary Image
    const imgUrl = getUnsplashUrl(p.i);
    await supabase.from('product_images').upsert({
      product_id: productId,
      public_url: imgUrl,
      alt_text: p.n,
      sort_order: 0,
      is_primary: true,
    });

    // Seed Variants
    const unitConfigs = WEIGHT_UNITS[p.w] || WEIGHT_UNITS.kg;
    for (const [vLabel, vMult] of unitConfigs) {
      const vPrice = Math.round(p.p * vMult);
      const vSku = `${p.sku || 'GS'}-${vLabel.replace(/\s+/g, '')}`;
      const { data: varData } = await supabase
        .from('product_variants')
        .upsert({
          product_id: productId,
          name: vLabel,
          sku: vSku,
          weight_value: vMult,
          weight_unit: p.w,
          price: vPrice,
          is_available: true,
        }, { onConflict: 'sku' })
        .select('id')
        .single();

      // Seed Inventory if variant was created
      if (varData?.id) {
        await supabase.from('inventory').upsert({
          product_variant_id: varData.id,
          quantity_on_hand: 50,
          quantity_reserved: 0,
        }, { onConflict: 'product_variant_id' });
      }
    }
  }

  // 3. Seed Default Store Settings
  const defaultSettings = [
    { key: 'store_info', value: { name: 'Gulfam Sweets & Dairy', phone: '0300 1234567', email: 'info@gulfamsweets.com', address: 'Main Market, Lahore, Pakistan', opening_hours: '9:00 AM to 11:00 PM' }, is_public: true },
    { key: 'currency', value: { code: 'PKR', symbol: 'Rs.', format: 'Rs. {amount}' }, is_public: true },
    { key: 'checkout_rules', value: { allow_guest_checkout: true, cod_enabled: true, bank_transfer_enabled: true, raast_enabled: true }, is_public: true },
    { key: 'delivery_policy', value: { standard_time_minutes: 60, express_available: true, fresh_food_same_day_only: true, free_delivery_threshold: 3000 }, is_public: true },
  ];

  for (const s of defaultSettings) {
    await supabase.from('store_settings').upsert(s, { onConflict: 'key' });
  }
}

// ==============================================================================
// 5. IMAGE & VIDEO MEDIA MANAGER MODAL
// ==============================================================================
function ProductImagesManager({ product, onClose, onUpdated }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState(product.video_url || '');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: qErr } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true });

    if (qErr) setError(qErr.message);
    else setImages(data || []);
    setLoading(false);
  }, [product.id]);

  useEffect(() => { load(); }, [load]);

  async function handleFileUpload(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setError('');
    setNotice('');

    const storage = supabase.storage.from('product-images');
    const uploadedPaths = [];

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name}: please select an image file.`);
        }
        if (file.size > 8 * 1024 * 1024) {
          throw new Error(`${file.name}: image must be 8 MB or smaller.`);
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const path = `${product.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: storageError } = await storage.upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
        if (storageError) throw storageError;
        uploadedPaths.push(path);
      }

      const rows = uploadedPaths.map((storagePath, idx) => {
        const { data } = storage.getPublicUrl(storagePath);
        return {
          product_id: product.id,
          storage_path: storagePath,
          public_url: data.publicUrl,
          alt_text: `${product.name} image`,
          sort_order: images.length + idx,
          is_primary: images.length === 0 && idx === 0,
        };
      });

      const { error: insErr } = await supabase.from('product_images').insert(rows);
      if (insErr) throw insErr;

      setNotice('Images successfully uploaded.');
      await load();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Image upload failed:', err);
      setError(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleAddUrlImage(event) {
    event.preventDefault();
    if (!newImageUrl.trim()) return;
    setError('');
    const { error: insErr } = await supabase.from('product_images').insert({
      product_id: product.id,
      public_url: newImageUrl.trim(),
      alt_text: product.name,
      sort_order: images.length,
      is_primary: images.length === 0,
    });
    if (insErr) setError(insErr.message);
    else {
      setNewImageUrl('');
      setNotice('Image URL added.');
      await load();
      if (onUpdated) onUpdated();
    }
  }

  async function handleSaveVideoUrl(event) {
    event.preventDefault();
    setError('');
    const { error: vidErr } = await supabase
      .from('products')
      .update({ video_url: videoUrl.trim() || null })
      .eq('id', product.id);

    if (vidErr) setError(vidErr.message);
    else {
      setNotice('Product video URL saved.');
      if (onUpdated) onUpdated();
    }
  }

  async function setPrimary(img) {
    setError('');
    await supabase.from('product_images').update({ is_primary: false }).eq('product_id', product.id);
    const { error: setErr } = await supabase.from('product_images').update({ is_primary: true }).eq('id', img.id);
    if (setErr) setError(setErr.message);
    else {
      await load();
      if (onUpdated) onUpdated();
    }
  }

  async function removeImage(img) {
    if (!window.confirm('Delete this image?')) return;
    setError('');
    const { error: delErr } = await supabase.from('product_images').delete().eq('id', img.id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    if (img.storage_path) {
      await supabase.storage.from('product-images').remove([img.storage_path]);
    }
    await load();
    if (onUpdated) onUpdated();
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="admin-modal" role="dialog" aria-modal="true" style={{ maxWidth: 860 }}>
        <div className="admin-modal-heading">
          <div>
            <h2>Product Media & Gallery</h2>
            <p>{product.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>

        <AdminNotice message={error} />
        <AdminNotice message={notice} type="success" />

        {/* Video Management Section */}
        <div style={{ background: '#fdfaf8', padding: 16, borderRadius: 12, marginBottom: 18, border: '1px solid #f0e9e4' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#321b20' }}>🎥 Product Video</h3>
          <form onSubmit={handleSaveVideoUrl} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ flex: 1 }}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter direct video URL (e.g. https://.../video.mp4)"
            />
            <button className="admin-button">Save Video</button>
          </form>

          {videoUrl && (
            <div className="admin-video-preview">
              <video src={videoUrl} controls preload="metadata">
                Your browser does not support HTML5 video.
              </video>
            </div>
          )}
        </div>

        {/* Image Upload Section */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <label className="admin-button admin-upload-button">
            {uploading ? 'Uploading to Storage…' : '📁 Upload Local Images'}
            <input type="file" accept="image/*" multiple disabled={uploading} onChange={handleFileUpload} />
          </label>

          <form onSubmit={handleAddUrlImage} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
            <input
              style={{ flex: 1 }}
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Or paste external image URL…"
            />
            <button className="admin-button admin-button-outline">Add URL</button>
          </form>
        </div>

        {loading ? <Loading /> : images.length ? (
          <div className="admin-image-grid">
            {images.map((img) => (
              <article className="admin-image-card" key={img.id}>
                <img src={img.public_url} alt={img.alt_text || product.name} />
                <div style={{ padding: 8 }}>
                  {img.is_primary ? (
                    <span className="admin-badge admin-badge-active" style={{ display: 'block', textAlign: 'center', marginBottom: 6 }}>
                      Primary
                    </span>
                  ) : (
                    <button
                      className="admin-button admin-button-small admin-button-outline"
                      style={{ width: '100%', marginBottom: 6 }}
                      onClick={() => setPrimary(img)}
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    className="admin-button admin-button-small admin-button-danger"
                    style={{ width: '100%' }}
                    onClick={() => removeImage(img)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="No images uploaded yet. Upload images from your computer or paste an image URL above." />
        )}
      </section>
    </div>
  );
}

// ==============================================================================
// 6. RESOURCE PAGE (CATEGORIES, VARIANTS, PROMOTIONS, DELIVERY)
// ==============================================================================
function ResourcePage({ config }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [referenceData, setReferenceData] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    let request = supabase.from(config.table).select('*').order(config.orderBy || 'created_at', { ascending: false });
    let { data, error: queryError } = await request;

    // Resilient fallback if PostgreSQL has restricted column-level SELECT on product_variants
    if (queryError && (queryError.message?.toLowerCase().includes('permission denied') || queryError.code === '42501') && config.table === 'product_variants') {
      const fallbackReq = await supabase
        .from('product_variants')
        .select('id, product_id, sku, name, weight_value, weight_unit, price, sale_price, low_stock_threshold, is_available, created_at')
        .order(config.orderBy || 'created_at', { ascending: false });
      if (!fallbackReq.error && fallbackReq.data) {
        data = fallbackReq.data;
        queryError = null;
      }
    }

    if (queryError) {
      console.error(`Loading ${config.table} failed:`, queryError);
      setError(queryError.message);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }, [config]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let active = true;
    async function loadReferenceData() {
      const sources = [...new Set((config.fields || []).filter((f) => f.type === 'relation').map((f) => f.source))];
      const entries = await Promise.all(sources.map(async (source) => {
        const table = source === 'categories' ? 'categories' : 'products';
        const { data } = await supabase.from(table).select('id,name').order('name').limit(500);
        return [source, data || []];
      }));
      if (active) setReferenceData(Object.fromEntries(entries));
    }
    loadReferenceData();
    return () => { active = false; };
  }, [config]);

  const visibleRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(needle)) : rows;
  }, [rows, search]);

  async function saveRecord(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const formData = new FormData(event.currentTarget);
    const payload = {};

    try {
      for (const field of config.fields || []) {
        const value = formData.get(field.name);
        if (field.type === 'checkbox') payload[field.name] = value === 'on';
        else if (value !== null && value !== '') {
          if (field.type === 'number') payload[field.name] = Number(value);
          else if (field.type === 'json') payload[field.name] = JSON.parse(value);
          else payload[field.name] = value;
        } else if (editing) {
          payload[field.name] = field.type === 'checkbox' ? false : null;
        }
      }
    } catch (e) {
      setError(`Invalid input: ${e.message}`);
      setSaving(false);
      return;
    }

    let result;
    const pk = config.primaryKey || 'id';
    if (editing?.[pk]) {
      result = await supabase.from(config.table).update(payload).eq(pk, editing[pk]);
    } else {
      result = await supabase.from(config.table).insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setNotice('Record saved successfully.');
      setEditing(null);
      await load();
    }
    setSaving(false);
  }

  async function deleteRecord(row) {
    if (!window.confirm('Delete this record?')) return;
    const pk = config.primaryKey || 'id';
    const { error: delErr } = await supabase.from(config.table).delete().eq(pk, row[pk]);
    if (delErr) setError(delErr.message);
    else {
      setNotice('Record deleted.');
      await load();
    }
  }

  return (
    <>
      <PageHeader title={config.title} description={config.description}>
        <button className="admin-button" onClick={() => setEditing({})}>+ Add New</button>
      </PageHeader>

      <AdminNotice message={error} />
      <AdminNotice message={notice} type="success" />

      <section className="admin-panel">
        <div className="admin-table-toolbar">
          <input
            className="admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${config.title.toLowerCase()}…`}
          />
          <button className="admin-button admin-button-outline" onClick={load} disabled={loading}>Refresh</button>
        </div>

        {loading ? <Loading /> : (
          <DataTable
            columns={config.columns}
            rows={visibleRows}
            empty="No records found."
            actions={(row) => (
              <div className="admin-row-actions">
                <button className="admin-button admin-button-small admin-button-outline" onClick={() => setEditing(row)}>Edit</button>
                <button className="admin-button admin-button-small admin-button-danger" onClick={() => deleteRecord(row)}>Delete</button>
              </div>
            )}
          />
        )}
      </section>

      {editing && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <section className="admin-modal" role="dialog" aria-modal="true">
            <div className="admin-modal-heading">
              <h2>{editing.id ? 'Edit Record' : 'Add New Record'}</h2>
              <button onClick={() => setEditing(null)}>×</button>
            </div>
            <form onSubmit={saveRecord}>
              <div className="admin-form-grid">
                {(config.fields || []).map((field) => (
                  <label className={`admin-field${field.type === 'textarea' || field.type === 'json' ? ' is-wide' : ''}`} key={field.name}>
                    <span>{field.label}{field.required && ' *'}</span>
                    {field.type === 'textarea' ? (
                      <textarea name={field.name} defaultValue={editing[field.name] || ''} rows={3} required={field.required} />
                    ) : field.type === 'json' ? (
                      <textarea name={field.name} defaultValue={JSON.stringify(editing[field.name] || {}, null, 2)} rows={5} required={field.required} />
                    ) : field.type === 'select' ? (
                      <select name={field.name} defaultValue={editing[field.name] || field.options[0]} required={field.required}>
                        {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : field.type === 'relation' ? (
                      <select name={field.name} defaultValue={editing[field.name] || ''} required={field.required}>
                        <option value="">Select…</option>
                        {(referenceData[field.source] || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <input name={field.name} type="checkbox" defaultChecked={Boolean(editing[field.name])} />
                    ) : (
                      <input
                        name={field.name}
                        type={field.type || 'text'}
                        defaultValue={editing[field.name] || ''}
                        required={field.required}
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="admin-form-actions">
                <button type="button" className="admin-button admin-button-outline" onClick={() => setEditing(null)}>Cancel</button>
                <button className="admin-button" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

// ==============================================================================
// 7. INVENTORY, ORDERS, CUSTOMERS, PAYMENTS & OTHER SECTIONS
// ==============================================================================
function InventoryPage() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [reasonById, setReasonById] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [variantsResult, categoriesResult] = await Promise.all([
      supabase.rpc('get_admin_inventory', { p_category_id: null }),
      supabase.from('categories').select('id,name').order('sort_order'),
    ]);
    if (variantsResult.error || categoriesResult.error) {
      setError((variantsResult.error || categoriesResult.error).message);
    } else {
      setRows(variantsResult.data || []);
      setCategories(categoriesResult.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((row) => {
    const name = `${row.product_name || ''} ${row.variant_name || ''} ${row.sku || ''}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const qty = Number(row.stock_quantity || 0);
    const matchFilter = filter === 'all'
      || (filter === 'out' ? qty === 0 : filter === 'low' ? qty > 0 && qty <= Number(row.low_stock_threshold || 10) : true);
    const matchCat = categoryId === 'all' || row.category_id === categoryId;
    return matchSearch && matchFilter && matchCat;
  });

  async function adjustStock(row, delta) {
    const reason = reasonById[row.variant_id];
    if (!reason?.trim()) {
      setError('Please enter an adjustment reason first.');
      return;
    }
    setError('');
    const { error: adjErr } = await supabase.rpc('adjust_inventory', {
      p_variant_id: row.variant_id,
      p_quantity_delta: delta,
      p_reason: reason.trim(),
    });
    if (adjErr) setError(adjErr.message);
    else {
      setReasonById((prev) => ({ ...prev, [row.variant_id]: '' }));
      await load();
    }
  }

  return (
    <>
      <PageHeader title="Inventory Management" description="Review stock across all product variations and submit audited adjustments." />
      <AdminNotice message={error} />
      <section className="admin-panel">
        <div className="admin-table-toolbar">
          <input className="admin-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, variant, or SKU" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter stock">
            <option value="all">All stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="admin-button admin-button-outline" onClick={load} disabled={loading}>Refresh</button>
        </div>
        {loading ? <Loading /> : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Low Limit</th>
                  <th>Adjustment Reason</th>
                  <th>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.variant_id}>
                    <td><strong>{r.product_name}</strong></td>
                    <td>{r.variant_name}</td>
                    <td><code>{r.sku || '—'}</code></td>
                    <td>
                      <span className={`admin-badge ${Number(r.stock_quantity) === 0 ? 'admin-badge-stock-out' : Number(r.stock_quantity) <= 10 ? 'admin-badge-stock-low' : 'admin-badge-stock-ok'}`}>
                        {r.stock_quantity} units
                      </span>
                    </td>
                    <td>{r.low_stock_threshold ?? 10}</td>
                    <td>
                      <input
                        value={reasonById[r.variant_id] || ''}
                        onChange={(e) => setReasonById((prev) => ({ ...prev, [r.variant_id]: e.target.value }))}
                        placeholder="e.g. Restock shipment"
                      />
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="admin-button admin-button-small" onClick={() => adjustStock(r, 10)}>+10</button>
                        <button className="admin-button admin-button-small admin-button-outline" onClick={() => adjustStock(r, -1)}>-1</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan="7"><EmptyState message="No inventory items match." /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function StockMovementsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: qErr } = await supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }).limit(200);
    if (qErr) setError(qErr.message);
    else setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="Stock Movements" description="Audited stock changes recorded across all inventory operations." />
      <AdminNotice message={error} />
      <section className="admin-panel">
        <div className="admin-table-toolbar">
          <span>{rows.length} recorded movements</span>
          <button className="admin-button admin-button-outline" onClick={load} disabled={loading}>Refresh</button>
        </div>
        {loading ? <Loading /> : <DataTable columns={['created_at', 'variant_id', 'quantity_delta', 'movement_type', 'reason', 'performed_by']} rows={rows} empty="No stock movements recorded." />}
      </section>
    </>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(300);
    if (status !== 'all') query = query.eq('status', status);
    const { data, error: qErr } = await query;
    if (qErr) setError(qErr.message);
    else setOrders(data || []);
    setLoading(false);
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const visible = orders.filter((o) => `${o.order_number} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(search.toLowerCase()));
  const statuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];

  async function updateStatus(order, nextStatus) {
    setError('');
    let err = null;
    try {
      const { error: rpcErr } = await supabase.rpc('admin_update_order_status', {
        p_order_id: order.id,
        p_status: nextStatus,
        p_payment_status: order.payment_status || 'pending',
      });
      if (!rpcErr) {
        await load();
        return;
      }
      err = rpcErr;
    } catch (e) {
      err = e;
    }

    const { error: updErr } = await supabase.from('orders').update({ status: nextStatus }).eq('id', order.id);
    if (updErr) setError(updErr.message || err?.message || 'Failed to update order status');
    else await load();
  }

  return (
    <>
      <PageHeader title="Orders Management" description="Review placed orders, verify payments, and manage fulfillment." />
      <AdminNotice message={error} />
      <section className="admin-panel">
        <div className="admin-table-toolbar">
          <input className="admin-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, customer, or phone" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Order status filter">
            <option value="all">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
          </select>
          <button className="admin-button admin-button-outline" onClick={() => downloadCsv('orders.csv', visible)}>Export CSV</button>
          <button className="admin-button admin-button-outline" onClick={load} disabled={loading}>Refresh</button>
        </div>
        {loading ? <Loading /> : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Update</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.order_number}</strong></td>
                    <td>{o.customer_name}</td>
                    <td>{o.customer_phone}</td>
                    <td>{formatDate(o.created_at)}</td>
                    <td><strong>{formatMoney(o.total)}</strong></td>
                    <td><span className="admin-badge">{capitalize(o.payment_method || 'COD')} ({capitalize(o.payment_status || 'pending')})</span></td>
                    <td><span className="admin-badge admin-badge-active">{capitalize(o.status)}</span></td>
                    <td>
                      <select value={o.status} onChange={(e) => updateStatus(o, e.target.value)}>
                        {statuses.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
                      </select>
                    </td>
                    <td><button className="admin-button admin-button-small admin-button-outline" onClick={() => setSelectedOrder(o)}>View</button></td>
                  </tr>
                ))}
                {!visible.length && <tr><td colSpan="9"><EmptyState message="No orders match this search." /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusChange={load} />
      )}
    </>
  );
}

function OrderDetailsModal({ order, onClose, onStatusChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderStatus, setOrderStatus] = useState(order.status);
  const [payStatus, setPayStatus] = useState(order.payment_status || 'pending');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      const { data, error: qErr } = await supabase.from('order_items').select('*').eq('order_id', order.id);
      if (qErr) setError(qErr.message);
      else setItems(data || []);
      setLoading(false);
    }
    fetchItems();
  }, [order.id]);

  async function handleUpdateStatuses() {
    setSaving(true);
    setError('');
    setNotice('');

    let success = false;
    let rpcError = null;
    try {
      const { error: rpcErr } = await supabase.rpc('admin_update_order_status', {
        p_order_id: order.id,
        p_status: orderStatus,
        p_payment_status: payStatus,
      });
      if (!rpcErr) {
        success = true;
      } else {
        rpcError = rpcErr;
      }
    } catch (e) {
      rpcError = e;
    }

    if (!success) {
      const { error: updErr } = await supabase.from('orders').update({
        status: orderStatus,
        payment_status: payStatus,
      }).eq('id', order.id);

      if (updErr) {
        setError(updErr.message || rpcError?.message || 'Failed to update order status');
        setSaving(false);
        return;
      }
    }

    try {
      const savedOrdersRaw = localStorage.getItem('gulfam_customer_orders');
      if (savedOrdersRaw) {
        const ordersList = JSON.parse(savedOrdersRaw);
        const idx = ordersList.findIndex((o) => o.id === order.id || o.orderNumber === order.order_number);
        if (idx !== -1) {
          ordersList[idx].status = orderStatus;
          ordersList[idx].paymentStatus = payStatus;
          localStorage.setItem('gulfam_customer_orders', JSON.stringify(ordersList));
        }
      }
    } catch (e) {
      console.warn('Local demo order update failed:', e);
    }

    setNotice('Order updated successfully.');
    if (onStatusChange) onStatusChange();
    setSaving(false);
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="admin-modal" role="dialog" aria-modal="true" style={{ maxWidth: 760 }}>
        <div className="admin-modal-heading">
          <div>
            <h2>Order {order.order_number}</h2>
            <p>{order.customer_name} · {order.customer_phone}</p>
          </div>
          <button onClick={onClose}>×</button>
        </div>

        <AdminNotice message={error} />
        <AdminNotice message={notice} type="success" />

        <div style={{ background: '#fdfaf8', padding: 14, borderRadius: 10, marginBottom: 14, border: '1px solid #f0e9e4' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12 }}><strong>Delivery Address:</strong> {order.delivery_address}, {order.city}</p>
          <p style={{ margin: 0, fontSize: 12 }}><strong>Customer Notes:</strong> {order.delivery_notes || 'None'}</p>
        </div>

        <div className="admin-form-grid" style={{ marginBottom: 14 }}>
          <label className="admin-field">
            <span>Order Status</span>
            <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
              {['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                <option key={s} value={s}>{capitalize(s)}</option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Payment Status</span>
            <select value={payStatus} onChange={(e) => setPayStatus(e.target.value)}>
              {['pending', 'paid', 'failed', 'refunded'].map((s) => (
                <option key={s} value={s}>{capitalize(s)}</option>
              ))}
            </select>
          </label>
          <div className="admin-form-actions is-wide">
            <button className="admin-button" onClick={handleUpdateStatuses} disabled={saving}>
              {saving ? 'Updating…' : 'Update Order Status'}
            </button>
          </div>
        </div>

        {loading ? <Loading /> : (
          <DataTable
            columns={['product_name', 'variant_label', 'quantity', 'unit_price', 'total_price']}
            rows={items}
            empty="No items in this order."
          />
        )}

        <div style={{ textAlign: 'right', marginTop: 14, fontSize: 16 }}>
          <strong>Total: {formatMoney(order.total)}</strong>
        </div>
      </section>
    </div>
  );
}

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [profilesResult, ordersResult] = await Promise.all([
      supabase.from('profiles').select('id,full_name,email,phone,created_at').order('created_at', { ascending: false }).limit(500),
      supabase.from('orders').select('customer_id,total'),
    ]);
    if (profilesResult.error || ordersResult.error) {
      setError((profilesResult.error || ordersResult.error).message);
    } else {
      const totals = new Map();
      for (const order of ordersResult.data || []) {
        if (!order.customer_id) continue;
        const summary = totals.get(order.customer_id) || { order_count: 0, total_purchases: 0 };
        summary.order_count += 1;
        summary.total_purchases += Number(order.total) || 0;
        totals.set(order.customer_id, summary);
      }
      setCustomers((profilesResult.data || []).map((p) => ({
        ...p,
        ...(totals.get(p.id) || { order_count: 0, total_purchases: 0 }),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const visible = customers.filter((c) => `${c.full_name} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <PageHeader title="Customers Management" description="View registered customer accounts, contact details, and order history." />
      <AdminNotice message={error} />
      <section className="admin-panel">
        <div className="admin-table-toolbar">
          <input className="admin-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, or phone" />
          <button className="admin-button admin-button-outline" onClick={load} disabled={loading}>Refresh</button>
          <button className="admin-button admin-button-outline" onClick={() => downloadCsv('customers.csv', visible)}>Export CSV</button>
        </div>
        {loading ? <Loading /> : <DataTable columns={['full_name', 'email', 'phone', 'order_count', 'total_purchases', 'created_at']} rows={visible} empty="No customer profiles found." />}
      </section>
    </>
  );
}

function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: qErr } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(300);
    if (qErr) setError(qErr.message);
    else setPayments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="Payments Management" description="Audit received transactions, COD collections, and gateway logs." />
      <AdminNotice message={error} />
      <section className="admin-panel">
        <div className="admin-table-toolbar">
          <span>Payment transactions</span>
          <button className="admin-button admin-button-outline" onClick={load} disabled={loading}>Refresh</button>
        </div>
        {loading ? <Loading /> : <DataTable columns={['order_id', 'method', 'amount', 'status', 'payment_reference', 'created_at']} rows={payments} empty="No payment records found." />}
      </section>
    </>
  );
}

function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: qErr } = await supabase.from('product_reviews').select('*').order('created_at', { ascending: false }).limit(300);
    if (qErr) setError(qErr.message);
    else setReviews(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(review, st) {
    const { error: updErr } = await supabase.from('product_reviews').update({ status: st }).eq('id', review.id);
    if (updErr) setError(updErr.message);
    else await load();
  }

  return (
    <>
      <PageHeader title="Reviews Management" description="Moderate customer product ratings and reviews." />
      <AdminNotice message={error} />
      <section className="admin-panel">
        {loading ? <Loading /> : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead><tr><th>Product ID</th><th>Rating</th><th>Review</th><th>Status</th><th>Moderate</th></tr></thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td><code>{r.product_id}</code></td>
                    <td>{r.rating} / 5 ⭐</td>
                    <td>{r.body}</td>
                    <td><span className="admin-badge">{r.status}</span></td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="admin-button admin-button-small" onClick={() => setStatus(r, 'approved')}>Approve</button>
                        <button className="admin-button admin-button-small admin-button-danger" onClick={() => setStatus(r, 'rejected')}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!reviews.length && <tr><td colSpan="5"><EmptyState message="No reviews to moderate." /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: qErr } = await supabase.from('customer_inquiries').select('*').order('created_at', { ascending: false }).limit(300);
    if (qErr) setError(qErr.message);
    else setInquiries(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="Contact Inquiries" description="Customer messages submitted through the website contact form." />
      <AdminNotice message={error} />
      <section className="admin-panel">
        {loading ? <Loading /> : <DataTable columns={['name', 'email', 'phone', 'message', 'status', 'created_at']} rows={inquiries} empty="No inquiries found." />}
      </section>
    </>
  );
}

function ReportsPage() {
  const [report, setReport] = useState([]);
  const [start, setStart] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadReport(e) {
    e?.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: rErr } = await supabase.rpc('get_sales_report', {
      p_start_date: new Date(`${start}T00:00:00`).toISOString(),
      p_end_date: new Date(`${end}T23:59:59`).toISOString(),
    });
    if (rErr) setError(rErr.message);
    else setReport(Array.isArray(data) ? data : data ? [data] : []);
    setLoading(false);
  }

  return (
    <>
      <PageHeader title="Reports & Analytics" description="Generate sales breakdowns and export CSVs." />
      <AdminNotice message={error} />
      <section className="admin-panel">
        <form className="admin-table-toolbar" onSubmit={loadReport}>
          <label className="admin-date-field">From <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required /></label>
          <label className="admin-date-field">To <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required /></label>
          <button className="admin-button" disabled={loading}>{loading ? 'Loading…' : 'Run Report'}</button>
          <button type="button" className="admin-button admin-button-outline" onClick={() => downloadCsv('sales-report.csv', report)} disabled={!report.length}>Export CSV</button>
        </form>
        <DataTable columns={report[0] ? Object.keys(report[0]) : ['Report results']} rows={report} empty="Select dates and click Run Report." />
      </section>
    </>
  );
}

function TeamPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('admin');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: qErr } = await supabase.from('user_roles').select('user_id,role,created_at').order('created_at', { ascending: false });
    if (qErr) setError(qErr.message);
    else setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function assignRole(event) {
    event.preventDefault();
    setError('');
    const { error: insErr } = await supabase.from('user_roles').upsert({
      user_id: userId.trim(),
      role,
    });
    if (insErr) setError(insErr.message);
    else {
      setUserId('');
      await load();
    }
  }

  return (
    <>
      <PageHeader title="Admin Users & Roles" description="Manage team permissions and administrative role assignments." />
      <AdminNotice message={error} />
      <section className="admin-panel">
        <h2>Assign Role to User</h2>
        <form onSubmit={assignRole} style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} required placeholder="User UUID (from auth.users)" style={{ minWidth: 320 }} />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="inventory_manager">Inventory Manager</option>
            <option value="order_manager">Order Manager</option>
          </select>
          <button className="admin-button">Assign Role</button>
        </form>
      </section>
      <section className="admin-panel">
        <PanelTitle title="Active Admin Roles" />
        {loading ? <Loading /> : <DataTable columns={['user_id', 'role', 'created_at']} rows={rows} empty="No roles assigned yet." />}
      </section>
    </>
  );
}

// ==============================================================================
// 8. DATA TABLE COMPONENT — PAGINATED, PREVIEWS IMAGES & JSON INSPECTOR
// ==============================================================================
function DataTable({ columns, rows, empty, actions }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [activeJson, setActiveJson] = useState(null);

  if (!rows || !rows.length) return <EmptyState message={empty} />;

  const totalPages = Math.ceil(rows.length / pageSize);
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col) => <th key={col}>{humanize(col)}</th>)}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, idx) => (
              <tr key={row.id || row.order_number || row.key || idx}>
                {columns.map((col) => (
                  <td key={col}>
                    {renderCellValue(col, row[col], () => setActiveJson({ title: humanize(col), data: row[col] }))}
                  </td>
                ))}
                {actions && <td>{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 10 && (
        <div className="admin-pagination">
          <span>Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, rows.length)} of {rows.length} records</span>
          <div className="admin-pagination-btns">
            <button
              className="admin-pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span style={{ padding: '0 8px' }}>Page {page} of {totalPages}</span>
            <button
              className="admin-pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* JSON Inspector Popup Modal */}
      {activeJson && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveJson(null); }}>
          <section className="admin-modal" role="dialog" aria-modal="true" style={{ maxWidth: 640 }}>
            <div className="admin-modal-heading">
              <h2>{activeJson.title}</h2>
              <button onClick={() => setActiveJson(null)}>×</button>
            </div>
            <pre className="admin-json-pre">{JSON.stringify(activeJson.data, null, 2)}</pre>
            <div className="admin-form-actions" style={{ marginTop: 14 }}>
              <button className="admin-button admin-button-outline" onClick={() => setActiveJson(null)}>Close</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function renderCellValue(key, value, onInspect) {
  if (value === null || value === undefined || value === '') return '—';
  if (key.endsWith('_at') || key === 'created_at') return formatDate(value);
  if (['total', 'amount', 'price', 'base_price', 'sale_price', 'subtotal', 'delivery_fee'].includes(key)) return formatMoney(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  // Handle Image URLs
  if (typeof value === 'string' && (value.startsWith('http') && (value.includes('unsplash') || value.includes('supabase') || /\.(jpg|png|webp|jpeg)$/i.test(value)))) {
    return (
      <img
        src={value}
        alt="Thumbnail"
        className="admin-prod-thumb"
        style={{ width: 36, height: 36 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }

  // Handle Nested JSON Objects & Arrays
  if (typeof value === 'object') {
    const count = Object.keys(value).length;
    return (
      <button className="admin-json-btn" onClick={onInspect} title="Click to view full JSON">
        {Array.isArray(value) ? `[Array: ${value.length}]` : `{JSON: ${count} keys}`}
      </button>
    );
  }

  return String(value);
}

// Helpers
function SalesChart({ rows }) {
  const values = rows.map((r) => ({
    label: r.period || r.sale_date || r.date || '',
    amount: Number(r.total_sales ?? r.sales ?? 0),
  })).filter((r) => r.label);

  if (!values.length) return <EmptyState message="Sales data will appear after completed orders." />;
  const max = Math.max(...values.map((v) => v.amount), 1);

  return (
    <div className="admin-sales-chart">
      {values.slice(-14).map((row, i) => (
        <div className="admin-sales-bar-wrap" key={i}>
          <span className="admin-sales-value">{formatMoney(row.amount)}</span>
          <div className="admin-sales-bar" style={{ height: `${Math.max(4, (row.amount / max) * 100)}%` }} />
          <span className="admin-sales-label">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function StatusSummary({ stats }) {
  const rows = [
    ['Pending', stats?.pending_orders],
    ['Confirmed', stats?.confirmed_orders],
    ['Processing', stats?.processing_orders],
    ['Delivered', stats?.delivered_orders],
    ['Cancelled', stats?.cancelled_orders],
  ];
  return (
    <div className="admin-simple-list">
      {rows.map(([label, count]) => (
        <div className="admin-simple-row" key={label}>
          <strong>{label}</strong>
          <span>{count == null ? '—' : Number(count).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function PanelTitle({ title, action }) {
  return <div className="admin-panel-title"><h2>{title}</h2>{action}</div>;
}

function EmptyState({ message }) {
  return <div className="admin-empty-state">{message}</div>;
}

function Loading() {
  return <div className="admin-loading">Loading database records…</div>;
}

function humanize(val) {
  return String(val || '').replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function capitalize(val) {
  return String(val || '').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMoney(val) {
  const n = Number(val);
  return Number.isFinite(n) ? `Rs. ${n.toLocaleString('en-PK')}` : '—';
}

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString();
}

function downloadCsv(filename, rows) {
  if (!rows || !rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const csv = [cols.map(esc).join(','), ...rows.map((r) => cols.map((k) => esc(r[k])).join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
