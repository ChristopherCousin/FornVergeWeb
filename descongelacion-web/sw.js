// ===== SERVICE WORKER PARA FORN VERGE =====
const CACHE_NAME = 'forn-verge-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/config.js',
    '/manifest.json',
    'https://unpkg.com/@supabase/supabase-js@2'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Archivos cacheados');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
    console.log('✅ Service Worker: Activado');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Eliminar caches antiguos
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Intercepción de peticiones (estrategia Network First)
self.addEventListener('fetch', event => {
    // Solo interceptar peticiones GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Estrategia diferente según el tipo de recurso
    if (event.request.url.includes('supabase.co')) {
        // Para API de Supabase: Network First (priorizar datos frescos)
        event.respondWith(networkFirstStrategy(event.request));
    } else {
        // Para recursos estáticos: Cache First
        event.respondWith(cacheFirstStrategy(event.request));
    }
});

// Estrategia Network First - Intenta red primero, luego cache
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Solo cachear respuestas exitosas
        if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, responseClone);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('🌐 Network First: Usando cache para:', request.url);
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response('Sin conexión', { 
            status: 503, 
            statusText: 'Service Unavailable' 
        });
    }
}

// Estrategia Cache First - Intenta cache primero, luego red
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, responseClone);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('❌ Cache First: No disponible:', request.url);
        return new Response('Recurso no disponible', { 
            status: 404, 
            statusText: 'Not Found' 
        });
    }
}

// Manejo de mensajes del cliente
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        // Forzar actualización de cache
        updateCache();
    }
});

// Función para actualizar cache manualmente
async function updateCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urlsToCache);
        console.log('🔄 Cache actualizado manualmente');
    } catch (error) {
        console.error('❌ Error actualizando cache:', error);
    }
}

// Manejo de sincronización en background (si el navegador lo soporta)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('🔄 Sincronización en background');
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Aquí podrías sincronizar datos pendientes cuando se recupere la conexión
    console.log('📡 Realizando sincronización en background');
}

// Manejo de notificaciones push (opcional para futuras funcionalidades)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Ver detalles',
                    icon: '/icon-96x96.png'
                },
                {
                    action: 'close',
                    title: 'Cerrar',
                    icon: '/icon-96x96.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        // Abrir la aplicación
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('🚀 Service Worker cargado para Forn Verge'); 