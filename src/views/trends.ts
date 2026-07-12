import { loadTrends } from '../data';
import { formatNumber, STATE_COLORS } from '../utils';

export async function renderTrends(el: HTMLElement): Promise<void> {
  const trends = await loadTrends();

  const width = 900;
  const height = 400;
  const pad = { top: 20, right: 20, bottom: 50, left: 65 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const maxTotal = Math.max(...trends.data.map(d => d.total));
  const n = trends.data.length;
  const barW = Math.max(1, plotW / n - 2);

  // Stacked bars by state
  let bars = '';
  for (let i = 0; i < n; i++) {
    const d = trends.data[i];
    const x = pad.left + (i / n) * plotW;
    let cumY = 0;
    for (const st of trends.states) {
      const val = d[st] || 0;
      const barH = (val / maxTotal) * plotH;
      const y = pad.top + plotH - cumY - barH;
      const tip = `${d.year} ${st}: ${formatNumber(val)}`;
      bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${STATE_COLORS[st] || '#6b7280'}" opacity="0.85" data-tip="${tip}" aria-label="${tip}"></rect>`;
      cumY += barH;
    }
  }

  // Y axis
  let yAxis = '';
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = Math.round((maxTotal / yTicks) * i);
    const y = pad.top + plotH - (val / maxTotal) * plotH;
    yAxis += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" fill="var(--text-tertiary)" font-size="11" font-family="var(--font-mono)">${formatNumber(val)}</text>`;
    yAxis += `<line x1="${pad.left}" x2="${width - pad.right}" y1="${y}" y2="${y}" stroke="var(--border-subtle)" stroke-dasharray="3"/>`;
  }

  // X axis
  let xAxis = '';
  for (let i = 0; i < n; i++) {
    const yr = trends.data[i].year;
    if (yr % 5 === 0) {
      const x = pad.left + (i / n) * plotW + barW / 2;
      xAxis += `<text x="${x}" y="${height - 10}" text-anchor="middle" fill="var(--text-tertiary)" font-size="11">${yr}</text>`;
    }
  }

  // Legend
  const legendHTML = trends.states.map(st =>
    `<div class="legend-item"><div class="legend-swatch" style="background:${STATE_COLORS[st]}"></div>${st}</div>`
  ).join('');

  // State sparklines
  const sparklines = trends.states.map(st => {
    const data = trends.stateByYear[st];
    const max = Math.max(...data);
    const w = 200;
    const h = 40;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
    const latest = data[data.length - 1];
    const prev = data[data.length - 2];
    const change = prev > 0 ? ((latest - prev) / prev * 100).toFixed(1) : '0';
    const changeClass = parseFloat(change) <= 0 ? 'stat-good' : 'stat-bad';
    const tip = `${st}: ${formatNumber(latest)} fatalities in latest year (${parseFloat(change) > 0 ? '+' : ''}${change}% vs prior year)`;
    return `
      <div style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) 0;border-bottom:1px solid var(--border-subtle)" data-tip="${tip}">
        <div style="width:40px;font-weight:600;color:${STATE_COLORS[st]}">${st}</div>
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
          <polyline points="${points}" fill="none" stroke="${STATE_COLORS[st]}" stroke-width="1.5"/>
        </svg>
        <div style="width:60px;font-family:var(--font-mono);font-size:var(--font-size-sm);text-align:right">${formatNumber(latest)}</div>
        <div style="width:60px;font-size:var(--font-size-xs)" class="${changeClass}">${parseFloat(change) > 0 ? '+' : ''}${change}%</div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="chart-container">
      <div class="chart-title">Fatalities by Year — Stacked by State</div>
      <div class="chart-subtitle">Annual road fatalities broken down by state/territory, ${trends.years[0]}–${trends.years[trends.years.length - 1]}</div>
      <div class="legend">${legendHTML}</div>
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        ${yAxis}${bars}${xAxis}
      </svg>
    </div>
    <div class="chart-container">
      <div class="chart-title">State Trends — Sparklines</div>
      <div class="chart-subtitle">Per-state trend with latest year count and year-over-year change</div>
      ${sparklines}
    </div>
  `;
}
