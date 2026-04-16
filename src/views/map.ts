import { loadGeo, loadSummary } from '../data';
import { formatNumber, STATE_COLORS } from '../utils';
import L from 'leaflet';

// Simplified Australian state boundaries GeoJSON
const STATE_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'NSW', abbr: 'NSW' }, geometry: { type: 'Polygon', coordinates: [[[141,-34],[141,-29],[149.5,-29],[153.5,-28.5],[154,-33.5],[150.5,-37.5],[150,-37.5],[149,-37.5],[141,-34]]] } },
    { type: 'Feature', properties: { name: 'VIC', abbr: 'VIC' }, geometry: { type: 'Polygon', coordinates: [[[141,-34],[141,-39],[144,-39],[147,-39],[150,-39],[150,-37.5],[149,-37.5],[141,-34]]] } },
    { type: 'Feature', properties: { name: 'QLD', abbr: 'QLD' }, geometry: { type: 'Polygon', coordinates: [[[138,-29],[138,-10.5],[142,-10.5],[146,-19],[149.5,-20.5],[153.5,-28.5],[149.5,-29],[141,-29],[138,-29]]] } },
    { type: 'Feature', properties: { name: 'SA', abbr: 'SA' }, geometry: { type: 'Polygon', coordinates: [[[129,-26],[129,-31.5],[132,-31.5],[132,-34],[141,-34],[141,-29],[138,-29],[138,-26],[129,-26]]] } },
    { type: 'Feature', properties: { name: 'WA', abbr: 'WA' }, geometry: { type: 'Polygon', coordinates: [[[129,-14],[115,-14],[113,-22],[114,-34.5],[129,-31.5],[129,-26],[129,-14]]] } },
    { type: 'Feature', properties: { name: 'TAS', abbr: 'TAS' }, geometry: { type: 'Polygon', coordinates: [[[144.5,-40],[145,-41],[146,-41.5],[148.5,-42],[148.5,-40],[146,-39.5],[144.5,-40]]] } },
    { type: 'Feature', properties: { name: 'NT', abbr: 'NT' }, geometry: { type: 'Polygon', coordinates: [[[129,-14],[129,-26],[138,-26],[138,-10.5],[136,-12],[132,-11],[129,-14]]] } },
    { type: 'Feature', properties: { name: 'ACT', abbr: 'ACT' }, geometry: { type: 'Polygon', coordinates: [[[148.7,-35.1],[149,-35.1],[149.4,-35.2],[149.4,-35.5],[149.2,-35.9],[148.7,-35.5],[148.7,-35.1]]] } },
  ],
};

export async function renderMap(el: HTMLElement): Promise<void> {
  const [geo, summary] = await Promise.all([loadGeo(), loadSummary()]);

  el.innerHTML = `
    <div class="chart-container">
      <div class="chart-title">Fatalities by State — ${summary.latestYear}</div>
      <div class="chart-subtitle">Colour intensity shows <span class="glossary-link" data-term="per-capita">per-capita rate</span> (fatalities per 100K population). Click a state for details.</div>
      <div class="legend" id="map-legend"></div>
      <div id="crash-map" class="map-container"></div>
    </div>
    <div class="chart-container">
      <div class="chart-title">All-Time Fatalities by State</div>
      <div class="chart-subtitle">Total fatality count across the full dataset (${summary.yearRange[0]}–${summary.yearRange[1]})</div>
      <div id="map-alltime-bars"></div>
    </div>
  `;

  // Build map
  const mapEl = document.getElementById('crash-map')!;
  const map = L.map(mapEl, { scrollWheelZoom: true }).setView([-28, 134], 4);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 10,
  }).addTo(map);

  // Colour scale based on per-capita rate
  const pcValues = Object.values(geo.perCapita);
  const maxPC = Math.max(...pcValues, 1);

  function getColor(pc: number): string {
    const t = Math.min(pc / maxPC, 1);
    const r = Math.round(30 + t * 190);
    const g = Math.round(100 - t * 60);
    const b = Math.round(200 - t * 160);
    return `rgb(${r},${g},${b})`;
  }

  L.geoJSON(STATE_GEOJSON, {
    style: (feature) => {
      const abbr = feature?.properties?.abbr || '';
      const pc = geo.perCapita[abbr] || 0;
      return {
        fillColor: getColor(pc),
        weight: 2,
        opacity: 1,
        color: '#fff',
        fillOpacity: 0.7,
      };
    },
    onEachFeature: (feature, layer) => {
      const abbr = feature.properties?.abbr || '';
      const count = geo.byState[abbr] || 0;
      const pc = geo.perCapita[abbr] || 0;
      const allTime = summary.byState[abbr] || 0;
      layer.bindPopup(`
        <strong>${abbr}</strong><br>
        ${summary.latestYear} fatalities: <strong>${formatNumber(count)}</strong><br>
        Per 100K: <strong>${pc.toFixed(1)}</strong><br>
        All-time total: <strong>${formatNumber(allTime)}</strong>
      `);
    },
  }).addTo(map);

  // Legend
  const legendEl = document.getElementById('map-legend')!;
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const v = (maxPC / steps) * i;
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<div class="legend-swatch" style="background:${getColor(v)}"></div>${v.toFixed(1)}`;
    legendEl.appendChild(item);
  }
  const label = document.createElement('span');
  label.style.cssText = 'font-size:var(--font-size-xs);color:var(--text-tertiary);margin-left:var(--space-sm)';
  label.textContent = 'per 100K population';
  legendEl.appendChild(label);

  // All-time bars
  const barsEl = document.getElementById('map-alltime-bars')!;
  const entries = Object.entries(summary.byState).sort((a, b) => b[1] - a[1]);
  const maxAll = entries[0]?.[1] || 1;
  barsEl.innerHTML = entries.map(([st, count]) => `
    <div class="bar-chart-row">
      <div class="bar-label">${st}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / maxAll) * 100}%;background:${STATE_COLORS[st] || '#6b7280'}"></div></div>
      <div class="bar-value">${formatNumber(count)}</div>
    </div>
  `).join('');
}
