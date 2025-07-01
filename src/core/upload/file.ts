import type { LocalFile } from './types.js';
import * as path from 'path';

const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.csv', '.json'];

export function isSupportedFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export function filterSupportedFiles(files: string[]): string[] {
  return files.filter(isSupportedFile);
}

export function createLocalFile(filePath: string, basePath: string): LocalFile {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(basePath, filePath);

  return {
    name: fileName,
    path: relativePath || fileName,
  };
}

export function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export function isTextFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ['.txt', '.md', '.csv', '.json'].includes(ext);
}
