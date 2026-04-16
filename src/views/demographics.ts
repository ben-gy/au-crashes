import { loadDemographics } from '../data';
import { formatNumber, heatColor } from '../utils';

export async function renderDemographics(el: HTMLElement): Promise<void> {
  const demo = await loadDemographics();

  // Find max for colour scale
  let max = 0;
  for (const ag of demo.ageGroups) {
    for (const gen of demo.genders) {
      const val = demo.data[ag]?.[gen] || 0;
      if (val > max) max = val;
    }
  }

  // Build heatmap
  const cellSize = 120;
  const labelW = 100;
  const headerH = 40;
  const cols = demo.genders.length;
  const rows = demo.ageGroups.length;
  const gridW = labelW + cols * cellSize;
  const gridH = headerH + rows * cellSize;

  let cells = '';

  // Column headers
  for (let c = 0; c < cols; c++) {
    const x = labelW + c * cellSize + cellSize / 2;
    cells += `<text x="${x}" y="${headerH - 10}" text-anchor="middle" fill="var(--text-secondary)" font-size="13" font-weight="600">${demo.genders[c]}</text>`;
  }

  // Rows
  for (let r = 0; r < rows; r++) {
    const y = headerH + r * cellSize;
    const ag = demo.ageGroups[r];

    // Row label
    cells += `<text x="${labelW - 10}" y="${y + cellSize / 2 + 5}" text-anchor="end" fill="var(--text-secondary)" font-size="12" font-weight="600">${ag}</text>`;

    for (let c = 0; c < cols; c++) {
      const x = labelW + c * cellSize;
      const gen = demo.genders[c];
      const val = demo.data[ag]?.[gen] || 0;
      const color = heatColor(val, max);
      const textColor = val / max > 0.5 ? '#fff' : 'var(--text-primary)';
      const pct = ((val / Object.values(demo.data).reduce((sum, g) => sum + Object.values(g).reduce((s, v) => s + v, 0), 0)) * 100).toFixed(1);

      cells += `
        <rect x="${x + 2}" y="${y + 2}" width="${cellSize - 4}" height="${cellSize - 4}" rx="6" fill="${color}">
          <title>${ag} ${gen}: ${formatNumber(val)} (${pct}%)</title>
        </rect>
        <text x="${x + cellSize / 2}" y="${y + cellSize / 2 - 5}" text-anchor="middle" fill="${textColor}" font-size="20" font-weight="700" font-family="var(--font-mono)">${formatNumber(val)}</text>
        <text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 15}" text-anchor="middle" fill="${textColor}" font-size="11" opacity="0.8">${pct}%</text>
      `;
    }
  }

  // Totals row
  const totalM = demo.ageGroups.reduce((sum, ag) => sum + (demo.data[ag]?.Male || 0), 0);
  const totalF = demo.ageGroups.reduce((sum, ag) => sum + (demo.data[ag]?.Female || 0), 0);
  const totalAll = totalM + totalF;

  // Key insights
  const maxAg = demo.ageGroups.reduce((best, ag) => {
    const total = (demo.data[ag]?.Male || 0) + (demo.data[ag]?.Female || 0);
    const bestTotal = (demo.data[best]?.Male || 0) + (demo.data[best]?.Female || 0);
    return total > bestTotal ? ag : best;
  }, demo.ageGroups[0]);
  const maleRatio = ((totalM / totalAll) * 100).toFixed(1);

  el.innerHTML = `
    <div class="chart-container">
      <div class="chart-title">Fatalities by Age Group and Gender</div>
      <div class="chart-subtitle">Cross-reference heatmap — darker cells indicate higher fatality counts. Hover for exact numbers.</div>
      <svg class="chart-svg" viewBox="0 0 ${gridW} ${gridH}" preserveAspectRatio="xMidYMid meet" style="max-width:${gridW}px">
        ${cells}
      </svg>
      <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-2xl);flex-wrap:wrap">
        <div class="stat-card" style="flex:1;min-width:180px">
          <div class="stat-label">Male fatalities</div>
          <div class="stat-value">${formatNumber(totalM)}</div>
          <div class="stat-sub">${maleRatio}% of all fatalities</div>
        </div>
        <div class="stat-card" style="flex:1;min-width:180px">
          <div class="stat-label">Female fatalities</div>
          <div class="stat-value">${formatNumber(totalF)}</div>
          <div class="stat-sub">${(100 - parseFloat(maleRatio)).toFixed(1)}% of all fatalities</div>
        </div>
        <div class="stat-card" style="flex:1;min-width:180px">
          <div class="stat-label">Highest risk group</div>
          <div class="stat-value">${maxAg}</div>
          <div class="stat-sub">Male, ${formatNumber(demo.data[maxAg]?.Male || 0)} fatalities</div>
        </div>
      </div>
    </div>
  `;
}
