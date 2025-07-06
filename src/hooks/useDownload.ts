import { useState, useRef, useCallback } from 'react';
import {
  Document,
  DownloadProgress as UIDownloadProgress,
} from '../core/types/index.js';
import {
  getDocuments,
  getDocumentSegments,
} from '../repositories/difyClient.js';
import { getDirectories } from '../repositories/fileRepository.js';
import { loadConfig } from '../repositories/config.js';
import * as logger from '../repositories/logger.js';
import {
  createBatchDownloadProcessor,
  type DownloadDependencies,
  type FileConflict,
  type DocumentSegment,
} from '../core/download/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Delay in milliseconds before returning to menu after completion
const COMPLETION_DELAY = 1500;

export function useDownload(
  onConflict?: (fileName: string) => void,
  onError?: (error: string) => void,
  forceOverwrite?: boolean,
  onComplete?: () => void
) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<
    UIDownloadProgress[]
  >([]);
  const [currentDownloadIndex, setCurrentDownloadIndex] = useState<number>(0);
  const [currentDownloadDocuments, setCurrentDownloadDocuments] = useState<
    Document[]
  >([]);
  const [downloadDirectories, setDownloadDirectories] = useState<string[]>([]);
  const [selectedDownloadDir, setSelectedDownloadDir] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Use ref for overwriteAllDecision to ensure immediate updates
  const overwriteAllDecisionRef = useRef<'overwrite' | 'skip' | null>(null);

  // Use ref to store conflict resolver to avoid stale closure issues
  const conflictResolverRef = useRef<
    ((decision: 'overwrite' | 'skip') => void) | null
  >(null);

  const loadDownloadDirectories = async () => {
    try {
      const dirs = await getDirectories('./');
      setDownloadDirectories(dirs);
    } catch (err) {
      throw new Error(
        `Failed to load download directories: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const loadDocuments = async () => {
    try {
      const config = await loadConfig();
      const allDocuments: Document[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await getDocuments(config.datasetId, page, 100);
        allDocuments.push(...response.data);
        hasMore = response.has_more;
        page++;
      }

      setDocuments(allDocuments);
    } catch (err) {
      throw new Error(
        `Failed to load documents: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const createDependencies = useCallback(
    (): DownloadDependencies => ({
      fetchDocumentSegments: async (
        documentId: string
      ): Promise<DocumentSegment[]> => {
        const config = await loadConfig();
        const response = await getDocumentSegments(
          config.datasetId,
          documentId
        );

        if (!response.data || !Array.isArray(response.data)) {
          return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.data.map((segment: any, index: number) => ({
          content: segment.content || '',
          position: segment.position ?? index,
        }));
      },

      checkFileExists: async (filePath: string): Promise<boolean> => {
        try {
          await fs.access(filePath);
          return true;
        } catch {
          return false;
        }
      },

      saveFile: async (
        filePath: string,
        content: string,
        overwrite: boolean
      ): Promise<void> => {
        const dir = path.dirname(filePath);

        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });

        if (!overwrite) {
          // Check if file exists
          try {
            await fs.access(filePath);
            throw new Error(`File already exists: ${path.basename(filePath)}`);
          } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((err as any).code !== 'ENOENT') {
              throw err;
            }
          }
        }

        await fs.writeFile(filePath, content, 'utf-8');
      },
    }),
    []
  );

  const handleDownloadDocuments = async (selectedDocuments: Document[]) => {
    globalThis.console.log(
      'Starting download for documents:',
      selectedDocuments.map(d => d.name)
    );

    if (isProcessing) {
      globalThis.console.log('Download already in progress, ignoring');
      return;
    }

    setCurrentDownloadDocuments(selectedDocuments);
    setCurrentDownloadIndex(0);
    setIsProcessing(true);
    overwriteAllDecisionRef.current = null; // Reset the overwrite all decision

    const progress: UIDownloadProgress[] = selectedDocuments.map(doc => ({
      fileName: doc.name,
      progress: 0,
      status: 'pending',
    }));

    setDownloadProgress(progress);

    const deps = createDependencies();
    const batchProcessor = createBatchDownloadProcessor(deps);

    try {
      const results = await batchProcessor({
        documents: selectedDocuments,
        outputDir: selectedDownloadDir,
        overwriteHandler: {
          onConflict: async (conflict: FileConflict) => {
            // If forceOverwrite is true, automatically overwrite
            if (forceOverwrite) {
              return 'overwrite';
            }

            // If we have an overwrite all decision, use it
            if (overwriteAllDecisionRef.current !== null) {
              return overwriteAllDecisionRef.current;
            }

            return new Promise<'overwrite' | 'skip'>(resolve => {
              // Store the resolver
              conflictResolverRef.current = (
                decision: 'overwrite' | 'skip'
              ) => {
                conflictResolverRef.current = null;
                resolve(decision);
              };

              // Trigger the conflict UI
              onConflict?.(conflict.documentName);
            });
          },
        },
        onProgress: (completed, total, currentDocument) => {
          setCurrentDownloadIndex(completed);

          setDownloadProgress(prev =>
            prev.map((p, index) => {
              if (index < completed) {
                return { ...p, status: 'completed' as const, progress: 100 };
              } else if (index === completed) {
                return { ...p, status: 'in-progress' as const, progress: 50 };
              }
              return p;
            })
          );

          logger.info(
            `Downloading ${currentDocument} (${completed + 1}/${total})`
          );
        },
      });

      // Update final progress based on results
      setDownloadProgress(prev =>
        prev.map((p, index) => {
          const result = results[index];
          if (!result) return p;

          return {
            ...p,
            status:
              result.status === 'success'
                ? ('completed' as const)
                : result.status === 'skipped'
                  ? ('skipped' as const)
                  : ('error' as const),
            progress: result.status === 'success' ? 100 : p.progress,
            error: result.error,
          };
        })
      );

      setIsProcessing(false);
      globalThis.console.log('All downloads completed');

      // Call onComplete callback after a short delay to show completion status
      if (onComplete) {
        globalThis.setTimeout(() => {
          onComplete();
        }, COMPLETION_DELAY);
      }
    } catch (err) {
      setIsProcessing(false);
      onError?.(err instanceof Error ? err.message : 'Download process failed');
    }
  };

  const handleOverwriteDecision = useCallback(
    (overwrite: boolean, applyToAll?: boolean) => {
      // If apply to all, set the decision for all future conflicts
      if (applyToAll) {
        overwriteAllDecisionRef.current = overwrite ? 'overwrite' : 'skip';
      }

      // Call the stored conflict resolver
      if (conflictResolverRef.current) {
        conflictResolverRef.current(overwrite ? 'overwrite' : 'skip');
      }
    },
    []
  );

  return {
    documents,
    downloadProgress,
    currentDownloadIndex,
    currentDownloadDocuments,
    downloadDirectories,
    selectedDownloadDir,
    setSelectedDownloadDir,
    loadDownloadDirectories,
    loadDocuments,
    handleDownloadDocuments,
    handleOverwriteDecision,
  };
}
