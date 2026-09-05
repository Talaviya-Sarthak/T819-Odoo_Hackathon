import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

/**
 * Loads environment variables from (in order of precedence):
 *   1. `backend/.env`        (process.cwd() when run from the backend dir)
 *   2. `<repo root>/.env`
 *
 * First-defined keys win; values in a root `.env` do not override values
 * already set in the process environment.
 */
dotenv.config({
  path: [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
  ],
  override: false,
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required (Neon PostgreSQL connection string)'),

  SUPABASE_DB_URL: z.string().optional().default(''),

  JWT_SECRET: z
    .string()
    .optional()
    .default(process.env.JWT_ACCESS_SECRET || 'ps05-jwt-secret-for-ai-chatbot-session-min32'),

  JWT_EXPIRES_IN: z.string().default('1h'),

  AUTH_COOKIE_NAME: z.string().min(1).default('ps05_token'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // --- Dataset configuration ---
  MAX_DATASET_SIZE_MB: z.coerce.number().int().positive().default(100),

  // Resolved relative to the backend working directory. Abstracted behind
  // StorageService so this can later point at S3/R2/Azure storage.
  DATASET_STORAGE_PATH: z.string().min(1).default('./storage/datasets'),

  // --- AI configuration ---
  GROQ_API_KEY: z.string().optional().default(process.env.GROQ_API_KEY || ''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

/**
 * Effective PostgreSQL connection string.
 * Automatically falls back to DATABASE_URL if SUPABASE_DB_URL contains placeholder values.
 */
const rawSupabaseUrl = process.env.SUPABASE_DB_URL || env.SUPABASE_DB_URL;
const isPlaceholderSupabase =
  !rawSupabaseUrl ||
  rawSupabaseUrl.includes('YOUR_PASSWORD') ||
  rawSupabaseUrl.includes('<PASSWORD>');

export const effectiveDatabaseUrl = isPlaceholderSupabase ? env.DATABASE_URL : rawSupabaseUrl;

/** Maximum accepted dataset upload size in bytes. */
export const MAX_DATASET_SIZE_BYTES = env.MAX_DATASET_SIZE_MB * 1024 * 1024;

/** Parsed list of allowed CORS origins. */
export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
