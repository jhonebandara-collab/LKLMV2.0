/* ==========================================================================
 * sw.js — LK Lottery Master · Service Worker (offline cache)
 * ==========================================================================
 *
 * 🎯 අරමුණ: internet නැති වුනත් app එක **load වෙන්න ඕන** සහ පසුගිය ප්‍රතිඵල
 *    බලාගන්න පුළුවන් වෙන්න ඕන.
 *
 * Cache 3ක් තියෙනවා:
 *   1. `lkm-shell-<v>`  → app එකේ HTML/CSS/JS/icon (install වෙද්දීම save)
 *   2. `lkm-api-<v>`    → /api/... GET පිළිතුරු (network-first, offline එකට fallback)
 *   3. `lkm-bundle-<v>` → /api/offline-bundle (draws ටික — cache-first)
 *
 * ⚠️ POST requests කවදාවත් cache කරන්නේ නෑ (scan/check දත්ත cache කරන එක
 *    අවදානම් — user එකෙකුට තව කෙනෙකුගේ ප්‍රතිඵලයක් යන්න පුළුවන්).
 *    Offline check එක client එකේම (offline.js + prize-engine.js) වෙනවා.
 *
 * ⚠️ Login/admin/billing endpoints cache කරන්නේ නෑ (privacy + correctness).
 * ========================================================================== */

'use strict';

const VERSION = 'v1';
const SHELL_CACHE = 'lkm-shell-' + VERSION;
const API_CACHE = 'lkm-api-' + VERSION;
const BUNDLE_CACHE = 'lkm-bundle-' + VERSION;

/** Offline එකට අනිවාර්යයෙන් ඕන files */
const SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/qr-parse.js',
  '/qr-decode.js',
  '/voice.js',
  '/vendor/jsqr.min.js',
  '/prize-engine.js',
  '/offline.js',
  '/manifest.webmanifest',
  '/app-icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon-32.png',
  '/apple-touch-icon.png',
];

/** Cache කරන්න බඩු නැති (හෝ අවදානම්) API paths */
const API_NO_CACHE = [
  '/api/auth',
  '/api/admin',
  '/api/billing',
  '/api/me',
  '/api/profile',
  '/api/history',
  '/api/report',
  '/api/lucky',
  '/api/scrape',
];

function isNoCacheApi(url) {
  return API_NO_CACHE.some(p => url.pathname.startsWith(p));
}

/* ---------------------------------------------------------------- install */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // එක file එකක් fail වුනත් install එක නවත්තන්නේ නෑ (ඉතුරු ඒවා save වෙනවා)
    await Promise.all(SHELL_FILES.map(async f => {
      try {
        await cache.add(new Request(f, { cache: 'reload' }));
      } catch (e) { /* මේ file එක නැති වුනාට app එක කැඩෙන්නේ නෑ */ }
    }));
  })());
  // දැනට open වෙලා තියෙන පිටු නවත්තන්නේ නෑ — update එක ලැබුනාම
  // client එකෙන් "reload" කියලා අහනවා (offline.js).
});

/* ---------------------------------------------------------------- activate */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = [SHELL_CACHE, API_CACHE, BUNDLE_CACHE];
    const names = await caches.keys();
    await Promise.all(names.map(n => (keep.includes(n) ? null : caches.delete(n))));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch (e) {}
    }
    await self.clients.claim();
  })());
});

/* ---------------------------------------------------------------- message */
self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();

  // Client එකෙන් bundle එක prefetch කරන්න කියනවා
  if (data.type === 'PREFETCH_BUNDLE') {
    event.waitUntil((async () => {
      try {
        const res = await fetch('/api/offline-bundle', { cache: 'no-store' });
        if (res && res.ok) {
          const cache = await caches.open(BUNDLE_CACHE);
          await cache.put('/api/offline-bundle', res.clone());
        }
      } catch (e) { /* offline — පස්සේ try කරනවා */ }
    })());
  }
});

/* ---------------------------------------------------------------- fetch */
self.addEventListener('fetch', event => {
  const req = event.request;

  // GET විතරයි — POST/PUT/DELETE කවදාවත් cache කරන්නේ නෑ
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  // අපේ origin එකේ ඒවා විතරයි (Google/Fonts වගේ ඒවා browser cache එකට බාර)
  if (url.origin !== self.location.origin) return;

  // --- 1. Page navigation → network-first, බැරි නම් cache → offline.html
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put('/index.html', res.clone()).catch(() => {});
        }
        return res;
      } catch (e) {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match('/index.html')) ||
               (await cache.match('/')) ||
               (await cache.match('/offline.html')) ||
               new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  // --- 2. Offline bundle → cache-first (දවසට දෙපාරක් විතරයි වෙනස් වෙන්නේ)
  if (url.pathname === '/api/offline-bundle') {
    event.respondWith((async () => {
      const cache = await caches.open(BUNDLE_CACHE);
      const hit = await cache.match('/api/offline-bundle');
      if (hit) {
        // background එකේ අලුත් එකක් ගන්න උත්සාහ කරනවා (හැම වෙලාවෙම නෑ)
        event.waitUntil((async () => {
          try {
            const fresh = await fetch(req);
            if (fresh && fresh.ok) await cache.put('/api/offline-bundle', fresh.clone());
          } catch (e) {}
        })());
        return hit;
      }
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put('/api/offline-bundle', res.clone()).catch(() => {});
        return res;
      } catch (e) {
        return new Response(JSON.stringify({ error: 'offline', lotteries: [] }), {
          status: 503, headers: { 'Content-Type': 'application/json' },
        });
      }
    })());
    return;
  }

  // --- 3. අනිත් /api GET → network-first, fail වුනොත් cache එකෙන්
  if (url.pathname.startsWith('/api/')) {
    if (isNoCacheApi(url)) return;               // cache කරන්නේ නෑ → එහෙමම යාවෙන්න දෙනවා
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE);
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch (e) {
        const hit = await cache.match(req);
        if (hit) {
          // Client එකට කියන්නේ cache එකකින් ආවා කියලා
          const headers = new Headers(hit.headers);
          headers.set('X-LKM-Cache', 'hit');
          return new Response(await hit.blob(), {
            status: hit.status, statusText: hit.statusText, headers,
          });
        }
        return new Response(JSON.stringify({ error: 'offline', offline: true }), {
          status: 503, headers: { 'Content-Type': 'application/json' },
        });
      }
    })());
    return;
  }

  // --- 4. Static files → stale-while-revalidate (වේගවත් + අලුත්)
  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const hit = await cache.match(req);
    const network = fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);
    return hit || (await network) || new Response('', { status: 504 });
  })());
});
