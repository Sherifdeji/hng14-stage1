import type { Request, Response } from 'express';
import { parseNaturalLanguageQuery } from '../domain/natural-language.js';
import { ValidationError } from '../errors/api-error.js';
import {
  createProfile,
  deleteProfileById,
  getAllProfiles,
  getProfileById,
  type ProfileListQuery,
} from '../services/profiles.service.js';

function serializeProfile(profile: {
  id: string;
  name: string;
  gender: string;
  genderProbability: number;
  age: number;
  ageGroup: string;
  countryId: string;
  countryName: string;
  countryProbability: number;
  createdAt: Date;
}) {
  return {
    id: profile.id,
    name: profile.name,
    gender: profile.gender,
    gender_probability: profile.genderProbability,
    age: profile.age,
    age_group: profile.ageGroup,
    country_id: profile.countryId,
    country_name: profile.countryName,
    country_probability: profile.countryProbability,
    created_at: profile.createdAt.toISOString(),
  };
}

function throwInvalidQuery(): never {
  throw new ValidationError(422, 'Invalid query parameters');
}

function assertAllowedKeys(
  input: Request['query'],
  allowedKeys: Set<string>,
): void {
  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      throwInvalidQuery();
    }
  }
}

function getQueryString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throwInvalidQuery();
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function getEnumValue<T extends string>(
  value: unknown,
  options: readonly T[],
): T | undefined {
  const parsed = getQueryString(value);
  if (parsed === undefined) {
    return undefined;
  }

  const normalized = parsed.toLowerCase();
  const selected = options.find(option => option === normalized);
  if (!selected) {
    throwInvalidQuery();
  }

  return selected;
}

function getCountryId(value: unknown): string | undefined {
  const parsed = getQueryString(value);
  if (parsed === undefined) {
    return undefined;
  }

  const upper = parsed.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) {
    throwInvalidQuery();
  }

  return upper;
}

function getNumberValue(value: unknown): number | undefined {
  const parsed = getQueryString(value);
  if (parsed === undefined) {
    return undefined;
  }

  const numeric = Number(parsed);
  if (!Number.isFinite(numeric)) {
    throwInvalidQuery();
  }

  return numeric;
}

function getIntegerValue(value: unknown): number | undefined {
  const numeric = getNumberValue(value);
  if (numeric === undefined) {
    return undefined;
  }

  if (!Number.isInteger(numeric)) {
    throwInvalidQuery();
  }

  return numeric;
}

function getProbabilityValue(value: unknown): number | undefined {
  const numeric = getNumberValue(value);
  if (numeric === undefined) {
    return undefined;
  }

  if (numeric < 0 || numeric > 1) {
    throwInvalidQuery();
  }

  return numeric;
}

function getPagination(query: Request['query']): {
  page: number;
  limit: number;
} {
  const page = getIntegerValue(query.page) ?? 1;
  const limit = getIntegerValue(query.limit) ?? 10;

  if (page <= 0 || limit <= 0 || limit > 50) {
    throwInvalidQuery();
  }

  return { page, limit };
}

function parseListQuery(query: Request['query']): ProfileListQuery {
  const allowed = new Set([
    'gender',
    'age_group',
    'country_id',
    'min_age',
    'max_age',
    'min_gender_probability',
    'min_country_probability',
    'sort_by',
    'order',
    'page',
    'limit',
  ]);
  assertAllowedKeys(query, allowed);

  const gender = getEnumValue(query.gender, ['male', 'female'] as const);
  const ageGroup = getEnumValue(query.age_group, [
    'child',
    'teenager',
    'adult',
    'senior',
  ] as const);
  const countryId = getCountryId(query.country_id);
  const minAge = getIntegerValue(query.min_age);
  const maxAge = getIntegerValue(query.max_age);
  const minGenderProbability = getProbabilityValue(
    query.min_gender_probability,
  );
  const minCountryProbability = getProbabilityValue(
    query.min_country_probability,
  );
  const sortBy =
    getEnumValue(query.sort_by, [
      'age',
      'created_at',
      'gender_probability',
    ] as const) ?? 'created_at';
  const order = getEnumValue(query.order, ['asc', 'desc'] as const) ?? 'desc';
  const pagination = getPagination(query);

  if (
    (minAge !== undefined && minAge < 0) ||
    (maxAge !== undefined && maxAge < 0)
  ) {
    throwInvalidQuery();
  }

  if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
    throwInvalidQuery();
  }

  return {
    gender,
    ageGroup,
    countryId,
    minAge,
    maxAge,
    minGenderProbability,
    minCountryProbability,
    sortBy,
    order,
    page: pagination.page,
    limit: pagination.limit,
  };
}

export async function createProfileController(req: Request, res: Response) {
  const name = res.locals.validName as string;
  const result = await createProfile(name);

  if (!result.created) {
    res.status(200).json({
      status: 'success',
      message: 'Profile already exists',
      data: serializeProfile(result.profile),
    });
    return;
  }

  res.status(201).json({
    status: 'success',
    data: serializeProfile(result.profile),
  });
}

export async function getSingleProfileController(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const profile = await getProfileById(id);
  res.status(200).json({
    status: 'success',
    data: serializeProfile(profile),
  });
}

export async function getAllProfilesController(req: Request, res: Response) {
  const query = parseListQuery(req.query);
  const result = await getAllProfiles(query);

  res.status(200).json({
    status: 'success',
    page: result.page,
    limit: result.limit,
    total: result.total,
    data: result.data.map(serializeProfile),
  });
}

export async function searchProfilesController(req: Request, res: Response) {
  const allowed = new Set(['q', 'page', 'limit']);
  assertAllowedKeys(req.query, allowed);

  const queryText = getQueryString(req.query.q);
  if (!queryText) {
    throw new ValidationError(400, 'Missing or empty parameter');
  }

  const parsed = parseNaturalLanguageQuery(queryText);
  if (!parsed) {
    throw new ValidationError(400, 'Unable to interpret query');
  }

  const pagination = getPagination(req.query);
  const result = await getAllProfiles({
    ...parsed,
    sortBy: 'created_at',
    order: 'desc',
    page: pagination.page,
    limit: pagination.limit,
  });

  res.status(200).json({
    status: 'success',
    page: result.page,
    limit: result.limit,
    total: result.total,
    data: result.data.map(serializeProfile),
  });
}

export async function deleteProfileController(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await deleteProfileById(id);
  res.status(204).send();
}
