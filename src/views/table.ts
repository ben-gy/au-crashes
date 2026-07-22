// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import { loadRecords } from '../data';
import type { FatalityRecord } from '../types';
import { formatNumber, debounce, h } from '../utils';

const PAGE_SIZE = 50;

interface TableState {
  records: FatalityRecord[];
  filtered: FatalityRecord[];
  sortCol: keyof FatalityRecord;
  sortDir: 'asc' | 'desc';
  page: number;
  search: string;
  stateFilter: string;
  yearMin: number;
  yearMax: number;
  crashTypeFilter: string;
  roadUserFilter: string;
}

const COLS: { key: keyof FatalityRecord; label: string; mono?: boolean }[] = [
  { key: 'yr', label: 'Year', mono: true },
  { key: 'mo', label: 'Month', mono: true },
  { key: 'st', label: 'State' },
  { key: 'ct', label: 'Crash Type' },
  { key: 'ru', label: 'Road User' },
  { key: 'gen', label: 'Gender' },
  { key: 'age', label: 'Age', mono: true },
  { key: 'ag', label: 'Age Group' },
  { key: 'sl', label: 'Speed Limit', mono: true },
  { key: 'rt', label: 'Road Type' },
  { key: 'rem', label: 'Remoteness' },
  { key: 'lga', label: 'LGA' },
];

function applyFilters(state: TableState): void {
  let result = state.records;
  if (state.stateFilter) result = result.filter(r => r.st === state.stateFilter);
  if (state.crashTypeFilter) result = result.filter(r => r.ct === state.crashTypeFilter);
  if (state.roadUserFilter) result = result.filter(r => r.ru === state.roadUserFilter);
  result = result.filter(r => r.yr >= state.yearMin && r.yr <= state.yearMax);
  if (state.search) {
    const q = state.search.toLowerCase();
    result = result.filter(r =>
      r.lga.toLowerCase().includes(q) ||
      r.sa4.toLowerCase().includes(q) ||
      r.rt.toLowerCase().includes(q) ||
      r.rem.toLowerCase().includes(q) ||
      r.st.toLowerCase().includes(q)
    );
  }
  // Sort
  result = [...result].sort((a, b) => {
    const av = a[state.sortCol];
    const bv = b[state.sortCol];
    if (typeof av === 'number' && typeof bv === 'number') {
      return state.sortDir === 'asc' ? av - bv : bv - av;
    }
    const cmp = String(av).localeCompare(String(bv));
    return state.sortDir === 'asc' ? cmp : -cmp;
  });
  state.filtered = result;
  state.page = 0;
}

