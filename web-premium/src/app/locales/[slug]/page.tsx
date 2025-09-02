import { getLocalBySlug } from '@/lib/strapi/api';
import { notFound } from 'next/navigation';
import React from 'react';

interface LocalDetailPageProps {
  params: {
    slug: string;
  };
}

const LocalDetailPage: React.FC<LocalDetailPageProps> = async ({ params }) => {
  const local = await getLocalBySlug(params.slug);

  if (!local) {
    return notFound();
  }

  return (
    <div className="pt-24 container mx-auto px-4 pb-16">
      <div className="text-center">
        <h1 className="text-6xl font-serif font-bold text-dark-brown">{local.attributes.nombre}</h1>
        <p className="text-2xl font-semibold text-gold mt-2">{local.attributes.direccion}</p>
      </div>

      <div className="mt-16 text-center">
        <p>
          Aquí iría más información sobre el local, como un mapa,
          horarios, galería de fotos, etc.
        </p>
      </div>
    </div>
  );
};

export default LocalDetailPage;
