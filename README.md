# AI Video Ads Generator (MVP)

MVP: Generate TikTok-ready (9:16, 5/10/15s, no-audio) product ad videos via PixVerse v6.

## Prereqs

- Node 18+
- Postgres

## Setup

1. Copy `.env.example` to `.env` and fill values
2. Install deps: `npm install`
3. DB migrate: `npx prisma migrate dev`
4. Seed: `npx prisma db seed`
5. Dev server: `npm run dev`
6. Worker (separate terminal): `npm run worker`
