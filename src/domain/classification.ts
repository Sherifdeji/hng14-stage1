import { UpstreamInvalidResponseError } from '../errors/api-error.js';

export type AgeGroup = 'child' | 'teenager' | 'adult' | 'senior';

type NationalizeCountry = {
  country_id: string;
  probability: number;
};

export function getAgeGroup(age: number): AgeGroup {
  if (age <= 12) {
    return 'child';
  }

  if (age <= 19) {
    return 'teenager';
  }

  if (age <= 59) {
    return 'adult';
  }

  return 'senior';
}

export function pickTopCountry(countries: NationalizeCountry[]): {
  countryId: string;
  countryProbability: number;
} {
  if (!Array.isArray(countries) || countries.length === 0) {
    throw new UpstreamInvalidResponseError('Nationalize');
  }

  const topCountry = countries.reduce((best, current) => {
    if (current.probability > best.probability) {
      return current;
    }

    return best;
  });

  return {
    countryId: topCountry.country_id.toUpperCase(),
    countryProbability: topCountry.probability,
  };
}
