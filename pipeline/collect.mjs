// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
/**
 * Pipeline: Download ARDD fatality data from BITRE (XLSX) and convert to CSV
 * Run: node pipeline/collect.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { read, utils } from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, 'raw');

// BITRE publishes a month-stamped file (e.g. bitre_fatalities_feb2026.xlsx).
// Probe backwards from the current month so scheduled runs always pick up the
// newest release instead of re-fetching a pinned snapshot forever.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

async function resolveLatestUrl() {
  const now = new Date();
  for (let back = 0; back < 12; back++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const candidate = `https://datahub.roadsafety.gov.au/sites/default/files/documents/bitre_fatalities_${MONTHS[d.getUTCMonth()]}${d.getUTCFullYear()}.xlsx`;
    // Ranged GET, not HEAD — the datahub server hangs on HEAD from some
    // networks. Errors/timeouts on one candidate just move to the next month.
    try {
      const probe = await fetch(candidate, {
        headers: { Range: 'bytes=0-0' },
        signal: AbortSignal.timeout(30_000),
      });
      probe.body?.cancel();
      if (probe.ok || probe.status === 206) return candidate;
    } catch {
      // unreachable candidate — keep probing older months
    }
  }
  throw new Error('No BITRE fatalities XLSX found in the last 12 months');
}

mkdirSync(RAW_DIR, { recursive: true });

let BITRE_URL;
try {
  BITRE_URL = await resolveLatestUrl();
} catch (err) {
  // datahub.roadsafety.gov.au blocks some CI networks (GitHub runners time
  // out on every candidate; data.gov.au's ARDD mirror is frozen at Oct 2023).
  // Soft-fail so scheduled runs don't alarm: existing data stays untouched,
  // and the pipeline self-heals if BITRE becomes reachable. A local
  // `npm run pipeline` + push still refreshes the data.
  console.warn(`::warning::${err.message} — source unreachable from this network; keeping existing data.`);
  process.exit(0);
}
console.log(`Downloading BITRE fatalities XLSX (${BITRE_URL.split('/').pop()})...`);
const res = await fetch(BITRE_URL);
if (!res.ok) throw new Error(`Failed to fetch XLSX: ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(join(RAW_DIR, 'bitre_fatalities.xlsx'), buf);
console.log(`  → Downloaded ${(buf.length / 1024 / 1024).toFixed(1)} MB`);

console.log('Converting XLSX to CSV...');
const wb = read(buf, { type: 'buffer' });
const sheet = wb.Sheets[wb.SheetNames[0]];
// Find the header row (contains "Crash ID") — skip title/metadata rows
const range = utils.decode_range(sheet['!ref']);
let headerRow = 0;
for (let r = range.s.r; r <= Math.min(range.s.r + 10, range.e.r); r++) {
  const cell = sheet[utils.encode_cell({ r, c: 0 })];
  if (cell && String(cell.v).trim() === 'Crash ID') { headerRow = r; break; }
}
range.s.r = headerRow;
sheet['!ref'] = utils.encode_range(range);
const csv = utils.sheet_to_csv(sheet);
writeFileSync(join(RAW_DIR, 'ardd_fatalities.csv'), csv);
const lines = csv.trim().split('\n').length - 1;
console.log(`  → ${lines.toLocaleString()} records`);

console.log('Collection complete.');
