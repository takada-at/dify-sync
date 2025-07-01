import React from 'react';
import { Box, Text } from 'ink';
import { ProgressBar } from '../ProgressBar.js';
import { UploadProgress } from '../../core/types/index.js';

interface UploadScreenProps {
  uploadProgress: UploadProgress[];
}

export function UploadScreen({ uploadProgress }: UploadScreenProps) {
  return (
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
  );
}