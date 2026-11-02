import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getUnsplashUrl } from '../data/products';

// Canonical default media registry across the entire Gulfam Sweets website
export const DEFAULT_SITE_MEDIA = [
  // 1. Homepage
  {
    id: 'def-1',
    media_key: 'home_hero_circle_video',
    title: 'Homepage Golden Ring Hero Video',
    media_type: 'video',
    url: '/videos/gulfam-commercial.mp4',
    poster_url: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80',
    mobile_url: '',
    file_name: 'gulfam-commercial.mp4',
    file_size: '11.0 MB',
    dimensions: '1920x1080 (1080p)',
    page: 'home',
    section: 'Hero Section',
    location_path: 'Homepage → Hero Section → Golden Ring Circular Video',
    description: 'Main commercial video rotating smoothly inside the golden ring on the homepage.',
    is_active: true,
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
    view_url: '/',
  },
  {
    id: 'def-2',
    media_key: 'home_cat_mithai',
    title: 'Homepage Category Circle - Mithai',
    media_type: 'image',
    url: getUnsplashUrl('1599599810769-bcde5a160d32'),
    poster_url: '',
    mobile_url: '',
    file_name: 'cat-mithai.jpg',
    file_size: '180 KB',
    dimensions: '800x800',
    page: 'home',
    section: 'Shop by Category',
    location_path: 'Homepage → Shop by Category → Mithai Circle',
    description: 'Circular category thumbnail image for Traditional Mithai department.',
    is_active: true,
    autoplay: false,
    loop: false,
    muted: true,
    controls: false,
    view_url: '/mithai',
  },
  {
    id: 'def-3',
    media_key: 'home_cat_nimco',
    title: 'Homepage Category Circle - Nimco',
    media_type: 'image',
    url: getUnsplashUrl('1601050690597-df0568f70950'),
    poster_url: '',
    mobile_url: '',
    file_name: 'cat-nimco.jpg',
    file_size: '210 KB',
    dimensions: '800x800',
    page: 'home',
    section: 'Shop by Category',
    location_path: 'Homepage → Shop by Category → Nimco Circle',
    description: 'Circular category thumbnail image for Nimco & Savoury department.',
    is_active: true,
    autoplay: false,
    loop: false,
    muted: true,
    controls: false,
    view_url: '/nimco',
  },
  {
    id: 'def-4',
    media_key: 'home_cat_snacks',
    title: 'Homepage Category Circle - Fresh Snacks',
    media_type: 'image',
    url: getUnsplashUrl('1601050690117-94f5f6fa8bd7'),
    poster_url: '',
    mobile_url: '',
    file_name: 'cat-snacks.jpg',
    file_size: '195 KB',
    dimensions: '800x800',
    page: 'home',
    section: 'Shop by Category',
    location_path: 'Homepage → Shop by Category → Fresh Snacks Circle',
    description: 'Circular category thumbnail image for Fresh Snacks department.',
    is_active: true,
    autoplay: false,
    loop: false,
    muted: true,
    controls: false,
    view_url: '/fresh-snacks',
  },
  {
    id: 'def-5',
    media_key: 'home_cat_frozen',
    title: 'Homepage Category Circle - Frozen Foods',
    media_type: 'image',
    url: getUnsplashUrl('1565557623262-b51c2513a641'),
    poster_url: '',
    mobile_url: '',
    file_name: 'cat-frozen.jpg',
    file_size: '175 KB',
    dimensions: '800x800',
    page: 'home',
    section: 'Shop by Category',
    location_path: 'Homepage → Shop by Category → Frozen Foods Circle',
    description: 'Circular category thumbnail image for Frozen Foods department.',
    is_active: true,
    autoplay: false,
    loop: false,
    muted: true,
    controls: false,
    view_url: '/frozen-foods',
  },
  {
    id: 'def-6',
    media_key: 'home_cat_bakery',
    title: 'Homepage Category Circle - Bakery',
    media_type: 'image',
    url: getUnsplashUrl('1509440159596-0249088772ff'),
    poster_url: '',
    mobile_url: '',
    file_name: 'cat-bakery.jpg',
    file_size: '220 KB',
    dimensions: '800x800',
    page: 'home',
    section: 'Shop by Category',
    location_path: 'Homepage → Shop by Category → Bakery Circle',
    description: 'Circular category thumbnail image for Bakery department.',
    is_active: true,
    autoplay: false,
    loop: false,
    muted: true,
    controls: false,
    view_url: '/bakery',
  },
  {
    id: 'def-7',
    media_key: 'home_cat_cakes',
    title: 'Homepage Category Circle - Cakes',
    media_type: 'image',
    url: getUnsplashUrl('1578985545062-69928b1d9587'),
    poster_url: '',
    mobile_url: '',
    file_name: 'cat-cakes.jpg',
    file_size: '240 KB',
    dimensions: '800x800',
    page: 'home',
    section: 'Shop by Category',
    location_path: 'Homepage → Shop by Category → Cakes Circle',
    description: 'Circular category thumbnail image for Cakes & Desserts department.',
    is_active: true,
    autoplay: false,
    loop: false,
    muted: true,
    controls: false,
    view_url: '/cakes',
  },
  {
    id: 'def-8',
    media_key: 'home_cat_wedding',
    title: 'Homepage Category Circle - Wedding & Bulk',
    media_type: 'image',
    url: getUnsplashUrl('1519225421980-715cb0215aed'),
    poster_url: '',
    mobile_url: '',
    file_name: 'cat-wedding.jpg',
    file_size: '230 KB',
    dimensions: '800x800',
    page: 'home',
    section: 'Shop by Category',
    location_path: 'Homepage → Shop by Category → Wedding & Bulk Circle',
    description: 'Circular category thumbnail image for Wedding & Bulk Orders.',
    is_active: true,
    autoplay: false,
    loop: false,
    muted: true,
    controls: false,
    view_url: '/wedding-bulk',
  },

  // 2. Department Category Hero Videos
  {
    id: 'def-9',
    media_key: 'mithai_hero_video',
    title: 'Mithai Page Hero Background Video',
    media_type: 'video',
    url: '/videos/mithai-food-video.mp4',
    poster_url: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=1600&q=80',
    mobile_url: '',
    file_name: 'mithai-food-video.mp4',
    file_size: '9.1 MB',
    dimensions: '1920x1080 (1080p)',
    page: 'mithai',
    section: 'Hero Banner',
    location_path: 'Mithai Page → Hero Banner → Background Ambient Video',
    description: 'Ambient royal background video for the Mithai department header.',
    is_active: true,
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
    view_url: '/mithai',
  },
  {
    id: 'def-10',
    media_key: 'nimco_hero_video',
    title: 'Nimco Page Hero Background Video',
    media_type: 'video',
    url: '/videos/nimco-food-video.mp4',
    poster_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1600&q=80',
    mobile_url: '',
    file_name: 'nimco-food-video.mp4',
    file_size: '10.7 MB',
    dimensions: '1920x1080 (1080p)',
    page: 'nimco',
    section: 'Hero Banner',
    location_path: 'Nimco Page → Hero Banner → Background Ambient Video',
    description: 'Crisp savoury snacks background video for the Nimco header.',
    is_active: true,
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
    view_url: '/nimco',
  },
  {
    id: 'def-11',
    media_key: 'fresh_snacks_hero_video',
    title: 'Fresh Snacks Page Hero Background Video',
    media_type: 'video',
    url: '/videos/fresh-snacks-video.mp4',
    poster_url: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1600&q=80',
    mobile_url: '',
    file_name: 'fresh-snacks-video.mp4',
    file_size: '11.3 MB',
    dimensions: '1920x1080 (1080p)',
    page: 'fresh-snacks',
    section: 'Hero Banner',
    location_path: 'Fresh Snacks Page → Hero Banner → Background Ambient Video',
    description: 'Tea-time savoury presentation video for the Fresh Snacks header.',
    is_active: true,
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
    view_url: '/fresh-snacks',
  },
  {
    id: 'def-12',
    media_key: 'frozen_foods_hero_video',
    title: 'Frozen Foods Page Hero Background Video',
    media_type: 'video',
    url: '/videos/frozen-foods-video.mp4',
    poster_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1600&q=80',
    mobile_url: '',
    file_name: 'frozen-foods-video.mp4',
    file_size: '15.9 MB',
    dimensions: '1920x1080 (1080p)',
    page: 'frozen-foods',
    section: 'Hero Banner',
    location_path: 'Frozen Foods Page → Hero Banner → Background Ambient Video',
    description: 'Rotating platter ambient background video for the Frozen Foods header.',
    is_active: true,
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
    view_url: '/frozen-foods',
  },
  {
    id: 'def-13',
    media_key: 'bakery_hero_video',
    title: 'Bakery Page Hero Background Video',
    media_type: 'video',
    url: '/videos/bakery-video.mp4',
    poster_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80',
    mobile_url: '',
    file_name: 'bakery-video.mp4',
    file_size: '12.1 MB',
    dimensions: '1920x1080 (1080p)',
    page: 'bakery',
    section: 'Hero Banner',
    location_path: 'Bakery Page → Hero Banner → Background Ambient Video',
    description: 'Rotating bakery delicacies background video for the Bakery header.',
    is_active: true,
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
    view_url: '/bakery',
  },
  {
    id: 'def-14',
    media_key: 'cakes_hero_video',
    title: 'Cakes & Desserts Page Hero Background Video',
    media_type: 'video',
    url: '/videos/cakes-video.mp4',
    poster_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80',
    mobile_url: '',
    file_name: 'cakes-video.mp4',
    file_size: '11.6 MB',
    dimensions: '1920x1080 (1080p)',
    page: 'cakes',
    section: 'Hero Banner',
    location_path: 'Cakes Page → Hero Banner → Background Ambient Video',
    description: 'Rotating chocolate cake background video for Cakes & Desserts header.',
    is_active: true,
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
    view_url: '/cakes',
  },
  {
    id: 'def-15',
    media_key: 'wedding_hero_video',
    title: 'Wedding & Bulk Orders Page Hero Background Video',
    media_type: 'video',
    url: '/videos/wedding-video.mp4',
    poster_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80',
    mobile_url: '',
    file_name: 'wedding-video.mp4',
    file_size: '14.0 MB',
    dimensions: '1920x1080 (1080p)',
    page: 'wedding',
    section: 'Hero Banner',
    location_path: 'Wedding Page → Hero Banner → Background Ambient Video',
    description: 'Grand royal wedding cake background video for Wedding & Bulk Orders header.',
    is_active: true,
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
    view_url: '/wedding-bulk',
  },

  // 3. About Us Page
  {
    id: 'def-16',
    media_key: 'about_story_image',
    title: 'About Us Heritage Story Image',
    media_type: 'image',
    url: getUnsplashUrl('1567337710282-00832b415979'),
    poster_url: '',
    mobile_url: '',
    file_name: 'about-story.jpg',
    file_size: '320 KB',
    dimensions: '1200x800',
    page: 'about',
    section: 'Story Section',
    location_path: 'About Us Page → Story Section → Handcrafted Since 1990 Image',
    description: 'Primary visual in the About Us story describing 30+ years of confection history.',
    is_active: true,
    autoplay: false,
    loop: false,
    muted: true,
    controls: false,
    view_url: '/about',
  },
  {
    id: 'def-17',
    media_key: 'about_kitchen_image',
    title: 'About Us Master Kitchen Heritage Image',
    media_type: 'image',
    url: getUnsplashUrl('1589301760014-d929f3979dbc'),
    poster_url: '',
    mobile_url: '',
    file_name: 'about-kitchen.jpg',
    file_size: '310 KB',
    dimensions: '1200x800',
    page: 'about',
    section: 'Heritage Section',
    location_path: 'About Us Page → Heritage Section → Master Halwai & Pure Ghee Kitchen',
    description: 'Behind-the-counter master halwai craftsmanship visual.',
    is_active: true,
    autoplay: false,
    loop: false,
    muted: true,
    controls: false,
    view_url: '/about',
  },
];

