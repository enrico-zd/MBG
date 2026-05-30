import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

async function main() {
  await prisma.user.upsert({
    where: { email: "demo@pixverse.local" },
    update: { name: "Demo User", credits: 2 },
    create: { email: "demo@pixverse.local", name: "Demo User", credits: 2 },
  });

  const packSeeds = [
    {
      slug: "minimal_studio",
      name: "Minimal Studio",
      packStyle:
        "clean studio, softbox lighting, glossy surface, premium minimal",
      defaultTone: "Clean, premium, confident",
      defaultCta: "Shop Now",
      targetDurationSec: 36,
      estimatedCreditCost: 1,
    },
    {
      slug: "lifestyle_urban",
      name: "Lifestyle Urban",
      packStyle:
        "natural daylight, home kitchen / trendy table, hands only, authentic",
      defaultTone: "Friendly, authentic, everyday",
      defaultCta: "Get Yours",
      targetDurationSec: 36,
      estimatedCreditCost: 1,
    },
    {
      slug: "luxury_cinematic",
      name: "Luxury Cinematic",
      packStyle:
        "dark moody background, dramatic rim light, high contrast, subtle film grain",
      defaultTone: "Bold, luxury, cinematic",
      defaultCta: "Explore Collection",
      targetDurationSec: 36,
      estimatedCreditCost: 1,
    },
  ] as const satisfies ReadonlyArray<{
    slug: string;
    name: string;
    packStyle: string;
    defaultTone: string;
    defaultCta: string;
    targetDurationSec: number;
    estimatedCreditCost: number;
  }>;

  for (const seed of packSeeds) {
    await prisma.creativePack.upsert({
      where: { slug: seed.slug },
      update: {
        name: seed.name,
        packStyle: seed.packStyle,
        defaultTone: seed.defaultTone,
        defaultCta: seed.defaultCta,
        targetDurationSec: seed.targetDurationSec,
        estimatedCreditCost: seed.estimatedCreditCost,
      },
      create: {
        slug: seed.slug,
        name: seed.name,
        packStyle: seed.packStyle,
        defaultTone: seed.defaultTone,
        defaultCta: seed.defaultCta,
        targetDurationSec: seed.targetDurationSec,
        estimatedCreditCost: seed.estimatedCreditCost,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
  });
