import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { prisma } from '../src/lib/prisma.js';

type SeedProfile = {
  name: string;
  gender: string;
  gender_probability: number;
  age: number;
  age_group: 'child' | 'teenager' | 'adult' | 'senior';
  country_id: string;
  country_name: string;
  country_probability: number;
};

type SeedFile = {
  profiles: SeedProfile[];
};

function assertSeedProfile(profile: SeedProfile): void {
  if (!profile.name.trim()) {
    throw new Error('Seed contains a profile with empty name');
  }

  if (!['male', 'female'].includes(profile.gender.toLowerCase())) {
    throw new Error(`Invalid gender for ${profile.name}`);
  }

  if (!['child', 'teenager', 'adult', 'senior'].includes(profile.age_group)) {
    throw new Error(`Invalid age_group for ${profile.name}`);
  }

  if (!/^[A-Za-z]{2}$/.test(profile.country_id)) {
    throw new Error(`Invalid country_id for ${profile.name}`);
  }

  if (profile.age < 0) {
    throw new Error(`Invalid age for ${profile.name}`);
  }

  if (
    profile.gender_probability < 0 ||
    profile.gender_probability > 1 ||
    profile.country_probability < 0 ||
    profile.country_probability > 1
  ) {
    throw new Error(`Invalid probability values for ${profile.name}`);
  }
}

async function main(): Promise<void> {
  const seedPath = path.resolve(process.cwd(), 'seed_profiles.json');
  const seedContent = await readFile(seedPath, 'utf8');
  const parsed = JSON.parse(seedContent) as SeedFile;

  if (!Array.isArray(parsed.profiles)) {
    throw new Error('seed_profiles.json must contain a profiles array');
  }

  const payload = parsed.profiles.map(profile => {
    assertSeedProfile(profile);

    return {
      id: uuidv7(),
      name: profile.name.trim(),
      gender: profile.gender.toLowerCase(),
      genderProbability: profile.gender_probability,
      age: profile.age,
      ageGroup: profile.age_group,
      countryId: profile.country_id.toUpperCase(),
      countryName: profile.country_name.trim(),
      countryProbability: profile.country_probability,
    };
  });

  const result = await prisma.profile.createMany({
    data: payload,
    skipDuplicates: true,
  });

  const total = await prisma.profile.count();
  console.log(
    `Seed completed. Inserted ${result.count} records. Total profiles: ${total}`,
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
