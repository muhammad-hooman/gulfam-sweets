import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '../config/siteConfig';

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Do you use 100% pure Desi Ghee in your sweets?',
      a: 'Yes, absolutely. All our traditional Pakistani mithai (including Gulab Jamun, Motichoor Laddu, Kaju Katli, and Halwas) are strictly prepared using 100% pure desi ghee. We never use hydrogenated oils, banaspati ghee, or artificial essences.',
    },
    {
      q: 'How does your delivery work across Karachi?',
      a: `We offer same-day fresh delivery across Karachi. Orders placed before 6:00 PM are delivered the same day in temperature-controlled packaging. Delivery is completely FREE on orders above Rs. ${SITE_CONFIG.freeDeliveryThreshold.toLocaleString()}, while a nominal standard delivery charge of Rs. ${SITE_CONFIG.standardDeliveryFee} applies to smaller orders.`,
    },
    {
      q: 'How are frozen food items packed and delivered?',
      a: 'Our ready-to-fry samosas, rolls, and seekh kababs are packed in specialized thermal insulated bags with food-grade gel ice packs to ensure they remain frozen at -18°C during transit. Upon arrival, please transfer them immediately to your freezer.',
    },
    {
      q: 'Can I order custom decorated thaals for weddings or Mehndis?',
      a: 'Yes! We specialize in custom wedding mithai thaals, festive mehndi platters, and corporate hampers. You can select your choice of fresh sweets, dry fruits, and bespoke packing with personalized greeting cards. Visit our Wedding & Bulk page or contact us on WhatsApp for complimentary tasting samples on large orders.',
    },
    {
      q: 'What is the shelf life of Gulfam sweets and bakery items?',
      a: 'Mithai made with milk or khoya (like Ras Malai and Gulab Jamun) should be consumed within 2 to 4 days and kept refrigerated. Dry sweets like Kaju Katli and Panjeeri last up to 10-15 days. Our bakery nan khatai and rusks remain crisp and fresh in airtight containers for over 3 weeks.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept Cash on Delivery (COD) as well as Direct Bank Transfers / Raast for your convenience. Corporate clients and large wedding orders can also pay via official company crossed cheques.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <span className="text-g-dark text-xs tracking-[.25em] font-semibold uppercase">
          CUSTOMER QUESTIONS
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-m-dark mt-2">
          Frequently Asked Questions
        </h1>
        <p className="text-stone-500 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
          Everything you need to know about our royal delicacies, pure desi ghee
          ingredients, delivery guidelines, and celebratory bulk orders.
        </p>
      </div>

      {/* Accordion List */}
      <div className="mt-12 space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs transition-all"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
              className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-stone-50/50 transition-colors"
            >
              <span className="font-display font-bold text-base sm:text-lg text-m-dark">
                {faq.q}
              </span>
              <span className="text-xl font-bold text-g-dark shrink-0">
                {openIndex === idx ? '−' : '+'}
              </span>
            </button>
            {openIndex === idx && (
              <div className="px-5 pb-5 pt-1 text-sm text-stone-600 leading-relaxed border-t border-stone-100 animate-fadeIn">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact box */}
      <div className="mt-14 bg-cream rounded-3xl border border-g-light p-8 text-center space-y-3">
        <h3 className="font-display text-xl font-bold text-m-dark">
          Still Have a Question?
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
          Our customer service team is available 7 days a week from 8:00 AM to
          11:00 PM to help you with order inquiries.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link to="/contact" className="btn btn-m !text-xs !py-2 !px-5">
            Contact Support
          </Link>
          <a
            href={`https://wa.me/${SITE_CONFIG.whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-g !text-xs !py-2 !px-5"
          >
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

