import type { 
  LocalFile, 
  UploadDependencies, 
  UploadOptions,
  BatchUploadOptions,
  UploadResult 
} from './types.js';

export function createUploadProcessor(deps: UploadDependencies) {
  return async function processUpload(
    file: LocalFile,
    onProgress?: (fileName: string, progress: number) => void
  ): Promise<UploadResult> {
    try {
      // Initial progress
      onProgress?.(file.name, 0);
      
      // Read file content
      onProgress?.(file.name, 25);
      const content = await deps.readFileContent(file.path);
      
      // Upload to API
      onProgress?.(file.name, 50);
      const result = await deps.createDocument(file.name, content);
      
      // Complete
      onProgress?.(file.name, 100);
      
      return {
        fileName: file.name,
        status: 'success',
        documentId: result.id
      };
    } catch (error) {
      return {
        fileName: file.name,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };
}

export function createBatchUploadProcessor(deps: UploadDependencies) {
  const processUpload = createUploadProcessor(deps);
  
  return async function processBatchUpload(
    options: BatchUploadOptions
  ): Promise<UploadResult[]> {
    const { files, onProgress, onFileComplete } = options;
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await processUpload(file, onProgress);
      results.push(result);
      onFileComplete?.(result);
    }
    
    return results;
  };
}

export interface UploadStats {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export function calculateUploadStats(results: UploadResult[]): UploadStats {
  const stats: UploadStats = {
    total: results.length,
    successful: 0,
    failed: 0,
    errors: []
  };
  
  for (const result of results) {
    if (result.status === 'success') {
      stats.successful++;
    } else {
      stats.failed++;
      if (result.error) {
        stats.errors.push(`${result.fileName}: ${result.error}`);
      }
    }
  }
  
  return stats;
}