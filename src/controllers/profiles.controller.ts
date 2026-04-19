import type { Request, Response } from 'express';
import { ValidationError } from '../errors/api-error.js';
import {
  createProfile,
  deleteProfileById,
  getAllProfiles,
  getProfileById,
} from '../services/profiles.service.js';

function serializeProfile(profile: {
  id: string;
  name: string;
  gender: string;
  genderProbability: number;
  sampleSize: number;
  age: number;
  ageGroup: string;
  countryId: string;
  countryProbability: number;
  createdAt: Date;
}) {
  return {
    id: profile.id,
    name: profile.name,
    gender: profile.gender,
    gender_probability: profile.genderProbability,
    sample_size: profile.sampleSize,
    age: profile.age,
    age_group: profile.ageGroup,
    country_id: profile.countryId,
    country_probability: profile.countryProbability,
    created_at: profile.createdAt.toISOString(),
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

function parseFilter(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new ValidationError(422, `Invalid type`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (fieldName === 'country_id') {
    return trimmed.toUpperCase();
  }

  return trimmed.toLowerCase();
}

export async function getAllProfilesController(req: Request, res: Response) {
  const filters = {
    gender: parseFilter(req.query.gender, 'gender'),
    countryId: parseFilter(req.query.country_id, 'country_id'),
    ageGroup: parseFilter(req.query.age_group, 'age_group'),
  };

  const profiles = await getAllProfiles(filters);

  res.status(200).json({
    status: 'success',
    count: profiles.length,
    data: profiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      gender: profile.gender,
      age: profile.age,
      age_group: profile.ageGroup,
      country_id: profile.countryId,
    })),
  });
}

export async function deleteProfileController(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await deleteProfileById(id);
  res.status(204).send();
}
