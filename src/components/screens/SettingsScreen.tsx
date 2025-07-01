import React from 'react';
import { Box, Text } from 'ink';

export function SettingsScreen() {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Settings
      </Text>
      <Text color="yellow">Settings configuration not implemented yet</Text>
      <Text color="gray">Press Escape to go back</Text>
    </Box>
  );
}