export async function renderTable(el: HTMLElement): Promise<void> {
  const records = await loadRecords();

  const years = records.map(r => r.yr);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const state: TableState = {
    records,
    filtered: records,
    sortCol: 'yr',
    sortDir: 'desc',
    page: 0,
    search: '',
    stateFilter: '',
    yearMin: minYear,
    yearMax: maxYear,
    crashTypeFilter: '',
    roadUserFilter: '',
  };

  const uniqueStates = [...new Set(records.map(r => r.st))].sort();
  const uniqueCrashTypes = [...new Set(records.map(r => r.ct))].filter(Boolean).sort();
  const uniqueRoadUsers = [...new Set(records.map(r => r.ru))].filter(Boolean).sort();

  applyFilters(state);

  const wrapper = h('div', { class: 'data-table-wrap' });

  // Controls
  const controls = h('div', { class: 'table-controls' });

  const searchInput = h('input', { type: 'text', placeholder: 'Search LGA, region...', 'aria-label': 'Search' }) as HTMLInputElement;
  const stateSelect = h('select', { 'aria-label': 'Filter by state' }) as HTMLSelectElement;
  stateSelect.innerHTML = '<option value="">All States</option>' + uniqueStates.map(s => `<option value="${s}">${s}</option>`).join('');
  const crashSelect = h('select', { 'aria-label': 'Filter by crash type' }) as HTMLSelectElement;
  crashSelect.innerHTML = '<option value="">All Crash Types</option>' + uniqueCrashTypes.map(s => `<option value="${s}">${s}</option>`).join('');
  const ruSelect = h('select', { 'aria-label': 'Filter by road user' }) as HTMLSelectElement;
  ruSelect.innerHTML = '<option value="">All Road Users</option>' + uniqueRoadUsers.map(s => `<option value="${s}">${s}</option>`).join('');
  const yearMinInput = h('input', { type: 'number', min: String(minYear), max: String(maxYear), value: String(minYear), 'aria-label': 'Year from', style: 'width:80px' }) as HTMLInputElement;
  const yearMaxInput = h('input', { type: 'number', min: String(minYear), max: String(maxYear), value: String(maxYear), 'aria-label': 'Year to', style: 'width:80px' }) as HTMLInputElement;

  controls.appendChild(searchInput);
  controls.appendChild(stateSelect);
  controls.appendChild(crashSelect);
  controls.appendChild(ruSelect);
  controls.append(document.createTextNode('Year: '), yearMinInput, document.createTextNode(' – '), yearMaxInput);

  // Table
  const scroll = h('div', { class: 'table-scroll' });
  const table = h('table', { class: 'data-table' });
  const thead = h('thead', {});
  const tbody = h('tbody', {});
  table.appendChild(thead);
  table.appendChild(tbody);
  scroll.appendChild(table);

  // Footer
  const footer = h('div', { class: 'table-footer' });
  const countEl = h('span', {});
  const pagination = h('div', { class: 'pagination' });
  footer.appendChild(countEl);
  footer.appendChild(pagination);

  wrapper.appendChild(controls);
  wrapper.appendChild(scroll);
  wrapper.appendChild(footer);

  function renderHeader(): void {
    thead.innerHTML = '<tr>' + COLS.map(col => {
      const arrow = state.sortCol === col.key ? (state.sortDir === 'asc' ? '\u25b2' : '\u25bc') : '';
      return `<th data-col="${col.key}">${col.label}<span class="sort-arrow">${arrow}</span></th>`;
    }).join('') + '</tr>';
  }

  function renderRows(): void {
    const start = state.page * PAGE_SIZE;
    const pageData = state.filtered.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = pageData.map(r => '<tr>' + COLS.map(col => {
      const val = r[col.key];
      const display = val === -1 ? '—' : val;
      return `<td${col.mono ? ' class="mono"' : ''}>${display}</td>`;
    }).join('') + '</tr>').join('');
  }

  function renderPagination(): void {
    const totalPages = Math.ceil(state.filtered.length / PAGE_SIZE);
    countEl.textContent = `${formatNumber(state.filtered.length)} of ${formatNumber(state.records.length)} records`;

    pagination.innerHTML = '';
    const prevBtn = h('button', {}, '\u2190 Prev');
    prevBtn.disabled = state.page === 0;
    prevBtn.addEventListener('click', () => { state.page--; renderRows(); renderPagination(); });
    pagination.appendChild(prevBtn);

    const maxButtons = 7;
    let startPage = Math.max(0, state.page - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons);
    if (endPage - startPage < maxButtons) startPage = Math.max(0, endPage - maxButtons);

    for (let i = startPage; i < endPage; i++) {
      const btn = h('button', { class: i === state.page ? 'active' : '' }, String(i + 1));
      btn.addEventListener('click', () => { state.page = i; renderRows(); renderPagination(); });
      pagination.appendChild(btn);
    }

    const nextBtn = h('button', {}, 'Next \u2192');
    nextBtn.disabled = state.page >= totalPages - 1;
    nextBtn.addEventListener('click', () => { state.page++; renderRows(); renderPagination(); });
    pagination.appendChild(nextBtn);
  }

  function refresh(): void {
    applyFilters(state);
    renderRows();
    renderPagination();
  }

  // Event listeners
  const debouncedRefresh = debounce(() => {
    state.search = searchInput.value;
    refresh();
  }, 300);
  searchInput.addEventListener('input', debouncedRefresh);
  stateSelect.addEventListener('change', () => { state.stateFilter = stateSelect.value; refresh(); });
  crashSelect.addEventListener('change', () => { state.crashTypeFilter = crashSelect.value; refresh(); });
  ruSelect.addEventListener('change', () => { state.roadUserFilter = ruSelect.value; refresh(); });
  yearMinInput.addEventListener('change', () => { state.yearMin = parseInt(yearMinInput.value) || minYear; refresh(); });
  yearMaxInput.addEventListener('change', () => { state.yearMax = parseInt(yearMaxInput.value) || maxYear; refresh(); });

  thead.addEventListener('click', (e) => {
    const th = (e.target as HTMLElement).closest('th') as HTMLElement | null;
    if (!th) return;
    const col = th.dataset.col as keyof FatalityRecord;
    if (state.sortCol === col) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortCol = col;
      state.sortDir = 'desc';
    }
    renderHeader();
    refresh();
  });

  renderHeader();
  refresh();

  el.innerHTML = '';
  el.appendChild(wrapper);
}
