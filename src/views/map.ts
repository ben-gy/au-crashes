// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import { loadGeo, loadSummary } from '../data';
import { formatNumber, STATE_COLORS } from '../utils';
import L from 'leaflet';

export async function renderMap(el: HTMLElement): Promise<void> {
  const [geo, summary, statesRes] = await Promise.all([
    loadGeo(),
    loadSummary(),
    fetch('data/au-states.geojson'),
  ]);
  if (!statesRes.ok) throw new Error(`Failed to load state boundaries: ${statesRes.status}`);
  const stateGeojson = (await statesRes.json()) as GeoJSON.FeatureCollection;

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

  L.geoJSON(stateGeojson, {
    attribution: 'Boundaries: ABS ASGS (CC BY 4.0)',
    style: (feature) => {
      const code = feature?.properties?.code || '';
      const pc = geo.perCapita[code] || 0;
      return {
        fillColor: getColor(pc),
        weight: 2,
        opacity: 1,
        color: '#fff',
        fillOpacity: 0.7,
      };
    },
    onEachFeature: (feature, layer) => {
      const code = feature.properties?.code || '';
      const name = feature.properties?.name || code;
      const count = geo.byState[code] || 0;
      const pc = geo.perCapita[code] || 0;
      const allTime = summary.byState[code] || 0;
      layer.bindTooltip(
        `${name}: ${formatNumber(count)} fatalities in ${summary.latestYear} (${pc.toFixed(1)} per 100K)`,
        { sticky: true }
      );
      layer.bindPopup(`
        <strong>${name} (${code})</strong><br>
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
    <div class="bar-chart-row" data-tip="${st}: ${formatNumber(count)} fatalities all-time (${((count / summary.totalFatalities) * 100).toFixed(1)}% of national total)">
      <div class="bar-label">${st}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / maxAll) * 100}%;background:${STATE_COLORS[st] || '#6b7280'}"></div></div>
      <div class="bar-value">${formatNumber(count)}</div>
    </div>
  `).join('');
}
