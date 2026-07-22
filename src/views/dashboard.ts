// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import { loadSummary, loadTrends } from '../data';
import { formatNumber, formatPercent, STATE_COLORS, sortedEntries, h } from '../utils';

export async function renderDashboard(el: HTMLElement): Promise<void> {
  const [summary, trends] = await Promise.all([loadSummary(), loadTrends()]);

  const yoyClass = summary.yoyChange <= 0 ? 'stat-good' : 'stat-bad';
  const peakYear = trends.data.reduce((best, row) => row.total > best.total ? row : best, trends.data[0]);

  // Top stats
  const cards = `
    <div class="card-grid">
      <div class="stat-card">
        <div class="stat-label">Total <span class="glossary-link" data-term="fatality">Fatalities</span></div>
        <div class="stat-value">${formatNumber(summary.totalFatalities)}</div>
        <div class="stat-sub">${summary.yearRange[0]}–${summary.yearRange[1]}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${summary.latestYear} Fatalities</div>
        <div class="stat-value">${formatNumber(summary.latestYearCount)}</div>
        <div class="stat-sub ${yoyClass}">${formatPercent(summary.yoyChange)} <span class="glossary-link" data-term="yoy-change">YoY</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Peak Year</div>
        <div class="stat-value">${peakYear.year}</div>
        <div class="stat-sub">${formatNumber(peakYear.total)} fatalities</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Reduction Since Peak</div>
        <div class="stat-value stat-good">${formatPercent(-((peakYear.total - summary.latestYearCount) / peakYear.total * 100))}</div>
        <div class="stat-sub">${formatNumber(peakYear.total - summary.latestYearCount)} fewer deaths/year</div>
      </div>
    </div>
  `;

  // Sparkline — 35-year national trend
  const sparkWidth = 800;
  const sparkHeight = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const plotW = sparkWidth - padding.left - padding.right;
  const plotH = sparkHeight - padding.top - padding.bottom;
  const maxTotal = Math.max(...trends.data.map(d => d.total));
  const barW = plotW / trends.data.length - 2;

  let bars = '';
  for (let i = 0; i < trends.data.length; i++) {
    const d = trends.data[i];
    const x = padding.left + (i / trends.data.length) * plotW;
    const barH = (d.total / maxTotal) * plotH;
    const y = padding.top + plotH - barH;
    const isLatest = d.year === summary.latestYear;
    const tip = `${d.year}: ${formatNumber(d.total)} fatalities`;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${isLatest ? '#d97706' : '#1e3a5f'}" opacity="${isLatest ? 1 : 0.7}" rx="1" data-tip="${tip}" aria-label="${tip}"></rect>`;
  }

  // Y axis
  let yAxis = '';
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = Math.round((maxTotal / yTicks) * i);
    const y = padding.top + plotH - (val / maxTotal) * plotH;
    yAxis += `<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="var(--text-tertiary)" font-size="11">${formatNumber(val)}</text>`;
    yAxis += `<line x1="${padding.left}" x2="${sparkWidth - padding.right}" y1="${y}" y2="${y}" stroke="var(--border-subtle)" stroke-dasharray="4"/>`;
  }

  // X axis labels (every 5 years)
  let xAxis = '';
  for (let i = 0; i < trends.data.length; i++) {
    if (trends.data[i].year % 5 === 0) {
      const x = padding.left + (i / trends.data.length) * plotW + barW / 2;
      xAxis += `<text x="${x}" y="${sparkHeight - 5}" text-anchor="middle" fill="var(--text-tertiary)" font-size="11">${trends.data[i].year}</text>`;
    }
  }

  const sparkSVG = `
    <div class="chart-container">
      <div class="chart-title">National Road Fatalities by Year</div>
      <div class="chart-subtitle">Annual fatality count from ${summary.yearRange[0]} to ${summary.yearRange[1]}</div>
      <svg class="chart-svg" viewBox="0 0 ${sparkWidth} ${sparkHeight}" preserveAspectRatio="xMidYMid meet">
        ${yAxis}${bars}${xAxis}
      </svg>
    </div>
  `;

  // State breakdown — latest year
  const stateEntries = sortedEntries(summary.byStateLatest);
  const maxState = stateEntries[0]?.[1] || 1;
  const stateRows = stateEntries.map(([st, count]) => {
    const pc = summary.perCapita[st];
    const pcText = pc ? ` (${pc.toFixed(1)} <span class="glossary-link" data-term="per-capita">per 100K</span>)` : '';
    const tip = `${st}: ${formatNumber(count)} fatalities in ${summary.latestYear}${pc ? ` (${pc.toFixed(1)} per 100K)` : ''}`;
    return `
      <div class="bar-chart-row" data-tip="${tip}">
        <div class="bar-label">${st}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(count / maxState) * 100}%;background:${STATE_COLORS[st] || '#6b7280'}"></div></div>
        <div class="bar-value">${formatNumber(count)}${pcText}</div>
      </div>
    `;
  }).join('');

  const stateChart = `
    <div class="chart-container">
      <div class="chart-title">Fatalities by State — ${summary.latestYear}</div>
      <div class="chart-subtitle">Raw count with <span class="glossary-link" data-term="per-capita">per-capita rate</span> in parentheses</div>
      ${stateRows}
    </div>
  `;

  // Road user breakdown — all time
  const ruEntries = sortedEntries(summary.byRoadUser);
  const maxRU = ruEntries[0]?.[1] || 1;
  const ROAD_USER_COLORS: Record<string, string> = {
    Driver: '#2563eb', Passenger: '#7c3aed', Pedestrian: '#dc2626',
    'Motorcycle rider': '#d97706', 'Motorcycle passenger': '#ea580c',
    'Pedal cyclist': '#059669', Other: '#6b7280',
  };
  const ruRows = ruEntries.map(([ru, count]) => `
    <div class="bar-chart-row" data-tip="${ru}: ${formatNumber(count)} fatalities all-time">
      <div class="bar-label">${ru}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / maxRU) * 100}%;background:${ROAD_USER_COLORS[ru] || '#6b7280'}"></div></div>
      <div class="bar-value">${formatNumber(count)}</div>
    </div>
  `).join('');

  const ruChart = `
    <div class="chart-container">
      <div class="chart-title"><span class="glossary-link" data-term="road-user">Road User</span> Type — All Time</div>
      <div class="chart-subtitle">Fatalities by the role of the person killed</div>
      ${ruRows}
    </div>
  `;

  // Two-column layout for state + road user
  const twoCol = document.createElement('div');
  twoCol.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:var(--space-xl);';
  twoCol.innerHTML = stateChart + ruChart;

  const wrapper = h('div', {});
  wrapper.innerHTML = cards + sparkSVG;
  wrapper.appendChild(twoCol);

  el.innerHTML = '';
  el.appendChild(wrapper);
}
