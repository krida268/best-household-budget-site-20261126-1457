// views.js — every page of DompetKeluarga, rendered from the ledger in data.js.
// Each view returns an HTML string; app.js wires the forms and buttons after render.

import { rupiah, rupiahShort, pct, monthLabel, dateLabel, escapeHtml } from './format.js';
import {
  CATEGORIES, INCOME_SOURCES, incomeForMonth, expensesForMonth, sumAmount,
  totalsForMonth, spendByCategory, budgetTotal, historyWithCurrent,
} from './data.js';
import { categoryBars, monthlyColumns } from './charts.js';

function summaryTiles(state, ym) {
  const t = totalsForMonth(state, ym);
  const budget = budgetTotal(state);
  const savedThisMonth = state.savingsTargetMonthly;
  const afterSaving = t.balance - savedThisMonth;
  return (
    '<div class="grid cols-4">' +
    '<section class="card tile income"><div class="label">Pemasukan</div><div class="value">' + rupiah(t.income) + '</div><div class="note">' + incomeForMonth(state, ym).length + ' sumber pemasukan bulan ini</div></section>' +
    '<section class="card tile expense"><div class="label">Pengeluaran</div><div class="value">' + rupiah(t.expense) + '</div><div class="note">' + pct(t.expense, budget) + '% dari anggaran ' + rupiahShort(budget) + '</div><div class="bar"><span style="width:' + Math.min(100, pct(t.expense, budget)) + '%"></span></div></section>' +
    '<section class="card tile"><div class="label">Sisa Uang</div><div class="value">' + rupiah(t.balance) + '</div><div class="note">Pemasukan dikurangi pengeluaran</div></section>' +
    '<section class="card tile savings"><div class="label">Target Tabungan</div><div class="value">' + rupiah(savedThisMonth) + '</div><div class="note">' + (afterSaving >= 0 ? 'Sisa setelah menabung: ' + rupiah(afterSaving) : 'Melebihi sisa uang bulan ini!') + '</div></section>' +
    '</div>'
  );
}

function recentTable(state, ym, limit) {
  const rows = [...expensesForMonth(state, ym), ...incomeForMonth(state, ym)]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit || 8);
  const body = rows.map((row) => {
    const isIncome = 'source' in row;
    return (
      '<tr><td>' + dateLabel(row.date) + '</td>' +
      '<td>' + escapeHtml(row.detail) + '</td>' +
      '<td><span class="pill">' + escapeHtml(isIncome ? row.source : row.category) + '</span></td>' +
      '<td class="num ' + (isIncome ? 'pos' : 'neg') + '">' + (isIncome ? '+' : '−') + rupiah(row.amount) + '</td></tr>'
    );
  }).join('');
  return (
    '<table><thead><tr><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th class="num">Jumlah</th></tr></thead>' +
    '<tbody>' + body + '</tbody></table>'
  );
}

