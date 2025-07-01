import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Menu, MenuOption } from './Menu.js';
import { FileSelector } from './FileSelector.js';
import { DocumentSelector } from './DocumentSelector.js';
import { DirectorySelector } from './DirectorySelector.js';
import { DownloadDirectorySelector } from './DownloadDirectorySelector.js';
import { ProgressBar } from './ProgressBar.js';
import { OverwriteConfirm } from './OverwriteConfirm.js';
import { LocalFile, getLocalFiles, getDirectories, readFileContent, downloadFile } from '../repositories/fileRepository.js';
import { Document, UploadProgress, DownloadProgress } from '../types/index.js';
import { getDocuments, createDocumentFromText, getDocumentSegments } from '../repositories/difyClient.js';
import { loadConfig } from '../repositories/config.js';
import * as logger from '../repositories/logger.js';

type AppState = 'menu' | 'upload-directory-select' | 'upload-file-select' | 'upload-progress' | 'download-directory-select' | 'download-document-select' | 'download-progress' | 'overwrite-confirm' | 'settings' | 'error';

export function App() {
  const [state, setState] = useState<AppState>('menu');
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress[]>([]);
  const [error, setError] = useState<string>('');
  const [currentDownloadIndex, setCurrentDownloadIndex] = useState<number>(0);
  const [currentDownloadDocuments, setCurrentDownloadDocuments] = useState<Document[]>([]);
  const [conflictFileName, setConflictFileName] = useState<string>('');
  const [directories, setDirectories] = useState<string[]>([]);
  const [downloadDirectories, setDownloadDirectories] = useState<string[]>([]);
  const [selectedDownloadDir, setSelectedDownloadDir] = useState<string>('');

  // Start download processing when state changes to download-progress
  useEffect(() => {
    if (state === 'download-progress' && currentDownloadDocuments.length > 0 && currentDownloadIndex === 0) {
      console.log('useEffect: Starting download queue processing...');
      processDownloadQueue();
    }
  }, [state, currentDownloadDocuments, currentDownloadIndex]);

  const mainMenuOptions: MenuOption[] = [
    { label: 'Upload files to Dify', value: 'upload' },
    { label: 'Download files from Dify', value: 'download' },
    { label: 'Settings', value: 'settings' },
    { label: 'Exit', value: 'exit' },
  ];

  const handleMainMenuSelect = async (value: string) => {
    try {
      switch (value) {
        case 'upload':
          await loadDirectories();
          setState('upload-directory-select');
          break;
        case 'download':
          await loadDownloadDirectories();
          setState('download-directory-select');
          break;
        case 'settings':
          setState('settings');
          break;
        case 'exit':
          process.exit(0);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setState('error');
    }
  };

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

  const loadDownloadDirectories = async () => {
    try {
      const dirs = await getDirectories('./');
      setDownloadDirectories(dirs);
    } catch (err) {
      throw new Error(`Failed to load download directories: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const loadDocuments = async () => {
    try {
      const config = await loadConfig();
      const response = await getDocuments(config.datasetId);
      setDocuments(response.data);
    } catch (err) {
      throw new Error(`Failed to load documents: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUploadFiles = async (selectedFiles: LocalFile[]) => {
    console.log('Starting upload process for', selectedFiles.length, 'files');
    
    if (selectedFiles.length === 0) {
      console.log('No files selected, returning to menu');
      setState('menu');
      return;
    }
    
    setState('upload-progress');
    
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
      setError(err instanceof Error ? err.message : 'Upload process failed');
      setState('error');
    }
  };

  const handleDownloadDocuments = async (selectedDocuments: Document[]) => {
    console.log('Starting download for documents:', selectedDocuments.map(d => d.name));
    
    setCurrentDownloadDocuments(selectedDocuments);
    setCurrentDownloadIndex(0);
    
    const progress: DownloadProgress[] = selectedDocuments.map(doc => ({
      fileName: doc.name,
      progress: 0,
      status: 'pending'
    }));
    
    setDownloadProgress(progress);
    setState('download-progress');
  };

  const handleDirectorySelect = async (selectedPath: string, recursive: boolean) => {
    try {
      await loadLocalFiles(selectedPath, recursive);
      setState('upload-file-select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files from directory');
      setState('error');
    }
  };

  const handleDownloadDirectorySelect = async (selectedPath: string) => {
    try {
      // Convert relative path to absolute or keep as-is for current directory
      const downloadPath = selectedPath === '.' ? './' : selectedPath;
      setSelectedDownloadDir(downloadPath);
      await loadDocuments();
      setState('download-document-select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      setState('error');
    }
  };

  const processDownloadQueue = async () => {
    console.log('processDownloadQueue called, currentDownloadIndex:', currentDownloadIndex);
    console.log('currentDownloadDocuments length:', currentDownloadDocuments.length);
    
    if (currentDownloadDocuments.length === 0) {
      console.log('No documents to process');
      return;
    }
    
    await processRemainingDownloads(currentDownloadIndex);
  };

  const processRemainingDownloads = async (startIndex: number) => {
    const selectedDocuments = currentDownloadDocuments;
    
    try {
      for (let i = startIndex; i < selectedDocuments.length; i++) {
        const doc = selectedDocuments[i];
        setCurrentDownloadIndex(i);
        
        setDownloadProgress(prev => prev.map((p, index) => 
          index === i ? { ...p, status: 'in-progress', progress: 0 } : p
        ));

        try {
          console.log(`Downloading segments for document: ${doc.name}`);
          
          // Progress update for getting segments
          setDownloadProgress(prev => prev.map((p, index) => 
            index === i ? { ...p, progress: 25 } : p
          ));

          const config = await loadConfig();
          const segmentsResponse = await getDocumentSegments(config.datasetId, doc.id);
          
          // Progress update after getting segments
          setDownloadProgress(prev => prev.map((p, index) => 
            index === i ? { ...p, progress: 50 } : p
          ));

          // Combine all segment content
          let content = `Document: ${doc.name}\n`;
          content += `Word Count: ${doc.word_count}\n`;
          content += `Created: ${new Date(doc.created_at * 1000).toISOString()}\n`;
          content += `Status: ${doc.indexing_status}\n\n`;
          content += '--- Content ---\n\n';
          
          if (segmentsResponse.data && segmentsResponse.data.length > 0) {
            content += segmentsResponse.data.map((segment: any) => segment.content).join('\n\n');
          } else {
            content += 'No content segments found for this document.';
          }

          // Progress update for file writing
          setDownloadProgress(prev => prev.map((p, index) => 
            index === i ? { ...p, progress: 75 } : p
          ));

          const fileName = doc.name;
          
          try {
            await downloadFile(fileName, content, selectedDownloadDir, false);
            
            setDownloadProgress(prev => prev.map((p, index) => 
              index === i ? { ...p, status: 'completed', progress: 100 } : p
            ));
            
            logger.info(`Successfully downloaded: ${doc.name}`);
          } catch (fileErr) {
            if (fileErr instanceof Error && fileErr.message.includes('File already exists')) {
              // File conflict - show confirmation dialog
              setConflictFileName(fileName);
              setState('overwrite-confirm');
              return; // Stop processing and wait for user decision
            } else {
              throw fileErr;
            }
          }
        } catch (err) {
          console.error(`Error downloading ${doc.name}:`, err);
          setDownloadProgress(prev => prev.map((p, index) => 
            index === i ? { 
              ...p, 
              status: 'error', 
              error: err instanceof Error ? err.message : 'Download failed' 
            } : p
          ));
          logger.error(`Failed to download ${doc.name}:`, err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download process failed');
      setState('error');
    }
  };

  const handleOverwriteDecision = async (overwrite: boolean) => {
    const doc = currentDownloadDocuments[currentDownloadIndex];
    const fileName = doc.name;
    
    setState('download-progress');
    
    if (overwrite) {
      try {
        // Get the content again (we could cache this to avoid re-fetching)
        const config = await loadConfig();
        const segmentsResponse = await getDocumentSegments(config.datasetId, doc.id);
        
        let content = `Document: ${doc.name}\n`;
        content += `Word Count: ${doc.word_count}\n`;
        content += `Created: ${new Date(doc.created_at * 1000).toISOString()}\n`;
        content += `Status: ${doc.indexing_status}\n\n`;
        content += '--- Content ---\n\n';
        
        if (segmentsResponse.data && segmentsResponse.data.length > 0) {
          content += segmentsResponse.data.map((segment: any) => segment.content).join('\n\n');
        } else {
          content += 'No content segments found for this document.';
        }

        await downloadFile(fileName, content, selectedDownloadDir, true);
        
        setDownloadProgress(prev => prev.map((p, index) => 
          index === currentDownloadIndex ? { ...p, status: 'completed', progress: 100 } : p
        ));
        
        logger.info(`Successfully downloaded (overwritten): ${doc.name}`);
      } catch (err) {
        setDownloadProgress(prev => prev.map((p, index) => 
          index === currentDownloadIndex ? { 
            ...p, 
            status: 'error', 
            error: err instanceof Error ? err.message : 'Download failed' 
          } : p
        ));
        logger.error(`Failed to download ${doc.name}:`, err);
      }
    } else {
      // Skip this file
      setDownloadProgress(prev => prev.map((p, index) => 
        index === currentDownloadIndex ? { 
          ...p, 
          status: 'error', 
          error: 'Skipped by user' 
        } : p
      ));
      logger.info(`Skipped: ${doc.name}`);
    }
    
    // Continue with next file
    const nextIndex = currentDownloadIndex + 1;
    setCurrentDownloadIndex(nextIndex);
    
    // Process remaining files
    await processRemainingDownloads(nextIndex);
  };

  const handleBack = () => {
    setState('menu');
    setError('');
  };

  useInput((input, key) => {
    if (key.escape && (state === 'upload-progress' || state === 'download-progress' || state === 'error' || state === 'settings')) {
      handleBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="magenta">🔄 Dify Sync</Text>
      </Box>

      {state === 'menu' && (
        <Menu
          title="Select an option:"
          options={mainMenuOptions}
          onSelect={handleMainMenuSelect}
        />
      )}

      {state === 'upload-directory-select' && (
        <DirectorySelector
          directories={directories}
          title="Select directory to upload:"
          onConfirm={handleDirectorySelect}
          onCancel={handleBack}
        />
      )}

      {state === 'upload-file-select' && (
        <FileSelector
          files={localFiles}
          title="Select files to upload:"
          onConfirm={handleUploadFiles}
          onCancel={handleBack}
        />
      )}

      {state === 'upload-progress' && (
        <Box flexDirection="column">
          <Text bold color="cyan">Uploading files...</Text>
          {uploadProgress.length === 0 ? (
            <Box>
              <Text color="yellow">No files selected for upload</Text>
              <Text color="gray">Press any key to return to menu</Text>
            </Box>
          ) : (
            uploadProgress.map((progress) => (
              <ProgressBar
                key={progress.fileName}
                label={progress.fileName}
                progress={progress.progress}
                status={progress.status}
                error={progress.error}
              />
            ))
          )}
          <Box marginTop={1}>
            <Text color="gray">Press Escape to go back</Text>
          </Box>
        </Box>
      )}

      {state === 'download-directory-select' && (
        <DownloadDirectorySelector
          directories={downloadDirectories}
          title="Select download directory:"
          onConfirm={handleDownloadDirectorySelect}
          onCancel={handleBack}
        />
      )}

      {state === 'download-document-select' && (
        <DocumentSelector
          documents={documents}
          title="Select documents to download:"
          onConfirm={handleDownloadDocuments}
          onCancel={handleBack}
        />
      )}

      {state === 'download-progress' && (
        <Box flexDirection="column">
          <Text bold color="cyan">Downloading documents...</Text>
          {downloadProgress.map((progress) => (
            <ProgressBar
              key={progress.fileName}
              label={progress.fileName}
              progress={progress.progress}
              status={progress.status}
              error={progress.error}
            />
          ))}
          <Box marginTop={1}>
            <Text color="gray">Press Ctrl+C to cancel</Text>
          </Box>
        </Box>
      )}

      {state === 'settings' && (
        <Box flexDirection="column">
          <Text bold color="cyan">Settings</Text>
          <Text color="yellow">Settings configuration not implemented yet</Text>
          <Text color="gray">Press Escape to go back</Text>
        </Box>
      )}

      {state === 'overwrite-confirm' && (
        <OverwriteConfirm
          fileName={conflictFileName}
          onConfirm={handleOverwriteDecision}
        />
      )}

      {state === 'error' && (
        <Box flexDirection="column">
          <Text bold color="red">Error</Text>
          <Text color="red">{error}</Text>
          <Text color="gray">Press Escape to go back</Text>
        </Box>
      )}
    </Box>
  );
}