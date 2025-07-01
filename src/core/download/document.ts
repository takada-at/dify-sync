import type { DocumentSegment } from './types.js';

export function combineSegments(segments: DocumentSegment[]): string {
  return segments
    .sort((a, b) => a.position - b.position)
    .map(segment => segment.content)
    .join('\n\n');
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-');
}

export function generateFilePath(documentName: string, outputDir: string): string {
  const sanitizedName = sanitizeFileName(documentName);
  const fileName = sanitizedName.endsWith('.txt') ? sanitizedName : `${sanitizedName}.txt`;
  return `${outputDir}/${fileName}`;
}