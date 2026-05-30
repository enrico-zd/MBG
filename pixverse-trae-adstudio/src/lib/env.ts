import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional().default("file:./dev.db"),
  UPLOAD_DIR: z.string().min(1).optional().default("./public/uploads"),
  BASE_URL: z.string().url().optional().default("http://localhost:3000"),
  PIXVERSE_MOCK: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  BASE_URL: process.env.BASE_URL,
  PIXVERSE_MOCK: process.env.PIXVERSE_MOCK,
});
