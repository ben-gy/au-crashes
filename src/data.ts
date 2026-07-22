// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type {
  Meta,
  Summary,
  TrendsData,
  DemographicsData,
  TemporalData,
  MatricesData,
  GeoData,
  RecordsData,
  FatalityRecord,
} from './types';
import { parseRecords } from './utils';

const cache: Record<string, unknown> = {};

async function loadJSON<T>(path: string): Promise<T> {
  if (cache[path]) return cache[path] as T;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data = await res.json();
  cache[path] = data;
  return data as T;
}

export async function loadMeta(): Promise<Meta> {
  return loadJSON<Meta>('/data/meta.json');
}

export async function loadSummary(): Promise<Summary> {
  return loadJSON<Summary>('/data/summary.json');
}

export async function loadTrends(): Promise<TrendsData> {
  return loadJSON<TrendsData>('/data/trends.json');
}

export async function loadDemographics(): Promise<DemographicsData> {
  return loadJSON<DemographicsData>('/data/demographics.json');
}

export async function loadTemporal(): Promise<TemporalData> {
  return loadJSON<TemporalData>('/data/temporal.json');
}

export async function loadMatrices(): Promise<MatricesData> {
  return loadJSON<MatricesData>('/data/matrices.json');
}

export async function loadGeo(): Promise<GeoData> {
  return loadJSON<GeoData>('/data/geo.json');
}

export async function loadRecords(): Promise<FatalityRecord[]> {
  const raw = await loadJSON<RecordsData>('/data/records.json');
  const records = parseRecords(raw);
  cache['_parsed_records'] = records;
  return records;
}

export function getCachedRecords(): FatalityRecord[] | null {
  return (cache['_parsed_records'] as FatalityRecord[]) || null;
}
