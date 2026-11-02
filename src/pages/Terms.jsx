import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '../config/siteConfig';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 animate-fadeIn">
      {/* Header */}
      <div className="text-center pb-8 border-b border-stone-200">
        <span className="text-g-dark text-xs tracking-[.25em] font-semibold uppercase">
          CUSTOMER AGREEMENT
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-m-dark mt-2">
          Terms &amp; Conditions
        </h1>
        <p className="text-stone-500 text-xs sm:text-sm mt-2">
          Effective Date: January 2026 &middot; {SITE_CONFIG.brandName}
        </p>
      </div>

      {/* Body */}
      <div className="mt-10 space-y-8 text-sm text-stone-700 leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-m-dark">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing the website of {SITE_CONFIG.brandName} or submitting an
            order online or via WhatsApp, you agree to be bound by the following
            Terms and Conditions. Please review them carefully before confirming
            your order.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-m-dark">
            2. Product Quality &amp; Freshness Guarantee
          </h2>
          <p>
            All our traditional sweets, halwas, and bakery goods are produced
            fresh daily using certified 100% pure desi ghee, premium dry fruits,
            and whole milk.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              Because our confectionery contains no artificial preservatives,
              storage instructions must be followed upon receipt.
            </li>
            <li>
              Perishable dairy products (e.g. Ras Malai, Chaunsa Gateau) must be
              refrigerated immediately at 2°C to 4°C.
            </li>
            <li>
              Frozen products are dispatched at -18°C in thermal insulation and
              must be frozen immediately on arrival.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-m-dark">
            3. Pricing and Payments
          </h2>
          <p>
            All prices listed on our website are in Pakistani Rupees (PKR) and
            inclusive of applicable local charges:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              We reserve the right to correct any typographical or calculation
              discrepancy prior to order dispatch.
            </li>
            <li>
              Standard payment terms are Cash on Delivery (COD) or Direct Bank
              Transfer upon order confirmation.
            </li>
            <li>
              Delivery is free on qualifying orders with subtotal reaching or
              exceeding Rs. {SITE_CONFIG.freeDeliveryThreshold.toLocaleString()}.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-m-dark">
            4. Wedding, Event &amp; Bulk Orders
          </h2>
          <p>
            For bulk wedding orders exceeding 10 kg or custom thaals:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              A 30% advance deposit is required to confirm catering dates during
              peak wedding season.
            </li>
            <li>
              Complimentary sample tastings can be arranged by appointment at
              our Karachi store.
            </li>
            <li>
              Cancellations for bespoke wedding boxes must be received at least
              72 hours prior to the event date.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-m-dark">
            5. Dispute Resolution &amp; Support
          </h2>
          <p>
            If any item arrives damaged or fails to meet our high standard of
            freshness, notify our delivery hotline within 3 hours of arrival with
            a photo. We will gladly arrange an immediate replacement or full
            refund.
          </p>
          <div className="p-4 rounded-2xl bg-cream border border-g-light text-stone-800 text-xs">
            <p>
              <b>Hotline Support:</b> {SITE_CONFIG.phone}
            </p>
            <p>
              <b>WhatsApp Care:</b> {SITE_CONFIG.whatsappNumber}
            </p>
          </div>
        </section>

        <div className="pt-6 border-t border-stone-200 flex justify-between items-center text-xs">
          <Link to="/" className="text-m font-semibold hover:underline">
            &larr; Back to Home
          </Link>
          <Link to="/privacy-policy" className="text-m font-semibold hover:underline">
            Privacy Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

