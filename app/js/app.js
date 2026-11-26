// app.js — bootstrap for DompetKeluarga: loads the ledger, renders the
// current route, and wires every form and button on each page.

import { rupiah, monthLabel, escapeHtml } from './format.js';
import {
  CATEGORIES, INCOME_SOURCES, loadState, saveState, resetState, nextId,
} from './data.js';
import { currentRoute, parseQuery, setActiveNav } from './router.js';
import {
  viewDashboard, viewTransactions, viewBudget, viewSavings, viewCalculator,
  viewReport, viewGuide,
} from './views.js';

const app = document.getElementById('app');
const monthSelect = document.getElementById('monthSelect');
let state = loadState();
let month = '2026-11';
let txFilter = { kind: 'semua', category: 'semua' };

function availableMonths() {
  const months = new Set(state.history.map((h) => h.month));
  for (const row of [...state.income, ...state.expenses]) months.add(row.date.slice(0, 7));
  months.add('2026-11');
  return [...months].sort();
}

function fillMonthSelect() {
  monthSelect.innerHTML = availableMonths()
    .map((m) => '<option value="' + m + '"' + (m === month ? ' selected' : '') + '>' + monthLabel(m) + '</option>')
    .join('');
}

function render() {
  const route = currentRoute();
  setActiveNav(route);
  if (route === '/transaksi') app.innerHTML = viewTransactions(state, month, txFilter);
  else if (route === '/anggaran') app.innerHTML = viewBudget(state, month);
  else if (route === '/tabungan') app.innerHTML = viewSavings(state);
  else if (route === '/kalkulator') app.innerHTML = viewCalculator(state, month);
  else if (route === '/laporan') app.innerHTML = viewReport(state, month);
  else if (route === '/panduan') app.innerHTML = viewGuide();
  else app.innerHTML = viewDashboard(state, month);
  wirePage(route);
  window.scrollTo(0, 0);
}

function fillCategoryOptions(select, kind) {
  const list = kind === 'masuk' ? INCOME_SOURCES : CATEGORIES;
  select.innerHTML = list.map((c) => '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>').join('');
}

function wirePage(route) {
  if (route === '/transaksi') wireTransactions();
  if (route === '/anggaran') wireBudgets();
  if (route === '/tabungan') wireSavings();
  if (route === '/kalkulator') wireCalculators();
  if (route === '/panduan') {
    const btn = document.getElementById('resetData');
    if (btn) btn.addEventListener('click', () => {
      state = resetState();
      fillMonthSelect();
      render();
    });
  }
}

function wireTransactions() {
  const form = document.getElementById('txForm');
  const kindSelect = document.getElementById('txKind');
  const catSelect = document.getElementById('txCategory');
  fillCategoryOptions(catSelect, kindSelect.value);
  kindSelect.addEventListener('change', () => fillCategoryOptions(catSelect, kindSelect.value));

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const data = new FormData(form);
    const kind = data.get('kind');
    const amount = Math.round(Number(data.get('amount')));
    if (!amount || amount <= 0) return;
    const detail = String(data.get('detail')).trim();
    if (kind === 'masuk') {
      state.income.push({
        id: nextId('p', state.income),
        date: data.get('date'),
        source: data.get('category'),
        detail,
        amount,
      });
    } else {
      state.expenses.push({
        id: nextId('e', state.expenses),
        date: data.get('date'),
        category: data.get('category'),
        detail,
        amount,
      });
    }
    saveState(state);
    fillMonthSelect();
    render();
  });

  const filterKind = document.getElementById('filterKind');
  const filterCategory = document.getElementById('filterCategory');
  filterKind.addEventListener('change', () => { txFilter.kind = filterKind.value; render(); });
  filterCategory.addEventListener('change', () => { txFilter.category = filterCategory.value; render(); });

  for (const btn of app.querySelectorAll('[data-delete]')) {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delete;
      if (btn.dataset.kind === 'masuk') state.income = state.income.filter((r) => r.id !== id);
      else state.expenses = state.expenses.filter((r) => r.id !== id);
      saveState(state);
      render();
    });
  }
  for (const btn of app.querySelectorAll('[data-edit]')) {
    btn.addEventListener('click', () => {
      const id = btn.dataset.edit;
      const row = (btn.dataset.kind === 'masuk' ? state.income : state.expenses).find((r) => r.id === id);
      if (!row) return;
      const amount = window.prompt('Jumlah baru (Rp) untuk "' + row.detail + '":', String(row.amount));
      if (amount === null) return;
      const n = Math.round(Number(amount));
      if (!n || n <= 0) { window.alert('Jumlah harus angka lebih dari 0.'); return; }
      row.amount = n;
      const detail = window.prompt('Keterangan baru:', row.detail);
      if (detail !== null && detail.trim()) row.detail = detail.trim();
      saveState(state);
      render();
    });
  }
}

