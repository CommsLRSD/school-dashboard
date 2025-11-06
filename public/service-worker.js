// Service Worker for School Dashboard PWA
// Version 1.1.0 - Updated for GitHub Pages sub-path deployment

const CACHE_NAME = 'school-dashboard-v1.1';
// Base path for GitHub Pages deployment
const BASE_PATH = '/school-dashboard';
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/styles.css`,
  `${BASE_PATH}/app.js`,
  `${BASE_PATH}/config.js`,
  `${BASE_PATH}/public/favicon.svg`,
  `${BASE_PATH}/public/apple-icon.png`,
  `${BASE_PATH}/public/android-maskable-icon.png.png`,
  `${BASE_PATH}/public/android-icon.png`,
  `${BASE_PATH}/public/lrsd-logo.svg`,
  `${BASE_PATH}/public/dashboard-logo.svg`,
  `${BASE_PATH}/public/dashboard-logo-mobile.svg`,
  `${BASE_PATH}/public/hamburger.svg`,
  `${BASE_PATH}/public/vendor/chart.umd.min.js`,
  `${BASE_PATH}/public/vendor/chartjs-plugin-datalabels.min.js`
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and non-GET requests
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }

  // Skip if request is not within our base path scope
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith(BASE_PATH)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response from cache
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched resource
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Network request failed, try to serve from cache
          return caches.match(event.request);
        });
      })
  );
});
