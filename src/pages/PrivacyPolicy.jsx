import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '../config/siteConfig';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 animate-fadeIn">
      {/* Header */}
      <div className="text-center pb-8 border-b border-stone-200">
        <span className="text-g-dark text-xs tracking-[.25em] font-semibold uppercase">
          LEGAL &amp; COMPLIANCE
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-m-dark mt-2">
          Privacy Policy
        </h1>
        <p className="text-stone-500 text-xs sm:text-sm mt-2">
          Last updated: January 2026 &middot; {SITE_CONFIG.brandName}
        </p>
      </div>

      {/* Body */}
      <div className="mt-10 space-y-8 text-sm text-stone-700 leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-m-dark">
            1. Commitment to Your Privacy
          </h2>
          <p>
            At {SITE_CONFIG.brandName}, we hold your trust and personal privacy
            with the same standard of uncompromising integrity as our royal
            recipes. This Privacy Policy details how we collect, handle, and
            safeguard your personal information when you use our website, place
            orders, or communicate with our staff.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-m-dark">
            2. Information We Collect
          </h2>
          <p>
            When you browse our catalog, register for a customer account, or
            place an order, we may collect the following details:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              <b>Contact Details:</b> Full name, mobile phone number, WhatsApp
              number, and email address.
            </li>
            <li>
              <b>Delivery Information:</b> Delivery address, city, landmark
              instructions, and preferred delivery dates.
            </li>
            <li>
              <b>Order Records:</b> Items purchased, weight selections, order
              totals, payment method selected (such as Cash on Delivery), and
              special notes (like custom cake inscriptions).
            </li>
            <li>
              <b>Account Security:</b> Passwords are cryptographically hashed;
              we never store plain-text passwords on our servers or client
              devices.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-m-dark">
            3. How We Use Your Information
          </h2>
          <p>We use your information strictly for legitimate business needs:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>To prepare, pack, and safely dispatch your food orders.</li>
            <li>
              To communicate delivery status and confirm arrival through our
              official WhatsApp and phone hotlines.
            </li>
            <li>
              To maintain your order history and saved wishlist items in your
              customer dashboard.
            </li>
            <li>
              To prevent fraudulent transactions and resolve customer queries.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-m-dark">
            4. Third-Party Integrations
          </h2>
          <p>
            Our website integrates with trusted services to fulfill orders:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              <b>WhatsApp:</b> For direct customer messaging, quotation requests,
              and order confirmations.
            </li>
            <li>
              <b>Google Maps:</b> For display and verification of store
              locations.
            </li>
            <li>
              <b>Supabase:</b> For encrypted backend authentication and order
              persistence when configured.
            </li>
          </ul>
          <p>We never sell, rent, or trade your personal data to advertisers.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-m-dark">
            5. Your Rights and Contact Information
          </h2>
          <p>
            You have the right to inspect, update, or request the deletion of
            your account and order data at any time through your dashboard or by
            contacting us directly at:
          </p>
          <div className="p-4 rounded-2xl bg-cream border border-g-light text-stone-800 text-xs">
            <p>
              <b>{SITE_CONFIG.brandName}</b>
            </p>
            <p>{SITE_CONFIG.address}</p>
            <p>Phone: {SITE_CONFIG.phone}</p>
          </div>
        </section>

        <div className="pt-6 border-t border-stone-200 flex justify-between items-center text-xs">
          <Link to="/" className="text-m font-semibold hover:underline">
            &larr; Back to Home
          </Link>
          <Link to="/terms" className="text-m font-semibold hover:underline">
            Terms &amp; Conditions &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

