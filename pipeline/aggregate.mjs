/**
 * Pipeline: Aggregate ARDD CSVs into optimised JSON for the frontend
 * Run: node pipeline/aggregate.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, 'raw');
const OUT_DIR = join(__dirname, '..', 'public', 'data');

mkdirSync(OUT_DIR, { recursive: true });

// ── Parse CSV ──
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const rawHeaders = [];
  const headerLine = lines[0];
  let inQuote = false;
  let current = '';
  for (let i = 0; i < headerLine.length; i++) {
    const ch = headerLine[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { rawHeaders.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  rawHeaders.push(current.trim());

  const headers = rawHeaders.map(h =>
    h.replace(/[\r\n]+/g, ' ').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
  );

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = [];
    let inQ = false;
    let cur = '';
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    vals.push(cur.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

// ── Load data ──
console.log('Loading fatalities...');
const fatRaw = readFileSync(join(RAW_DIR, 'ardd_fatalities.csv'), 'utf-8');
const fatalities = parseCSV(fatRaw);
console.log(`  → ${fatalities.length.toLocaleString()} fatality records`);

// ── Normalisation ──
const STATE_MAP = {
  'NSW': 'NSW', 'Vic': 'VIC', 'Qld': 'QLD', 'SA': 'SA',
  'WA': 'WA', 'Tas': 'TAS', 'NT': 'NT', 'ACT': 'ACT',
};
function normState(s) { return STATE_MAP[s] || s.toUpperCase(); }

function normGender(g) {
  if (g === 'Male' || g === 'M') return 'Male';
  if (g === 'Female' || g === 'F') return 'Female';
  return 'Unknown';
}

function ageToGroup(age) {
  if (age < 0) return 'Unknown';
  if (age <= 16) return '0-16';
  if (age <= 25) return '17-25';
  if (age <= 39) return '26-39';
  if (age <= 64) return '40-64';
  if (age <= 74) return '65-74';
  return '75+';
}

function parseHour(time) {
  if (!time || time === '-9') return -1;
  const match = time.match(/^(\d{1,2}):/);
  return match ? parseInt(match[1]) : -1;
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function normDay(dayweek) {
  for (const d of DAY_ORDER) {
    if (dayweek && dayweek.toLowerCase() === d.toLowerCase()) return d;
  }
  return '';
}

// State populations (2023 ABS estimates, thousands) for per-capita
const STATE_POP = {
  'NSW': 8238, 'VIC': 6704, 'QLD': 5378, 'WA': 2855,
  'SA': 1834, 'TAS': 572, 'ACT': 464, 'NT': 250,
};

const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

// ── Build records ──
const records = fatalities.map(r => {
  const yr = parseInt(r.Year) || 0;
  if (yr === 0) return null;
  return {
    id: r.Crash_ID,
    st: normState(r.State),
    yr,
    mo: parseInt(r.Month) || 0,
    day: normDay(r.Dayweek),
    hr: parseHour(r.Time),
    ct: r.Crash_Type || '',
    ru: r.Road_User || '',
    gen: normGender(r.Gender),
    age: parseInt(r.Age) || -1,
    ag: ageToGroup(parseInt(r.Age) || -1),
    sl: parseInt(r.Speed_Limit) > 0 ? parseInt(r.Speed_Limit) : -1,
    rt: r.National_Road_Type || '',
    rem: r.National_Remoteness_Areas_2021 || r.National_Remoteness_Areas || '',
    lga: r.National_LGA_Name_2021 || '',
    sa4: r.SA4_Name_2021 || '',
    bus: r.Bus_Involvement === 'Yes' ? 1 : 0,
    hrt: r.Heavy_Rigid_Truck_Involvement === 'Yes' ? 1 : 0,
    art: r.Articulated_Truck_Involvement === 'Yes' ? 1 : 0,
  };
}).filter(Boolean);

console.log(`  → ${records.length.toLocaleString()} valid records`);

// ── Column-oriented format for smaller JSON ──
const columns = ['id','st','yr','mo','day','hr','ct','ru','gen','age','ag','sl','rt','rem','lga','sa4','bus','hrt','art'];
const data = records.map(r => columns.map(c => r[c]));

// ── Aggregation helpers ──
function countBy(arr, keyFn) {
  const counts = {};
  for (const item of arr) {
    const key = keyFn(item);
    if (key === '' || key === undefined || key === null || key === 'Unknown') continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function countBy2D(arr, rowFn, colFn) {
  const matrix = {};
  for (const item of arr) {
    const row = rowFn(item);
    const col = colFn(item);
    if (!row || !col || row === 'Unknown' || col === 'Unknown') continue;
    if (!matrix[row]) matrix[row] = {};
    matrix[row][col] = (matrix[row][col] || 0) + 1;
  }
  return matrix;
}

// ── Trends: fatalities by year × state ──
const yearStateMatrix = countBy2D(records, r => r.yr, r => r.st);
const years = Object.keys(yearStateMatrix).map(Number).sort((a, b) => a - b);
const trends = years.map(yr => {
  const row = { year: yr, total: 0 };
  for (const st of STATES) {
    const v = (yearStateMatrix[yr] || {})[st] || 0;
    row[st] = v;
    row.total += v;
  }
  return row;
});

// ── Summary stats ──
const totalFatalities = records.length;
const latestYear = Math.max(...years);
const latestYearCount = trends.find(t => t.year === latestYear)?.total || 0;
const prevYearCount = trends.find(t => t.year === latestYear - 1)?.total || 0;
const yoyChange = prevYearCount > 0 ? parseFloat(((latestYearCount - prevYearCount) / prevYearCount * 100).toFixed(1)) : 0;

const byState = countBy(records, r => r.st);
const byStateLatest = countBy(records.filter(r => r.yr === latestYear), r => r.st);
const byCrashType = countBy(records, r => r.ct);
const byRoadUser = countBy(records, r => r.ru);
const byGender = countBy(records, r => r.gen);
const byAgeGroup = countBy(records, r => r.ag);
const bySpeedLimit = countBy(records, r => r.sl > 0 ? r.sl.toString() : '');
const byRoadType = countBy(records, r => r.rt);
const byRemoteness = countBy(records, r => r.rem);

// Per-capita by state (latest year, per 100K)
const perCapita = {};
for (const st of STATES) {
  const pop = STATE_POP[st];
  if (pop && byStateLatest[st]) {
    perCapita[st] = parseFloat(((byStateLatest[st] / pop) * 100).toFixed(2));
  }
}

const summary = {
  totalFatalities,
  yearRange: [years[0], latestYear],
  latestYear,
  latestYearCount,
  yoyChange,
  byState,
  byStateLatest,
  perCapita,
  byCrashType,
  byRoadUser,
  byGender,
  byAgeGroup,
  bySpeedLimit,
  byRoadType,
  byRemoteness,
  heavyVehicle: {
    bus: records.filter(r => r.bus).length,
    heavyRigid: records.filter(r => r.hrt).length,
    articulated: records.filter(r => r.art).length,
  },
};

// ── Demographics matrix: age group × gender (cleaned) ──
const AGE_GROUPS = ['0-16', '17-25', '26-39', '40-64', '65-74', '75+'];
const GENDERS = ['Male', 'Female'];
const demographics = {};
for (const ag of AGE_GROUPS) {
  demographics[ag] = {};
  for (const gen of GENDERS) {
    demographics[ag][gen] = records.filter(r => r.ag === ag && r.gen === gen).length;
  }
}

// ── Temporal matrix: day of week × hour bucket ──
const HOUR_LABELS = [];
for (let h = 0; h < 24; h++) {
  HOUR_LABELS.push(`${h.toString().padStart(2, '0')}:00`);
}

const temporal = {};
for (const day of DAY_ORDER) {
  temporal[day] = {};
  for (let h = 0; h < 24; h++) {
    temporal[day][h] = records.filter(r => r.day === day && r.hr === h).length;
  }
}

// ── State × crash type matrix ──
const stateVsCrashType = {};
for (const st of STATES) {
  stateVsCrashType[st] = {};
  const crashTypes = ['Single', 'Multiple', 'Pedestrian'];
  for (const ct of crashTypes) {
    stateVsCrashType[st][ct] = records.filter(r => r.st === st && r.ct === ct).length;
  }
}

// ── State × road user matrix ──
const roadUsers = [...new Set(records.map(r => r.ru))].filter(Boolean).sort();
const stateVsRoadUser = {};
for (const st of STATES) {
  stateVsRoadUser[st] = {};
  for (const ru of roadUsers) {
    const count = records.filter(r => r.st === st && r.ru === ru).length;
    if (count > 0) stateVsRoadUser[st][ru] = count;
  }
}

// ── Geo aggregates ──
const byLGA = countBy(records, r => r.lga);
const bySA4 = countBy(records, r => r.sa4);

// ── State sparklines ──
const stateByYear = {};
for (const st of STATES) {
  stateByYear[st] = years.map(yr => (yearStateMatrix[yr] || {})[st] || 0);
}

// ── Write output ──
const meta = {
  generated: new Date().toISOString(),
  source: 'BITRE Australian Road Deaths Database (ARDD)',
  sourceUrl: 'https://datahub.roadsafety.gov.au/',
  license: 'Creative Commons Attribution 3.0 Australia',
  recordCount: records.length,
  yearRange: [years[0], latestYear],
};

writeFileSync(join(OUT_DIR, 'meta.json'), JSON.stringify(meta));
writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify(summary));
writeFileSync(join(OUT_DIR, 'trends.json'), JSON.stringify({ years, states: STATES, data: trends, stateByYear }));
writeFileSync(join(OUT_DIR, 'demographics.json'), JSON.stringify({ ageGroups: AGE_GROUPS, genders: GENDERS, data: demographics }));
writeFileSync(join(OUT_DIR, 'temporal.json'), JSON.stringify({ days: DAY_ORDER, hours: HOUR_LABELS, data: temporal }));
writeFileSync(join(OUT_DIR, 'matrices.json'), JSON.stringify({ stateVsCrashType, stateVsRoadUser, roadUsers }));
writeFileSync(join(OUT_DIR, 'geo.json'), JSON.stringify({ byState: byStateLatest, byLGA, bySA4, perCapita }));
writeFileSync(join(OUT_DIR, 'records.json'), JSON.stringify({ columns, data }));

// Print summary
console.log(`\nAggregation complete:`);
console.log(`  Records: ${records.length.toLocaleString()}`);
console.log(`  Years: ${years[0]}–${latestYear}`);
console.log(`  Latest year (${latestYear}): ${latestYearCount.toLocaleString()} fatalities (${yoyChange > 0 ? '+' : ''}${yoyChange}% YoY)`);
console.log(`  Output: ${OUT_DIR}`);
for (const f of ['meta','summary','trends','demographics','temporal','matrices','geo','records']) {
  const size = readFileSync(join(OUT_DIR, `${f}.json`)).length;
  console.log(`    ${f}.json: ${(size / 1024).toFixed(1)} KB`);
}
