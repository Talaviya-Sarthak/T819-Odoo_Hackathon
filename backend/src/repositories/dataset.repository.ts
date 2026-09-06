import { pool } from '../config/database';
import type { Dataset } from '../models/dataset.model';
import type { DatasetFileType, DatasetStatus } from '../types/dataset';

const DATASET_COLUMNS = `
  id,
  user_id,
  name,
  description,
  original_filename,
  storage_path,
  file_type,
  file_size,
  row_count,
  column_count,
  status,
  error_message,
  created_at,
  updated_at
` as const;

interface DatasetRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  original_filename: string;
  storage_path: string | null;
  file_type: DatasetFileType;
  file_size: number;
  row_count: number | null;
  column_count: number | null;
  status: DatasetStatus;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: DatasetRow): Dataset {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    originalFilename: row.original_filename,
    storagePath: row.storage_path,
    fileType: row.file_type,
    fileSize: row.file_size,
    rowCount: row.row_count,
    columnCount: row.column_count,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectColumns = `SELECT ${DATASET_COLUMNS} FROM datasets`;

export interface CreateDatasetInput {
  userId: string;
  name: string;
  description: string | null;
  originalFilename: string;
  fileType: DatasetFileType;
  fileSize: number;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
}

export async function create(input: CreateDatasetInput): Promise<Dataset> {
  const result = await pool.query<DatasetRow>(
    `INSERT INTO datasets (user_id, name, description, original_filename, file_type, file_size, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'UPLOADING')
     RETURNING ${DATASET_COLUMNS}`,
    [
      input.userId,
      input.name,
      input.description,
      input.originalFilename,
      input.fileType,
      input.fileSize,
    ],
  );
  return mapRow(result.rows[0]!);
}

export async function findById(id: string): Promise<Dataset | null> {
  const result = await pool.query<DatasetRow>(
    `${selectColumns} WHERE id = $1`,
    [id],
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function findByIdAndUser(
  id: string,
  userId: string,
): Promise<Dataset | null> {
  const result = await pool.query<DatasetRow>(
    `${selectColumns} WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function listByUser(
  userId: string,
  options: ListOptions = {},
): Promise<Dataset[]> {
  try {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const offset = Math.max(options.offset ?? 0, 0);

    const result = await pool.query<DatasetRow>(
      `${selectColumns}
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows.map(mapRow);
  } catch (err: any) {
    if (err?.code === '42P01') return [];
    throw err;
  }
}

export async function findRecentByUser(
  userId: string,
  limit = 5,
): Promise<Dataset[]> {
  try {
    const result = await pool.query<DatasetRow>(
      `${selectColumns}
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, Math.min(Math.max(limit, 1), 20)],
    );
    return result.rows.map(mapRow);
  } catch (err: any) {
    if (err?.code === '42P01') return [];
    throw err;
  }
}

export async function countByUser(userId: string): Promise<number> {
  try {
    const result = await pool.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM datasets WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0]?.total ?? 0;
  } catch (err: any) {
    if (err?.code === '42P01') return 0;
    throw err;
  }
}

export async function countByUserAndStatus(
  userId: string,
  status: DatasetStatus,
): Promise<number> {
  const result = await pool.query<{ total: number }>(
    `SELECT count(*)::int AS total FROM datasets WHERE user_id = $1 AND status = $2`,
    [userId, status],
  );
  return result.rows[0]?.total ?? 0;
}

export async function updateStatus(
  id: string,
  status: DatasetStatus,
  errorMessage: string | null = null,
): Promise<void> {
  await pool.query(
    `UPDATE datasets SET status = $2, error_message = $3 WHERE id = $1`,
    [id, status, errorMessage],
  );
}

export async function updateStorage(
  id: string,
  storagePath: string,
): Promise<void> {
  await pool.query(
    `UPDATE datasets SET storage_path = $2 WHERE id = $1`,
    [id, storagePath],
  );
}

export async function updateMetadata(
  id: string,
  metadata: { rowCount: number; columnCount: number },
): Promise<void> {
  await pool.query(
    `UPDATE datasets SET row_count = $2, column_count = $3 WHERE id = $1`,
    [id, metadata.rowCount, metadata.columnCount],
  );
}

/**
 * Hard-deletes the dataset. `dataset_columns` rows are removed by the
 * ON DELETE CASCADE foreign key. The caller is responsible for deleting the
 * stored file afterwards to avoid orphaned files.
 */
export async function deleteById(id: string): Promise<void> {
  await pool.query(`DELETE FROM datasets WHERE id = $1`, [id]);
}
