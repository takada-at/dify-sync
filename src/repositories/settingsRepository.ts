import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Settings {
  apiUrl?: string;
  apiKey?: string;
  datasetId?: string;
}

const SETTINGS_DIR = path.join(os.homedir(), '.config', 'dify-sync');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json');

export async function loadSettingsFromFile(): Promise<Settings | null> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid
    return null;
  }
}

export async function saveSettingsToFile(settings: Settings): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(SETTINGS_DIR, { recursive: true });

    // Write settings to file
    await fs.writeFile(
      SETTINGS_FILE,
      JSON.stringify(settings, null, 2),
      'utf-8'
    );
  } catch (error) {
    throw new Error(`Failed to save settings: ${error}`);
  }
}

export function getSettingsFilePath(): string {
  return SETTINGS_FILE;
}
