import React, { useState } from 'react';
import { WHATSAPP_NUMBER } from '../data/products';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = `Name: ${formData.name}\nPhone: ${formData.phone}\n\n${formData.message}`;
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
    setFormData({ name: '', phone: '', message: '' });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-g-light p-6 md:p-8 space-y-4 shadow-sm self-start"
    >
      <h2 className="font-display text-2xl font-bold text-m-dark">
        Send us a message
      </h2>
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
      <textarea
        name="message"
        rows="5"
        required
        placeholder="Your message"
        value={formData.message}
        onChange={handleChange}
      />
      <button type="submit" className="btn btn-m w-full shadow-md">
        Send via WhatsApp
      </button>
    </form>
  );
}

