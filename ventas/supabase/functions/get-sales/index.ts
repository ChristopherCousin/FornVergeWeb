import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Configuración de la API de Ágora (se configurará en los secrets de Supabase)
const AGORA_URL = Deno.env.get('AGORA_URL') || '';
const AGORA_TOKEN = Deno.env.get('AGORA_TOKEN') || '';

interface Invoice {
  Totals?: {
    GrossAmount?: number;
  };
}

interface AgoraResponse {
  Invoices?: Invoice[];
}

serve(async (req) => {
  try {
    // Verificar que tenemos las variables de entorno necesarias
    if (!AGORA_URL || !AGORA_TOKEN) {
      throw new Error('Configuración de API incompleta');
    }

    // Construir la URL para obtener las facturas del día
    const url = `${AGORA_URL}/export/?filter=Invoices`;

    // Realizar la petición a la API de Ágora
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Api-Token': AGORA_TOKEN,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error en la API de Ágora: ${response.status}`);
    }

    const data: AgoraResponse = await response.json();
    
    // Calcular el total de ventas
    let totalVentas = 0;
    if (data.Invoices && Array.isArray(data.Invoices)) {
      totalVentas = data.Invoices.reduce((total, factura) => {
        return total + (factura.Totals?.GrossAmount || 0);
      }, 0);
    }

    // Devolver la respuesta
    return new Response(
      JSON.stringify({
        total: totalVentas,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type'
        }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}); 