function wireBudgets() {
  for (const form of app.querySelectorAll('.budget-form')) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const cat = form.dataset.category;
      const limit = Math.round(Number(new FormData(form).get('limit')));
      if (limit < 0 || Number.isNaN(limit)) return;
      state.budgets[cat] = limit;
      saveState(state);
      render();
    });
  }
}

function wireSavings() {
  for (const form of app.querySelectorAll('.save-form')) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const goal = state.savings.find((g) => g.id === form.dataset.id);
      if (!goal) return;
      const amount = Math.round(Number(new FormData(form).get('amount')));
      if (!amount || amount <= 0) return;
      goal.saved += amount;
      saveState(state);
      render();
    });
  }
  const goalForm = document.getElementById('goalForm');
  if (goalForm) {
    goalForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const data = new FormData(goalForm);
      const target = Math.round(Number(data.get('target')));
      const saved = Math.round(Number(data.get('saved') || 0));
      if (!target || target <= 0) return;
      state.savings.push({
        id: 's' + Date.now().toString(36),
        name: String(data.get('name')).trim(),
        target,
        saved: Math.max(0, saved),
        note: String(data.get('note') || '').trim() || 'Target baru keluarga',
      });
      saveState(state);
      render();
    });
  }
}

function wireCalculators() {
  const f503020 = document.getElementById('calc503020');
  if (f503020) {
    f503020.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const income = Math.round(Number(new FormData(f503020).get('income')));
      if (!income || income <= 0) return;
      document.getElementById('result503020').innerHTML =
        '<div class="bar-row"><span class="bar-label">Kebutuhan (50%)</span><div class="bar-track"><div class="bar-fill" style="width:50%"></div></div><span class="bar-value">' + rupiah(income * 0.5) + '</span></div>' +
        '<div class="bar-row"><span class="bar-label">Keinginan (30%)</span><div class="bar-track"><div class="bar-fill amber" style="width:30%"></div></div><span class="bar-value">' + rupiah(income * 0.3) + '</span></div>' +
        '<div class="bar-row"><span class="bar-label">Tabungan (20%)</span><div class="bar-track"><div class="bar-fill" style="width:20%"></div></div><span class="bar-value">' + rupiah(income * 0.2) + '</span></div>' +
        '<p class="kbd-note">Kebutuhan: sewa, makan, listrik, transport, sekolah. Keinginan: hiburan, makan di luar, langganan. Tabungan: dana darurat &amp; tujuan.</p>';
    });
  }
  const fEmergency = document.getElementById('calcEmergency');
  if (fEmergency) {
    fEmergency.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const data = new FormData(fEmergency);
      const expense = Math.round(Number(data.get('expense')));
      const months = Number(data.get('months'));
      if (!expense || expense <= 0) return;
      const total = expense * months;
      document.getElementById('resultEmergency').innerHTML =
        '<p>Dengan pengeluaran ' + rupiah(expense) + ' per bulan, dana darurat ' + months + ' bulan = <strong>' + rupiah(total) + '</strong>. ' +
        'Keluarga Pratama sudah mengumpulkan ' + rupiah(12500000) + ' — ' +
        (total > 12500000 ? 'kurang ' + rupiah(total - 12500000) + ' lagi.' : 'target sudah tercapai.') + '</p>';
    });
  }
  const fLoan = document.getElementById('calcLoan');
  if (fLoan) {
    fLoan.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const data = new FormData(fLoan);
      const price = Math.round(Number(data.get('price')));
      const down = Math.round(Number(data.get('down') || 0));
      const months = Number(data.get('months'));
      const rate = Number(data.get('rate'));
      if (!price || price <= 0 || !months || months <= 0) return;
      const principal = Math.max(0, price - down);
      const interestPerMonth = (principal * (rate / 100)) / 12;
      const monthly = Math.round(principal / months + interestPerMonth);
      const totalPaid = Math.round(monthly * months + down);
      document.getElementById('resultLoan').innerHTML =
        '<p>Pinjaman pokok ' + rupiah(principal) + ' (' + rupiah(price) + ' − DP ' + rupiah(down) + '), tenor ' + months + ' bulan, bunga ' + rate + '% per tahun → cicilan <strong>' + rupiah(monthly) + ' per bulan</strong> ' +
        '(pokok ' + rupiah(Math.round(principal / months)) + ' + bunga ' + rupiah(Math.round(interestPerMonth)) + '). Total dibayar ' + rupiah(totalPaid) + '.</p>';
    });
  }
}

monthSelect.addEventListener('change', () => {
  month = monthSelect.value;
  render();
});

window.addEventListener('hashchange', () => {
  const q = parseQuery();
  if (q.bulan) month = q.bulan;
  render();
});

fillMonthSelect();
render();
