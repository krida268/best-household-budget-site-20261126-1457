// charts.js — small chart builders that render with plain HTML/CSS only:
// horizontal category bars and a grouped monthly column chart. No library,
// no canvas, no network.

import { rupiahShort, monthShort } from './format.js';

export function categoryBars(rows, maxValue) {
  // rows: [{label, value, className}] — sorted by caller.
  const max = maxValue || Math.max(1, ...rows.map((r) => r.value));
  return rows.map((row) => {
    const width = Math.max(2, Math.round((row.value / max) * 100));
    return (
      '<div class="bar-row">' +
      '<span class="bar-label">' + row.label + '</span>' +
      '<div class="bar-track"><div class="bar-fill ' + (row.className || '') + '" style="width:' + width + '%"></div></div>' +
      '<span class="bar-value">' + rupiahShort(row.value) + '</span>' +
      '</div>'
    );
  }).join('');
}

export function monthlyColumns(history) {
  // history: [{month, income, expense}] — oldest first.
  const max = Math.max(1, ...history.flatMap((h) => [h.income, h.expense]));
  const cols = history.map((h) => {
    const inH = Math.max(3, Math.round((h.income / max) * 150));
    const outH = Math.max(3, Math.round((h.expense / max) * 150));
    return (
      '<div class="col">' +
      '<div class="pair">' +
      '<div class="stick in" style="height:' + inH + 'px" title="Pemasukan ' + monthShort(h.month) + ': ' + h.income.toLocaleString('id-ID') + '"></div>' +
      '<div class="stick out" style="height:' + outH + 'px" title="Pengeluaran ' + monthShort(h.month) + ': ' + h.expense.toLocaleString('id-ID') + '"></div>' +
      '</div>' +
      '<span class="cap">' + monthShort(h.month) + '</span>' +
      '</div>'
    );
  }).join('');
  return (
    '<div class="chart" role="img" aria-label="Grafik pemasukan dan pengeluaran 6 bulan terakhir">' + cols + '</div>' +
    '<div class="chart-key"><span><i class="k-in"></i>Pemasukan</span><span><i class="k-out"></i>Pengeluaran</span></div>'
  );
}
