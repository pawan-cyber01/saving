// sw.js — Service Worker for SaveLock PWA
// Provides offline support, caching, and background sync

const CACHE_NAME = 'savelock-v1.1.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/space.css',
  '/js/firebase.js',
  '/js/utils.js',
  '/js/theme.js',
  '/js/notifications.js',
  '/js/upi.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/savings.js',
  '/js/expenses.js',
  '/js/income.js',
  '/js/budget.js',
  '/js/goals.js',
  '/js/locked.js',
  '/js/analytics.js',
  '/js/calendar.js',
  '/js/reports.js',
  '/js/profile.js',
  '/js/admin.js',
  '/js/app.js',
  '/js/space-bg.js',
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

  // Skip non-GET, non-HTTP, and Firebase/CDN API requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (url.hostname.includes('firestore') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) return;

  // Stale-While-Revalidate Strategy for instant PWA loading
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Background fetch to update the cache
      const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.ok) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(err => {
        // If network fails, and we have no cache, return offline fallback for navigation
        if (request.mode === 'navigate' && !cachedResponse) {
          return new Response(OFFLINE_HTML, {
            headers: { 'Content-Type': 'text/html' },
          });
        }
        throw err;
      });

      // Return cached immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
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

// ─── Daily Reminder Alarms (up to 3 per day) ─────────────────────────────────
const reminderTimers = [];

function clearAllTimers() {
  reminderTimers.forEach(t => clearTimeout(t));
  reminderTimers.length = 0;
}

function getTimeMessage(hour) {
  if (hour < 12) return "Good morning! 🌅 Don't forget to save today!";
  if (hour < 17) return "Afternoon check-in! 💰 Have you saved today?";
  return "Evening reminder! 🌙 Still time to save today — don't break your streak!";
}

function scheduleOneAlarm(hour, minute) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const msUntil = next - now;

  const t = setTimeout(() => {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) {
        clients.forEach(c => c.postMessage({ type: 'CHECK_AND_NOTIFY' }));
      } else {
        self.registration.showNotification('💰 SaveLock Reminder', {
          body: getTimeMessage(hour),
          icon: '/assets/icons/icon-192.png',
          badge: '/assets/icons/icon-72.png',
          tag: `savelock-reminder-${hour}`,
          renotify: true,
          actions: [
            { action: 'open', title: '💰 Save Now' },
            { action: 'dismiss', title: 'Later' }
          ]
        });
      }
    });
    // Reschedule for next day
    scheduleOneAlarm(hour, minute);
  }, msUntil);
  reminderTimers.push(t);
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_DAILY_REMINDERS') {
    clearAllTimers();
    const times = event.data.times || [
      { hour: 8, minute: 0 },
      { hour: 14, minute: 0 },
      { hour: 20, minute: 0 },
    ];
    times.forEach(({ hour, minute }) => scheduleOneAlarm(hour, minute));
  }
  // Legacy single-time support
  if (event.data && event.data.type === 'SCHEDULE_DAILY_REMINDER') {
    clearAllTimers();
    scheduleOneAlarm(event.data.hour, event.data.minute);
  }
});
