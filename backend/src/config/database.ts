import { Pool, types as pgTypes } from 'pg';
import { env } from './env';
import { logger } from './logger';

// BIGINT and NUMERIC arrive as strings by default. Dataset row/column counts
// are well within safe integer range, so parse them to JS numbers at the
// driver level to keep the API contract numeric.
pgTypes.setTypeParser(pgTypes.builtins.INT8, (value: string) => Number(value));
pgTypes.setTypeParser(pgTypes.builtins.NUMERIC, (value: string) => Number(value));

/**
 * Main Application PostgreSQL connection pool (Neon PostgreSQL).
 * Used for authentication, users, datasets, backtesting, datamart, etc.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (error) => {
  logger.error({ err: error }, 'Unexpected error on idle Neon PostgreSQL client');
});

/**
 * Dedicated Supabase pgvector Connection Pool for RAG Knowledge Base ONLY.
 */
const rawSupabaseUrl = process.env.SUPABASE_DB_URL || env.SUPABASE_DB_URL;
const isPlaceholderSupabase =
  !rawSupabaseUrl ||
  rawSupabaseUrl.includes('YOUR_PASSWORD') ||
  rawSupabaseUrl.includes('<PASSWORD>');

export const supabasePool = isPlaceholderSupabase
  ? pool // Fallback to Neon pool if Supabase URL is unconfigured/placeholder
  : new Pool({
      connectionString: rawSupabaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

if (!isPlaceholderSupabase) {
  supabasePool.on('error', (error) => {
    logger.error({ err: error }, 'Unexpected error on idle Supabase pgvector client');
  });
}
