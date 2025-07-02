import path from 'node:path';
import type { DocumentSegment } from './types.js';

export function combineSegments(segments: DocumentSegment[]): string {
  return segments
    .sort((a, b) => a.position - b.position)
    .map(segment => segment.content)
    .join('\n\n');
}

export function sanitizeFileName(name: string): string {
  // Normalize and split path using Node's path utilities for cross-platform compatibility
  const normalized = path.posix.normalize(name.trim());
  const parts =
    normalized === '.' ? [] : normalized.split(path.posix.sep).filter(Boolean);

  // Sanitize each part separately (excluding slashes)
  const sanitizedParts = parts.map(part => part.replace(/[\\?%*:|"<>]/g, '-'));

  // Rejoin with forward slash using path.posix.join
  return sanitizedParts.length > 0 ? path.posix.join(...sanitizedParts) : '';
}

export function generateFilePath(
  documentName: string,
  outputDir: string
): string {
  const sanitizedName = sanitizeFileName(documentName);
  return `${outputDir}/${sanitizedName}`;
}
