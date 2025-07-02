import type { DocumentSegment } from './types.js';

export function combineSegments(segments: DocumentSegment[]): string {
  return segments
    .sort((a, b) => a.position - b.position)
    .map(segment => segment.content)
    .join('\n\n');
}

export function sanitizeFileName(name: string): string {
  // Split by forward slash to preserve directory structure
  const parts = name.split('/');

  // Sanitize each part separately (excluding slashes)
  const sanitizedParts = parts.map(part => part.replace(/[\\?%*:|"<>]/g, '-'));

  // Rejoin with forward slash
  return sanitizedParts.join('/');
}

export function generateFilePath(
  documentName: string,
  outputDir: string
): string {
  const sanitizedName = sanitizeFileName(documentName);
  return `${outputDir}/${sanitizedName}`;
}
