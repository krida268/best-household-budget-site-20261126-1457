// data.js — the household ledger: seed data, localStorage persistence,
// and the arithmetic the whole site shares (totals, per-category sums,
// monthly history). Everything is local; nothing leaves the browser.

export const CATEGORIES = [
  'Belanja Dapur',
  'Sewa & Rumah',
  'Listrik & Air',
  'Transportasi',
  'Pendidikan',
  'Kesehatan',
  'Hiburan',
  'Lainnya',
];

export const INCOME_SOURCES = ['Gaji', 'Usaha Sampingan', 'Lainnya'];

const STORAGE_KEY = 'dompetkeluarga-v1';

function seedState() {
  return {
    family: { name: 'Keluarga Pratama', city: 'Jakarta', members: 4 },
    budgets: {
      'Belanja Dapur': 2500000,
      'Sewa & Rumah': 2000000,
      'Listrik & Air': 700000,
      'Transportasi': 1000000,
      'Pendidikan': 1600000,
      'Kesehatan': 500000,
      'Hiburan': 600000,
      'Lainnya': 500000,
    },
    savingsTargetMonthly: 2000000,
    income: [
      { id: 'p1', date: '2026-11-01', source: 'Gaji', detail: 'Gaji Budi — staf gudang', amount: 8500000 },
      { id: 'p2', date: '2026-11-01', source: 'Gaji', detail: 'Gaji Sari — kasir toko', amount: 4200000 },
      { id: 'p3', date: '2026-11-07', source: 'Usaha Sampingan', detail: 'Jualan kue Sari (minggu 1)', amount: 650000 },
      { id: 'p4', date: '2026-11-21', source: 'Usaha Sampingan', detail: 'Jualan kue Sari (minggu 3)', amount: 650000 },
    ],
    expenses: [
      { id: 'e01', date: '2026-11-01', category: 'Sewa & Rumah', detail: 'Sewa kontrakan bulan November', amount: 2000000 },
      { id: 'e02', date: '2026-11-02', category: 'Pendidikan', detail: 'SPP anak — Dimas & Kirana', amount: 1200000 },
      { id: 'e03', date: '2026-11-03', category: 'Belanja Dapur', detail: 'Belanja mingguan pasar (beras, sayur, ayam)', amount: 685000 },
      { id: 'e04', date: '2026-11-04', category: 'Lainnya', detail: 'Pulsa & paket internet keluarga', amount: 250000 },
      { id: 'e05', date: '2026-11-05', category: 'Listrik & Air', detail: 'Token listrik + PAM', amount: 648000 },
      { id: 'e06', date: '2026-11-06', category: 'Hiburan', detail: 'Langganan streaming keluarga', amount: 149000 },
      { id: 'e07', date: '2026-11-07', category: 'Transportasi', detail: 'Bensin motor 2 minggu', amount: 420000 },
      { id: 'e08', date: '2026-11-09', category: 'Pendidikan', detail: 'Buku & alat tulis anak', amount: 300000 },
      { id: 'e09', date: '2026-11-10', category: 'Belanja Dapur', detail: 'Belanja mingguan pasar (daging, buah, susu)', amount: 742500 },
      { id: 'e10', date: '2026-11-12', category: 'Transportasi', detail: 'Tol & parkir', amount: 210000 },
      { id: 'e11', date: '2026-11-14', category: 'Kesehatan', detail: 'Berobat klinik — Dimas demam', amount: 250000 },
      { id: 'e12', date: '2026-11-15', category: 'Hiburan', detail: 'Makan di luar sekeluarga (akhir pekan)', amount: 320000 },
      { id: 'e13', date: '2026-11-17', category: 'Belanja Dapur', detail: 'Belanja mingguan pasar (sayur, telur, minyak)', amount: 618000 },
      { id: 'e14', date: '2026-11-18', category: 'Lainnya', detail: 'Perbaikan keran & lampu dapur', amount: 185000 },
      { id: 'e15', date: '2026-11-20', category: 'Transportasi', detail: 'Ojek online antar anak les', amount: 270000 },
      { id: 'e16', date: '2026-11-21', category: 'Kesehatan', detail: 'Obat & vitamin keluarga', amount: 150000 },
      { id: 'e17', date: '2026-11-24', category: 'Belanja Dapur', detail: 'Belanja mingguan pasar (beras, lauk, buah)', amount: 354500 },
    ],
    savings: [
      { id: 's1', name: 'Dana Darurat', target: 30000000, saved: 12500000, note: 'Target 6× pengeluaran bulanan' },
      { id: 's2', name: 'DP Rumah', target: 150000000, saved: 48000000, note: 'Menabung Rp1.500.000 per bulan' },
      { id: 's3', name: 'Pendidikan Anak', target: 25000000, saved: 8750000, note: 'Untuk biaya masuk SMP Dimas' },
      { id: 's4', name: 'Liburan Keluarga', target: 6000000, saved: 3200000, note: 'Rencana ke Yogyakarta, Juni 2027' },
    ],
    // Closed months (June–October 2026) for the report chart.
    history: [
      { month: '2026-06', income: 13500000, expense: 9850000 },
      { month: '2026-07', income: 13800000, expense: 10120000 },
      { month: '2026-08', income: 14000000, expense: 9640000 },
      { month: '2026-09', income: 14000000, expense: 10480000 },
      { month: '2026-10', income: 14200000, expense: 10050000 },
    ],
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.income) && Array.isArray(parsed.expenses)) return parsed;
    }
  } catch (err) {
    // Corrupt storage: fall through to the seed.
  }
  const fresh = seedState();
  saveState(fresh);
  return fresh;
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  const fresh = seedState();
  saveState(fresh);
  return fresh;
}

export function monthOf(dateIso) {
  return dateIso.slice(0, 7);
}

export function incomeForMonth(state, ym) {
  return state.income.filter((t) => monthOf(t.date) === ym);
}

export function expensesForMonth(state, ym) {
  return state.expenses.filter((t) => monthOf(t.date) === ym);
}

export function sumAmount(rows) {
  return rows.reduce((total, row) => total + Number(row.amount || 0), 0);
}

export function totalsForMonth(state, ym) {
  const income = sumAmount(incomeForMonth(state, ym));
  const expense = sumAmount(expensesForMonth(state, ym));
  return { income, expense, balance: income - expense };
}

export function spendByCategory(state, ym) {
  const out = {};
  for (const cat of CATEGORIES) out[cat] = 0;
  for (const row of expensesForMonth(state, ym)) {
    if (out[row.category] === undefined) out[row.category] = 0;
    out[row.category] += Number(row.amount || 0);
  }
  return out;
}

export function budgetTotal(state) {
  return Object.values(state.budgets).reduce((a, b) => a + Number(b || 0), 0);
}

export function historyWithCurrent(state, ym) {
  const rows = state.history.filter((h) => h.month < ym);
  const current = totalsForMonth(state, ym);
  rows.push({ month: ym, income: current.income, expense: current.expense });
  return rows.slice(-6);
}

export function nextId(prefix, rows) {
  let max = 0;
  for (const row of rows) {
    const n = parseInt(String(row.id).replace(/^\D+/, ''), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return prefix + String(max + 1).padStart(2, '0');
}
