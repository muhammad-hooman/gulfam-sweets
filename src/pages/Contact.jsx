import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '../config/siteConfig';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function Contact({ onShowToast }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('customer_inquiries').insert({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          subject: formData.subject,
          message: formData.message.trim(),
        });
        if (error) throw error;
      }
      const msg = `Name: ${formData.name}\nPhone: ${formData.phone}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`;
      window.open(
        `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`,
        '_blank'
      );
      setSubmitted(true);
      if (onShowToast) onShowToast('Message prepared for WhatsApp');
    } catch (error) {
      console.error('Customer inquiry submission failed:', error);
      setErrorMessage('Your message could not be saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectWhatsApp = () => {
    const msg =
      'Assalam o Alaikum! I would like to place an order or ask a question regarding Gulfam Sweets.';
    window.open(
      `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  return (
    <div className="animate-fadeIn">
      {/* Banner */}
      <div className="bg-m">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-g text-xs tracking-[.25em] font-semibold uppercase">
            <Link to="/" className="hover:underline">
              HOME
            </Link>{' '}
            / CONTACT
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mt-2">
            Visit or <em className="text-g italic">Order</em>
          </h1>
          <p className="text-white/80 text-sm mt-3 max-w-xl mx-auto">
            Get in touch for home delivery, wedding thaal orders, or corporate
            gifting inquiries.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-g-light p-6 md:p-8 text-sm space-y-5 shadow-sm">
            <div>
              <b className="text-m block text-base font-semibold mb-1">
                Shop Address &amp; Location
              </b>
              <p className="text-stone-600 leading-relaxed">
                {SITE_CONFIG.address}
              </p>
            </div>

            <div>
              <b className="text-m block text-base font-semibold mb-1">
                Phone &amp; WhatsApp Hotlines
              </b>
              <a
                href={`tel:${SITE_CONFIG.phoneTel}`}
                className="text-stone-700 hover:text-m font-semibold block transition-colors"
              >
                {SITE_CONFIG.phone}
              </a>
              <span className="text-xs text-stone-400">
                Available 8:00 AM to 11:00 PM daily
              </span>
            </div>

            <div>
              <b className="text-m block text-base font-semibold mb-1">
                Store Timings
              </b>
              <p className="text-stone-600">
                {SITE_CONFIG.openingHours} (Open 7 days a week)
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleDirectWhatsApp}
                className="btn btn-g shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                Instant Order on WhatsApp
              </button>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="rounded-3xl border border-stone-200 overflow-hidden shadow-sm h-80">
            <iframe
              title="Gulfam Sweets Karachi Map"
              loading="lazy"
              className="w-full h-full border-0"
              src="https://maps.google.com/maps?q=Karachi,Pakistan&output=embed"
            />
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-3xl border border-g-light p-6 md:p-8 space-y-5 shadow-sm self-start">
          <h2 className="font-display text-2xl font-bold text-m-dark">
            Send us a message
          </h2>
          <p className="text-xs text-stone-500">
            Have a question about large events or special recipes? We respond
            promptly on WhatsApp.
          </p>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-3">
              <div className="text-3xl">✓</div>
              <h3 className="font-bold text-base">Inquiry Prepared!</h3>
              <p className="text-xs leading-relaxed">
                Your WhatsApp window has opened with your inquiry pre-filled.
                Click send to reach our customer support team directly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="btn btn-o !text-xs !py-2 !px-4"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Your Full Name
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Asim Raza"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Mobile / WhatsApp Number
                </label>
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="0300 1234567"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Topic of Inquiry
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                >
                  <option>General Inquiry</option>
                  <option>Wedding Thaal &amp; Bulk Catering</option>
                  <option>Custom Cake Design</option>
                  <option>Corporate Gifting Hamper</option>
                  <option>Delivery Tracking</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Your Message
                </label>
                <textarea
                  name="message"
                  rows="4"
                  required
                  placeholder="Please write your questions, requirements, or custom order requests..."
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="btn btn-m w-full shadow-md py-3 text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving message…' : 'Send via WhatsApp'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
