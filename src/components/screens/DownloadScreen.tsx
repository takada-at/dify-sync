import React from 'react';
import { Box, Text } from 'ink';
import { ProgressBar } from '../ProgressBar.js';
import { DownloadProgress } from '../../core/types/index.js';

interface DownloadScreenProps {
  downloadProgress: DownloadProgress[];
}

export function DownloadScreen({ downloadProgress }: DownloadScreenProps) {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Downloading documents...
      </Text>
      {downloadProgress.map(progress => (
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
  );
}
