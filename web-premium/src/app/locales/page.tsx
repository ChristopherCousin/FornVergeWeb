import { getLocals } from '@/lib/strapi/api';
import React from 'react';
import LocalesList from './LocalesList';

const LocalesPage = async () => {
  const locales = await getLocals();

  return (
    <div className="pt-24 container mx-auto px-4 pb-16">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-serif font-bold text-dark-brown">Nuestros Locales</h1>
        <p className="text-lg text-brown mt-2">Elige tu MASSA más cercano. Misma esencia, dos ubicaciones.</p>
      </div>

      {locales.length === 0 ? (
        <p className="text-center">No hay locales disponibles. Añade algunos en Strapi.</p>
      ) : (
        <LocalesList locales={locales} />
      )}
    </div>
  );
};

export default LocalesPage;
