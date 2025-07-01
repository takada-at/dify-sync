import { promises as fs } from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { DifyConfig } from '../core/types/index.js';

config();

let configCache: DifyConfig | null = null;

export async function loadConfig(): Promise<DifyConfig> {
  if (configCache) {
    return configCache;
  }

  const apiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1';
  const apiKey = process.env.DIFY_API_KEY;
  const datasetId = process.env.DIFY_DATASET_ID;

  if (!apiKey) {
    throw new Error(
      'DIFY_API_KEY is required. Please set it in your .env file.'
    );
  }

  if (!datasetId) {
    throw new Error(
      'DIFY_DATASET_ID is required. Please set it in your .env file.'
    );
  }

  configCache = {
    apiUrl,
    apiKey,
    datasetId,
  };

  return configCache;
}

export async function saveConfig(config: DifyConfig): Promise<void> {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = `DIFY_API_URL=${config.apiUrl}
DIFY_API_KEY=${config.apiKey}
DIFY_DATASET_ID=${config.datasetId}
LOG_LEVEL=info
`;

  await fs.writeFile(envPath, envContent);
  configCache = config;
}

export function getLogLevel(): string {
  return process.env.LOG_LEVEL || 'info';
}
