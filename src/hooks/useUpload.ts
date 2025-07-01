import { useState } from 'react';
import { LocalFile, getLocalFiles, getDirectories, readFileContent } from '../repositories/fileRepository.js';
import { UploadProgress } from '../types/index.js';
import { createDocumentFromText } from '../repositories/difyClient.js';
import { loadConfig } from '../repositories/config.js';
import * as logger from '../repositories/logger.js';

export function useUpload() {
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [directories, setDirectories] = useState<string[]>([]);

  const loadDirectories = async () => {
    try {
      const dirs = await getDirectories('./');
      setDirectories(dirs);
    } catch (err) {
      throw new Error(`Failed to load directories: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const loadLocalFiles = async (dirPath: string, recursive: boolean) => {
    try {
      const files = await getLocalFiles(dirPath, ['.txt', '.md', '.csv', '.json'], recursive);
      setLocalFiles(files);
    } catch (err) {
      throw new Error(`Failed to load local files: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUploadFiles = async (selectedFiles: LocalFile[]) => {
    console.log('Starting upload process for', selectedFiles.length, 'files');
    
    if (selectedFiles.length === 0) {
      console.log('No files selected, returning to menu');
      return;
    }
    
    const progress: UploadProgress[] = selectedFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadProgress(progress);

    try {
      console.log('Loading config...');
      const config = await loadConfig();
      console.log('Config loaded:', { apiUrl: config.apiUrl, datasetId: config.datasetId });
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        console.log(`Processing file ${i + 1}/${selectedFiles.length}: ${file.name}`);
        
        // Update progress to uploading
        setUploadProgress(prev => prev.map((p, index) => 
          index === i ? { ...p, status: 'in-progress', progress: 0 } : p
        ));

        try {
          console.log('Reading file content...');
          const content = await readFileContent(file.path);
          console.log(`File content read, length: ${content.length} characters`);
          
          // Simulate progress updates
          for (let progress = 25; progress <= 75; progress += 25) {
            setUploadProgress(prev => prev.map((p, index) => 
              index === i ? { ...p, progress } : p
            ));
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          console.log('Calling Dify API...');
          await createDocumentFromText(config.datasetId, file.name, content);
          console.log('Upload successful!');
          
          // Mark as completed
          setUploadProgress(prev => prev.map((p, index) => 
            index === i ? { ...p, status: 'completed', progress: 100 } : p
          ));
          
          logger.info(`Successfully uploaded: ${file.name}`);
        } catch (err) {
          console.error(`Error uploading ${file.name}:`, err);
          setUploadProgress(prev => prev.map((p, index) => 
            index === i ? { 
              ...p, 
              status: 'error', 
              error: err instanceof Error ? err.message : 'Upload failed' 
            } : p
          ));
          logger.error(`Failed to upload ${file.name}:`, err);
        }
      }
    } catch (err) {
      console.error('Upload process error:', err);
      throw err;
    }
  };

  return {
    localFiles,
    uploadProgress,
    directories,
    loadDirectories,
    loadLocalFiles,
    handleUploadFiles,
  };
}