/**
 * Pipeline: Download ARDD data from data.gov.au
 * Run: node pipeline/collect.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, 'raw');

const SOURCES = [
  {
    name: 'ardd_fatalities.csv',
    url: 'https://data.gov.au/data/dataset/5b530fb8-526e-4fbf-b0f6-aa24e84e4277/resource/fd646fdc-7788-4bea-a736-e4aeb0dd09a8/download/ardd_fatalities.csv',
  },
  {
    name: 'ardd_fatal_crashes.csv',
    url: 'https://data.gov.au/data/dataset/5b530fb8-526e-4fbf-b0f6-aa24e84e4277/resource/d54f7465-74b8-4fff-8653-37e724d0ebbb/download/ardd_fatal_crashes.csv',
  },
];

mkdirSync(RAW_DIR, { recursive: true });

for (const source of SOURCES) {
  console.log(`Downloading ${source.name}...`);
  const res = await fetch(source.url);
  if (!res.ok) throw new Error(`Failed to fetch ${source.name}: ${res.status}`);
  const text = await res.text();
  writeFileSync(join(RAW_DIR, source.name), text);
  const lines = text.trim().split('\n').length - 1;
  console.log(`  → ${lines.toLocaleString()} records`);
}

console.log('Collection complete.');
