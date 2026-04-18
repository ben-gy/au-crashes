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

const BITRE_URL =
  'https://datahub.roadsafety.gov.au/sites/default/files/documents/bitre_fatalities_feb2026.xlsx';

mkdirSync(RAW_DIR, { recursive: true });

console.log('Downloading BITRE fatalities XLSX...');
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
