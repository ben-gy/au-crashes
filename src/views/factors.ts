import { loadSummary } from '../data';
import { formatNumber, sortedEntries, CRASH_TYPE_COLORS, ROAD_USER_COLORS } from '../utils';

function barChart(
  title: string,
  subtitle: string,
  entries: [string, number][],
  colors: Record<string, string>,
  defaultColor = '#1e3a5f'
): string {
  const max = entries[0]?.[1] || 1;
  const rows = entries.map(([label, count]) => `
    <div class="bar-chart-row">
      <div class="bar-label">${label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%;background:${colors[label] || defaultColor}"></div></div>
      <div class="bar-value">${formatNumber(count)}</div>
    </div>
  `).join('');
  return `
    <div class="chart-container">
      <div class="chart-title">${title}</div>
      <div class="chart-subtitle">${subtitle}</div>
      ${rows}
    </div>
  `;
}

export async function renderFactors(el: HTMLElement): Promise<void> {
  const summary = await loadSummary();

  const crashTypeChart = barChart(
    '<span class="glossary-link" data-term="crash-type">Crash Type</span>',
    'Single vehicle, multiple vehicle, or pedestrian crash',
    sortedEntries(summary.byCrashType),
    CRASH_TYPE_COLORS
  );

  const roadUserChart = barChart(
    '<span class="glossary-link" data-term="road-user">Road User</span> Type',
    'Role of the person killed in the crash',
    sortedEntries(summary.byRoadUser),
    ROAD_USER_COLORS
  );

  const speedEntries = sortedEntries(summary.bySpeedLimit)
    .filter(([k]) => k !== '' && k !== '-9')
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  const speedColors: Record<string, string> = {};
  speedEntries.forEach(([sl]) => {
    const n = parseInt(sl);
    if (n <= 50) speedColors[sl] = '#059669';
    else if (n <= 80) speedColors[sl] = '#0891b2';
    else if (n <= 100) speedColors[sl] = '#d97706';
    else speedColors[sl] = '#dc2626';
  });
  const speedChart = barChart(
    '<span class="glossary-link" data-term="speed-limit">Speed Limit</span> Distribution',
    'Posted speed limit at crash location (km/h)',
    speedEntries,
    speedColors
  );

  const roadTypeChart = barChart(
    'Road Type',
    'Classification of the road where the crash occurred',
    sortedEntries(summary.byRoadType).filter(([k]) => k !== ''),
    {},
    '#1e3a5f'
  );

  const remotenessChart = barChart(
    '<span class="glossary-link" data-term="remoteness">Remoteness Area</span>',
    'ABS remoteness classification of crash location',
    sortedEntries(summary.byRemoteness).filter(([k]) => k !== ''),
    {
      'Major Cities of Australia': '#2563eb',
      'Inner Regional Australia': '#0891b2',
      'Outer Regional Australia': '#059669',
      'Remote Australia': '#d97706',
      'Very Remote Australia': '#dc2626',
    }
  );

  // Heavy vehicle involvement
  const hvData: [string, number][] = [
    ['Articulated Truck', summary.heavyVehicle.articulated],
    ['Heavy Rigid Truck', summary.heavyVehicle.heavyRigid],
    ['Bus', summary.heavyVehicle.bus],
  ];
  const hvChart = barChart(
    '<span class="glossary-link" data-term="heavy-vehicle">Heavy Vehicle</span> Involvement',
    'Number of fatalities in crashes involving heavy vehicles',
    hvData.sort((a, b) => b[1] - a[1]),
    { 'Articulated Truck': '#7c3aed', 'Heavy Rigid Truck': '#1e3a5f', Bus: '#d97706' }
  );

  // Two-column layout
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-xl)">
      ${crashTypeChart}
      ${roadUserChart}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-xl)">
      ${speedChart}
      ${roadTypeChart}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-xl)">
      ${remotenessChart}
      ${hvChart}
    </div>
  `;
}
