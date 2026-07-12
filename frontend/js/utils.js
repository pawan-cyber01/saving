// utils.js — Shared utility functions for SaveLock

// ─── Currency ────────────────────────────────────────────────────────────────
function formatCurrency(amount, symbol = '₹') {
  const num = Number(amount) || 0;
  if (num >= 10000000) return `${symbol}${(num/10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${symbol}${(num/100000).toFixed(2)}L`;
  if (num >= 1000) return `${symbol}${(num/1000).toFixed(1)}K`;
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatCurrencyFull(amount, symbol = '₹') {
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Dates ───────────────────────────────────────────────────────────────────
function getDateStr(date = new Date()) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getTodayStr() { return getDateStr(new Date()); }

function getMonthStr(date = new Date()) {
  return date.toISOString().substring(0, 7); // YYYY-MM
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0,0,0,0);
  return d;
}

function getStartOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getStartOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1);
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthDates(year, month) {
  const days = [];
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(getDateStr(new Date(d)));
  }
  return days;
}

function countdownTo1st() {
  const now = new Date();
  const next1st = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  const diff = next1st - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isUnlocked: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, isUnlocked: now.getDate() === 1 };
}

function relativeTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateShort(getDateStr(d));
}

// ─── DOM Helpers ─────────────────────────────────────────────────────────────
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
}

// ─── Toast Notifications ─────────────────────────────────────────────────────
const toastTimers = {};

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  const id = 'toast-' + Date.now();
  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="flex-shrink-0">${icons[type] || icons.info}</div>
    <p class="flex-1 text-sm" style="color: var(--text-primary);">${message}</p>
    <button onclick="removeToast('${id}')" style="color: var(--text-secondary); background:none; border:none; cursor:pointer; padding:0; flex-shrink:0;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  container.appendChild(toast);

  toastTimers[id] = setTimeout(() => removeToast(id), duration);
}

function removeToast(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.animation = 'slideInRight 0.2s ease reverse forwards';
    setTimeout(() => el.remove(), 200);
    clearTimeout(toastTimers[id]);
  }
}

// ─── Loading State ────────────────────────────────────────────────────────────
function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> Loading...`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
  }
}

// ─── Input Sanitization ───────────────────────────────────────────────────────
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '').trim();
}

function parseAmount(val) {
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'food',          label: 'Food',         emoji: '🍔', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  { id: 'travel',        label: 'Travel',        emoji: '✈️', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { id: 'shopping',      label: 'Shopping',      emoji: '🛍️', color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  { id: 'recharge',      label: 'Recharge',      emoji: '📱', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  { id: 'bills',         label: 'Bills',         emoji: '📋', color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
  { id: 'entertainment', label: 'Fun',           emoji: '🎬', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { id: 'health',        label: 'Health',        emoji: '💊', color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  { id: 'education',     label: 'Education',     emoji: '📚', color: '#14b8a6', bg: 'rgba(20,184,166,0.15)' },
  { id: 'fuel',          label: 'Fuel',          emoji: '⛽', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)'},
  { id: 'emi',           label: 'EMI',           emoji: '🏦', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  { id: 'other',         label: 'Other',         emoji: '💰', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)'},
];

function getCategoryInfo(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

// ─── Payment Methods ──────────────────────────────────────────────────────────
const PAYMENT_METHODS = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'];

// ─── Number Animation ────────────────────────────────────────────────────────
function animateNumber(el, from, to, duration = 800, prefix = '₹') {
  if (!el) return;
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = from + (to - from) * ease;
    el.textContent = prefix + current.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = prefix + to.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };
  requestAnimationFrame(update);
}

// ─── Percentage ───────────────────────────────────────────────────────────────
function pct(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

// ─── Skeleton HTML ────────────────────────────────────────────────────────────
function skeletonCard(lines = 2) {
  return `<div class="card">
    <div class="skeleton h-4 w-3/4 mb-3"></div>
    ${Array(lines).fill('<div class="skeleton h-3 w-full mb-2"></div>').join('')}
  </div>`;
}

// ─── Goal Icons ───────────────────────────────────────────────────────────────
const GOAL_ICONS = {
  bike: '🏍️', laptop: '💻', trip: '✈️', emergency: '🆘',
  phone: '📱', house: '🏠', car: '🚗', education: '📚',
  wedding: '💒', custom: '🎯',
};

function getGoalIcon(name) {
  const n = (name || '').toLowerCase();
  for (const [k, v] of Object.entries(GOAL_ICONS)) {
    if (n.includes(k)) return v;
  }
  return '🎯';
}

// ─── Chart.js default theme config ───────────────────────────────────────────
function getChartDefaults() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    color: isDark ? '#8895b3' : '#64748b',
    gridColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  };
}

// ─── Uid getter ───────────────────────────────────────────────────────────────
function getUID() {
  return AUTH.currentUser ? AUTH.currentUser.uid : null;
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function showConfirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, danger = false }) {
  document.getElementById('confirm-modal-body').innerHTML = `
    <div class="text-center">
      <div class="text-4xl mb-4">${danger ? '⚠️' : '❓'}</div>
      <h3 class="font-outfit font-semibold text-lg mb-2" style="color:var(--text-primary)">${title}</h3>
      <p class="text-sm mb-6" style="color:var(--text-secondary)">${message}</p>
      <div class="flex gap-3">
        <button onclick="closeModal('confirm-modal')" class="btn-secondary flex-1">${cancelText}</button>
        <button id="confirm-ok-btn" class="${danger ? 'btn-danger' : 'btn-primary'} flex-1">${confirmText}</button>
      </div>
    </div>
  `;
  openModal('confirm-modal');
  document.getElementById('confirm-ok-btn').onclick = () => {
    closeModal('confirm-modal');
    onConfirm && onConfirm();
  };
}
