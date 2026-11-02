import React from 'react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-m text-g px-6 py-3 rounded-full z-[70] shadow-2xl text-sm font-semibold tracking-wide border border-g-dark/30 animate-bounce pointer-events-none transition-all">
      {message}
    </div>
  );
}

