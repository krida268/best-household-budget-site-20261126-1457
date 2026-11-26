// router.js — hash routing for DompetKeluarga. Routes are plain hashes
// (#/, #/transaksi, ...) so the static site works from any static server.

export const ROUTES = {
  '/': 'dashboard',
  '/transaksi': 'transaksi',
  '/anggaran': 'anggaran',
  '/tabungan': 'tabungan',
  '/kalkulator': 'kalkulator',
  '/laporan': 'laporan',
  '/panduan': 'panduan',
};

export function currentRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const path = hash.split('?')[0];
  return ROUTES[path] ? path : '/';
}

export function parseQuery() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const query = {};
  const q = hash.split('?')[1];
  if (q) {
    for (const pair of q.split('&')) {
      const [k, v] = pair.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }
  return query;
}

export function setActiveNav(route) {
  const name = ROUTES[route] || 'dashboard';
  for (const link of document.querySelectorAll('[data-nav]')) {
    link.classList.toggle('active', link.dataset.nav === name);
  }
}
