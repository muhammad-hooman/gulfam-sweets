import { SITE_CONFIG } from '../config/siteConfig';

export const WHATSAPP_NUMBER = SITE_CONFIG.whatsappNumber;

export const getUnsplashUrl = (imgId) =>
  typeof imgId === 'string' && /^https?:\/\//i.test(imgId)
    ? imgId
    : `https://images.unsplash.com/photo-${imgId}?auto=format&fit=crop&w=800&q=75`;

export const getFallbackSvg = (title = 'Gulfam') =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="525"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6B0F1A"/><stop offset="1" stop-color="#45090F"/></linearGradient></defs><rect width="700" height="525" fill="url(#a)"/><text x="350" y="270" font-family="serif" font-size="38" fill="#D4A62A" text-anchor="middle">${String(
      title
    ).replace(/&/g, 'and')}</text></svg>`
  );

export const WEIGHT_UNITS = {
  kg: [
    ['500 g', 0.5],
    ['1 kg', 1],
    ['2 kg', 2],
  ],
  pc: [
    ['6 pcs', 0.5],
    ['12 pcs', 1],
    ['24 pcs', 2],
  ],
  lb: [
    ['1 lb', 1],
    ['2 lb', 1.95],
    ['3 lb', 2.9],
  ],
  box: [
    ['Small', 1],
    ['Medium', 1.8],
    ['Large', 3.2],
  ],
};

export const DEFAULT_WEIGHT_INDEX = {
  kg: 1,
  pc: 1,
  lb: 0,
  box: 0,
};

export const CATEGORIES = [
  {
    id: 'mithai',
    slug: 'mithai',
    path: '/mithai',
    n: 'Mithai',
    t: 'Traditional Mithai',
    w: 'kg',
    i: '1599599810769-bcde5a160d32',
    d: 'Gulab jamun, ras malai, kaju katli and laddu made in pure desi ghee.',
  },
  {
    id: 'nimco',
    slug: 'nimco',
    path: '/nimco',
    n: 'Nimco',
    t: 'Nimco',
    w: 'kg',
    i: '1601050690597-df0568f70950',
    d: 'Crunchy, spiced savoury mixes for tea time and gifting.',
  },
  {
    id: 'snacks',
    slug: 'fresh-snacks',
    path: '/fresh-snacks',
    n: 'Fresh Snacks',
    t: 'Fresh Snacks',
    w: 'pc',
    i: '1601050690117-94f5f6fa8bd7',
    d: 'Samosas, rolls and patties fried fresh every afternoon.',
  },
  {
    id: 'frozen',
    slug: 'frozen-foods',
    path: '/frozen-foods',
    n: 'Frozen Foods',
    t: 'Frozen Foods',
    w: 'pc',
    i: '1565557623262-b51c2513a641',
    d: 'Ready-to-fry frozen favourites, packed in insulated bags.',
  },
  {
    id: 'bakery',
    slug: 'bakery',
    path: '/bakery',
    n: 'Bakery',
    t: 'Bakery',
    w: 'kg',
    i: '1558961363-fa8fdf82db35',
    d: 'Nan khatai, cookies and rusk baked fresh every morning.',
  },
  {
    id: 'cakes',
    slug: 'cakes',
    path: '/cakes',
    n: 'Cakes',
    t: 'Cakes',
    w: 'lb',
    i: '1578985545062-69928b1d9587',
    d: 'Celebration cakes baked to order. Add a message in your notes.',
  },
  {
    id: 'wedding',
    slug: 'wedding-bulk',
    path: '/wedding-bulk',
    n: 'Wedding & Bulk',
    t: 'Wedding & Bulk',
    w: 'box',
    i: '1631452180519-c014fe946bc7',
    d: 'Mithai thaals, dry-fruit hampers and bulk packs for big occasions.',
  },
];

const rawProducts = [
  ['mithai', 'Shahi Gulab Jamun (Desi Ghee)', 'Soft khoya dumplings in cardamom syrup, fried in pure ghee.', 1800, 'Best Seller', '1666190092159-3171cf0fbb12', 'Pure Desi Ghee, Khoya, Green Cardamom, Saffron, Sugar Syrup', 'Store in a cool dry place. Best consumed warm within 4 days.'],
  ['mithai', 'Zafrani Ras Malai', 'Saffron milk with soft paneer discs and pistachio.', 2200, 'Chilled', '1606313564200-e75d5e30476c', 'Fresh Full Cream Milk, Organic Saffron, Pistachio, Paneer', 'Keep refrigerated at 2-4°C. Consume within 48 hours of delivery.'],
  ['mithai', 'Silver Leaf Kaju Katli', 'Diamond-cut cashew fudge finished with edible silver.', 3600, 'Premium', '1578985545062-69928b1d9587', 'Premium Goan Cashews, Fine Sugar, Pure Edible Silver Foil (Vark)', 'Store in an airtight container at room temperature for up to 10 days.'],
  ['mithai', 'Motichoor Laddu', 'Fine boondi pearls in ghee with saffron and nuts.', 1700, 'Festive', '1610192244261-3f33de3f55e4', 'Gram Flour (Besan), Desi Ghee, Saffron, Melon Seeds, Green Cardamom', 'Keep in a cool dry place. Consume within 7 days.'],

  ['nimco', 'Crispy Mix Nimco', 'Gathiya, sev and peanuts with our house spice blend.', 1200, 'Fresh Batch', '1601050690597-df0568f70950', 'Gram Flour, Roasted Peanuts, Curry Leaves, House Chaat Spices', 'Store in an airtight jar to preserve crunchiness for up to 30 days.'],
  ['nimco', 'Masala Daal Moth', 'Crunchy lentils tossed in tangy masala.', 1100, '', '1599490659213-e2b9527bd087', 'Moth Lentils, Chaat Masala, Red Chili, Roasted Cumin, Black Salt', 'Keep in dry pantry storage for up to 45 days.'],
  ['nimco', 'Chatpata Chana Daal', 'Roasted chana daal with lemon and chaat masala.', 1000, '', '1606491956689-2ea866880c84', 'Golden Bengal Gram, Lemon Salt, Amchur, Spices', 'Crispy snack ideal with afternoon chai.'],
  ['nimco', 'Aloo Bhujia', 'Thin potato sev, light and extra crisp.', 1150, 'Bestseller', '1630409351217-bc86ed6d1e7f', 'Crispy Potato Flour, Gram Flour, Mint, Cumin, Mild Chili', 'Airtight packaging ensures fresh crispiness for 1 month.'],

  ['snacks', 'Chicken Samosa (Fresh)', 'Crisp pastry with spiced chicken filling.', 720, 'Hot & Fresh', '1601050690117-94f5f6fa8bd7', 'Minced Chicken, Green Chilies, Coriander, Handcrafted Filo Pastry', 'Freshly fried daily. Consume hot within 4 hours.'],
  ['snacks', 'Beef Roll', 'Juicy seasoned beef wrapped in golden crust.', 900, '', '1565557623262-b51c2513a641', 'Prime Minced Beef, Ginger-Garlic, Crushed Coriander Seeds, Crisp Crust', 'Ready to eat fresh. Reheat in oven or air fryer if needed.'],
  ['snacks', 'Chicken Patties', 'Flaky layers with creamy chicken filling.', 850, 'Popular', '1606755962773-d324e0a13086', 'Multi-layered Puff Pastry, Shredded Chicken, White Sauce, Black Pepper', 'Bake-fresh every afternoon. Super flaky and buttery.'],
  ['snacks', 'Aloo Cutlet', 'Spiced potato cutlets, crumb-coated.', 600, 'Veg', '1626132647523-66f5bf380027', 'Mashed Red Potatoes, Fresh Herbs, Pomegranate Seeds, Golden Breadcrumbs', '100% vegetarian. Served with mint chutney.'],

  ['frozen', 'Chicken Spring Rolls (Frozen)', 'Ready-to-fry rolls, packed at -18 C.', 680, 'Frozen', '1544025162-d76694265947', 'Shredded Chicken, Cabbage, Spring Onions, Soy Seasoning, Spring Roll Pastry', 'Store in freezer at -18°C. Deep fry from frozen in hot oil for 4-5 mins.'],
  ['frozen', 'Seekh Kabab (Frozen)', 'Hand-minced kabab on skewers, just grill or fry.', 950, 'Frozen', '1529042410759-befb1204b468', 'Minced Beef, Brown Onions, Papaya Tenderizer, Raw Spices', 'Keep frozen. Shallow fry, air fry, or grill for 6-8 minutes until golden.'],
  ['frozen', 'Cheese Samosas (Frozen)', 'Mozzarella and cheddar in crisp pastry.', 780, 'Frozen', '1601050690117-94f5f6fa8bd7', 'Mozzarella, Aged Cheddar, Dried Oregano, Samosa Sheet', 'Deep fry on medium flame until golden brown and cheese melts.'],
  ['frozen', 'Crispy Nuggets (Frozen)', 'Golden chicken nuggets for quick meals.', 850, 'Frozen', '1562967914-608f82629710', 'Premium Chicken Breast, Crispy Tempura Crumb, Mild Spices', 'Kid-friendly favourite. Ready in 5 minutes in air fryer.'],

  ['bakery', 'Nan Khatai', 'Melt-in-mouth cardamom shortbread.', 1400, 'Signature', '1558961363-fa8fdf82db35', 'Clarified Butter, Gram Flour, Semolina, Crushed Cardamom, Almond Flakes', 'Heritage recipe since 1990. Keeps fresh in airtight tin for 20 days.'],
  ['bakery', 'Almond Cookies', 'Buttery cookies studded with almonds.', 1800, '', '1499636136210-6f4ee915583e', 'Pure Butter, Roasted California Almonds, Vanilla, Cane Sugar', 'Crunchy, rich, and perfect companion for tea.'],
  ['bakery', 'Fruit Cake Rusk', 'Twice-baked rusk with candied fruit.', 900, '', '1509440159596-0249088772ff', 'Twice-baked Sweet Sponge, Tutti Frutti, Cardamom Extract', 'Dip into hot milk tea (karak chai) for the ultimate morning breakfast.'],
  ['bakery', 'Dry Fruit Biscuits', 'Crunchy biscuits with pistachio and cashew.', 1600, 'Premium', '1590080875515-8a3a8dc5735e', 'Whole Wheat, Crushed Pistachios, Cashews, Desi Ghee', 'Nutrient-rich traditional bakery treat.'],

  ['cakes', 'Belgian Chocolate Fudge Cake', 'Layers of chocolate sponge with Belgian ganache.', 2499, 'Best Seller', '1578985545062-69928b1d9587', '54% Belgian Dark Chocolate Ganache, Rich Cocoa Sponge, Cream', 'Refrigerate. Bring to room temperature 20 minutes before serving.'],
  ['cakes', 'Signature Red Velvet Cake', 'Classic red velvet with cream cheese frosting.', 2699, '', '1586788680434-30d324b2d46f', 'Buttermilk Cocoa Sponge, Philadelphia Cream Cheese Frosting', 'Keep refrigerated. Soft, velvety, and balanced sweetness.'],
  ['cakes', 'German Black Forest Cake', 'Whipped cream, morello cherries and chocolate shavings.', 2399, '', '1578985545062-69928b1d9587', 'Fresh Dairy Cream, Glazed Dark Cherries, Dark Chocolate Flakes', 'Classic bakery favorite baked daily.'],
  ['cakes', 'Chaunsa Mango Gateau', 'Fresh chaunsa mango with light vanilla cream.', 2299, 'Seasonal', '1565958011703-44f9829ba187', 'Pure Pakistani Chaunsa Mango Puree, Light Vanilla Chiffon, Cream', 'Seasonal summer specialty made with fresh fruit chunks.'],

  ['wedding', 'Wedding Mithai Box Set', 'Assorted mithai in a gold-foil gift box.', 4500, 'Wedding', '1631452180519-c014fe946bc7', 'Gulab Jamun, Kaju Katli, Motichoor Laddu, Dry Fruit Pera, Cham Cham', 'Luxury rigid gift box embossed with gold foil ribbon. Perfect for Baraat & Valima.'],
  ['wedding', 'Dry Fruit Hamper', 'Almonds, pistachios, cashews and dates in a keepsake box.', 6500, 'Gifting', '1599599810769-bcde5a160d32', 'Imported Jumbo Almonds, Roasted Pistachios, Premium Cashews, Medjool Dates', 'A timeless gift for festive Eid, family milestones, and executive corporate gifting.'],
  ['wedding', 'Mehndi Thaal Assortment', 'Decorated thaal with mithai, nimco and fruit.', 8500, 'Mehndi', '1589301760014-d929f3979dbc', 'Handmade ceremonial steel thaal dressed with festive gota work, fresh sweets, and nimco', 'Traditional celebratory presentation ready for mehndi entry.'],
  ['wedding', 'Barat Bulk Mithai Pack', 'Bulk mithai tubs for large gatherings. Free delivery.', 17000, 'Bulk', '1666190092159-3171cf0fbb12', '10 kg Assorted Royal Mithai packed in hygienic temperature-safe insulated tubs', 'Includes free event delivery and on-site distribution coordination in Karachi.'],
];

export const PRODUCTS = rawProducts.map((a, k) => {
  const cat = CATEGORIES.find((c) => c.id === a[0]);
  return {
    id: k + 1,
    c: a[0],
    n: a[1],
    d: a[2],
    p: a[3],
    tag: a[4],
    i: a[5],
    w: cat ? cat.w : 'kg',
    ingredients: a[6] || 'Pure and natural authentic ingredients.',
    shelfLife: a[7] || 'Best enjoyed fresh.',
    inStock: true,
    sku: `GS-${a[0].toUpperCase().slice(0, 3)}-${String(k + 1).padStart(2, '0')}`,
  };
});

export const getCategory = (catIdOrSlug) =>
  CATEGORIES.find((c) => c.id === catIdOrSlug || c.slug === catIdOrSlug);

export const getProductById = (id) =>
  PRODUCTS.find((p) => p.id === Number(id));

export const getRelatedProducts = (product, limit = 4) => {
  if (!product) return [];
  return PRODUCTS.filter(
    (p) => p.c === product.c && p.id !== product.id
  ).slice(0, limit);
};

export const formatPrice = (num) =>
  'Rs. ' + Math.round(num || 0).toLocaleString();

export const getDefaultWeightIndex = (product) => {
  if (!product) return 0;
  const weights = getProductWeights(product);
  if (!weights || weights.length === 0) return 0;
  const preferred = DEFAULT_WEIGHT_INDEX[product.w] ?? 0;
  return preferred < weights.length ? preferred : 0;
};

export const getProductWeights = (product) => {
  if (!product) return [['Standard', 1]];
  if (product.variants?.length) {
    const list = product.variants
      .filter(Boolean)
      .map((variant) => [
        (variant.name && variant.name.trim()) ||
          `${variant.weight_value || ''} ${variant.weight_unit || ''}`.trim() ||
          'Standard',
        1,
      ]);
    if (list.length > 0) return list;
  }
  const units = WEIGHT_UNITS[product.w];
  if (units && units.length > 0) return units;
  return [['Standard', 1]];
};

export const calcPrice = (product, weightIndex = 0) => {
  if (!product) return 0;
  const fallbackBase = Number(product.salePrice ?? product.p ?? product.base_price ?? 0);
  if (product.variants?.length) {
    const safeIdx = typeof weightIndex === 'number' && product.variants[weightIndex] ? weightIndex : 0;
    const variant = product.variants[safeIdx];
    if (variant) {
      const p = variant.sale_price ?? variant.price ?? fallbackBase;
      return Math.round(Number(p || fallbackBase));
    }
  }
  const unitList = WEIGHT_UNITS[product.w];
  if (!unitList || !unitList.length) return Math.round(fallbackBase);
  const safeIdx = typeof weightIndex === 'number' && unitList[weightIndex] ? weightIndex : 0;
  const factor = unitList[safeIdx]?.[1] ?? 1;
  return Math.round(fallbackBase * factor);
};

export const getRating = (productId) => {
  const r = 4 + ((productId * 7) % 10) / 10;
  const count = 12 + ((productId * 17) % 90);
  return {
    stars: Math.round(r),
    count,
  };
};

export const FEATURES = [
  ['Fast & Chilled Delivery', 'Fresh and frozen, carefully packed'],
  ['100% Pure Desi Ghee', 'No refined oils, ever'],
  ['Fresh Daily Batch', 'Made every morning'],
  ['Halal & Quality Checked', 'Hygienic kitchen standards'],
];

export const TESTIMONIALS = [
  ['Ayesha K.', 'The gulab jamuns taste exactly like my nani made. We order every Eid.'],
  ['Bilal R.', 'Frozen samosas arrive perfectly packed and fry up crisp. Great value.'],
  ['Sana M.', 'Ordered wedding boxes for 200 guests. Beautiful packing and everyone asked where they were from.'],
];

export const STATS = [
  ['1990', 'Serving since'],
  ['7', 'Product categories'],
  ['50,000+', 'Happy customers'],
  ['100%', 'Pure desi ghee'],
];

export const MISSION = [
  ['Our mission', 'Make every celebration sweeter with honest, handmade mithai and dairy.'],
  ['Quality promise', 'Pure desi ghee, fresh milk, no artificial colours or preservatives.'],
  ['Our people', 'Master halwais with 20+ years of experience, backed by a caring team.'],
];
