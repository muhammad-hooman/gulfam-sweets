import React from 'react';
import { Link } from 'react-router-dom';
import {
  STATS,
  MISSION,
  getUnsplashUrl,
  getFallbackSvg,
} from '../data/products';
import { SITE_CONFIG } from '../config/siteConfig';
import { useSiteMedia } from '../context/SiteMediaContext';

export default function About() {
  const { getMedia } = useSiteMedia();
  const storyImage = getMedia('about_story_image', getUnsplashUrl('1567337710282-00832b415979')).url;
  const kitchenImage = getMedia('about_kitchen_image', getUnsplashUrl('1589301760014-d929f3979dbc')).url;
  return (
    <div className="animate-fadeIn">
      {/* Banner */}
      <div className="bg-m">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-g text-xs tracking-[.25em] font-semibold uppercase">
            <Link to="/" className="hover:underline">
              HOME
            </Link>{' '}
            / ABOUT US
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mt-2">
            Our <em className="text-g italic">Story</em>
          </h1>
        </div>
      </div>

      {/* Story Narrative */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
        <img
          src={storyImage}
          alt="Our shop"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getFallbackSvg('Gulfam Heritage');
          }}
          className="w-full h-80 sm:h-96 object-cover rounded-3xl shadow-xl hover:scale-[1.02] transition-transform duration-500"
        />
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-m-dark leading-tight">
            From a small counter to a{' '}
            <em className="text-g-dark italic">family name</em>
          </h2>
          <p className="mt-5 text-sm sm:text-base text-stone-600 leading-relaxed">
            Gulfam began in {SITE_CONFIG.establishedYear} as a single counter
            selling fresh milk and a handful of mithai. Every sweet was stirred
            by hand over slow flame, and customers returned because they could
            taste the difference.
          </p>
          <p className="mt-4 text-sm sm:text-base text-stone-600 leading-relaxed">
            Today we make mithai, nimco, bakery, celebration cakes and frozen
            snacks, but the promise is the same: pure ingredients, fresh
            batches, and honest prices.
          </p>
          <div className="mt-6 flex gap-4">
            <Link to="/mithai" className="btn btn-m shadow-md">
              Browse Mithai
            </Link>
            <Link to="/contact" className="btn btn-o">
              Visit Our Shop
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="bg-white py-14 border-y border-g-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(([num, label], idx) => (
            <div key={idx} className="p-2">
              <p className="font-display text-4xl sm:text-5xl font-bold text-m">
                {num}
              </p>
              <p className="text-xs sm:text-sm text-stone-500 mt-2 font-medium tracking-wide">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission & Quality Cards */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
        {MISSION.map(([title, desc], idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-g-light p-7 border-t-4 !border-t-g shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-display text-xl font-bold text-m">{title}</h3>
            <p className="text-sm text-stone-600 mt-3 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* How We Make It */}
      <div className="max-w-7xl mx-auto px-4 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-m-dark leading-tight">
            How we <em className="text-g-dark italic">make it</em>
          </h2>
          <p className="mt-5 text-sm sm:text-base text-stone-600 leading-relaxed">
            Milk arrives from trusted dairy farms each morning. It is boiled,
            reduced, and set by hand in small batches by master halwais with
            decades of experience. Nothing is made from powdered milk and
            nothing is stored overnight.
          </p>
          <div className="mt-8">
            <Link to="/mithai" className="btn btn-m shadow-md hover:shadow-lg">
              Explore Our Mithai
            </Link>
          </div>
        </div>
        <img
          src={kitchenImage}
          alt="Making mithai"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getFallbackSvg('Halwai Craft');
          }}
          className="order-1 md:order-2 w-full h-80 sm:h-96 object-cover rounded-3xl shadow-xl hover:scale-[1.02] transition-transform duration-500"
        />
      </div>
    </div>
  );
}
