export interface Document {
  id: string;
  name: string;
}

export interface DocumentSegment {
  content: string;
  position: number;
}

export interface DownloadProgress {
  documentId: string;
  documentName: string;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'skipped';
  error?: string;
}

export interface FileConflict {
  documentId: string;
  documentName: string;
  filePath: string;
}

export interface DownloadDependencies {
  fetchDocumentSegments: (documentId: string) => Promise<DocumentSegment[]>;
  checkFileExists: (filePath: string) => Promise<boolean>;
  saveFile: (filePath: string, content: string, overwrite: boolean) => Promise<void>;
}

export interface OverwriteHandler {
  onConflict: (conflict: FileConflict) => Promise<'overwrite' | 'skip'>;
}

export interface DownloadResult {
  documentId: string;
  documentName: string;
  status: 'success' | 'skipped' | 'error';
  error?: string;
}