export function viewDashboard(state, ym) {
  const t = totalsForMonth(state, ym);
  const byCat = spendByCategory(state, ym);
  const catRows = CATEGORIES
    .map((cat) => ({ label: cat, value: byCat[cat], className: byCat[cat] > (state.budgets[cat] || 0) ? 'red' : '' }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  const topCat = catRows[0];
  const budget = budgetTotal(state);
  const over = CATEGORIES.filter((cat) => byCat[cat] > (state.budgets[cat] || 0));
  const advice = over.length
    ? '<div class="notice red"><strong>Perhatian:</strong> ' + over.map(escapeHtml).join(', ') + ' sudah melewati anggaran bulan ini. Cek halaman <a href="#/anggaran">Anggaran</a> untuk menyesuaikan.</div>'
    : '<div class="notice green"><strong>Semua kategori masih dalam anggaran.</strong> Sisa uang bulan ini ' + rupiah(t.balance) + ' — pertimbangkan menambah tabungan Dana Darurat.</div>';

  return (
    '<div class="page-head"><h1>Dashboard Anggaran ' + monthLabel(ym) + '</h1>' +
    '<p>Keluarga Pratama, ' + escapeHtml(state.family.city) + ' · ' + state.family.members + ' anggota keluarga · ' +
    'Pengeluaran terbesar bulan ini: <strong>' + escapeHtml(topCat ? topCat.label : '—') + '</strong> (' + rupiah(topCat ? topCat.value : 0) + ').</p></div>' +
    advice +
    summaryTiles(state, ym) +
    '<div class="grid cols-2">' +
    '<section class="card"><h2>Pengeluaran per Kategori</h2><p class="sub">Total ' + rupiah(t.expense) + ' dari anggaran ' + rupiah(budget) + '</p>' +
    categoryBars(catRows) +
    '<p class="bar-legend"><a href="#/anggaran">Lihat anggaran per kategori &rarr;</a></p></section>' +
    '<section class="card"><h2>Arus Kas 6 Bulan Terakhir</h2><p class="sub">Pemasukan vs pengeluaran, Juni–' + monthLabel(ym) + '</p>' +
    monthlyColumns(historyWithCurrent(state, ym)) + '</section>' +
    '</div>' +
    '<section class="card"><h2>Transaksi Terbaru</h2><p class="sub">8 transaksi terakhir di bulan ' + monthLabel(ym) + '</p>' +
    recentTable(state, ym, 8) +
    '<p class="bar-legend"><a href="#/transaksi">Semua transaksi &rarr;</a></p></section>'
  );
}

export function viewTransactions(state, ym, filter) {
  const f = filter || { kind: 'semua', category: 'semua' };
  let rows = [
    ...incomeForMonth(state, ym).map((r) => ({ ...r, kind: 'masuk' })),
    ...expensesForMonth(state, ym).map((r) => ({ ...r, kind: 'keluar' })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  if (f.kind !== 'semua') rows = rows.filter((r) => r.kind === f.kind);
  if (f.category !== 'semua') rows = rows.filter((r) => (r.kind === 'masuk' ? r.source : r.category) === f.category);

  const inTotal = sumAmount(rows.filter((r) => r.kind === 'masuk'));
  const outTotal = sumAmount(rows.filter((r) => r.kind === 'keluar'));

  const body = rows.map((row) => {
    const isIncome = row.kind === 'masuk';
    return (
      '<tr><td>' + dateLabel(row.date) + '</td>' +
      '<td>' + escapeHtml(row.detail) + '</td>' +
      '<td><span class="pill">' + escapeHtml(isIncome ? row.source : row.category) + '</span></td>' +
      '<td class="num ' + (isIncome ? 'pos' : 'neg') + '">' + (isIncome ? '+' : '−') + rupiah(row.amount) + '</td>' +
      '<td><button class="btn small secondary" data-edit="' + row.id + '" data-kind="' + row.kind + '">Ubah</button> ' +
      '<button class="btn small danger" data-delete="' + row.id + '" data-kind="' + row.kind + '">Hapus</button></td></tr>'
    );
  }).join('');

  const catOptions = ['<option value="semua">Semua kategori</option>']
    .concat(CATEGORIES.map((c) => '<option value="' + escapeHtml(c) + '"' + (f.category === c ? ' selected' : '') + '>' + escapeHtml(c) + '</option>'))
    .concat(INCOME_SOURCES.map((c) => '<option value="' + escapeHtml(c) + '"' + (f.category === c ? ' selected' : '') + '>' + escapeHtml(c) + ' (pemasukan)</option>'))
    .join('');

  return (
    '<div class="page-head"><h1>Transaksi ' + monthLabel(ym) + '</h1>' +
    '<p>Semua pemasukan dan pengeluaran keluarga. Tambah, ubah, atau hapus — total di bawah dihitung otomatis.</p></div>' +
    '<div class="grid cols-3">' +
    '<section class="card tile income"><div class="label">Masuk (terfilter)</div><div class="value">' + rupiah(inTotal) + '</div></section>' +
    '<section class="card tile expense"><div class="label">Keluar (terfilter)</div><div class="value">' + rupiah(outTotal) + '</div></section>' +
    '<section class="card tile"><div class="label">Selisih</div><div class="value">' + rupiah(inTotal - outTotal) + '</div></section>' +
    '</div>' +
    '<section class="card"><h2>Tambah Transaksi Baru</h2>' +
    '<form id="txForm"><div class="row">' +
    '<label class="field"><span>Jenis</span><select name="kind" id="txKind"><option value="keluar">Pengeluaran</option><option value="masuk">Pemasukan</option></select></label>' +
    '<label class="field"><span>Tanggal</span><input type="date" name="date" value="2026-11-26" required></label>' +
    '</div><div class="row">' +
    '<label class="field"><span>Kategori</span><select name="category" id="txCategory"></select></label>' +
    '<label class="field"><span>Jumlah (Rp)</span><input type="number" name="amount" min="1000" step="500" placeholder="contoh: 250000" required></label>' +
    '</div>' +
    '<label class="field"><span>Keterangan</span><input type="text" name="detail" maxlength="120" placeholder="contoh: Belanja mingguan pasar" required></label>' +
    '<div class="btn-row"><button class="btn" type="submit">Simpan Transaksi</button></div></form></section>' +
    '<section class="card"><h2>Daftar Transaksi</h2>' +
    '<div class="toolbar">' +
    '<label>Jenis<br><select id="filterKind"><option value="semua"' + (f.kind === 'semua' ? ' selected' : '') + '>Semua</option><option value="masuk"' + (f.kind === 'masuk' ? ' selected' : '') + '>Pemasukan</option><option value="keluar"' + (f.kind === 'keluar' ? ' selected' : '') + '>Pengeluaran</option></select></label>' +
    '<label>Kategori<br><select id="filterCategory">' + catOptions + '</select></label>' +
    '</div>' +
    (rows.length
      ? '<table><thead><tr><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th class="num">Jumlah</th><th>Aksi</th></tr></thead><tbody>' + body + '</tbody></table>'
      : '<p class="muted">Tidak ada transaksi yang cocok dengan filter ini.</p>') +
    '</section>'
  );
}

export function viewBudget(state, ym) {
  const byCat = spendByCategory(state, ym);
  const budget = budgetTotal(state);
  const spent = sumAmount(expensesForMonth(state, ym));
  const cards = CATEGORIES.map((cat) => {
    const limit = state.budgets[cat] || 0;
    const used = byCat[cat] || 0;
    const p = pct(used, limit);
    const status = used > limit
      ? '<span class="pill bad">Melebihi ' + rupiah(used - limit) + '</span>'
      : p >= 90 ? '<span class="pill warn">Hampir habis</span>' : '<span class="pill good">Aman</span>';
    return (
      '<section class="card"><div class="goal-head"><strong>' + escapeHtml(cat) + '</strong>' + status + '</div>' +
      '<p class="goal-meta">Terpakai ' + rupiah(used) + ' dari ' + rupiah(limit) + ' · sisa ' + rupiah(Math.max(0, limit - used)) + '</p>' +
      '<div class="progress"><span class="' + (used > limit ? 'over' : '') + '" style="width:' + Math.min(100, p) + '%"></span></div>' +
      '<p class="goal-meta">' + p + '% anggaran terpakai</p>' +
      '<form class="budget-form" data-category="' + escapeHtml(cat) + '"><label class="field"><span>Ubah anggaran bulanan (Rp)</span>' +
      '<input type="number" name="limit" min="0" step="50000" value="' + limit + '" required></label>' +
      '<button class="btn small" type="submit">Simpan Anggaran</button></form></section>'
    );
  }).join('');

  return (
    '<div class="page-head"><h1>Anggaran Bulanan ' + monthLabel(ym) + '</h1>' +
    '<p>Total anggaran ' + rupiah(budget) + ' · terpakai ' + rupiah(spent) + ' (' + pct(spent, budget) + '%) · sisa anggaran ' + rupiah(Math.max(0, budget - spent)) + '. ' +
    'Aturan keluarga Pratama: kebutuhan 50%, keinginan 30%, tabungan 20% dari penghasilan.</p></div>' +
    '<div class="grid cols-2">' + cards + '</div>'
  );
}

export function viewSavings(state) {
  const totalSaved = state.savings.reduce((a, g) => a + g.saved, 0);
  const totalTarget = state.savings.reduce((a, g) => a + g.target, 0);
  const cards = state.savings.map((g) => {
    const p = pct(g.saved, g.target);
    const remaining = g.target - g.saved;
    return (
      '<section class="card"><div class="goal-head"><strong>' + escapeHtml(g.name) + '</strong><span class="pill">' + p + '%</span></div>' +
      '<p class="goal-meta">' + escapeHtml(g.note) + '</p>' +
      '<p class="goal-meta">Terkumpul ' + rupiah(g.saved) + ' dari target ' + rupiah(g.target) + ' · kurang ' + rupiah(Math.max(0, remaining)) + '</p>' +
      '<div class="progress"><span style="width:' + Math.min(100, p) + '%"></span></div>' +
      '<form class="save-form" data-id="' + g.id + '" style="margin-top:12px"><div class="row">' +
      '<label class="field"><span>Tambah tabungan (Rp)</span><input type="number" name="amount" min="1000" step="5000" placeholder="contoh: 500000" required></label>' +
      '<label class="field"><span>&nbsp;</span><button class="btn small" type="submit">Tambah ke Target</button></label>' +
      '</div></form></section>'
    );
  }).join('');

  return (
    '<div class="page-head"><h1>Target Tabungan</h1>' +
    '<p>Total terkumpul ' + rupiah(totalSaved) + ' dari ' + rupiah(totalTarget) + ' (' + pct(totalSaved, totalTarget) + '%). ' +
    'Target tabungan bulanan keluarga: ' + rupiah(state.savingsTargetMonthly) + ' — disisihkan di awal bulan, bukan dari sisa.</p></div>' +
    '<div class="grid cols-2">' + cards + '</div>' +
    '<section class="card"><h2>Buat Target Tabungan Baru</h2>' +
    '<form id="goalForm"><div class="row">' +
    '<label class="field"><span>Nama target</span><input type="text" name="name" maxlength="60" placeholder="contoh: Renovasi kamar mandi" required></label>' +
    '<label class="field"><span>Target dana (Rp)</span><input type="number" name="target" min="100000" step="50000" placeholder="contoh: 5000000" required></label>' +
    '</div><div class="row">' +
    '<label class="field"><span>Sudah terkumpul (Rp)</span><input type="number" name="saved" min="0" step="50000" value="0"></label>' +
    '<label class="field"><span>Catatan</span><input type="text" name="note" maxlength="120" placeholder="contoh: Target akhir tahun"></label>' +
    '</div><div class="btn-row"><button class="btn" type="submit">Buat Target</button></div></form></section>'
  );
}

export function viewCalculator(state, ym) {
  const t = totalsForMonth(state, ym);
  const income = t.income || 14000000;
  return (
    '<div class="page-head"><h1>Kalkulator Keuangan Keluarga</h1>' +
    '<p>Tiga alat hitung yang paling sering dipakai keluarga: pembagian anggaran 50/30/20, dana darurat, dan cicilan barang.</p></div>' +
    '<div class="grid cols-2">' +
    '<section class="card"><h2>Aturan 50 / 30 / 20</h2><p class="sub">Dari penghasilan bulanan ' + monthLabel(ym) + ': ' + rupiah(income) + '</p>' +
    '<form id="calc503020"><label class="field"><span>Penghasilan bulanan (Rp)</span><input type="number" name="income" min="100000" step="100000" value="' + income + '" required></label>' +
    '<div class="btn-row"><button class="btn" type="submit">Hitung Pembagian</button></div></form>' +
    '<div id="result503020" style="margin-top:14px">' +
    '<div class="bar-row"><span class="bar-label">Kebutuhan (50%)</span><div class="bar-track"><div class="bar-fill" style="width:50%"></div></div><span class="bar-value">' + rupiah(income * 0.5) + '</span></div>' +
    '<div class="bar-row"><span class="bar-label">Keinginan (30%)</span><div class="bar-track"><div class="bar-fill amber" style="width:30%"></div></div><span class="bar-value">' + rupiah(income * 0.3) + '</span></div>' +
    '<div class="bar-row"><span class="bar-label">Tabungan (20%)</span><div class="bar-track"><div class="bar-fill" style="width:20%"></div></div><span class="bar-value">' + rupiah(income * 0.2) + '</span></div>' +
    '<p class="kbd-note">Kebutuhan: sewa, makan, listrik, transport, sekolah. Keinginan: hiburan, makan di luar, langganan. Tabungan: dana darurat &amp; tujuan.</p>' +
    '</div></section>' +
    '<section class="card"><h2>Dana Darurat</h2><p class="sub">Idealnya 3–6 bulan pengeluaran untuk keluarga dengan penghasilan tetap.</p>' +
    '<form id="calcEmergency"><label class="field"><span>Pengeluaran bulanan (Rp)</span><input type="number" name="expense" min="100000" step="100000" value="' + (t.expense || 8752000) + '" required></label>' +
    '<label class="field"><span>Berapa bulan cadangan?</span><select name="months"><option value="3">3 bulan (penghasilan tetap)</option><option value="6" selected>6 bulan (aman)</option><option value="12">12 bulan (penghasilan tidak tetap)</option></select></label>' +
    '<div class="btn-row"><button class="btn" type="submit">Hitung Dana Darurat</button></div></form>' +
    '<div id="resultEmergency" style="margin-top:14px"><p>Dengan pengeluaran ' + rupiah(t.expense || 8752000) + ' per bulan, dana darurat 6 bulan = <strong>' + rupiah((t.expense || 8752000) * 6) + '</strong>. Keluarga Pratama sudah mengumpulkan ' + rupiah(12500000) + ' — kurang ' + rupiah(Math.max(0, (t.expense || 8752000) * 6 - 12500000)) + ' lagi.</p></div></section>' +
    '</div>' +
    '<section class="card"><h2>Cicilan Barang (Bunga Flat)</h2><p class="sub">Cek dulu cicilan per bulan sebelum membeli secara kredit.</p>' +
    '<form id="calcLoan"><div class="row">' +
    '<label class="field"><span>Harga barang (Rp)</span><input type="number" name="price" min="100000" step="100000" value="6000000" required></label>' +
    '<label class="field"><span>Uang muka / DP (Rp)</span><input type="number" name="down" min="0" step="100000" value="1500000"></label>' +
    '</div><div class="row">' +
    '<label class="field"><span>Tenor (bulan)</span><input type="number" name="months" min="1" max="60" value="12" required></label>' +
    '<label class="field"><span>Bunga per tahun (%)</span><input type="number" name="rate" min="0" max="50" step="0.5" value="12" required></label>' +
    '</div><div class="btn-row"><button class="btn" type="submit">Hitung Cicilan</button></div></form>' +
    '<div id="resultLoan" style="margin-top:14px"><p>Contoh: kulkas Rp6.000.000, DP Rp1.500.000, tenor 12 bulan, bunga 12% per tahun → cicilan <strong>Rp420.000 per bulan</strong> (pokok Rp375.000 + bunga Rp45.000). Total dibayar Rp6.540.000.</p></div></section>'
  );
}

export function viewReport(state, ym) {
  const history = historyWithCurrent(state, ym);
  const t = totalsForMonth(state, ym);
  const byCat = spendByCategory(state, ym);
  const catRows = CATEGORIES
    .map((cat) => ({ label: cat, value: byCat[cat] }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  const avgIncome = Math.round(history.reduce((a, h) => a + h.income, 0) / history.length);
  const avgExpense = Math.round(history.reduce((a, h) => a + h.expense, 0) / history.length);
  const bestMonth = history.reduce((best, h) => (h.income - h.expense > best.income - best.expense ? h : best), history[0]);

  const rows = history.map((h) => (
    '<tr><td>' + monthLabel(h.month) + '</td><td class="num pos">' + rupiah(h.income) + '</td><td class="num neg">' + rupiah(h.expense) + '</td><td class="num"><strong>' + rupiah(h.income - h.expense) + '</strong></td></tr>'
  )).join('');

  return (
    '<div class="page-head"><h1>Laporan Bulanan</h1>' +
    '<p>Ringkasan 6 bulan terakhir keluarga Pratama. Rata-rata pemasukan ' + rupiah(avgIncome) + ' dan pengeluaran ' + rupiah(avgExpense) + ' per bulan. ' +
    'Bulan paling hemat: <strong>' + monthLabel(bestMonth.month) + '</strong> (sisa ' + rupiah(bestMonth.income - bestMonth.expense) + ').</p></div>' +
    '<div class="grid cols-3">' +
    '<section class="card tile income"><div class="label">Rata-rata Pemasukan</div><div class="value">' + rupiah(avgIncome) + '</div><div class="note">per bulan, 6 bulan terakhir</div></section>' +
    '<section class="card tile expense"><div class="label">Rata-rata Pengeluaran</div><div class="value">' + rupiah(avgExpense) + '</div><div class="note">per bulan, 6 bulan terakhir</div></section>' +
    '<section class="card tile savings"><div class="label">Rata-rata Sisa</div><div class="value">' + rupiah(avgIncome - avgExpense) + '</div><div class="note">disisihkan untuk tabungan</div></section>' +
    '</div>' +
    '<section class="card"><h2>Arus Kas 6 Bulan</h2>' + monthlyColumns(history) + '</section>' +
    '<div class="grid cols-2">' +
    '<section class="card"><h2>Pengeluaran ' + monthLabel(ym) + ' per Kategori</h2>' + categoryBars(catRows) + '</section>' +
    '<section class="card"><h2>Tabel Bulanan</h2><table><thead><tr><th>Bulan</th><th class="num">Pemasukan</th><th class="num">Pengeluaran</th><th class="num">Sisa</th></tr></thead><tbody>' + rows + '</tbody></table></section>' +
    '</div>'
  );
}

export function viewGuide() {
  return (
    '<div class="page-head"><h1>Panduan Mengatur Anggaran Keluarga</h1>' +
    '<p>Lima kebiasaan sederhana yang dipakai keluarga Pratama untuk menjaga uang tetap cukup sampai akhir bulan.</p></div>' +
    '<div class="grid cols-2">' +
    '<section class="card"><h2>1. Bayar diri sendiri dulu</h2><p>Sisihkan tabungan ' + rupiah(2000000) + ' di awal bulan, begitu gaji masuk. Jangan menunggu sisa di akhir bulan — sisa itu hampir tidak pernah ada.</p></section>' +
    '<section class="card"><h2>2. Satu dompet untuk belanja dapur</h2><p>Anggaran belanja dapur ' + rupiah(2500000) + ' dipegang satu orang dan dibelanjakan seminggu sekali di pasar. Belanja harian di warung dekat rumah hampir selalu lebih boros.</p></section>' +
    '<section class="card"><h2>3. Pisahkan kebutuhan dan keinginan</h2><p>Kebutuhan (sewa, makan, listrik, sekolah) dibayar dulu. Keinginan (makan di luar, langganan, jalan-jalan) memakai jatah 30% dan berhenti saat jatahnya habis.</p></section>' +
    '<section class="card"><h2>4. Dana darurat sebelum gaya hidup</h2><p>Target dana darurat keluarga Pratama ' + rupiah(30000000) + ' — enam bulan pengeluaran. Baru setelah itu menaikkan jatah hiburan.</p></section>' +
    '<section class="card"><h2>5. Rapat anggaran 15 menit tiap Minggu</h2><p>Setiap Minggu malam, keluarga Pratama mengecek halaman <a href="#/transaksi">Transaksi</a> dan <a href="#/anggaran">Anggaran</a> bersama. Anak-anak ikut melihat supaya paham harga kebutuhan.</p></section>' +
    '<section class="card"><h2>Catatan tentang data di situs ini</h2><p>Semua angka di situs ini adalah contoh keluarga Pratama dan tersimpan di peramban Anda. Ubah lewat halaman Transaksi, Anggaran, dan Tabungan, atau <button class="btn small secondary" id="resetData">Kembalikan Data Contoh</button> kapan saja.</p></section>' +
    '</div>'
  );
}
