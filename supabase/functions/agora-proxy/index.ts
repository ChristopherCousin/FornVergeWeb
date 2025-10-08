// Edge Function para proxy HTTPS → HTTP hacia AGORA
// Soluciona el problema de mixed content en producción

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, api-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Obtener parámetros del body
    const { agoraUrl, payload, apiToken } = await req.json();

    if (!agoraUrl || !payload || !apiToken) {
      throw new Error('Faltan parámetros: agoraUrl, payload o apiToken');
    }

    console.log(`📡 [Proxy] Redirigiendo a: ${agoraUrl}/api/custom-query`);

    // Hacer la llamada HTTP a AGORA desde el servidor
    const response = await fetch(`${agoraUrl}/api/custom-query`, {
      method: 'POST',
      headers: {
        'Api-Token': apiToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP de AGORA: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('❌ [Proxy] Error:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error desconocido en el proxy'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
