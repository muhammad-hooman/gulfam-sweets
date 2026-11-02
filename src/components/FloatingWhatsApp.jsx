import React from 'react';
import { useCart } from '../context/CartContext';
import { SITE_CONFIG } from '../config/siteConfig';

export default function FloatingWhatsApp() {
  const { cart, openCartDrawer } = useCart();

  const handleClick = () => {
    if (cart.length > 0) {
      openCartDrawer();
    } else {
      const msg =
        'Assalam o Alaikum! I would like to place an order at Gulfam Sweets & Dairy.';
      window.open(
        `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`,
        '_blank'
      );
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-5 right-5 z-30 bg-[#25D366] text-white rounded-full px-4 sm:px-5 py-3 shadow-2xl text-sm font-semibold flex items-center gap-2 hover:brightness-105 transition-all transform active:scale-95"
      aria-label="Instant WhatsApp Order"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="shrink-0"
      >
        <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.200 14.100c-.2.6-1.300 1.200-1.800 1.200-.5.100-1 .2-3.300-.7-2.800-1.100-4.600-4-4.700-4.200-.1-.2-1.100-1.500-1.100-2.800s.7-2 1-2.200c.2-.3.500-.3.700-.3h.5c.2 0 .4 0 .6.500l.8 2c.1.200.1.300 0 .5l-.4.600c-.1.100-.3.300-.1.600.2.300.8 1.300 1.800 2.100 1.200 1 2.200 1.300 2.500 1.500.3.100.5.100.6-.1l.9-1.100c.2-.3.400-.2.600-.1l2 1c.3.100.5.200.5.300.100.100.100.700-.1 1.300z" />
      </svg>
      <span className="hidden sm:inline">Instant WhatsApp Order</span>
    </button>
  );
}
