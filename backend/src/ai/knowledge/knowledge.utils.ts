/**
 * Helper utilities for Knowledge Engine (RAG)
 * PS-05 Enterprise Intelligence Platform
 */

/**
 * Normalizes raw document text by removing control characters, PDF binary residues,
 * font CMap artifacts, and normalizing newlines.
 */
export function normalizeDocumentText(text: string): string {
  if (!text) return '';

  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove PDF CMap / Font glyph table artifacts (e.g., <0059> <006B> endcmap CMapName)
    .replace(/<[0-9a-fA-F]{4,}>/g, ' ')
    .replace(/\b(endbfrange|endcmap|CMapName|defineresource|begincmap|beginbfrange|endcodespacerange|findresource)\b/gi, ' ')
    // Remove PDF stream residue
    .replace(/\/Filter\s*\/[A-Za-z0-9]+/g, ' ')
    .replace(/\/Length\s+\d+/g, ' ')
    // Remove non-printable ASCII / binary control bytes
    .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, ' ')
    // Strip non-standard binary characters while keeping standard punctuation & letters
    .replace(/[^\x20-\x7E\n\t]/g, ' ')
    // Collapse excess spaces and newlines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Computes Cosine Similarity score between two numeric vectors (A and B).
 * Returns a value between -1.0 and 1.0 (1.0 = identical direction).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const valA = a[i] ?? 0;
    const valB = b[i] ?? 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Derives a clean human-readable title from a document filename.
 */
export function titleFromFilename(filename: string): string {
  if (!filename) return 'Untitled Document';
  const clean = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Approximates token count for text strings (4 characters per token heuristic).
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
