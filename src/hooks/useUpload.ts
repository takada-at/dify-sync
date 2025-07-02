import { useState, useCallback } from 'react';
import {
  LocalFile,
  getLocalFiles,
  getDirectories,
} from '../repositories/fileRepository.js';
import { UploadProgress } from '../core/types/index.js';
import { createDocumentFromText } from '../repositories/difyClient.js';
import { loadConfig } from '../repositories/config.js';
import * as logger from '../repositories/logger.js';
import {
  createBatchUploadProcessor,
  calculateUploadStats,
  type UploadDependencies,
  type LocalFile as CoreLocalFile,
} from '../core/upload/index.js';
import * as fs from 'fs/promises';

// Delay in milliseconds before returning to menu after completion
const COMPLETION_DELAY = 1500;

export function useUpload(onComplete?: () => void) {
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [directories, setDirectories] = useState<string[]>([]);

  const loadDirectories = async () => {
    try {
      const dirs = await getDirectories('./');
      setDirectories(dirs);
    } catch (err) {
      throw new Error(
        `Failed to load directories: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const loadLocalFiles = async (dirPath: string, recursive: boolean) => {
    try {
      const files = await getLocalFiles(
        dirPath,
        ['.txt', '.md', '.csv', '.json'],
        recursive
      );
      setLocalFiles(files);
    } catch (err) {
      throw new Error(
        `Failed to load local files: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const createDependencies = useCallback(
    (): UploadDependencies => ({
      readFileContent: async (filePath: string): Promise<string> => {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
      },

      createDocument: async (
        fileName: string,
        content: string
      ): Promise<{ id: string }> => {
        const config = await loadConfig();
        const response = await createDocumentFromText(
          config.datasetId,
          fileName,
          content
        );
        return { id: response.document.id };
      },
    }),
    []
  );

  const handleUploadFiles = async (selectedFiles: LocalFile[]) => {
    globalThis.console.log(
      'Starting upload process for',
      selectedFiles.length,
      'files'
    );

    if (selectedFiles.length === 0) {
      globalThis.console.log('No files selected, returning to menu');
      return;
    }

    const progress: UploadProgress[] = selectedFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'pending',
    }));

    setUploadProgress(progress);

    try {
      const deps = createDependencies();
      const batchProcessor = createBatchUploadProcessor(deps);

      // Convert LocalFile to CoreLocalFile format
      const coreFiles: CoreLocalFile[] = selectedFiles.map(file => ({
        name: file.name,
        path: file.path,
        size: file.size,
      }));

      const results = await batchProcessor({
        files: coreFiles,
        onProgress: (fileName: string, progress: number) => {
          setUploadProgress(prev =>
            prev.map(p =>
              p.fileName === fileName
                ? {
                    ...p,
                    progress,
                    status: progress < 100 ? 'in-progress' : 'completed',
                  }
                : p
            )
          );
        },
        onFileComplete: result => {
          if (result.status === 'success') {
            logger.info(`Successfully uploaded: ${result.fileName}`);
          } else {
            logger.error(`Failed to upload ${result.fileName}:`, result.error);
          }

          setUploadProgress(prev =>
            prev.map(p =>
              p.fileName === result.fileName
                ? {
                    ...p,
                    status: result.status === 'success' ? 'completed' : 'error',
                    progress: result.status === 'success' ? 100 : p.progress,
                    error: result.error,
                  }
                : p
            )
          );
        },
      });

      const stats = calculateUploadStats(results);
      globalThis.console.log(
        `Upload completed: ${stats.successful}/${stats.total} successful`
      );

      if (stats.failed > 0) {
        globalThis.console.error('Upload errors:', stats.errors);
      }

      // Call onComplete callback after a short delay to show completion status
      if (onComplete) {
        globalThis.setTimeout(() => {
          onComplete();
        }, COMPLETION_DELAY);
      }
    } catch (err) {
      globalThis.console.error('Upload process error:', err);
      throw err;
    }
  };

  return {
    localFiles,
    uploadProgress,
    directories,
    loadDirectories,
    loadLocalFiles,
    handleUploadFiles,
  };
}
