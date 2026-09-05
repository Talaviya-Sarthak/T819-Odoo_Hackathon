/**
 * Artifact Generator Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

export type ArtifactFormat = 'csv' | 'json' | 'markdown' | 'pdf' | 'excel';

export interface GeneratedArtifact {
  id: string;
  filename: string;
  format: ArtifactFormat;
  mimeType: string;
  sizeBytes: number;
  content: string | Buffer;
  downloadUrl?: string;
  createdAt: string;
}
