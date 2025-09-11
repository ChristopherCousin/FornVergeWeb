interface StrapiData<T> {
  id: number;
  attributes: T;
}

interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface Product {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: 'Dulce' | 'Salado' | 'Cafe' | 'Bebidas';
}

export interface Local {
  nombre: string;
  direccion: string;
  slug: string;
}

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${STRAPI_URL}/api/${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
    next: { revalidate: 3600 } // Revalidate every hour
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    throw new Error(`Failed to fetch API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getProducts(): Promise<StrapiData<Product>[]> {
  try {
    const response = await fetchApi<StrapiResponse<StrapiData<Product>[]>>('productos');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getLocals(): Promise<StrapiData<Local>[]> {
  try {
    const response = await fetchApi<StrapiResponse<StrapiData<Local>[]>>('locales');
    return response.data;
  } catch (error) {
    console.error('Error fetching locals:', error);
    return [];
  }
}

export async function getLocalBySlug(slug: string): Promise<StrapiData<Local> | null> {
  try {
    const response = await fetchApi<StrapiResponse<StrapiData<Local>[]>>(`locales?filters[slug][$eq]=${slug}`);
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error(`Error fetching local by slug ${slug}:`, error);
    return null;
  }
}
