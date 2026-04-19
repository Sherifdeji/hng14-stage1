import { UpstreamInvalidResponseError } from '../errors/api-error.js';
import { fetchJson } from '../lib/http.js';

type GenderizeResponse = {
  gender: string | null;
  probability: number | null;
  count: number;
};

type AgifyResponse = {
  age: number | null;
};

type NationalizeResponse = {
  country: Array<{
    country_id: string;
    probability: number;
  }>;
};

export async function getGenderizeData(name: string): Promise<{
  gender: string;
  probability: number;
  count: number;
}> {
  const data = await fetchJson<GenderizeResponse>(
    `https://api.genderize.io?name=${encodeURIComponent(name)}`,
    'Genderize',
  );

  if (!data.gender || data.count === 0) {
    throw new UpstreamInvalidResponseError('Genderize');
  }

  return {
    gender: data.gender.toLowerCase(),
    probability: data.probability ?? 0,
    count: data.count,
  };
}

export async function getAgifyData(name: string): Promise<{ age: number }> {
  const data = await fetchJson<AgifyResponse>(
    `https://api.agify.io?name=${encodeURIComponent(name)}`,
    'Agify',
  );

  if (data.age === null) {
    throw new UpstreamInvalidResponseError('Agify');
  }

  return { age: data.age };
}

export async function getNationalizeData(name: string): Promise<{
  country: Array<{
    country_id: string;
    probability: number;
  }>;
}> {
  const data = await fetchJson<NationalizeResponse>(
    `https://api.nationalize.io?name=${encodeURIComponent(name)}`,
    'Nationalize',
  );

  if (!Array.isArray(data.country) || data.country.length === 0) {
    throw new UpstreamInvalidResponseError('Nationalize');
  }

  return data;
}
