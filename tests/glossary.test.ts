import { describe, expect, it } from 'vitest';
import { lookupTerm, getAllTerms, glossary } from '../src/glossary';

describe('lookupTerm', () => {
  it('returns entry for known term', () => {
    const entry = lookupTerm('ARDD');
    expect(entry).not.toBeNull();
    expect(entry!.term).toBe('Australian Road Deaths Database');
    expect(entry!.definition).toBeTruthy();
  });
  it('returns entry for crash-type', () => {
    const entry = lookupTerm('crash-type');
    expect(entry).not.toBeNull();
    expect(entry!.term).toBe('Crash Type');
  });
  it('returns null for unknown term', () => {
    expect(lookupTerm('nonexistent')).toBeNull();
  });
  it('returns null for empty string', () => {
    expect(lookupTerm('')).toBeNull();
  });
});

describe('getAllTerms', () => {
  it('returns all terms sorted alphabetically', () => {
    const terms = getAllTerms();
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.length).toBe(Object.keys(glossary).length);
    for (let i = 1; i < terms.length; i++) {
      expect(terms[i].term.localeCompare(terms[i - 1].term)).toBeGreaterThanOrEqual(0);
    }
  });
  it('includes key property on each term', () => {
    const terms = getAllTerms();
    for (const t of terms) {
      expect(t.key).toBeTruthy();
      expect(t.term).toBeTruthy();
      expect(t.definition).toBeTruthy();
    }
  });
  it('has road safety domain terms', () => {
    const terms = getAllTerms();
    const termNames = terms.map(t => t.term);
    expect(termNames).toContain('Fatality');
    expect(termNames).toContain('Crash Type');
    expect(termNames).toContain('Road User');
    expect(termNames).toContain('Speed Limit');
    expect(termNames).toContain('Local Government Area');
  });
});

describe('glossary completeness', () => {
  it('has at least 10 terms', () => {
    expect(Object.keys(glossary).length).toBeGreaterThanOrEqual(10);
  });
  it('all entries have term and definition', () => {
    for (const [key, entry] of Object.entries(glossary)) {
      expect(entry.term, `${key} missing term`).toBeTruthy();
      expect(entry.definition, `${key} missing definition`).toBeTruthy();
      expect(entry.definition.length, `${key} definition too short`).toBeGreaterThan(20);
    }
  });
});
