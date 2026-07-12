import './styles.css';
import type { ViewId } from './types';
import { lookupTerm, getAllTerms } from './glossary';
import { h } from './utils';
import { renderDashboard } from './views/dashboard';
import { renderTable } from './views/table';
import { renderTrends } from './views/trends';
import { renderMap } from './views/map';
import { renderFactors } from './views/factors';
import { renderDemographics } from './views/demographics';
import { renderTemporal } from './views/temporal';
import { renderComparison } from './views/comparison';

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'table', label: 'Table' },
  { id: 'trends', label: 'Trends' },
  { id: 'map', label: 'Map' },
  { id: 'factors', label: 'Factors' },
  { id: 'demographics', label: 'Demographics' },
  { id: 'temporal', label: 'Temporal' },
  { id: 'comparison', label: 'Comparison' },
];

const renderers: Record<ViewId, (el: HTMLElement) => Promise<void>> = {
  dashboard: renderDashboard,
  table: renderTable,
  trends: renderTrends,
  map: renderMap,
  factors: renderFactors,
  demographics: renderDemographics,
  temporal: renderTemporal,
  comparison: renderComparison,
};

let activeView: ViewId = 'dashboard';
const rendered = new Set<ViewId>();

function buildApp(): void {
  const app = document.getElementById('app')!;

  // Header
  const header = h('header', { class: 'site-header' });
  header.appendChild(h('h1', {}, 'Road Crashes (AU)'));
  header.appendChild(h('span', { class: 'tagline' }, '37 years of Australian road fatality data'));

  const actions = h('div', { class: 'header-actions' });
  const infoBtn = h('button', { class: 'btn-icon', 'aria-label': 'About this site', title: 'About this site' }, '?');
  infoBtn.addEventListener('click', openAboutModal);
  actions.appendChild(infoBtn);
  header.appendChild(actions);

  // Tabs
  const tabBar = h('nav', { class: 'tab-bar', role: 'tablist', 'aria-label': 'Views' });
  for (const view of VIEWS) {
    const btn = h('button', {
      class: `tab-btn${view.id === activeView ? ' active' : ''}`,
      role: 'tab',
      'aria-selected': view.id === activeView ? 'true' : 'false',
      'data-view': view.id,
    }, view.label);
    btn.addEventListener('click', () => switchView(view.id));
    tabBar.appendChild(btn);
  }

  // Main content
  const main = h('main', { class: 'main-content' });
  for (const view of VIEWS) {
    const panel = h('div', {
      class: `view-panel${view.id === activeView ? ' active' : ''}`,
      id: `view-${view.id}`,
      role: 'tabpanel',
    });
    panel.innerHTML = '<div class="loading"><span class="loading-pulse">Loading data...</span></div>';
    main.appendChild(panel);
  }

  // Footer
  const footer = h('footer', { class: 'site-footer' });
  footer.innerHTML = `
    <div class="footer-sources">Data: <a href="https://datahub.roadsafety.gov.au/" target="_blank" rel="noopener">BITRE Australian Road Deaths Database (ARDD)</a> · CC BY 3.0 AU</div>
    <div>Built by <a href="https://benrichardson.dev/" target="_blank" rel="noopener">benrichardson.dev</a> · <a href="https://hub.benrichardson.dev" target="_blank" rel="noopener">more tools &amp; sites</a></div>
  `;

  app.appendChild(header);
  app.appendChild(tabBar);
  app.appendChild(main);
  app.appendChild(footer);

  // Initial view
  loadView(activeView);

  // Glossary tooltips
  initTooltips();
}

async function loadView(id: ViewId): Promise<void> {
  if (rendered.has(id)) return;
  const panel = document.getElementById(`view-${id}`)!;
  try {
    await renderers[id](panel);
    rendered.add(id);
  } catch (err) {
    panel.innerHTML = `<div class="error-state"><p>Failed to load data</p><p>${err instanceof Error ? err.message : 'Unknown error'}</p><button onclick="location.reload()">Retry</button></div>`;
  }
}

function switchView(id: ViewId): void {
  activeView = id;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.getAttribute('data-view') === id;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `view-${id}`);
  });
  loadView(id);

  // Save preference
  try { localStorage.setItem('au-crashes-view', id); } catch { /* noop */ }
}

function initTooltips(): void {
  const tooltip = document.getElementById('tooltip')!;
  document.addEventListener('click', e => {
    const link = (e.target as HTMLElement).closest('.glossary-link') as HTMLElement | null;
    if (link) {
      e.preventDefault();
      const entry = lookupTerm(link.dataset.term || '');
      if (!entry) return;
      tooltip.innerHTML = `<span class="tooltip-term">${entry.term}</span>${entry.definition}`;
      const rect = link.getBoundingClientRect();
      tooltip.hidden = false;
      tooltip.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
      tooltip.style.top = (rect.bottom + 8) + 'px';
    } else if (!(e.target as HTMLElement).closest('.tooltip')) {
      tooltip.hidden = true;
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') tooltip.hidden = true;
  });
}

function openAboutModal(): void {
  const terms = getAllTerms();
  const glossaryHTML = terms.map(t =>
    `<li><span class="term-name">${t.term}</span> — ${t.definition}</li>`
  ).join('');

  const overlay = h('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
  const panel = h('div', { class: 'modal-panel' });
  const closeBtn = h('button', { class: 'modal-close', 'aria-label': 'Close' }, '\u00d7');
  panel.appendChild(closeBtn);
  panel.innerHTML += `
    <h2 class="modal-title">About Road Crashes (AU)</h2>
    <div class="modal-body">
      <p>This site visualises 37 years of Australian road fatality data from the
      <strong>Australian Road Deaths Database (ARDD)</strong>, maintained by the
      Bureau of Infrastructure and Transport Research Economics (BITRE).</p>

      <h3>What data is included?</h3>
      <p>Every road traffic fatality recorded in Australia from 1989 to February 2026 —
      over 58,000 individual records. Each record includes the state, crash type,
      road user type, demographics (age, gender), speed limit, road type,
      remoteness area, and local government area.</p>

      <h3>How often is it updated?</h3>
      <p>BITRE updates the ARDD monthly. This site's data pipeline fetches the
      latest data on the 15th of each month. Recent months are preliminary
      and subject to revision.</p>

      <h3>Important caveats</h3>
      <ul>
        <li>Only <strong>fatalities</strong> (deaths within 30 days) are recorded — serious injuries are not included</li>
        <li>Data from 2025 onward may be incomplete or preliminary</li>
        <li>Some fields (speed limit, LGA, remoteness) are not available for all years</li>
        <li>Population data for per-capita rates uses 2023 ABS estimates</li>
      </ul>

      <h3>Glossary</h3>
      <ul class="glossary-list">${glossaryHTML}</ul>

      <h3>Data source</h3>
      <p><a href="https://datahub.roadsafety.gov.au/" target="_blank" rel="noopener">BITRE Road Safety Data Hub</a><br>
      Licensed under Creative Commons Attribution 3.0 Australia.</p>
    </div>
  `;
  overlay.appendChild(panel);

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });
  panel.querySelector('.modal-close')!.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
}

// Restore last view
const saved = localStorage.getItem('au-crashes-view') as ViewId | null;
if (saved && VIEWS.some(v => v.id === saved)) {
  activeView = saved;
}

buildApp();
