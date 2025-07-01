import axios, { AxiosInstance } from 'axios';
import { promises as fs } from 'fs';
import {
  Dataset,
  CreateDocumentResponse,
  DocumentListResponse,
  DatasetListResponse,
} from '../core/types/index.js';
import { loadConfig } from './config.js';
import * as logger from './logger.js';

let axiosInstance: AxiosInstance | null = null;

async function getAxiosInstance(): Promise<AxiosInstance> {
  if (axiosInstance) {
    return axiosInstance;
  }

  const config = await loadConfig();

  axiosInstance = axios.create({
    baseURL: config.apiUrl,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  axiosInstance.interceptors.request.use(
    config => {
      logger.debug(
        `API Request: ${config.method?.toUpperCase()} ${config.url}`
      );
      return config;
    },
    error => {
      logger.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    response => {
      logger.debug(`API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    error => {
      logger.error(
        'API Response Error:',
        error.response?.data || error.message
      );
      return Promise.reject(error);
    }
  );

  return axiosInstance;
}

export async function getDatasets(
  page: number = 1,
  limit: number = 20
): Promise<DatasetListResponse> {
  const client = await getAxiosInstance();
  const response = await client.get<DatasetListResponse>(
    `/datasets?page=${page}&limit=${limit}`
  );
  return response.data;
}

export async function getDataset(datasetId: string): Promise<Dataset> {
  const client = await getAxiosInstance();
  const response = await client.get<Dataset>(`/datasets/${datasetId}`);
  return response.data;
}

export async function createDataset(
  name: string,
  permission: string = 'only_me'
): Promise<Dataset> {
  const client = await getAxiosInstance();
  const response = await client.post<Dataset>('/datasets', {
    name,
    permission,
  });
  return response.data;
}

export async function deleteDataset(datasetId: string): Promise<void> {
  const client = await getAxiosInstance();
  await client.delete(`/datasets/${datasetId}`);
}

export async function getDocuments(
  datasetId: string,
  page: number = 1,
  limit: number = 20
): Promise<DocumentListResponse> {
  const client = await getAxiosInstance();
  const response = await client.get<DocumentListResponse>(
    `/datasets/${datasetId}/documents?page=${page}&limit=${limit}`
  );
  return response.data;
}

export async function createDocumentFromText(
  datasetId: string,
  name: string,
  text: string,
  indexingTechnique: string = 'high_quality'
): Promise<CreateDocumentResponse> {
  const client = await getAxiosInstance();

  globalThis.console.log(
    'Making API call to:',
    `/datasets/${datasetId}/document/create-by-text`
  );
  globalThis.console.log('Request payload:', {
    name,
    text: text.substring(0, 100) + '...',
    indexing_technique: indexingTechnique,
    process_rule: { mode: 'automatic' },
  });

  const response = await client.post<CreateDocumentResponse>(
    `/datasets/${datasetId}/document/create-by-text`,
    {
      name,
      text,
      indexing_technique: indexingTechnique,
      process_rule: {
        mode: 'automatic',
      },
    }
  );
  return response.data;
}

export async function createDocumentFromFile(
  datasetId: string,
  filePath: string,
  indexingTechnique: string = 'high_quality'
): Promise<CreateDocumentResponse> {
  // Note: File upload functionality would need form-data package
  // For now, we'll use text-based upload
  const content = await fs.readFile(filePath, 'utf-8');
  const fileName = filePath.split('/').pop() || 'file';
  return createDocumentFromText(
    datasetId,
    fileName,
    content,
    indexingTechnique
  );
}

export async function updateDocumentWithText(
  datasetId: string,
  documentId: string,
  name: string,
  text: string
): Promise<CreateDocumentResponse> {
  const client = await getAxiosInstance();
  const response = await client.post<CreateDocumentResponse>(
    `/datasets/${datasetId}/documents/${documentId}/update_by_text`,
    {
      name,
      text,
    }
  );
  return response.data;
}

export async function updateDocumentWithFile(
  datasetId: string,
  documentId: string,
  filePath: string,
  name?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  indexingTechnique: string = 'high_quality'
): Promise<CreateDocumentResponse> {
  // Note: File upload functionality would need form-data package
  // For now, we'll use text-based update
  const content = await fs.readFile(filePath, 'utf-8');
  const fileName = name || filePath.split('/').pop() || 'file';
  return updateDocumentWithText(datasetId, documentId, fileName, content);
}

export async function deleteDocument(
  datasetId: string,
  documentId: string
): Promise<void> {
  const client = await getAxiosInstance();
  await client.delete(`/datasets/${datasetId}/documents/${documentId}`);
}

export async function getDocumentIndexingStatus(
  datasetId: string,
  batch: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const client = await getAxiosInstance();
  const response = await client.get(
    `/datasets/${datasetId}/documents/${batch}/indexing-status`
  );
  return response.data;
}

export async function getDocumentSegments(
  datasetId: string,
  documentId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const client = await getAxiosInstance();
  const response = await client.get(
    `/datasets/${datasetId}/documents/${documentId}/segments`
  );
  return response.data;
}
