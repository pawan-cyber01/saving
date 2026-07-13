// sw.js — Service Worker for SaveLock PWA
// Provides offline support, caching, and background sync

const CACHE_NAME = 'savelock-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/firebase.js',
  '/js/utils.js',
  '/js/theme.js',
  '/js/notifications.js',
  '/js/upi.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/savings.js',
  '/js/expenses.js',
  '/js/budget.js',
  '/js/goals.js',
  '/js/locked.js',
  '/js/analytics.js',
  '/js/calendar.js',
  '/js/reports.js',
  '/js/profile.js',
  '/js/admin.js',
  '/js/app.js',
  '/manifest.json',
];

// Offline fallback page
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaveLock – Offline</title>
  <style>
    body { background:#07091a; color:#f0f4fc; font-family:system-ui,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; text-align:center; padding:24px; }
    .card { background:#131c35; border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:40px 32px; max-width:400px; }
    h1 { font-size:1.75rem; font-weight:700; margin-bottom:8px; }
    p { color:#8895b3; margin-bottom:24px; }
    button { background:linear-gradient(135deg,#7c3aed,#14b8a6); color:white; border:none; border-radius:12px; padding:12px 28px; font-size:1rem; font-weight:600; cursor:pointer; }
    .icon { font-size:3rem; margin-bottom:16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📵</div>
    <h1>You're Offline</h1>
    <p>SaveLock needs an internet connection to sync your data. Please check your connection and try again.</p>
    <button onclick="location.reload()">Try Again</button>
  </div>
</body>
</html>`;

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Failed to cache some assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, non-HTTP, and Firebase/CDN requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (url.hostname.includes('firestore') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) return;
  if (url.hostname.includes('cdn.jsdelivr') || url.hostname.includes('cdnjs') || url.hostname.includes('fonts.google')) {
    // Network-first for CDN assets (they may update)
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Network-first for local static assets to ensure latest updates
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then(cached => {
          if (cached) return cached;
          
          // Return offline page for navigation requests if network fails and no cache
          if (request.mode === 'navigate') {
            return new Response(OFFLINE_HTML, {
              headers: { 'Content-Type': 'text/html' },
            });
          }
        });
      })
  );
});

// ─── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'SaveLock', {
      body: data.body || '',
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-72.png',
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// ─── Daily Reminder Alarm ────────────────────────────────────────────────────
let reminderTimer = null;

function scheduleNextReminder(hour, minute) {
  if (reminderTimer) clearTimeout(reminderTimer);

  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);

  // If time already passed today, schedule for tomorrow
  if (next <= now) next.setDate(next.getDate() + 1);

  const msUntil = next - now;

  reminderTimer = setTimeout(() => {
    // Tell all open app windows to check-and-notify
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) {
        // App is open — let the app handle it
        clients.forEach(c => c.postMessage({ type: 'CHECK_AND_NOTIFY' }));
      } else {
        // App is closed — show notification directly from SW
        self.registration.showNotification('💰 SaveLock Reminder', {
          body: "You haven't saved yet today! Keep your streak alive 🔥",
          icon: '/assets/icons/icon-192.png',
          badge: '/assets/icons/icon-72.png',
          tag: 'savelock-reminder',
          renotify: true,
          actions: [
            { action: 'open', title: '💰 Save Now' },
            { action: 'dismiss', title: 'Later' }
          ]
        });
      }
    });

    // Reschedule for next day
    scheduleNextReminder(hour, minute);
  }, msUntil);
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_DAILY_REMINDER') {
    const { hour, minute } = event.data;
    scheduleNextReminder(hour, minute);
  }
});

