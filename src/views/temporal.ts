import { loadTemporal } from '../data';
import { formatNumber, heatColor } from '../utils';

export async function renderTemporal(el: HTMLElement): Promise<void> {
  const temporal = await loadTemporal();

  // Find max value for colour scale
  let max = 0;
  for (const day of temporal.days) {
    for (let h = 0; h < 24; h++) {
      const val = temporal.data[day]?.[h] || 0;
      if (val > max) max = val;
    }
  }

  // Build heatmap SVG
  const cellW = 32;
  const cellH = 36;
  const labelW = 90;
  const headerH = 50;
  const cols = 24;
  const rows = temporal.days.length;
  const gridW = labelW + cols * cellW + 10;
  const gridH = headerH + rows * cellH + 10;

  let cells = '';

  // Column headers (hours)
  for (let c = 0; c < cols; c++) {
    const x = labelW + c * cellW + cellW / 2;
    cells += `<text x="${x}" y="${headerH - 8}" text-anchor="middle" fill="var(--text-tertiary)" font-size="10" font-family="var(--font-mono)">${c.toString().padStart(2, '0')}</text>`;
  }

  // Rows
  for (let r = 0; r < rows; r++) {
    const y = headerH + r * cellH;
    const day = temporal.days[r];
    const dayShort = day.substring(0, 3);

    // Row label
    cells += `<text x="${labelW - 8}" y="${y + cellH / 2 + 4}" text-anchor="end" fill="var(--text-secondary)" font-size="12" font-weight="500">${dayShort}</text>`;

    for (let c = 0; c < cols; c++) {
      const x = labelW + c * cellW;
      const val = temporal.data[day]?.[c] || 0;
      const color = heatColor(val, max);
      const textColor = val / max > 0.5 ? '#fff' : 'var(--text-primary)';

      cells += `
        <rect x="${x + 1}" y="${y + 1}" width="${cellW - 2}" height="${cellH - 2}" rx="3" fill="${color}">
          <title>${day} ${c.toString().padStart(2, '0')}:00: ${formatNumber(val)} fatalities</title>
        </rect>
        <text x="${x + cellW / 2}" y="${y + cellH / 2 + 4}" text-anchor="middle" fill="${textColor}" font-size="9" font-family="var(--font-mono)">${val}</text>
      `;
    }
  }

  // Colour scale legend
  const scaleW = 200;
  const scaleH = 12;
  const scaleY = gridH + 10;
  let scaleCells = '';
  const scaleSteps = 10;
  for (let i = 0; i <= scaleSteps; i++) {
    const t = i / scaleSteps;
    const x = labelW + (i / scaleSteps) * scaleW;
    const val = Math.round(t * max);
    scaleCells += `<rect x="${x}" y="${scaleY}" width="${scaleW / scaleSteps + 1}" height="${scaleH}" fill="${heatColor(val, max)}"/>`;
  }
  scaleCells += `<text x="${labelW}" y="${scaleY + scaleH + 14}" fill="var(--text-tertiary)" font-size="10">0</text>`;
  scaleCells += `<text x="${labelW + scaleW}" y="${scaleY + scaleH + 14}" text-anchor="end" fill="var(--text-tertiary)" font-size="10">${formatNumber(max)}</text>`;
  scaleCells += `<text x="${labelW + scaleW / 2}" y="${scaleY + scaleH + 14}" text-anchor="middle" fill="var(--text-tertiary)" font-size="10">fatalities</text>`;

  // Insights
  let peakDay = '';
  let peakHour = 0;
  let peakVal = 0;
  for (const day of temporal.days) {
    for (let h = 0; h < 24; h++) {
      const val = temporal.data[day]?.[h] || 0;
      if (val > peakVal) { peakVal = val; peakDay = day; peakHour = h; }
    }
  }

  // Weekend vs weekday totals
  const weekdayTotal = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].reduce((sum, day) => {
    return sum + Object.values(temporal.data[day] || {}).reduce((s, v) => s + v, 0);
  }, 0);
  const weekendTotal = ['Saturday', 'Sunday'].reduce((sum, day) => {
    return sum + Object.values(temporal.data[day] || {}).reduce((s, v) => s + v, 0);
  }, 0);

  // Night vs day
  const nightTotal = temporal.days.reduce((sum, day) => {
    let daySum = 0;
    for (let h = 0; h < 24; h++) {
      if (h >= 20 || h < 6) daySum += temporal.data[day]?.[h] || 0;
    }
    return sum + daySum;
  }, 0);
  const dayTotal = temporal.days.reduce((sum, day) => {
    let daySum = 0;
    for (let h = 6; h < 20; h++) {
      daySum += temporal.data[day]?.[h] || 0;
    }
    return sum + daySum;
  }, 0);

  el.innerHTML = `
    <div class="chart-container">
      <div class="chart-title">Fatalities by Day of Week and Hour</div>
      <div class="chart-subtitle">Heatmap showing when fatal crashes occur. Darker = more fatalities. Hover for exact counts.</div>
      <svg class="chart-svg" viewBox="0 0 ${gridW} ${scaleY + scaleH + 20}" preserveAspectRatio="xMidYMid meet">
        ${cells}${scaleCells}
      </svg>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-lg)">
      <div class="stat-card">
        <div class="stat-label">Peak Time</div>
        <div class="stat-value" style="font-size:var(--font-size-xl)">${peakDay.substring(0, 3)} ${peakHour.toString().padStart(2, '0')}:00</div>
        <div class="stat-sub">${formatNumber(peakVal)} fatalities</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Weekday vs Weekend</div>
        <div class="stat-value" style="font-size:var(--font-size-lg)">${formatNumber(weekdayTotal)} / ${formatNumber(weekendTotal)}</div>
        <div class="stat-sub">${((weekendTotal / (weekdayTotal + weekendTotal)) * 100).toFixed(1)}% on weekends (2 of 7 days)</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Night (8pm–6am) vs Day</div>
        <div class="stat-value" style="font-size:var(--font-size-lg)">${formatNumber(nightTotal)} / ${formatNumber(dayTotal)}</div>
        <div class="stat-sub">${((nightTotal / (nightTotal + dayTotal)) * 100).toFixed(1)}% at night</div>
      </div>
    </div>
  `;
}
