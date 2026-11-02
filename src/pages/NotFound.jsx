import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 text-center animate-fadeIn">
      <div className="max-w-md w-full bg-white rounded-3xl border border-g-light p-8 md:p-12 shadow-lg">
        <span className="font-display text-7xl font-bold text-m block tracking-tighter">
          404
        </span>
        <div className="w-12 h-1 bg-g mx-auto my-4 rounded-full" />
        <h1 className="font-display text-2xl font-bold text-m-dark">
          Page Not Found
        </h1>
        <p className="text-stone-500 text-xs sm:text-sm mt-2 leading-relaxed">
          The delicacy or page you are looking for may have been moved, renamed,
          or does not exist.
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          <Link to="/" className="btn btn-m shadow-md">
            Return to Homepage
          </Link>
          <Link to="/mithai" className="btn btn-g shadow-sm">
            Browse Royal Mithai
          </Link>
          <Link to="/contact" className="btn btn-o !text-xs mt-1">
            Need Help? Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}

