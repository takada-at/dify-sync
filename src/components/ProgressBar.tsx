import React from 'react';
import { Box, Text } from 'ink';
import { ProgressBar as InkProgressBar } from '@inkjs/ui';

interface ProgressBarProps {
  label: string;
  progress: number; // 0-100
  status: 'pending' | 'in-progress' | 'completed' | 'error' | 'skipped';
  error?: string;
}

export function ProgressBar({
  label,
  progress,
  status,
  error,
}: ProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'error':
        return 'red';
      case 'in-progress':
        return 'yellow';
      case 'skipped':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusSymbol = () => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'error':
        return '✗';
      case 'in-progress':
        return '◐';
      case 'skipped':
        return '⊝';
      default:
        return '○';
    }
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={getStatusColor()}>
          {getStatusSymbol()} {label}
        </Text>
      </Box>

      {status === 'in-progress' && (
        <Box marginLeft={2}>
          <InkProgressBar value={progress} />
        </Box>
      )}

      {error && (
        <Box marginLeft={2}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}
    </Box>
  );
}
