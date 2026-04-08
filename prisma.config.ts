import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";

// Prisma evaluates this file before loading .env, so we load it manually
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
