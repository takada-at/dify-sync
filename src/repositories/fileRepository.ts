import { promises as fs } from 'fs';
import * as path from 'path';
import * as logger from './logger.js';

export interface LocalFile {
  name: string;
  path: string;
  size: number;
  content?: string;
}

export async function getLocalFiles(
  dirPath: string,
  extensions: string[] = ['.txt', '.md', '.csv', '.json'],
  recursive: boolean = false,
  basePath?: string
): Promise<LocalFile[]> {
  try {
    const files: LocalFile[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const currentBasePath = basePath || dirPath;

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          const stats = await fs.stat(fullPath);

          // Calculate relative path for display
          const relativePath = path.relative(currentBasePath, fullPath);
          // Normalize path separators to forward slashes for consistent display
          const normalizedPath = relativePath.replace(/\\/g, '/');
          const displayName =
            recursive && normalizedPath.includes('/')
              ? normalizedPath
              : entry.name;

          files.push({
            name: displayName,
            path: fullPath,
            size: stats.size,
          });
        }
      } else if (entry.isDirectory() && recursive) {
        // Skip hidden directories and common ignore patterns
        if (
          !entry.name.startsWith('.') &&
          !['node_modules', 'dist', 'build', '__pycache__'].includes(entry.name)
        ) {
          const subFiles = await getLocalFiles(
            fullPath,
            extensions,
            recursive,
            currentBasePath
          );
          files.push(...subFiles);
        }
      }
    }

    return files;
  } catch (error) {
    logger.error(`Error reading directory ${dirPath}:`, error);
    throw error;
  }
}

export async function getDirectories(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const directories: string[] = [];

    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        !['node_modules', 'dist', 'build', '__pycache__'].includes(entry.name)
      ) {
        directories.push(entry.name);
      }
    }

    return directories;
  } catch (error) {
    logger.error(`Error reading directories in ${dirPath}:`, error);
    throw error;
  }
}

export async function readFileContent(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    logger.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    logger.info(`File written successfully: ${filePath}`);
  } catch (error) {
    logger.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
}

export async function downloadFile(
  fileName: string,
  content: string,
  downloadDir: string,
  overwrite: boolean = false
): Promise<string> {
  await fs.mkdir(downloadDir, { recursive: true });

  const filePath = path.join(downloadDir, fileName);

  // Check if file exists and overwrite is not confirmed
  if (!overwrite && (await fileExists(filePath))) {
    throw new Error(`File already exists: ${fileName}`);
  }

  await writeFile(filePath, content);
  return filePath;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getFileStats(filePath: string): Promise<any> {
  return fs.stat(filePath);
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

export function isValidFileType(
  fileName: string,
  allowedExtensions: string[] = ['.txt', '.md', '.csv', '.json']
): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(ext);
}
