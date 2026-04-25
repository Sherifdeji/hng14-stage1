import { findCountryIdInText } from './country.js';

export type NaturalLanguageFilters = {
  gender?: 'male' | 'female';
  ageGroup?: 'child' | 'teenager' | 'adult' | 'senior';
  countryId?: string;
  minAge?: number;
  maxAge?: number;
};

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseGender(query: string): 'male' | 'female' | undefined {
  const maleMatch = /\b(male|males|man|men|boy|boys)\b/.test(query);
  const femaleMatch = /\b(female|females|woman|women|girl|girls)\b/.test(query);

  if (maleMatch && !femaleMatch) {
    return 'male';
  }

  if (femaleMatch && !maleMatch) {
    return 'female';
  }

  return undefined;
}

function parseAgeGroup(
  query: string,
): 'child' | 'teenager' | 'adult' | 'senior' | undefined {
  if (/\b(child|children|kid|kids)\b/.test(query)) {
    return 'child';
  }

  if (/\b(teen|teens|teenager|teenagers)\b/.test(query)) {
    return 'teenager';
  }

  if (/\b(adult|adults)\b/.test(query)) {
    return 'adult';
  }

  if (/\b(senior|seniors|elderly)\b/.test(query)) {
    return 'senior';
  }

  return undefined;
}

function parseAgeBounds(query: string): {
  minAge?: number;
  maxAge?: number;
} {
  const bounds: {
    minAge?: number;
    maxAge?: number;
  } = {};

  if (/\byoung\b/.test(query)) {
    bounds.minAge = 16;
    bounds.maxAge = 24;
  }

  const minAgeMatch = query.match(
    /\b(?:above|over|older than|at least)\s+(\d{1,3})\b/,
  );
  if (minAgeMatch) {
    bounds.minAge = Number(minAgeMatch[1]);
  }

  const maxAgeMatch = query.match(
    /\b(?:below|under|younger than|at most)\s+(\d{1,3})\b/,
  );
  if (maxAgeMatch) {
    bounds.maxAge = Number(maxAgeMatch[1]);
  }

  return bounds;
}

export function parseNaturalLanguageQuery(
  query: string,
): NaturalLanguageFilters | null {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return null;
  }

  const filters: NaturalLanguageFilters = {};

  const gender = parseGender(normalizedQuery);
  if (gender) {
    filters.gender = gender;
  }

  const ageGroup = parseAgeGroup(normalizedQuery);
  if (ageGroup) {
    filters.ageGroup = ageGroup;
  }

  const countryId = findCountryIdInText(normalizedQuery);
  if (countryId) {
    filters.countryId = countryId;
  }

  const ageBounds = parseAgeBounds(normalizedQuery);
  if (ageBounds.minAge !== undefined) {
    filters.minAge = ageBounds.minAge;
  }

  if (ageBounds.maxAge !== undefined) {
    filters.maxAge = ageBounds.maxAge;
  }

  if (
    filters.minAge !== undefined &&
    filters.maxAge !== undefined &&
    filters.minAge > filters.maxAge
  ) {
    return null;
  }

  if (Object.keys(filters).length === 0) {
    return null;
  }

  return filters;
}
