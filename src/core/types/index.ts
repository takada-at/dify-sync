export interface DifyConfig {
  apiUrl: string;
  apiKey: string;
  datasetId: string;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  permission: string;
  data_source_type?: string;
  indexing_technique?: string;
  app_count: number;
  document_count: number;
  word_count: number;
  created_by: string;
  created_at: number;
  updated_by: string;
  updated_at: number;
}

export interface Document {
  id: string;
  position: number;
  data_source_type: string;
  data_source_info?: any;
  dataset_process_rule_id?: string;
  name: string;
  created_from: string;
  created_by: string;
  created_at: number;
  tokens: number;
  indexing_status: string;
  error?: string;
  enabled: boolean;
  disabled_at?: number;
  disabled_by?: string;
  archived: boolean;
  display_status?: string;
  word_count: number;
  hit_count: number;
  doc_form: string;
}

export interface CreateDocumentResponse {
  document: Document;
  batch: string;
}

export interface DocumentListResponse {
  data: Document[];
  has_more: boolean;
  limit: number;
  total: number;
  page: number;
}

export interface DatasetListResponse {
  data: Dataset[];
  has_more: boolean;
  limit: number;
  total: number;
  page: number;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  error?: string;
}

export interface DownloadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  error?: string;
}
