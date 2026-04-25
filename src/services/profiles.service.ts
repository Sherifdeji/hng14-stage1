import { Prisma, type Profile } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';
import { getCountryNameByCode } from '../domain/country.js';
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
  minAge?: number;
  maxAge?: number;
  minGenderProbability?: number;
  minCountryProbability?: number;
};

export type ProfileSortBy = 'age' | 'created_at' | 'gender_probability';
export type SortOrder = 'asc' | 'desc';

export type ProfileListQuery = ProfileFilters & {
  sortBy: ProfileSortBy;
  order: SortOrder;
  page: number;
  limit: number;
};

export type PaginatedProfiles = {
  page: number;
  limit: number;
  total: number;
  data: Profile[];
};

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function createProfile(name: string): Promise<{
  created: boolean;
  profile: Profile;
}> {
  const trimmedName = name.trim();

  const existing = await prisma.profile.findFirst({
    where: {
      name: {
        equals: trimmedName,
        mode: 'insensitive',
      },
    },
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
  const countryName = getCountryNameByCode(countryId);

  try {
    const profile = await prisma.profile.create({
      data: {
        id: uuidv7(),
        name: trimmedName,
        gender: genderize.gender,
        genderProbability: genderize.probability,
        age: agify.age,
        ageGroup: getAgeGroup(agify.age),
        countryId,
        countryName,
        countryProbability,
      },
    });

    return { created: true, profile };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const alreadyExists = await prisma.profile.findFirst({
        where: {
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
        },
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

function buildProfileWhere(filters: ProfileFilters): Prisma.ProfileWhereInput {
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

  if (filters.minAge !== undefined || filters.maxAge !== undefined) {
    where.age = {};

    if (filters.minAge !== undefined) {
      where.age.gte = filters.minAge;
    }

    if (filters.maxAge !== undefined) {
      where.age.lte = filters.maxAge;
    }
  }

  if (filters.minGenderProbability !== undefined) {
    where.genderProbability = {
      gte: filters.minGenderProbability,
    };
  }

  if (filters.minCountryProbability !== undefined) {
    where.countryProbability = {
      gte: filters.minCountryProbability,
    };
  }

  return where;
}

function toOrderBy(
  sortBy: ProfileSortBy,
  order: SortOrder,
): Prisma.ProfileOrderByWithRelationInput {
  if (sortBy === 'age') {
    return { age: order };
  }

  if (sortBy === 'gender_probability') {
    return { genderProbability: order };
  }

  return { createdAt: order };
}

export async function getAllProfiles(
  query: ProfileListQuery,
): Promise<PaginatedProfiles> {
  const where = buildProfileWhere(query);
  const skip = (query.page - 1) * query.limit;
  const orderBy = toOrderBy(query.sortBy, query.order);

  const [total, data] = await prisma.$transaction([
    prisma.profile.count({ where }),
    prisma.profile.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
    }),
  ]);

  return {
    page: query.page,
    limit: query.limit,
    total,
    data,
  };
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
