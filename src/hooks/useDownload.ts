import { useState, useEffect } from 'react';
import { Document, DownloadProgress } from '../types/index.js';
import { getDocuments, getDocumentSegments } from '../repositories/difyClient.js';
import { getDirectories, downloadFile } from '../repositories/fileRepository.js';
import { loadConfig } from '../repositories/config.js';
import * as logger from '../repositories/logger.js';

export function useDownload(onConflict?: (fileName: string) => void, onError?: (error: string) => void) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress[]>([]);
  const [currentDownloadIndex, setCurrentDownloadIndex] = useState<number>(0);
  const [currentDownloadDocuments, setCurrentDownloadDocuments] = useState<Document[]>([]);
  const [downloadDirectories, setDownloadDirectories] = useState<string[]>([]);
  const [selectedDownloadDir, setSelectedDownloadDir] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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

  const handleDownloadDocuments = async (selectedDocuments: Document[]) => {
    console.log('Starting download for documents:', selectedDocuments.map(d => d.name));
    
    if (isProcessing) {
      console.log('Download already in progress, ignoring');
      return;
    }
    
    setCurrentDownloadDocuments(selectedDocuments);
    setCurrentDownloadIndex(0);
    setIsProcessing(true);
    
    const progress: DownloadProgress[] = selectedDocuments.map(doc => ({
      fileName: doc.name,
      progress: 0,
      status: 'pending'
    }));
    
    setDownloadProgress(progress);
    
    // Start download immediately - use selectedDocuments directly instead of state
    try {
      await processDocumentsDownload(selectedDocuments, 0);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      if (err instanceof Error && err.message.startsWith('CONFLICT:')) {
        const fileName = err.message.replace('CONFLICT:', '');
        onConflict?.(fileName);
      } else {
        onError?.(err instanceof Error ? err.message : 'Download process failed');
      }
    }
  };



  const processDocumentsDownload = async (selectedDocuments: Document[], startIndex: number) => {
    // Safety check - prevent infinite loops
    if (startIndex >= selectedDocuments.length) {
      console.log('All documents processed, stopping');
      setIsProcessing(false);
      return;
    }
    
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

          // Extract only the original content from segments
          let content = '';
          
          if (segmentsResponse.data && segmentsResponse.data.length > 0) {
            content = segmentsResponse.data.map((segment: any) => segment.content).join('\n\n');
          } else {
            content = 'No content segments found for this document.';
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
              // File conflict - throw error with file name for handling in parent
              throw new Error(`CONFLICT:${fileName}`);
            } else {
              throw fileErr;
            }
          }
        } catch (err) {
          console.error(`Error downloading ${doc.name}:`, err);
          if (err instanceof Error && err.message.startsWith('CONFLICT:')) {
            // Re-throw conflict errors to be handled by parent component
            throw err;
          }
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
      if (err instanceof Error && err.message.startsWith('CONFLICT:')) {
        // Re-throw conflict errors to be handled by parent component
        throw err;
      }
      throw new Error(`Download process failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleOverwriteDecision = async (overwrite: boolean) => {
    const doc = currentDownloadDocuments[currentDownloadIndex];
    const fileName = doc.name;
    
    if (overwrite) {
      try {
        // Get the content again (we could cache this to avoid re-fetching)
        const config = await loadConfig();
        const segmentsResponse = await getDocumentSegments(config.datasetId, doc.id);
        
        // Extract only the original content from segments
        let content = '';
        
        if (segmentsResponse.data && segmentsResponse.data.length > 0) {
          content = segmentsResponse.data.map((segment: any) => segment.content).join('\n\n');
        } else {
          content = 'No content segments found for this document.';
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
    
    // Process remaining files - ONLY if there are more files to process
    if (nextIndex < currentDownloadDocuments.length) {
      try {
        await processDocumentsDownload(currentDownloadDocuments, nextIndex);
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('CONFLICT:')) {
          const fileName = err.message.replace('CONFLICT:', '');
          onConflict?.(fileName);
        } else {
          onError?.(err instanceof Error ? err.message : 'Download process failed');
        }
      }
    } else {
      // All downloads completed
      setIsProcessing(false);
      console.log('All downloads completed');
    }
  };

  return {
    documents,
    downloadProgress,
    currentDownloadIndex,
    currentDownloadDocuments,
    downloadDirectories,
    selectedDownloadDir,
    setSelectedDownloadDir,
    loadDownloadDirectories,
    loadDocuments,
    handleDownloadDocuments,
    handleOverwriteDecision,
  };
}