import { prisma } from "../src/lib/db"

async function main() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? "admin@mbg.local"

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { name: "Super Admin" },
    create: { email: superAdminEmail, name: "Super Admin" },
  })

  const existingAdminGrant = await prisma.creditLedger.findFirst({
    where: { userId: superAdmin.id, refType: "admin", refId: "seed_super_admin" },
    select: { id: true },
  })

  if (!existingAdminGrant) {
    await prisma.creditLedger.create({
      data: {
        userId: superAdmin.id,
        delta: 10000,
        reason: "adjustment",
        refType: "admin",
        refId: "seed_super_admin",
      },
    })
  }

  await prisma.templatePack.upsert({
    where: { id: "ugc_hook" },
    update: {},
    create: {
      id: "ugc_hook",
      name: "UGC Hook",
      tags: ["ugc", "hook", "tiktok"],
      basePrompt:
        "Short-form UGC product ad. Hook fast, show product clearly, emphasize benefit, end with CTA.",
      defaults: {
        tone: "energetic",
        pacing: "fast",
      },
    },
  })

  await prisma.templatePack.upsert({
    where: { id: "flash_sale" },
    update: {},
    create: {
      id: "flash_sale",
      name: "Flash Sale",
      tags: ["sale", "urgency", "tiktok"],
      basePrompt:
        "Flash sale product ad with urgency. Big offer, countdown vibe, strong CTA.",
      defaults: {
        tone: "energetic",
        pacing: "fast",
      },
    },
  })

  await prisma.templatePack.upsert({
    where: { id: "benefit_stack" },
    update: {},
    create: {
      id: "benefit_stack",
      name: "Benefit Stack",
      tags: ["benefits", "tiktok"],
      basePrompt:
        "Product ad showing 3 quick benefits with clean visuals and strong clarity.",
      defaults: {
        tone: "friendly",
        pacing: "medium",
      },
    },
  })

  await prisma.templatePack.upsert({
    where: { id: "social_proof" },
    update: {},
    create: {
      id: "social_proof",
      name: "Social Proof",
      tags: ["reviews", "trust", "tiktok"],
      basePrompt:
        "Product ad that highlights social proof and trust signals, then CTA.",
      defaults: {
        tone: "friendly",
        pacing: "medium",
      },
    },
  })

  await prisma.templatePack.upsert({
    where: { id: "before_after" },
    update: {},
    create: {
      id: "before_after",
      name: "Before/After",
      tags: ["transformation", "tiktok"],
      basePrompt:
        "Before/after transformation product ad. Clear contrast, quick payoff, CTA.",
      defaults: {
        tone: "energetic",
        pacing: "fast",
      },
    },
  })

  await prisma.templatePack.upsert({
    where: { id: "premium_luxury" },
    update: {},
    create: {
      id: "premium_luxury",
      name: "Premium/Luxury",
      tags: ["luxury", "premium", "tiktok"],
      basePrompt:
        "Premium product ad with clean minimal luxury vibe, soft camera movement, CTA.",
      defaults: {
        tone: "professional",
        pacing: "slow",
      },
    },
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    await prisma.$disconnect()
    throw e
  })
