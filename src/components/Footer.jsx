import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '../config/siteConfig';

export default function Footer() {
  return (
    <footer className="bg-m-dark text-white/80 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand Col */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-lg bg-g grid place-items-center font-display text-2xl font-bold text-m-dark shadow-sm">
              G
            </span>
            <span className="font-display text-xl font-bold text-g tracking-tight">
              {SITE_CONFIG.brandName}
            </span>
          </div>
          <p className="mt-4 leading-relaxed text-stone-300 text-xs sm:text-sm">
            Taste of Purity, Tradition of Sweetness. Royal mithai, bakery, fresh
            dairy, and traditional savouries handcrafted since{' '}
            {SITE_CONFIG.establishedYear}.
          </p>
          <div className="flex gap-2.5 mt-5">
            <a
              href={SITE_CONFIG.socialLinks.facebook}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 grid place-items-center rounded-full bg-g text-m-dark text-xs font-bold hover:brightness-110 transition-all shadow-sm"
              aria-label="Facebook"
            >
              f
            </a>
            <a
              href={SITE_CONFIG.socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 grid place-items-center rounded-full bg-g text-m-dark text-xs font-bold hover:brightness-110 transition-all shadow-sm"
              aria-label="Instagram"
            >
              ig
            </a>
            <a
              href={SITE_CONFIG.socialLinks.tiktok}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 grid place-items-center rounded-full bg-g text-m-dark text-xs font-bold hover:brightness-110 transition-all shadow-sm"
              aria-label="TikTok"
            >
              tt
            </a>
          </div>
        </div>

        {/* Shop Col */}
        <div>
          <b className="text-g text-base block font-serif tracking-wide">
            Shop Catalog
          </b>
          <ul className="mt-4 space-y-2 text-stone-300 text-xs sm:text-sm">
            <li>
              <Link to="/mithai" className="hover:text-g transition-colors">
                Royal Mithai
              </Link>
            </li>
            <li>
              <Link to="/nimco" className="hover:text-g transition-colors">
                Crispy Nimco &amp; Mixes
              </Link>
            </li>
            <li>
              <Link to="/fresh-snacks" className="hover:text-g transition-colors">
                Fresh Hot Snacks
              </Link>
            </li>
            <li>
              <Link to="/frozen-foods" className="hover:text-g transition-colors">
                Ready-to-Fry Frozen Foods
              </Link>
            </li>
            <li>
              <Link to="/bakery" className="hover:text-g transition-colors">
                Fresh Bakery &amp; Rusks
              </Link>
            </li>
            <li>
              <Link to="/cakes" className="hover:text-g transition-colors">
                Celebration Cakes
              </Link>
            </li>
            <li>
              <Link to="/wedding-bulk" className="hover:text-g transition-colors font-medium text-g-light">
                Wedding Thaals &amp; Bulk Packs
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care Col */}
        <div>
          <b className="text-g text-base block font-serif tracking-wide">
            Customer Care
          </b>
          <ul className="mt-4 space-y-2 text-stone-300 text-xs sm:text-sm">
            <li>
              <Link to="/account" className="hover:text-g transition-colors">
                My Account &amp; Profile
              </Link>
            </li>
            <li>
              <Link to="/account/orders" className="hover:text-g transition-colors">
                Order Tracking &amp; History
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-g transition-colors">
                Shopping Cart
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-g transition-colors">
                Saved Delicacies (Wishlist)
              </Link>
            </li>
            <li>
              <Link to="/faqs" className="hover:text-g transition-colors">
                Frequently Asked Questions
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-g transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-g transition-colors">
                Terms &amp; Conditions
              </Link>
            </li>
          </ul>
        </div>

        {/* Visit us Col */}
        <div>
          <b className="text-g text-base block font-serif tracking-wide">
            Visit Our Flagship Store
          </b>
          <p className="mt-4 leading-relaxed text-stone-300 text-xs sm:text-sm">
            {SITE_CONFIG.address}
            <br />
            <a
              href={`tel:${SITE_CONFIG.phoneTel}`}
              className="hover:text-g font-semibold block mt-2 text-white"
            >
              {SITE_CONFIG.phone}
            </a>
            <span className="text-g-light text-xs block mt-1 font-medium">
              {SITE_CONFIG.openingHours}
            </span>
          </p>

          <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-300">
            <span className="text-g font-bold block mb-1">
              Need Quick Catering?
            </span>
            Call or WhatsApp us for instant custom packaging and wedding quotes.
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-stone-400 max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          &copy; {new Date().getFullYear()} {SITE_CONFIG.brandName}. All rights
          reserved.
        </p>
        <div className="flex gap-4">
          <Link to="/privacy-policy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <span>&middot;</span>
          <Link to="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <span>&middot;</span>
          <Link to="/faqs" className="hover:text-white transition-colors">
            Help &amp; FAQs
          </Link>
        </div>
      </div>
    </footer>
  );
}
