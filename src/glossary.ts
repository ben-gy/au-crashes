// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
export interface GlossaryEntry {
  term: string;
  definition: string;
}

export const glossary: Record<string, GlossaryEntry> = {
  ARDD: {
    term: 'Australian Road Deaths Database',
    definition:
      'A national database maintained by BITRE recording basic details of all road traffic crash fatalities in Australia, sourced from state and territory police reports.',
  },
  BITRE: {
    term: 'Bureau of Infrastructure and Transport Research Economics',
    definition:
      'An Australian Government research bureau that provides economic analysis, research and statistics on infrastructure and transport issues.',
  },
  fatality: {
    term: 'Fatality',
    definition:
      'A person who dies within 30 days as a result of injuries sustained in a road crash. This is the internationally accepted definition used by all Australian jurisdictions.',
  },
  'crash-type': {
    term: 'Crash Type',
    definition:
      'Classification of the crash: "Single" means only one vehicle involved (e.g. hitting a tree or pole). "Multiple" means two or more vehicles collided. "Pedestrian" means a vehicle struck a person on foot.',
  },
  'road-user': {
    term: 'Road User',
    definition:
      'The role of the person killed: Driver, Passenger, Pedestrian, Motorcycle rider, Motorcycle passenger, Pedal cyclist, or other.',
  },
  'speed-limit': {
    term: 'Speed Limit',
    definition:
      'The posted speed limit at the crash location in km/h. A value of -9 or "Unknown" means the speed limit was not recorded.',
  },
  remoteness: {
    term: 'Remoteness Area',
    definition:
      'The ABS Remoteness Area classification of the crash location: Major Cities, Inner Regional, Outer Regional, Remote, or Very Remote. Based on physical distance from urban centres.',
  },
  LGA: {
    term: 'Local Government Area',
    definition:
      'The council or municipality where the crash occurred, as defined by the ABS. Examples: City of Sydney, Greater Geelong, Brisbane.',
  },
  SA4: {
    term: 'Statistical Area Level 4',
    definition:
      'A large geographic area defined by the ABS, roughly equivalent to a labour market region. Covers the whole of Australia without overlap.',
  },
  'per-capita': {
    term: 'Per Capita Rate',
    definition:
      'Fatalities per 100,000 population. This adjusts for population size so states with larger populations can be compared fairly to smaller ones.',
  },
  'yoy-change': {
    term: 'Year-over-Year Change',
    definition:
      'The percentage change in fatalities compared to the previous year. A negative number means fewer deaths.',
  },
  'heavy-vehicle': {
    term: 'Heavy Vehicle Involvement',
    definition:
      'Whether a heavy rigid truck (GVM > 4.5 tonnes) or articulated truck was involved in the crash. Does not mean the truck driver was at fault.',
  },
  'christmas-period': {
    term: 'Christmas Period',
    definition:
      'A defined holiday period used for road safety campaigns, typically from 23 December to 2 January. Fatalities during this period are tracked separately.',
  },
  'easter-period': {
    term: 'Easter Period',
    definition:
      'A defined holiday period from the Thursday before Good Friday to Easter Tuesday. Fatalities during this period are tracked separately.',
  },
};

export function lookupTerm(key: string): GlossaryEntry | null {
  return glossary[key] || null;
}

export function getAllTerms(): (GlossaryEntry & { key: string })[] {
  return Object.entries(glossary)
    .map(([key, entry]) => ({ key, ...entry }))
    .sort((a, b) => a.term.localeCompare(b.term));
}
