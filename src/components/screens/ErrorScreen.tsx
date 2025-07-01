import React from 'react';
import { Box, Text } from 'ink';

interface ErrorScreenProps {
  error: string;
}

export function ErrorScreen({ error }: ErrorScreenProps) {
  return (
    <Box flexDirection="column">
      <Text bold color="red">Error</Text>
      <Text color="red">{error}</Text>
      <Text color="gray">Press Escape to go back</Text>
    </Box>
  );
}