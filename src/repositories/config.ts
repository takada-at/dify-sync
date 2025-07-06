import { promises as fs } from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { DifyConfig } from '../core/types/index.js';
import { loadSettingsFromFile } from './settingsRepository.js';

config();

let configCache: DifyConfig | null = null;
let datasetIdOverride: string | null = null;

export async function loadConfig(): Promise<DifyConfig> {
  if (configCache) {
    return configCache;
  }

  // Load settings from file
  const fileSettings = await loadSettingsFromFile();

  // Priority: CLI args > env vars > settings file > defaults
  const apiUrl =
    globalThis.process.env.DIFY_API_URL ||
    fileSettings?.apiUrl ||
    'https://api.dify.ai/v1';

  const apiKey = globalThis.process.env.DIFY_API_KEY || fileSettings?.apiKey;

  const datasetId =
    datasetIdOverride ||
    globalThis.process.env.DIFY_DATASET_ID ||
    fileSettings?.datasetId;

  if (!apiKey) {
    throw new Error(
      'DIFY_API_KEY is required. Please set it via DIFY_API_KEY environment variable or in ~/.config/dify-sync/settings.json'
    );
  }

  if (!datasetId) {
    throw new Error(
      'DIFY_DATASET_ID is required. Please set it via --dataset-id argument, DIFY_DATASET_ID environment variable, or in ~/.config/dify-sync/settings.json'
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
  const envPath = path.join(globalThis.process.cwd(), '.env');
  const envContent = `DIFY_API_URL=${config.apiUrl}
DIFY_API_KEY=${config.apiKey}
DIFY_DATASET_ID=${config.datasetId}
LOG_LEVEL=info
`;

  await fs.writeFile(envPath, envContent);
  configCache = config;
}

export function setDatasetIdOverride(datasetId: string): void {
  datasetIdOverride = datasetId;
  // Clear cache to force reload with new dataset ID
  configCache = null;
}

export function clearConfigCache(): void {
  // Clear cache to force reload from file/env
  configCache = null;
}

export function getLogLevel(): string {
  return globalThis.process.env.LOG_LEVEL || 'info';
}
