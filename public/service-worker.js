// Service Worker for School Dashboard PWA
// Version 1.3.0 - Uses registration scope so it works from subfolders.
// Bump CACHE_NAME whenever app.js, styles.css or index.html change so that
// published fixes are not masked by a previously installed service worker.

const CACHE_NAME = 'school-dashboard-v1.3';
// Build the app base path from registration scope (e.g. /school-dashboard/)
const APP_BASE_PATH = new URL(self.registration.scope).pathname;
// Application code and markup must always reflect the deployed version, so they
// are fetched from the network first and only fall back to the cache offline.
const NETWORK_FIRST_PATHS = [
  `${APP_BASE_PATH}`,
  `${APP_BASE_PATH}index.html`,
  `${APP_BASE_PATH}styles.css`,
  `${APP_BASE_PATH}app.js`,
  `${APP_BASE_PATH}card-renderer.js`,
  `${APP_BASE_PATH}config.js`
];
const urlsToCache = [
  `${APP_BASE_PATH}`,
  `${APP_BASE_PATH}index.html`,
  `${APP_BASE_PATH}styles.css`,
  `${APP_BASE_PATH}app.js`,
  `${APP_BASE_PATH}card-renderer.js`,
  `${APP_BASE_PATH}config.js`,
  `${APP_BASE_PATH}public/manifest.json`,
  `${APP_BASE_PATH}public/favicon.svg`,
  `${APP_BASE_PATH}public/apple-icon.png`,
  `${APP_BASE_PATH}public/android-maskable-icon.png`,
  `${APP_BASE_PATH}public/android-icon.png`,
  `${APP_BASE_PATH}public/lrsd-logo.svg`,
  `${APP_BASE_PATH}public/dashboard-logo.svg`,
  `${APP_BASE_PATH}public/dashboard-logo-mobile.svg`,
  `${APP_BASE_PATH}public/hamburger.svg`,
  `${APP_BASE_PATH}public/vendor/chart.umd.min.js`,
  `${APP_BASE_PATH}public/vendor/chartjs-plugin-datalabels.min.js`
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

  // Skip if request is not within this app's scope path
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith(APP_BASE_PATH)) {
    return;
  }

  // Never cache the WordPress plugin's school data; always use the live response
  // so edits made in the plugin appear immediately.
  if (url.pathname.indexOf('/wp-json/') !== -1) {
    return;
  }

  // Application code and markup: network first, cache only as an offline fallback.
  if (NETWORK_FIRST_PATHS.indexOf(url.pathname) !== -1) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== 'error') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
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
