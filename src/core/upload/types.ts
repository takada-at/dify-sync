export interface LocalFile {
  name: string;
  path: string;
  size?: number;
}

export interface UploadResult {
  fileName: string;
  status: 'success' | 'error';
  error?: string;
  documentId?: string;
}

export interface UploadProgress {
  fileName: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export interface UploadDependencies {
  readFileContent: (filePath: string) => Promise<string>;
  createDocument: (
    fileName: string,
    content: string
  ) => Promise<{ id: string }>;
}

export interface UploadOptions {
  files: LocalFile[];
  onProgress?: (fileName: string, progress: number) => void;
}

export interface BatchUploadOptions extends UploadOptions {
  onFileComplete?: (result: UploadResult) => void;
}
