import type {
  Document,
  DownloadDependencies,
  OverwriteHandler,
  DownloadResult,
  FileConflict,
} from './types.js';
import { combineSegments, generateFilePath } from './document.js';

export interface ProcessDownloadOptions {
  document: Document;
  outputDir: string;
  overwriteHandler: OverwriteHandler;
}

export function createDownloadProcessor(deps: DownloadDependencies) {
  return async function processDownload(
    options: ProcessDownloadOptions
  ): Promise<DownloadResult> {
    const { document, outputDir, overwriteHandler } = options;
    const filePath = generateFilePath(document.name, outputDir);

    try {
      const fileExists = await deps.checkFileExists(filePath);

      if (fileExists) {
        const conflict: FileConflict = {
          documentId: document.id,
          documentName: document.name,
          filePath,
        };

        const decision = await overwriteHandler.onConflict(conflict);

        if (decision === 'skip') {
          return {
            documentId: document.id,
            documentName: document.name,
            status: 'skipped',
          };
        }
      }

      const segments = await deps.fetchDocumentSegments(document.id);
      const content = combineSegments(segments);

      await deps.saveFile(filePath, content, fileExists);

      return {
        documentId: document.id,
        documentName: document.name,
        status: 'success',
      };
    } catch (error) {
      return {
        documentId: document.id,
        documentName: document.name,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
}

export interface BatchDownloadOptions {
  documents: Document[];
  outputDir: string;
  overwriteHandler: OverwriteHandler;
  onProgress?: (
    completed: number,
    total: number,
    currentDocument: string
  ) => void;
}

export function createBatchDownloadProcessor(deps: DownloadDependencies) {
  const processDownload = createDownloadProcessor(deps);

  return async function processBatchDownload(
    options: BatchDownloadOptions
  ): Promise<DownloadResult[]> {
    const { documents, outputDir, overwriteHandler, onProgress } = options;
    const results: DownloadResult[] = [];

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];

      if (onProgress) {
        onProgress(i, documents.length, document.name);
      }

      const result = await processDownload({
        document,
        outputDir,
        overwriteHandler,
      });

      results.push(result);
    }

    return results;
  };
}
