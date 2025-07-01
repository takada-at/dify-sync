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
import { setDatasetIdOverride } from '../repositories/config.js';

interface AppProps {
  uploadPath?: string;
  downloadPath?: string;
  forceOverwrite?: boolean;
  datasetId?: string;
}

export function App({
  uploadPath,
  downloadPath,
  forceOverwrite,
  datasetId,
}: AppProps) {
  const {
    state,
    setState,
    error,
    conflictFileName,
    setConflictFileName,
    handleBack,
    handleError,
  } = useAppState();

  // Set dataset ID override if provided via CLI argument
  React.useEffect(() => {
    if (datasetId) {
      setDatasetIdOverride(datasetId);
    }
  }, [datasetId]);

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
      // Skip conflict callback if forceOverwrite is true
      if (!forceOverwrite) {
        setConflictFileName(fileName);
        setState('overwrite-confirm');
      }
    },
    error => {
      handleError(error);
    },
    forceOverwrite
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

  // Handle automatic download when downloadPath is provided
  useEffect(() => {
    if (downloadPath) {
      const startDownload = async () => {
        try {
          // Set the download directory
          setSelectedDownloadDir(downloadPath);
          // Load documents and start download
          await loadDocuments();
          setState('download-document-select');
        } catch (err) {
          handleError(
            err instanceof Error
              ? err.message
              : 'Failed to load documents for download'
          );
        }
      };
      startDownload();
    }
  }, [downloadPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Exit when download is completed in CLI mode
  useEffect(() => {
    if (
      downloadPath &&
      state === 'download-progress' &&
      downloadProgress.length > 0
    ) {
      // Check if all downloads are completed, errored, or skipped
      const allCompleted = downloadProgress.every(
        p =>
          p.status === 'completed' ||
          p.status === 'error' ||
          p.status === 'skipped'
      );

      if (allCompleted) {
        // Give a small delay to show the final status
        const timer = globalThis.setTimeout(() => {
          globalThis.process.exit(0);
        }, 1000);
        return () => globalThis.clearTimeout(timer);
      }
    }
  }, [downloadPath, state, downloadProgress]);

  const mainMenuOptions: MenuOption[] = [
    {
      label: 'Upload files to Dify',
      value: 'upload',
      icon: '📤',
      description: 'Sync local files to your Dify knowledge base',
    },
    {
      label: 'Download files from Dify',
      value: 'download',
      icon: '📥',
      description: 'Export documents from Dify to local storage',
    },
    {
      label: 'Settings',
      value: 'settings',
      icon: '⚙️',
      description: 'Configure API credentials and preferences',
    },
    {
      label: 'Exit',
      value: 'exit',
      icon: '🚪',
      description: 'Close the application',
    },
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
      <Box marginBottom={1} flexDirection="column" alignItems="center">
        <Box
          borderStyle="double"
          borderColor="magenta"
          paddingX={3}
          paddingY={1}
        >
          <Text bold>
            <Text color="magenta">╔═══════════════════════════╗</Text>
          </Text>
        </Box>
        <Box marginTop={-1}>
          <Text bold>
            <Text color="magenta">║ </Text>
            <Text color="cyan">🔄 </Text>
            <Text color="yellow" bold>
              DIFY SYNC
            </Text>
            <Text color="cyan"> v1.0.0</Text>
            <Text color="magenta"> ║</Text>
          </Text>
        </Box>
        <Box>
          <Text bold>
            <Text color="magenta">╚═══════════════════════════╝</Text>
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray" italic>
            Seamless Knowledge Base Synchronization
          </Text>
        </Box>
      </Box>

      {state === 'menu' && (
        <Box marginTop={1}>
          <Menu
            title="MAIN MENU"
            options={mainMenuOptions}
            onSelect={handleMainMenuSelect}
          />
        </Box>
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
          autoConfirm={!!downloadPath}
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
