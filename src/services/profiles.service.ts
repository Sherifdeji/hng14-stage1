import { Prisma } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';
import { getAgeGroup, pickTopCountry } from '../domain/classification.js';
import { NotFoundError } from '../errors/api-error.js';
import { prisma } from '../lib/prisma.js';
import {
  getAgifyData,
  getGenderizeData,
  getNationalizeData,
} from './upstream.service.js';

export type ProfileFilters = {
  gender?: string;
  countryId?: string;
  ageGroup?: string;
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function createProfile(name: string): Promise<{
  created: boolean;
  profile: {
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
  };
}> {
  const trimmedName = name.trim();
  const normalizedName = normalizeName(trimmedName);

  const existing = await prisma.profile.findUnique({
    where: { normalizedName },
  });

  if (existing) {
    return { created: false, profile: existing };
  }

  const [genderize, agify, nationalize] = await Promise.all([
    getGenderizeData(trimmedName),
    getAgifyData(trimmedName),
    getNationalizeData(trimmedName),
  ]);

  const { countryId, countryProbability } = pickTopCountry(nationalize.country);
  try {
    const profile = await prisma.profile.create({
      data: {
        id: uuidv7(),
        name: trimmedName,
        normalizedName,
        gender: genderize.gender,
        genderProbability: genderize.probability,
        sampleSize: genderize.count,
        age: agify.age,
        ageGroup: getAgeGroup(agify.age),
        countryId,
        countryProbability,
        createdAt: new Date(),
      },
    });

    return { created: true, profile };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const alreadyExists = await prisma.profile.findUnique({
        where: { normalizedName },
      });

      if (alreadyExists) {
        return { created: false, profile: alreadyExists };
      }
    }

    throw error;
  }
}

export async function getProfileById(id: string) {
  if (!isUuidLike(id)) {
    throw new NotFoundError();
  }

  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) {
    throw new NotFoundError();
  }

  return profile;
}

export async function getAllProfiles(filters: ProfileFilters) {
  const where: Prisma.ProfileWhereInput = {};

  if (filters.gender) {
    where.gender = {
      equals: filters.gender,
      mode: 'insensitive',
    };
  }

  if (filters.countryId) {
    where.countryId = {
      equals: filters.countryId,
      mode: 'insensitive',
    };
  }

  if (filters.ageGroup) {
    where.ageGroup = {
      equals: filters.ageGroup,
      mode: 'insensitive',
    };
  }

  return prisma.profile.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteProfileById(id: string): Promise<void> {
  if (!isUuidLike(id)) {
    throw new NotFoundError();
  }

  const existing = await prisma.profile.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError();
  }

  await prisma.profile.delete({ where: { id } });
}
