import { getProducts } from '@/lib/strapi/api';
import React from 'react';
import MenuClient from './MenuClient';

const MenuPage = async () => {
  const products = await getProducts();
  const categories = [...new Set(products.map(p => p.attributes.categoria))];

  return (
    <div className="pt-24 container mx-auto px-4 pb-16">
      <h1 className="text-6xl font-serif font-bold text-center text-dark-brown mb-12">
        Nuestra Carta
      </h1>
      
      {products.length === 0 ? (
        <p className="text-center">No hay productos disponibles. Añade algunos en Strapi.</p>
      ) : (
        <MenuClient products={products} categories={categories} />
      )}
    </div>
  );
};

export default MenuPage;