const LOCAL_STORAGE_KEY = 'gulfam_site_media_overrides_v1';

const SiteMediaContext = createContext(null);

export function SiteMediaProvider({ children }) {
  const [mediaList, setMediaList] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const overrides = JSON.parse(stored);
        return DEFAULT_SITE_MEDIA.map((item) => {
          const match = overrides[item.media_key];
          return match ? { ...item, ...match } : item;
        });
      }
    } catch {
      // ignore
    }
    return DEFAULT_SITE_MEDIA;
  });

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch live media from Supabase on mount
  const fetchMedia = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: sbError } = await supabase
        .from('site_media')
        .select('*')
        .order('created_at', { ascending: true });

      if (sbError) {
        // Table might not be migrated yet; fallback gracefully
        console.warn('site_media table lookup failed (falling back to defaults):', sbError.message);
        return;
      }

      if (data && data.length > 0) {
        const dbMap = new Map(data.map((item) => [item.media_key, item]));

        // Merge DB data onto defaults, plus any custom user entries
        const merged = DEFAULT_SITE_MEDIA.map((def) => {
          const dbItem = dbMap.get(def.media_key);
          if (dbItem) {
            dbMap.delete(def.media_key);
            return {
              ...def,
              ...dbItem,
              // Normalize nulls
              poster_url: dbItem.poster_url || def.poster_url,
              mobile_url: dbItem.mobile_url || '',
            };
          }
          return def;
        });

        // Add any additional items created dynamically in Supabase
        dbMap.forEach((extraItem) => {
          merged.push(extraItem);
        });

        setMediaList(merged);
      }
    } catch (err) {
      console.error('Error fetching site media:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Fast lookup map
  const mediaMap = useMemo(() => {
    const map = new Map();
    mediaList.forEach((item) => {
      map.set(item.media_key, item);
    });
    return map;
  }, [mediaList]);

  // Public getter for images
  const getMedia = useCallback(
    (key, fallbackUrl = '') => {
      const item = mediaMap.get(key);
      if (!item) {
        return {
          url: fallbackUrl,
          posterUrl: '',
          mobileUrl: '',
          title: key,
          alt: key,
          isVideo: false,
          autoplay: false,
          loop: false,
          muted: true,
          controls: false,
        };
      }

      return {
        ...item,
        url: item.url || fallbackUrl,
        posterUrl: item.poster_url || '',
        mobileUrl: item.mobile_url || '',
        title: item.title || '',
        alt: item.title || '',
        isVideo: item.media_type === 'video',
      };
    },
    [mediaMap]
  );

  // Public getter for videos
  const getVideoProps = useCallback(
    (key, defaults = {}) => {
      const item = mediaMap.get(key);
      if (!item) {
        return {
          src: defaults.src || '',
          poster: defaults.poster || '',
          autoPlay: defaults.autoPlay ?? true,
          loop: defaults.loop ?? true,
          muted: defaults.muted ?? true,
          playsInline: true,
          preload: 'auto',
          controls: defaults.controls ?? false,
          title: defaults.title || '',
        };
      }

      return {
        src: item.url || defaults.src || '',
        poster: item.poster_url || defaults.poster || '',
        autoPlay: item.autoplay ?? true,
        loop: item.loop ?? true,
        muted: item.muted ?? true,
        playsInline: true,
        preload: 'auto',
        controls: item.controls ?? false,
        title: item.title || defaults.title || '',
        mobileSrc: item.mobile_url || '',
      };
    },
    [mediaMap]
  );

  // Upload a file to Supabase Storage
  const uploadMediaFile = useCallback(async (file, folder = 'general') => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please connect Supabase to upload files.');
    }

    if (!file) throw new Error('No file provided for upload.');

    // Clean file name
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${folder}/${timestamp}_${cleanName}`;

    // Bucket preference: try 'site-media' first, then 'banner-images' or 'product-images'
    let bucket = 'site-media';
    let uploadRes = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadRes.error && uploadRes.error.message?.includes('bucket not found')) {
      bucket = 'banner-images';
      uploadRes = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
    }

    if (uploadRes.error) {
      throw new Error(`Upload failed: ${uploadRes.error.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      throw new Error('Failed to resolve public URL for uploaded file.');
    }

    // Format file size
    const sizeInKb = (file.size / 1024).toFixed(0);
    const sizeFormatted = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeInKb} KB`;

    return {
      publicUrl,
      fileName: file.name,
      fileSize: sizeFormatted,
      fileType: file.type.startsWith('video') ? 'video' : 'image',
      storagePath: path,
      bucket,
    };
  }, []);

  // Update a media record both locally and in Supabase
  const updateMedia = useCallback(
    async (key, updates) => {
      setIsUpdating(true);
      setError(null);

      // Local optimistic update
      setMediaList((prev) => {
        const next = prev.map((item) => (item.media_key === key ? { ...item, ...updates, updated_at: new Date().toISOString() } : item));
        try {
          const overrides = {};
          next.forEach((item) => {
            overrides[item.media_key] = item;
          });
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(overrides));
        } catch {
          // ignore
        }
        return next;
      });

      // Remote update if Supabase is connected
      if (isSupabaseConfigured && supabase) {
        try {
          const payload = {
            media_key: key,
            ...updates,
            updated_at: new Date().toISOString(),
          };

          const { error: upsertErr } = await supabase
            .from('site_media')
            .upsert(payload, { onConflict: 'media_key' });

          if (upsertErr) {
            console.warn('Could not save to site_media table, falling back to store_settings:', upsertErr.message);
            // Save to store_settings as backup
            await supabase.from('store_settings').upsert({
              key: `media_${key}`,
              value: payload,
              updated_at: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('Failed to sync media with database:', err);
        }
      }

      setIsUpdating(false);
      return true;
    },
    []
  );

  // Restore to canonical default
  const restoreDefault = useCallback(
    async (key) => {
      const defaultItem = DEFAULT_SITE_MEDIA.find((d) => d.media_key === key);
      if (!defaultItem) return false;

      return updateMedia(key, {
        url: defaultItem.url,
        poster_url: defaultItem.poster_url,
        mobile_url: defaultItem.mobile_url,
        file_name: defaultItem.file_name,
        file_size: defaultItem.file_size,
        dimensions: defaultItem.dimensions,
        autoplay: defaultItem.autoplay,
        loop: defaultItem.loop,
        muted: defaultItem.muted,
        controls: defaultItem.controls,
      });
    },
    [updateMedia]
  );

  // Safe delete
  const deleteMedia = useCallback(
    async (key) => {
      const item = mediaMap.get(key);
      if (!item) return;

      // Soft delete: deactivate
      return updateMedia(key, { is_active: false });
    },
    [mediaMap, updateMedia]
  );

  const value = {
    allMedia: mediaList,
    getMedia,
    getVideoProps,
    updateMedia,
    uploadMediaFile,
    restoreDefault,
    deleteMedia,
    refreshMedia: fetchMedia,
    loading,
    isUpdating,
    error,
  };

  return <SiteMediaContext.Provider value={value}>{children}</SiteMediaContext.Provider>;
}

export function useSiteMedia() {
  const ctx = useContext(SiteMediaContext);
  if (!ctx) {
    // Return a safe fallback if accessed outside provider
    return {
      allMedia: DEFAULT_SITE_MEDIA,
      getMedia: (key, fallback) => ({ url: fallback, posterUrl: '', isVideo: false }),
      getVideoProps: (key, defaults) => ({
        src: defaults.src || '',
        poster: defaults.poster || '',
        autoPlay: true,
        loop: true,
        muted: true,
        playsInline: true,
        preload: 'auto',
      }),
      updateMedia: async () => {},
      uploadMediaFile: async () => {},
      restoreDefault: async () => {},
      deleteMedia: async () => {},
      refreshMedia: () => {},
      loading: false,
      isUpdating: false,
      error: null,
    };
  }
  return ctx;
}

