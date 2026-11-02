import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSiteMedia } from '../../context/SiteMediaContext';

export default function WebsiteMediaEditorPage() {
  const {
    allMedia,
    updateMedia,
    uploadMediaFile,
    restoreDefault,
    isUpdating,
  } = useSiteMedia();

  // Selected state
  const [selectedPage, setSelectedPage] = useState('home');
  const [selectedKey, setSelectedKey] = useState('home_hero_circle_video');

  // Editor form state
  const [activeTab, setActiveTab] = useState('upload'); // upload, url
  const [newFile, setNewFile] = useState(null);
  const [newFilePreview, setNewFilePreview] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [posterUrl, setPosterUrl] = useState('');
  const [mobileUrl, setMobileUrl] = useState('');
  const [autoplay, setAutoplay] = useState(true);
  const [loop, setLoop] = useState(true);
  const [muted, setMuted] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Structured Page Hierarchy
  const PAGES = [
    { id: 'home', label: 'Homepage', icon: '🏠', path: '/' },
    { id: 'mithai', label: 'Mithai Page', icon: '👑', path: '/mithai' },
    { id: 'nimco', label: 'Nimco Page', icon: '🥨', path: '/nimco' },
    { id: 'fresh-snacks', label: 'Fresh Snacks', icon: '🥟', path: '/fresh-snacks' },
    { id: 'frozen-foods', label: 'Frozen Foods', icon: '❄️', path: '/frozen-foods' },
    { id: 'bakery', label: 'Bakery Page', icon: '🥖', path: '/bakery' },
    { id: 'cakes', label: 'Cakes & Desserts', icon: '🎂', path: '/cakes' },
    { id: 'wedding', label: 'Wedding & Bulk', icon: '💍', path: '/wedding-bulk' },
    { id: 'about', label: 'About Us Page', icon: '📖', path: '/about' },
  ];

  // Media items belonging to selected page
  const pageMediaList = useMemo(() => {
    return allMedia.filter((item) => item.page === selectedPage);
  }, [allMedia, selectedPage]);

  // Selected media object
  const activeMedia = useMemo(() => {
    return (
      pageMediaList.find((item) => item.media_key === selectedKey) ||
      pageMediaList[0] ||
      allMedia[0]
    );
  }, [pageMediaList, selectedKey, allMedia]);

  // When selected media changes, synchronize form
  const handleSelectMedia = (item) => {
    setSelectedKey(item.media_key);
    setCustomUrl(item.url || '');
    setPosterUrl(item.poster_url || '');
    setMobileUrl(item.mobile_url || '');
    setAutoplay(item.autoplay ?? true);
    setLoop(item.loop ?? true);
    setMuted(item.muted ?? true);
    setNewFile(null);
    setNewFilePreview('');
    setPosterFile(null);
    setPreviewMode(false);
  };

  // When page tab changes
  const handlePageChange = (pageId) => {
    setSelectedPage(pageId);
    const firstOfPage = allMedia.find((item) => item.page === pageId);
    if (firstOfPage) {
      handleSelectMedia(firstOfPage);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewFile(file);
    const objectUrl = URL.createObjectURL(file);
    setNewFilePreview(objectUrl);
  };

  const handleSaveAndPublish = async () => {
    if (!activeMedia) return;

    setIsUploading(true);
    try {
      let finalUrl = activeMedia.url;
      let finalPoster = posterUrl || activeMedia.poster_url;
      let fileName = activeMedia.file_name;
      let fileSize = activeMedia.file_size;

      // Upload main file if chosen
      if (activeTab === 'upload' && newFile) {
        const uploadResult = await uploadMediaFile(
          newFile,
          activeMedia.media_type === 'video' ? 'videos' : 'images'
        );
        finalUrl = uploadResult.publicUrl;
        fileName = uploadResult.fileName;
        fileSize = uploadResult.fileSize;
      } else if (activeTab === 'url' && customUrl) {
        finalUrl = customUrl;
      }

      // Upload poster if chosen
      if (posterFile) {
        const posterRes = await uploadMediaFile(posterFile, 'posters');
        finalPoster = posterRes.publicUrl;
      }

      // Publish update
      await updateMedia(activeMedia.media_key, {
        url: finalUrl,
        poster_url: finalPoster,
        mobile_url: mobileUrl,
        autoplay,
        loop,
        muted,
        file_name: fileName,
        file_size: fileSize,
      });

      setNewFile(null);
      setNewFilePreview('');
      setPosterFile(null);
      setPreviewMode(false);
      showToast(`Published changes to live website for ${activeMedia.title}!`);
    } catch (err) {
      console.error('Error saving media:', err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRestore = async () => {
    if (!activeMedia) return;
    if (confirm(`Reset ${activeMedia.title} to the original default asset?`)) {
      await restoreDefault(activeMedia.media_key);
      showToast(`Restored default brand media for ${activeMedia.title}`);
    }
  };

  const isVideo = activeMedia?.media_type === 'video';
  const effectiveDisplayUrl = previewMode && newFilePreview ? newFilePreview : activeMedia?.url;

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-amber-400/40 flex items-center gap-3 animate-slideIn">
          <span className="text-amber-400">✓</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#4A0E17] via-[#5C131D] to-[#3B080E] text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-amber-300 border border-amber-400/30 mb-2">
              <span>✦</span> Direct Section Visual Editor
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Website Media Editor
            </h1>
            <p className="text-amber-100/80 text-sm mt-1 max-w-2xl">
              Select any page and section of your storefront to replace its image or video with zero coding required.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/media"
              className="btn bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm !py-2.5 !px-4 rounded-xl"
            >
              Browse All in Media Library
            </Link>
          </div>
        </div>
      </div>

      {/* Two-Column Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Page & Section Tree */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-stone-200 p-5 space-y-6">
          <div>
            <h3 className="font-display text-base font-bold text-stone-900">
              1. Select Website Page
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Choose which page you want to customize.
            </p>

            <div className="grid grid-cols-1 gap-1.5 mt-3">
              {PAGES.map((p) => {
                const isSelected = selectedPage === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePageChange(p.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      isSelected
                        ? 'bg-amber-50 text-amber-900 border border-amber-300/80 shadow-sm'
                        : 'text-stone-700 hover:bg-stone-50 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{p.icon}</span>
                      <span>{p.label}</span>
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {allMedia.filter((m) => m.page === p.id).length} media
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-5 border-t border-stone-100">
            <h3 className="font-display text-base font-bold text-stone-900">
              2. Select Section / Visual
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Available image &amp; video slots on this page.
            </p>

            <div className="space-y-2 mt-3">
              {pageMediaList.map((item) => {
                const isSelected = activeMedia?.media_key === item.media_key;
                const isVid = item.media_type === 'video';

                return (
                  <div
                    key={item.media_key}
                    onClick={() => handleSelectMedia(item)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500/10 via-amber-50 to-transparent border-amber-500/60 shadow-sm'
                        : 'bg-stone-50 hover:bg-stone-100/70 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                          isVid
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isVid ? '1080p Video' : 'Image'}
                      </span>
                      <span className="text-[10px] text-stone-400">{item.section}</span>
                    </div>
                    <p className="text-xs font-bold text-stone-900 mt-1.5 leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                      {item.location_path}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Visual Editor */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8 space-y-6">
          {activeMedia ? (
            <>
              {/* Top Meta Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isVideo
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isVideo ? '🎬 Video Visual' : '🖼️ Image Visual'}
                    </span>
                    <span className="text-xs text-stone-500 font-mono">
                      {activeMedia.media_key}
                    </span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900 mt-1">
                    {activeMedia.title}
                  </h2>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    {activeMedia.location_path}
                  </p>
                </div>

                {activeMedia.view_url && (
                  <Link
                    to={activeMedia.view_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1 self-start sm:self-auto bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200"
                  >
                    View Live on Page ↗
                  </Link>
                )}
              </div>

              {/* Live Preview Display */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {previewMode ? 'Live Preview of New Media' : 'Current Active Media on Website'}
                  </span>
                  <div className="flex items-center gap-2">
                    {newFilePreview && (
                      <button
                        type="button"
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          previewMode
                            ? 'bg-amber-500 text-stone-950 shadow'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {previewMode ? '👁️ Previewing New' : 'Preview New Media'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="aspect-video bg-stone-950 rounded-2xl overflow-hidden border border-stone-200 shadow-inner relative flex items-center justify-center">
                  {isVideo ? (
                    <video
                      key={effectiveDisplayUrl}
                      src={effectiveDisplayUrl}
                      poster={activeMedia.poster_url}
                      controls
                      autoPlay={autoplay}
                      loop={loop}
                      muted={muted}
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={effectiveDisplayUrl}
                      alt={activeMedia.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Circular Preview Tag if this is the homepage circular hero */}
                  {activeMedia.media_key === 'home_hero_circle_video' && (
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-amber-300 font-medium border border-amber-400/40">
                      Note: On homepage, this renders perfectly inside the Golden Ring circle
                    </div>
                  )}
                </div>
              </div>

              {/* Upload & Replacement Controls */}
              <div className="pt-6 border-t border-stone-200 space-y-4">
                <h4 className="font-display text-base font-bold text-stone-900">
                  Replace &amp; Configure Media
                </h4>

                {/* Tab Switcher */}
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
                    📁 Upload File to Supabase Storage
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
                    🔗 Custom Storage / External URL
                  </button>
                </div>

                {activeTab === 'upload' ? (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-center">
                    <input
                      type="file"
                      id="section-media-file-input"
                      accept={
                        isVideo
                          ? 'video/mp4,video/webm'
                          : 'image/jpeg,image/png,image/webp,image/svg+xml'
                      }
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="section-media-file-input"
                      className="cursor-pointer inline-flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 grid place-items-center text-xl">
                        {isVideo ? '🎬' : '📷'}
                      </div>
                      <span className="text-xs font-bold text-stone-800">
                        {newFile ? newFile.name : `Click to select new ${isVideo ? 'Video (MP4/WebM)' : 'Image'}`}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Max file size: 50 MB &bull; Uploads automatically to Supabase bucket
                      </span>
                    </label>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Direct Media URL
                    </label>
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                )}

                {/* Video Playback Options */}
                {isVideo && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                      <input
                        type="checkbox"
                        checked={autoplay}
                        onChange={(e) => setAutoplay(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Autoplay Video</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                      <input
                        type="checkbox"
                        checked={loop}
                        onChange={(e) => setLoop(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Loop Continuously</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                      <input
                        type="checkbox"
                        checked={muted}
                        onChange={(e) => setMuted(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Muted by Default</span>
                    </label>
                  </div>
                )}

                {/* Video Poster Image Upload */}
                {isVideo && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Video Poster / Placeholder Image (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPosterFile(e.target.files?.[0])}
                      className="w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-stone-200 file:text-stone-800 border border-stone-200 rounded-xl p-2 bg-stone-50"
                    />
                  </div>
                )}

                {/* Mobile Screen Media Override */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Mobile Specific Media (Optional override for mobile phones)
                  </label>
                  <input
                    type="url"
                    value={mobileUrl}
                    onChange={(e) => setMobileUrl(e.target.value)}
                    placeholder="Leave blank to use the desktop media across all devices"
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>

                {/* Save and Publish Controls */}
                <div className="pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handleRestore}
                    className="text-xs text-stone-500 hover:text-amber-800 font-semibold"
                  >
                    ↺ Reset to Default Brand Visual
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectMedia(activeMedia)}
                      className="btn btn-o text-xs !py-2.5 !px-4"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAndPublish}
                      disabled={isUploading}
                      className="btn bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs sm:text-sm !py-2.5 !px-6 rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUploading ? 'Uploading & Publishing...' : 'Save & Publish Live'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-stone-400">
              Select a section from the left panel to edit its media.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

