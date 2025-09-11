import Link from 'next/link';
import React from 'react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-cream/80 backdrop-blur-md z-50 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-serif font-bold text-brown">
                <Link href="/">MASSA</Link>
              </h1>
              <p className="text-xs text-gold font-semibold tracking-wider">
                Cafeterías & Panaderías
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-brown font-medium">
            <Link href="/menu" className="hover:text-gold transition-colors">
              Nuestra Carta
            </Link>
            <Link href="/locales" className="hover:text-gold transition-colors">
              Locales
            </Link>
          </div>
          {/* Mobile menu button will be added later */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
