import type { DatasetFileType, DatasetStatus } from '../types/dataset';

/** Database row for the `datasets` table. */
export interface Dataset {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  originalFilename: string;
  /** Relative storage key managed by StorageService (never a raw FS path). */
  storagePath: string | null;
  fileType: DatasetFileType;
  fileSize: number;
  rowCount: number | null;
  columnCount: number | null;
  status: DatasetStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Database row for the `dataset_columns` table. */
export interface DatasetColumn {
  id: string;
  datasetId: string;
  columnName: string;
  /** DuckDB type, e.g. `VARCHAR`, `BIGINT`, `DOUBLE`, `DATE`. */
  dataType: string;
  nullable: boolean;
  ordinalPosition: number;
  uniqueCount: number | null;
  nullCount: number | null;
  createdAt: Date;
}

/**
 * Public dataset representation exposed via the API. Storage paths are
 * intentionally omitted — clients never need to know where files live.
 */
export type PublicDataset = Omit<Dataset, 'storagePath'>;

export function toPublicDataset(dataset: Dataset): PublicDataset {
  const { storagePath: _storagePath, ...publicDataset } = dataset;
  return publicDataset;
}
