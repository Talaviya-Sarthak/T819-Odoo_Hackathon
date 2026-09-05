/**
 * Centralized dataset domain types. Statuses and file types are controlled
 * enums — never arbitrary strings scattered through the codebase.
 */

export const DATASET_STATUSES = [
  'UPLOADING',
  'VALIDATING',
  'PROCESSING',
  'READY',
  'FAILED',
  'DELETED',
] as const;

export type DatasetStatus = (typeof DATASET_STATUSES)[number];

/** File formats the platform understands. Only `csv` is ingestable today. */
export const DATASET_FILE_TYPES = ['csv', 'parquet', 'xlsx', 'json'] as const;

export type DatasetFileType = (typeof DATASET_FILE_TYPES)[number];

export function isDatasetStatus(value: unknown): value is DatasetStatus {
  return typeof value === 'string' && (DATASET_STATUSES as readonly string[]).includes(value);
}

export function isDatasetFileType(value: unknown): value is DatasetFileType {
  return (
    typeof value === 'string' && (DATASET_FILE_TYPES as readonly string[]).includes(value)
  );
}
