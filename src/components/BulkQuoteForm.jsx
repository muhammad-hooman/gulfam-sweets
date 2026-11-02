import React, { useState } from 'react';
import { WHATSAPP_NUMBER } from '../data/products';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function BulkQuoteForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    event: 'Wedding',
    date: '',
    quantity: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const msg = `Bulk quote request - Gulfam\n\nName: ${formData.name}\nPhone: ${formData.phone}\nEvent: ${formData.event}\nDate: ${formData.date}\nQuantity: ${formData.quantity}\n\n${formData.message}`;

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('customer_inquiries').insert({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          subject: `Bulk quote: ${formData.event}`,
          message: `Event date: ${formData.date}\nQuantity: ${formData.quantity}\n\n${formData.message}`.trim(),
        });
        if (error) throw error;
      }

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
        '_blank'
      );

      setFormData({
        name: '',
        phone: '',
        event: 'Wedding',
        date: '',
        quantity: '',
        message: '',
      });
    } catch (error) {
      console.error('Bulk quote submission failed:', error);
      setErrorMessage('Your quote request could not be saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-16 bg-white rounded-3xl border border-g-light p-6 md:p-10 grid md:grid-cols-2 gap-8 shadow-sm">
      <div>
        <h2 className="font-display text-3xl font-bold text-m-dark">
          Request a <em className="text-g-dark">Bulk Quote</em>
        </h2>
        <p className="text-sm text-stone-600 mt-3 leading-relaxed">
          Tell us about your event and we will reply on WhatsApp with a custom
          menu and price. Orders of 10 kg and above include free delivery.
        </p>
        <div className="mt-6 p-4 rounded-2xl bg-cream border border-g-light/60 space-y-2 text-xs text-stone-700">
          <p className="flex items-center gap-2">
            <span className="text-g-dark font-bold text-base">✓</span> Free
            sample tasting available for 50+ guests
          </p>
          <p className="flex items-center gap-2">
            <span className="text-g-dark font-bold text-base">✓</span> Custom
            gift boxes with custom card prints
          </p>
          <p className="flex items-center gap-2">
            <span className="text-g-dark font-bold text-base">✓</span> Direct
            venue delivery and setup coordination
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMessage && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}
        <input
          name="name"
          required
          placeholder="Your name"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          name="phone"
          type="tel"
          required
          placeholder="Phone number"
          value={formData.phone}
          onChange={handleChange}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            name="event"
            value={formData.event}
            onChange={handleChange}
          >
            <option>Wedding</option>
            <option>Mehndi / Barat</option>
            <option>Corporate gifting</option>
            <option>Eid / Festival</option>
            <option>Other</option>
          </select>
          <input
            name="date"
            type="date"
            required
            title="Event date"
            value={formData.date}
            onChange={handleChange}
          />
        </div>
        <input
          name="quantity"
          placeholder="Approx. quantity (kg or boxes)"
          required
          value={formData.quantity}
          onChange={handleChange}
        />
        <textarea
          name="message"
          rows="3"
          placeholder="Anything else we should know?"
          value={formData.message}
          onChange={handleChange}
        />
        <button type="submit" className="btn btn-m w-full shadow-md" disabled={isSubmitting}>
          {isSubmitting ? 'Saving quote request…' : 'Send Quote Request on WhatsApp'}
        </button>
      </form>
    </div>
  );
}
