import React, { useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Menu, MenuOption } from './Menu.js';
import { FileSelector } from './FileSelector.js';
import { DocumentSelector } from './DocumentSelector.js';
import { DirectorySelector } from './DirectorySelector.js';
import { DownloadDirectorySelector } from './DownloadDirectorySelector.js';
import { OverwriteConfirm } from './OverwriteConfirm.js';
import { UploadScreen } from './screens/UploadScreen.js';
import { DownloadScreen } from './screens/DownloadScreen.js';
import { ErrorScreen } from './screens/ErrorScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { useAppState } from '../hooks/useAppState.js';
import { useUpload } from '../hooks/useUpload.js';
import { useDownload } from '../hooks/useDownload.js';
import { LocalFile } from '../repositories/fileRepository.js';
import { Document } from '../core/types/index.js';

interface AppProps {
  uploadPath?: string;
}

export function App({ uploadPath }: AppProps) {
  const {
    state,
    setState,
    error,
    conflictFileName,
    setConflictFileName,
    handleBack,
    handleError,
  } = useAppState();

  const {
    localFiles,
    uploadProgress,
    directories,
    loadDirectories,
    loadLocalFiles,
    handleUploadFiles,
  } = useUpload();

  const {
    documents,
    downloadProgress,
    downloadDirectories,
    setSelectedDownloadDir,
    loadDownloadDirectories,
    loadDocuments,
    handleDownloadDocuments,
    handleOverwriteDecision,
  } = useDownload(
    fileName => {
      setConflictFileName(fileName);
      setState('overwrite-confirm');
    },
    error => {
      handleError(error);
    }
  );

  // Handle automatic upload when uploadPath is provided
  useEffect(() => {
    if (uploadPath) {
      const startUpload = async () => {
        try {
          // Load files from the specified path with recursive mode
          await loadLocalFiles(uploadPath, true);
          // Automatically select all files and start upload
          setState('upload-file-select');
        } catch (err) {
          handleError(
            err instanceof Error
              ? err.message
              : 'Failed to load files from specified path'
          );
        }
      };
      startUpload();
    }
  }, [uploadPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Exit when upload is completed in CLI mode
  useEffect(() => {
    if (
      uploadPath &&
      state === 'upload-progress' &&
      uploadProgress.length > 0
    ) {
      // Check if all uploads are completed or errored
      const allCompleted = uploadProgress.every(
        p => p.status === 'completed' || p.status === 'error'
      );

      if (allCompleted) {
        // Give a small delay to show the final status
        const timer = globalThis.setTimeout(() => {
          globalThis.process.exit(0);
        }, 1000);
        return () => globalThis.clearTimeout(timer);
      }
    }
  }, [uploadPath, state, uploadProgress]);

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
          globalThis.process.exit(0);
          break;
      }
    } catch (err) {
      handleError(
        err instanceof Error ? err.message : 'Unknown error occurred'
      );
    }
  };

  const handleUploadFilesWrapper = async (selectedFiles: LocalFile[]) => {
    if (selectedFiles.length === 0) {
      setState('menu');
      return;
    }

    setState('upload-progress');

    try {
      await handleUploadFiles(selectedFiles);
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'Upload process failed');
    }
  };

  const handleDownloadDocumentsWrapper = async (
    selectedDocuments: Document[]
  ) => {
    setState('download-progress');
    await handleDownloadDocuments(selectedDocuments);
  };

  const handleDirectorySelect = async (
    selectedPath: string,
    recursive: boolean
  ) => {
    try {
      await loadLocalFiles(selectedPath, recursive);
      setState('upload-file-select');
    } catch (err) {
      handleError(
        err instanceof Error
          ? err.message
          : 'Failed to load files from directory'
      );
    }
  };

  const handleDownloadDirectorySelect = async (selectedPath: string) => {
    try {
      const downloadPath = selectedPath === '.' ? './' : selectedPath;
      setSelectedDownloadDir(downloadPath);
      await loadDocuments();
      setState('download-document-select');
    } catch (err) {
      handleError(
        err instanceof Error ? err.message : 'Failed to load documents'
      );
    }
  };

  const handleOverwriteDecisionWrapper = async (overwrite: boolean) => {
    setState('download-progress');

    try {
      await handleOverwriteDecision(overwrite);
    } catch (err) {
      handleError(
        err instanceof Error ? err.message : 'Download process failed'
      );
    }
  };

  useInput((input, key) => {
    if (
      key.escape &&
      (state === 'upload-progress' ||
        state === 'download-progress' ||
        state === 'error' ||
        state === 'settings')
    ) {
      handleBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="magenta">
          🔄 Dify Sync
        </Text>
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
          onConfirm={handleUploadFilesWrapper}
          onCancel={handleBack}
          autoConfirm={!!uploadPath}
        />
      )}

      {state === 'upload-progress' && (
        <UploadScreen uploadProgress={uploadProgress} />
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
          onConfirm={handleDownloadDocumentsWrapper}
          onCancel={handleBack}
        />
      )}

      {state === 'download-progress' && (
        <DownloadScreen downloadProgress={downloadProgress} />
      )}

      {state === 'settings' && <SettingsScreen />}

      {state === 'overwrite-confirm' && (
        <OverwriteConfirm
          fileName={conflictFileName}
          onConfirm={handleOverwriteDecisionWrapper}
        />
      )}

      {state === 'error' && <ErrorScreen error={error} />}
    </Box>
  );
}
