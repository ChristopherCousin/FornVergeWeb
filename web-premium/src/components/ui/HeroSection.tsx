"use client";

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        duration: 1,
        opacity: 0,
        y: 50,
        ease: 'power3.out',
        delay: 0.2,
      });

      gsap.from(subtitleRef.current, {
        duration: 1,
        opacity: 0,
        y: 50,
        ease: 'power3.out',
        delay: 0.4,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      id="inicio" 
      ref={containerRef}
      className="h-screen w-full flex items-center justify-center bg-cream relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gold/20 z-0">
        {/* Placeholder for a future background image or video */}
      </div>
      <div className="text-center z-10">
        <h1 ref={titleRef} className="text-6xl md:text-8xl font-serif font-black text-dark-brown">
          MASSA
        </h1>
        <p ref={subtitleRef} className="text-xl md:text-2xl font-sans text-gold font-semibold mt-2 tracking-wider">
          Cadena de Cafeterías & Panaderías Artesanales
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
