import { loadMatrices } from '../data';
import { formatNumber, heatColor, STATE_COLORS } from '../utils';

export async function renderComparison(el: HTMLElement): Promise<void> {
  const matrices = await loadMatrices();

  const states = Object.keys(matrices.stateVsCrashType).sort();

  // ── State × Crash Type Matrix ──
  const crashTypes = ['Single', 'Multiple', 'Pedestrian'];
  let ctMax = 0;
  for (const st of states) {
    for (const ct of crashTypes) {
      const val = matrices.stateVsCrashType[st]?.[ct] || 0;
      if (val > ctMax) ctMax = val;
    }
  }

  const ctCellW = 110;
  const ctCellH = 44;
  const ctLabelW = 60;
  const ctHeaderH = 50;
  const ctGridW = ctLabelW + crashTypes.length * ctCellW + 10;
  const ctGridH = ctHeaderH + states.length * ctCellH + 10;

  let ctCells = '';
  // Headers
  for (let c = 0; c < crashTypes.length; c++) {
    const x = ctLabelW + c * ctCellW + ctCellW / 2;
    ctCells += `<text x="${x}" y="${ctHeaderH - 10}" text-anchor="middle" fill="var(--text-secondary)" font-size="12" font-weight="600">${crashTypes[c]}</text>`;
  }
  // Rows
  for (let r = 0; r < states.length; r++) {
    const y = ctHeaderH + r * ctCellH;
    const st = states[r];
    ctCells += `<text x="${ctLabelW - 8}" y="${y + ctCellH / 2 + 4}" text-anchor="end" fill="${STATE_COLORS[st] || 'var(--text-secondary)'}" font-size="12" font-weight="600">${st}</text>`;
    for (let c = 0; c < crashTypes.length; c++) {
      const x = ctLabelW + c * ctCellW;
      const val = matrices.stateVsCrashType[st]?.[crashTypes[c]] || 0;
      const color = heatColor(val, ctMax);
      const textColor = val / ctMax > 0.5 ? '#fff' : 'var(--text-primary)';
      ctCells += `
        <rect x="${x + 2}" y="${y + 2}" width="${ctCellW - 4}" height="${ctCellH - 4}" rx="4" fill="${color}">
          <title>${st} — ${crashTypes[c]}: ${formatNumber(val)}</title>
        </rect>
        <text x="${x + ctCellW / 2}" y="${y + ctCellH / 2 + 4}" text-anchor="middle" fill="${textColor}" font-size="12" font-family="var(--font-mono)" font-weight="600">${formatNumber(val)}</text>
      `;
    }
  }

  // ── State × Road User Matrix ──
  const roadUsers = matrices.roadUsers.filter(ru => ru !== '' && ru !== 'Other' && ru !== '-9');
  let ruMax = 0;
  for (const st of states) {
    for (const ru of roadUsers) {
      const val = matrices.stateVsRoadUser[st]?.[ru] || 0;
      if (val > ruMax) ruMax = val;
    }
  }

  const ruCellW = 100;
  const ruCellH = 44;
  const ruLabelW = 60;
  const ruHeaderH = 80;
  const ruGridW = ruLabelW + roadUsers.length * ruCellW + 10;
  const ruGridH = ruHeaderH + states.length * ruCellH + 10;

  let ruCells = '';
  // Headers (rotated)
  for (let c = 0; c < roadUsers.length; c++) {
    const x = ruLabelW + c * ruCellW + ruCellW / 2;
    ruCells += `<text x="${x}" y="${ruHeaderH - 8}" text-anchor="middle" fill="var(--text-secondary)" font-size="10" font-weight="600" transform="rotate(-25,${x},${ruHeaderH - 8})">${roadUsers[c]}</text>`;
  }
  // Rows
  for (let r = 0; r < states.length; r++) {
    const y = ruHeaderH + r * ruCellH;
    const st = states[r];
    ruCells += `<text x="${ruLabelW - 8}" y="${y + ruCellH / 2 + 4}" text-anchor="end" fill="${STATE_COLORS[st] || 'var(--text-secondary)'}" font-size="12" font-weight="600">${st}</text>`;
    for (let c = 0; c < roadUsers.length; c++) {
      const x = ruLabelW + c * ruCellW;
      const val = matrices.stateVsRoadUser[st]?.[roadUsers[c]] || 0;
      const color = heatColor(val, ruMax);
      const textColor = val / ruMax > 0.5 ? '#fff' : 'var(--text-primary)';
      ruCells += `
        <rect x="${x + 2}" y="${y + 2}" width="${ruCellW - 4}" height="${ruCellH - 4}" rx="4" fill="${color}">
          <title>${st} — ${roadUsers[c]}: ${formatNumber(val)}</title>
        </rect>
        <text x="${x + ruCellW / 2}" y="${y + ruCellH / 2 + 4}" text-anchor="middle" fill="${textColor}" font-size="11" font-family="var(--font-mono)" font-weight="600">${formatNumber(val)}</text>
      `;
    }
  }

  el.innerHTML = `
    <div class="chart-container">
      <div class="chart-title">State × <span class="glossary-link" data-term="crash-type">Crash Type</span></div>
      <div class="chart-subtitle">All-time fatalities by state and crash type. Darker = more fatalities.</div>
      <svg class="chart-svg" viewBox="0 0 ${ctGridW} ${ctGridH}" preserveAspectRatio="xMidYMid meet" style="max-width:${ctGridW}px">
        ${ctCells}
      </svg>
    </div>
    <div class="chart-container">
      <div class="chart-title">State × <span class="glossary-link" data-term="road-user">Road User</span> Type</div>
      <div class="chart-subtitle">All-time fatalities by state and the role of the person killed. Reveals which states have unique risk profiles.</div>
      <div style="overflow-x:auto">
        <svg class="chart-svg" viewBox="0 0 ${ruGridW} ${ruGridH}" preserveAspectRatio="xMidYMid meet" style="min-width:${ruGridW}px">
          ${ruCells}
        </svg>
      </div>
    </div>
  `;
}
