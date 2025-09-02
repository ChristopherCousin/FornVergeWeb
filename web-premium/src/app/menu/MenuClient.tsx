"use client";

import { Product, StrapiData } from "@/lib/strapi/api";
import React, { useLayoutEffect, useRef, useState } from "react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface MenuClientProps {
  products: StrapiData<Product>[];
  categories: string[];
}

const MenuClient: React.FC<MenuClientProps> = ({ products, categories }) => {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0] || 'Todos');
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredProducts =
    activeCategory === 'Todos'
      ? products
      : products.filter((p) => p.attributes.categoria === activeCategory);

  useLayoutEffect(() => {
    if (gridRef.current) {
      const cards = gsap.utils.toArray('.product-card');
      gsap.from(cards, {
        opacity: 0,
        y: 50,
        duration: 0.5,
        stagger: 0.1,
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 80%',
        }
      });
    }
  }, [activeCategory]); // Re-run animation when category changes

  return (
    <div>
      {/* Category Tabs */}
      <div className="flex justify-center gap-2 md:gap-4 mb-12 flex-wrap">
        <button
          onClick={() => setActiveCategory('Todos')}
          className={`px-6 py-2 rounded-full font-semibold transition-colors text-sm md:text-base ${
            activeCategory === 'Todos' ? 'bg-brown text-cream' : 'bg-white text-brown hover:bg-gold/10'
          }`}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-2 rounded-full font-semibold transition-colors text-sm md:text-base ${
              activeCategory === category ? 'bg-brown text-cream' : 'bg-white text-brown hover:bg-gold/10'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105 opacity-0">
            <h2 className="text-2xl font-serif font-bold text-dark-brown">{product.attributes.nombre}</h2>
            <p className="text-brown mt-2 h-12">{product.attributes.descripcion}</p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-lg font-bold text-gold">{product.attributes.precio.toFixed(2)}€</span>
              <span className="text-sm bg-light-gold/50 text-gold font-semibold px-3 py-1 rounded-full">{product.attributes.categoria}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuClient;
