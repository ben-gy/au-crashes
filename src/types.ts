export interface FatalityRecord {
  id: string;
  st: string;
  yr: number;
  mo: number;
  day: string;
  hr: number;
  ct: string;
  ru: string;
  gen: string;
  age: number;
  ag: string;
  sl: number;
  rt: string;
  rem: string;
  lga: string;
  sa4: string;
  bus: number;
  hrt: number;
  art: number;
}

export interface RecordsData {
  columns: string[];
  data: (string | number)[][];
}

export interface Meta {
  generated: string;
  source: string;
  sourceUrl: string;
  license: string;
  recordCount: number;
  yearRange: [number, number];
}

export interface Summary {
  totalFatalities: number;
  yearRange: [number, number];
  latestYear: number;
  latestYearCount: number;
  yoyChange: number;
  byState: Record<string, number>;
  byStateLatest: Record<string, number>;
  perCapita: Record<string, number>;
  byCrashType: Record<string, number>;
  byRoadUser: Record<string, number>;
  byGender: Record<string, number>;
  byAgeGroup: Record<string, number>;
  bySpeedLimit: Record<string, number>;
  byRoadType: Record<string, number>;
  byRemoteness: Record<string, number>;
  heavyVehicle: { bus: number; heavyRigid: number; articulated: number };
}

export interface TrendRow {
  year: number;
  total: number;
  [state: string]: number;
}

export interface TrendsData {
  years: number[];
  states: string[];
  data: TrendRow[];
  stateByYear: Record<string, number[]>;
}

export interface DemographicsData {
  ageGroups: string[];
  genders: string[];
  data: Record<string, Record<string, number>>;
}

export interface TemporalData {
  days: string[];
  hours: string[];
  data: Record<string, Record<string, number>>;
}

export interface MatricesData {
  stateVsCrashType: Record<string, Record<string, number>>;
  stateVsRoadUser: Record<string, Record<string, number>>;
  roadUsers: string[];
}

export interface GeoData {
  byState: Record<string, number>;
  byLGA: Record<string, number>;
  bySA4: Record<string, number>;
  perCapita: Record<string, number>;
}

export type ViewId = 'dashboard' | 'table' | 'trends' | 'map' | 'factors' | 'demographics' | 'temporal' | 'comparison';
