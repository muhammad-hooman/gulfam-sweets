import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSiteMedia } from '../../context/SiteMediaContext';
import { useCatalog } from '../../context/CatalogContext';
import { getUnsplashUrl } from '../../data/products';

export default function MediaLibraryPage() {
  const {
    allMedia,
    updateMedia,
    uploadMediaFile,
    restoreDefault,
    deleteMedia,
    refreshMedia,
    isUpdating,
    loading,
  } = useSiteMedia();

  const { products: catalogProducts } = useCatalog();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, video, image
  const [pageFilter, setPageFilter] = useState('all'); // all, home, mithai, nimco, snacks, frozen, bakery, cakes, wedding, about, products
  const [viewMode, setViewMode] = useState('grid'); // grid, table

  // Modals state
  const [activeMediaForReplace, setActiveMediaForReplace] = useState(null);
  const [activeMediaForPreview, setActiveMediaForPreview] = useState(null);
  const [deleteWarningMedia, setDeleteWarningMedia] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [statusToast, setStatusToast] = useState('');

  const triggerToast = (msg) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(''), 3000);
  };

  // Combine site media + catalog product images for total discovery
  const combinedMedia = useMemo(() => {
    const list = [...allMedia];

    // Include product media items so admins can see & locate product images
    if (pageFilter === 'all' || pageFilter === 'products') {
      catalogProducts.slice(0, 40).forEach((prod) => {
        const imgUrl = prod.image_url || getUnsplashUrl(prod.i);
        list.push({
          id: `prod-${prod.id}`,
          media_key: `product_${prod.id}`,
          title: `Product: ${prod.n || prod.name}`,
          media_type: 'image',
          url: imgUrl,
          poster_url: '',
          file_name: `${prod.slug || 'product'}.jpg`,
          file_size: '220 KB',
          dimensions: '800x600',
          page: 'products',
          section: 'Product Catalog',
          location_path: `Shop / Category → Product Card & Details → ${prod.n || prod.name}`,
          description: `Main thumbnail and showcase photo for ${prod.n || prod.name}.`,
          is_active: true,
          view_url: `/product/${prod.id}`,
          isProduct: true,
          productId: prod.id,
        });
      });
    }

    return list;
  }, [allMedia, catalogProducts, pageFilter]);

  // Filtered Media
  const filteredMedia = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return combinedMedia.filter((item) => {
      const matchType = typeFilter === 'all' || item.media_type === typeFilter;
      const matchPage = pageFilter === 'all' || item.page === pageFilter;
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.media_key.toLowerCase().includes(q) ||
        item.location_path.toLowerCase().includes(q) ||
        (item.file_name && item.file_name.toLowerCase().includes(q));

      return matchType && matchPage && matchQuery;
    });
  }, [combinedMedia, searchQuery, typeFilter, pageFilter]);

  // Statistics
  const stats = useMemo(() => {
    const videos = allMedia.filter((m) => m.media_type === 'video').length;
    const images = allMedia.filter((m) => m.media_type === 'image').length;
    const total = allMedia.length;
    return { total, videos, images };
  }, [allMedia]);

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed top-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-amber-400/40 flex items-center gap-3 animate-slideIn">
          <span className="text-amber-400">✓</span>
          <span className="text-sm font-medium">{statusToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#4A0E17] via-[#5C131D] to-[#3B080E] text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-amber-300 border border-amber-400/30 mb-2">
              <span>✦</span> Media Management System
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Website Media Library
            </h1>
            <p className="text-amber-100/80 text-sm mt-1 max-w-2xl">
              Inspect, preview, replace, and upload every single image and video across the Gulfam Sweets website in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/website-media"
              className="btn bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm !py-2.5 !px-4 rounded-xl backdrop-blur-sm transition-all"
            >
              <span>✦</span> Open Section Editor
            </Link>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs sm:text-sm !py-2.5 !px-5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <span className="text-base font-extrabold">+</span> Upload Media
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <p className="text-[11px] text-amber-200/70 font-medium uppercase tracking-wider">Total Managed Media</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <p className="text-[11px] text-amber-200/70 font-medium uppercase tracking-wider">Active 1080p Videos</p>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">{stats.videos}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <p className="text-[11px] text-amber-200/70 font-medium uppercase tracking-wider">Website Photos &amp; Icons</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.images}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <p className="text-[11px] text-amber-200/70 font-medium uppercase tracking-wider">Supabase Storage</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">Online</p>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            🔍
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media by title, page, section or file name..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Media Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs sm:text-sm py-2.5 px-3 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-700 cursor-pointer"
          >
            <option value="all">All Media Types</option>
            <option value="video">🎬 Videos Only</option>
            <option value="image">🖼️ Images Only</option>
          </select>

          {/* Page Filter */}
          <select
            value={pageFilter}
            onChange={(e) => setPageFilter(e.target.value)}
            className="text-xs sm:text-sm py-2.5 px-3 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-700 cursor-pointer"
          >
            <option value="all">All Website Pages</option>
            <option value="home">Homepage</option>
            <option value="mithai">Mithai Page</option>
            <option value="nimco">Nimco Page</option>
            <option value="fresh-snacks">Fresh Snacks Page</option>
            <option value="frozen-foods">Frozen Foods Page</option>
            <option value="bakery">Bakery Page</option>
            <option value="cakes">Cakes Page</option>
            <option value="wedding">Wedding &amp; Bulk</option>
            <option value="about">About Us Page</option>
            <option value="products">Product Catalog (Shop)</option>
          </select>

          {/* View Toggle */}
          <div className="flex border border-stone-200 rounded-xl overflow-hidden bg-stone-50 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white shadow text-stone-900'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Grid View"
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white shadow text-stone-900'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Table View"
            >
              ☰ Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Media Grid / Table */}
      {filteredMedia.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 grid place-items-center text-3xl mb-3">
            📁
          </div>
          <h3 className="font-display text-lg font-bold text-stone-800">No media items matched</h3>
          <p className="text-sm text-stone-500 mt-1">Try adjusting your search terms or filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('all');
              setPageFilter('all');
            }}
            className="btn btn-o mt-4 text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((media) => (
            <MediaCard
              key={media.id || media.media_key}
              media={media}
              onPreview={() => setActiveMediaForPreview(media)}
              onReplace={() => setActiveMediaForReplace(media)}
              onRestore={() => {
                restoreDefault(media.media_key);
                triggerToast(`Restored default for ${media.title}`);
              }}
              onDelete={() => setDeleteWarningMedia(media)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Media Title &amp; File</th>
                  <th className="py-3 px-4">Type &amp; Dimensions</th>
                  <th className="py-3 px-4">Website Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMedia.map((media) => (
                  <tr key={media.id || media.media_key} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 w-24">
                      <div
                        onClick={() => setActiveMediaForPreview(media)}
                        className="w-16 h-12 rounded-lg overflow-hidden bg-stone-900 border border-stone-200 cursor-pointer relative group shrink-0"
                      >
                        {media.media_type === 'video' ? (
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={media.url}
                            alt={media.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white text-xs">
                          👁️
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-stone-900 leading-tight">{media.title}</p>
                      <p className="text-xs text-stone-500 font-mono mt-0.5 truncate max-w-xs">
                        {media.file_name || media.media_key}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          media.media_type === 'video'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {media.media_type}
                      </span>
                      <p className="text-xs text-stone-500 mt-1">
                        {media.dimensions || 'Standard'} &bull; {media.file_size || 'N/A'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-stone-600 block leading-snug">
                        {media.location_path}
                      </span>
                      {media.view_url && (
                        <Link
                          to={media.view_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1 mt-0.5"
                        >
                          View on website ↗
                        </Link>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setActiveMediaForReplace(media)}
                        className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold rounded-lg transition-colors mr-2"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => setActiveMediaForPreview(media)}
                        className="px-3 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Replace Media Modal */}
      {activeMediaForReplace && (
        <ReplaceMediaModal
          media={activeMediaForReplace}
          onClose={() => setActiveMediaForReplace(null)}
          onSuccess={(msg) => {
            setActiveMediaForReplace(null);
            triggerToast(msg || 'Media updated and published to live website!');
          }}
          uploadMediaFile={uploadMediaFile}
          updateMedia={updateMedia}
        />
      )}

      {/* Media Preview Modal */}
      {activeMediaForPreview && (
        <MediaPreviewModal
          media={activeMediaForPreview}
          onClose={() => setActiveMediaForPreview(null)}
          onReplace={() => {
            const m = activeMediaForPreview;
            setActiveMediaForPreview(null);
            setActiveMediaForReplace(m);
          }}
        />
      )}

      {/* Delete / Unset Warning Modal */}
      {deleteWarningMedia && (
        <SafeDeleteModal
          media={deleteWarningMedia}
          onClose={() => setDeleteWarningMedia(null)}
          onConfirm={() => {
            deleteMedia(deleteWarningMedia.media_key);
            setDeleteWarningMedia(null);
            triggerToast(`Archived media for ${deleteWarningMedia.title}`);
          }}
        />
      )}

      {/* Generic Upload Modal */}
      {showUploadModal && (
        <DirectUploadModal
          onClose={() => setShowUploadModal(false)}
          onUploaded={(data) => {
            setShowUploadModal(false);
            triggerToast(`File uploaded successfully to ${data.bucket}`);
          }}
          uploadMediaFile={uploadMediaFile}
        />
      )}
    </div>
  );
}

// Media Card Component for Grid View
function MediaCard({ media, onPreview, onReplace, onRestore, onDelete }) {
  const isVideo = media.media_type === 'video';

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-stone-200 overflow-hidden flex flex-col group">
      {/* Media Visual Container */}
      <div
        onClick={onPreview}
        className="relative aspect-video bg-stone-950 overflow-hidden cursor-pointer flex items-center justify-center border-b border-stone-100"
      >
        {isVideo ? (
          <video
            src={media.url}
            poster={media.poster_url}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={media.url}
            alt={media.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Badge & Overlay */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow ${
              isVideo
                ? 'bg-purple-900/90 text-purple-200 border border-purple-400/30'
                : 'bg-emerald-900/90 text-emerald-200 border border-emerald-400/30'
            }`}
          >
            {isVideo ? '🎬 1080p Video' : '🖼️ Image'}
          </span>
        </div>

        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="bg-white/90 hover:bg-white text-stone-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
            Quick Preview
          </span>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-stone-900 text-sm line-clamp-1 leading-snug">
            {media.title}
          </h4>

          {/* Location Mapping Pill */}
          <div className="mt-2 p-2 bg-amber-50/70 rounded-xl border border-amber-200/50">
            <p className="text-[10px] font-semibold text-amber-900/80 uppercase tracking-wider">
              Used On Website
            </p>
            <p className="text-xs text-stone-700 font-medium leading-tight mt-0.5 line-clamp-2">
              {media.location_path}
            </p>
            {media.view_url && (
              <Link
                to={media.view_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 mt-1.5"
              >
                View live on page ↗
              </Link>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500">
            <span>Size: {media.file_size || 'HD'}</span>
            <span>Dim: {media.dimensions || 'Responsive'}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <button
            onClick={onReplace}
            className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Replace
          </button>
          <button
            onClick={onPreview}
            className="py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-all"
            title="Inspect"
          >
            Inspect
          </button>
          {!media.isProduct && (
            <button
              onClick={onRestore}
              className="py-1.5 px-2 text-stone-400 hover:text-amber-700 text-xs transition-colors"
              title="Reset to default brand video/photo"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Replace Media Modal
function ReplaceMediaModal({ media, onClose, onSuccess, uploadMediaFile, updateMedia }) {
  const [activeTab, setActiveTab] = useState('upload'); // upload, url
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [directUrl, setDirectUrl] = useState(media.url || '');
  const [posterUrl, setPosterUrl] = useState(media.poster_url || '');
  const [posterFile, setPosterFile] = useState(null);
  const [mobileUrl, setMobileUrl] = useState(media.mobile_url || '');
  const [title, setTitle] = useState(media.title || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const isVideo = media.media_type === 'video';

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setFilePreview(objectUrl);
  };

  const handlePosterChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setPosterFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError('');

    try {
      let finalUrl = directUrl;
      let finalPoster = posterUrl;
      let fileName = media.file_name;
      let fileSize = media.file_size;

      // 1. If user selected a main file, upload it
      if (activeTab === 'upload' && file) {
        const uploadResult = await uploadMediaFile(file, isVideo ? 'videos' : 'images');
        finalUrl = uploadResult.publicUrl;
        fileName = uploadResult.fileName;
        fileSize = uploadResult.fileSize;
      }

      // 2. If user selected a video poster file, upload it
      if (posterFile) {
        const posterRes = await uploadMediaFile(posterFile, 'posters');
        finalPoster = posterRes.publicUrl;
      }

      // 3. Save updates into SiteMedia registry & database
      await updateMedia(media.media_key, {
        url: finalUrl,
        poster_url: finalPoster,
        mobile_url: mobileUrl,
        title: title || media.title,
        file_name: fileName,
        file_size: fileSize,
      });

      onSuccess(`Successfully replaced and published media for "${media.title}"!`);
    } catch (err) {
      console.error('Failed to replace media:', err);
      setUploadError(err.message || 'Failed to replace media. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 relative my-8 animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 w-8 h-8 rounded-full grid place-items-center bg-stone-100"
        >
          ✕
        </button>

        {/* Modal Title */}
        <div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {isVideo ? 'Replace Video' : 'Replace Image'}
          </span>
          <h3 className="font-display text-xl font-bold text-stone-900 mt-2">
            Replace Media at Location
          </h3>
          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
            {media.location_path}
          </p>
        </div>

        {uploadError && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 mt-4">
            ⚠️ {uploadError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Method Tabs */}
          <div className="flex border-b border-stone-200 pb-2 gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-1.5 transition-colors ${
                activeTab === 'upload'
                  ? 'text-amber-800 border-b-2 border-amber-600 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              📁 Upload New File (Supabase Storage)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`pb-1.5 transition-colors ${
                activeTab === 'url'
                  ? 'text-amber-800 border-b-2 border-amber-600 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              🔗 Direct Storage / Web URL
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Choose {isVideo ? 'MP4 / WebM Video' : 'JPEG / PNG / WebP Image'}
              </label>
              <input
                type="file"
                accept={isVideo ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/svg+xml'}
                onChange={handleFileChange}
                className="w-full text-xs text-stone-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer border border-dashed border-stone-300 rounded-xl p-3 bg-stone-50"
              />

              {filePreview && (
                <div className="mt-3 aspect-video bg-stone-900 rounded-xl overflow-hidden border border-stone-300 relative">
                  {isVideo ? (
                    <video src={filePreview} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Selected Preview
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Enter Direct URL (Supabase Public URL or CDN)
              </label>
              <input
                type="url"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="https://..."
                required={activeTab === 'url'}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white"
              />
            </div>
          )}

          {/* Optional Video Poster Image */}
          {isVideo && (
            <div className="pt-2 border-t border-stone-100">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Video Thumbnail / Poster Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePosterChange}
                className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-stone-200 file:text-stone-800 border border-stone-200 rounded-xl p-2 bg-stone-50"
              />
            </div>
          )}

          {/* Mobile Specific Media Override */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Mobile Screen Media URL (Optional override for mobile phones)
            </label>
            <input
              type="url"
              value={mobileUrl}
              onChange={(e) => setMobileUrl(e.target.value)}
              placeholder="Leave blank to use desktop media on all screens"
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="btn btn-o text-xs !py-2 !px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || (activeTab === 'upload' && !file && !directUrl)}
              className="btn bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs !py-2.5 !px-5 rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? 'Uploading & Publishing...' : 'Save & Publish Live'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Media Preview Modal
function MediaPreviewModal({ media, onClose, onReplace }) {
  const isVideo = media.media_type === 'video';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-900 text-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-stone-700 relative animate-scaleUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white w-8 h-8 rounded-full bg-stone-800 grid place-items-center z-10"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isVideo ? 'bg-purple-900 text-purple-200' : 'bg-emerald-900 text-emerald-200'
            }`}
          >
            {isVideo ? '🎬 Video Asset' : '🖼️ Image Asset'}
          </span>
          <span className="text-xs text-stone-400 font-mono">{media.file_name || media.media_key}</span>
        </div>

        <h3 className="font-display text-xl font-bold text-white mb-1">{media.title}</h3>
        <p className="text-xs text-amber-300 font-medium mb-4">{media.location_path}</p>

        {/* Media Preview Box */}
        <div className="aspect-video bg-black rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center relative">
          {isVideo ? (
            <video
              src={media.url}
              poster={media.poster_url}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <img src={media.url} alt={media.title} className="w-full h-full object-contain" />
          )}
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="bg-stone-800/60 p-2.5 rounded-xl border border-stone-700">
            <span className="text-stone-400 block text-[10px] uppercase">Dimensions</span>
            <span className="font-medium text-white">{media.dimensions || 'Responsive'}</span>
          </div>
          <div className="bg-stone-800/60 p-2.5 rounded-xl border border-stone-700">
            <span className="text-stone-400 block text-[10px] uppercase">File Size</span>
            <span className="font-medium text-white">{media.file_size || 'Standard'}</span>
          </div>
          <div className="bg-stone-800/60 p-2.5 rounded-xl border border-stone-700">
            <span className="text-stone-400 block text-[10px] uppercase">Page</span>
            <span className="font-medium text-amber-300 capitalize">{media.page}</span>
          </div>
          <div className="bg-stone-800/60 p-2.5 rounded-xl border border-stone-700">
            <span className="text-stone-400 block text-[10px] uppercase">Status</span>
            <span className="font-medium text-emerald-400">Live on Site</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between">
          {media.view_url ? (
            <Link
              to={media.view_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              Open on live website ↗
            </Link>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-xs font-semibold rounded-xl text-white transition-all"
            >
              Close
            </button>
            <button
              onClick={onReplace}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-xl shadow-lg transition-all"
            >
              Replace Media
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Safe Delete / Warning Modal
function SafeDeleteModal({ media, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-scaleUp">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 grid place-items-center text-xl mx-auto mb-3">
          ⚠️
        </div>
        <h3 className="font-display text-lg font-bold text-center text-stone-900">
          Media is Currently in Use
        </h3>
        <p className="text-xs text-stone-600 text-center mt-2 leading-relaxed">
          This media asset is currently displayed on your website at:
        </p>
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 mt-2 text-xs font-medium text-stone-800 text-center">
          {media.location_path}
        </div>
        <p className="text-[11px] text-stone-500 text-center mt-3">
          Deleting this asset will archive it. If you want to change what is displayed on the live website, we recommend using <strong>Replace</strong> instead.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-100 pt-3">
          <button onClick={onClose} className="btn btn-o text-xs !py-2 !px-4">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs !py-2 !px-4 rounded-xl font-bold"
          >
            Archive Asset
          </button>
        </div>
      </div>
    </div>
  );
}

// Direct File Upload Modal
function DirectUploadModal({ onClose, onUploaded, uploadMediaFile }) {
  const [file, setFile] = useState(null);
  const [folder, setFolder] = useState('general');
  const [isUploading, setIsUploading] = useState(false);
  const [err, setErr] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setErr('');
    try {
      const res = await uploadMediaFile(file, folder);
      onUploaded(res);
    } catch (error) {
      setErr(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-scaleUp">
        <h3 className="font-display text-lg font-bold text-stone-900">
          Upload New Media Asset
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Upload files to your Supabase Storage bucket for use on your storefront.
        </p>

        {err && (
          <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-xl border border-red-200 mt-3">
            {err}
          </div>
        )}

        <form onSubmit={handleUpload} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Select Destination Folder
            </label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
            >
              <option value="general">General Media</option>
              <option value="videos">Videos (MP4/WebM)</option>
              <option value="banners">Banners &amp; Heroes</option>
              <option value="products">Product Photos</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              File (Max 50MB)
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0])}
              required
              className="w-full text-xs text-stone-500 border border-dashed border-stone-300 rounded-xl p-3 bg-stone-50 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button type="button" onClick={onClose} className="btn btn-o text-xs !py-2 !px-4">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="btn bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs !py-2 !px-4 rounded-xl disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

