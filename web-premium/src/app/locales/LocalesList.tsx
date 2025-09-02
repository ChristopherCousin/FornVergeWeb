"use client";

import { Local, StrapiData } from "@/lib/strapi/api";
import Link from "next/link";
import React, { useLayoutEffect, useRef } from "react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface LocalesListProps {
  locales: StrapiData<Local>[];
}

const LocalesList: React.FC<LocalesListProps> = ({ locales }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (gridRef.current) {
      const cards = gsap.utils.toArray('.local-card');
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
  }, []);

  return (
    <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {locales.map((local) => (
        <div key={local.id} className="local-card bg-white p-8 rounded-lg shadow-lg text-center transition-transform hover:scale-105 opacity-0">
          <h2 className="text-3xl font-serif font-bold text-dark-brown">{local.attributes.nombre}</h2>
          <p className="text-brown mt-2 mb-6">{local.attributes.direccion}</p>
          <Link
            href={`/locales/${local.attributes.slug}`}
            className="inline-block bg-brown text-cream font-semibold px-6 py-3 rounded-full hover:bg-gold transition-colors"
          >
            Ver Local
          </Link>
        </div>
      ))}
    </div>
  );
};

export default LocalesList;
