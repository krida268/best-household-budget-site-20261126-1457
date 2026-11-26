// format.js — formatting helpers for Rupiah amounts, dates and percents.
// Pure functions, no DOM access, no network.

export function rupiah(amount) {
  const n = Math.round(Number(amount) || 0);
  return 'Rp' + n.toLocaleString('id-ID');
}

export function rupiahShort(amount) {
  const n = Math.abs(Number(amount) || 0);
  if (n >= 1000000) return 'Rp' + (n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' jt';
  if (n >= 1000) return 'Rp' + (n / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' rb';
  return rupiah(amount);
}

export function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return MONTH_NAMES[m - 1] + ' ' + y;
}

export function monthShort(ym) {
  const [y, m] = ym.split('-').map(Number);
  return MONTH_NAMES[m - 1].slice(0, 3) + ' ' + String(y).slice(2);
}

export function dateLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return d + ' ' + MONTH_NAMES[m - 1] + ' ' + y;
}

export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
