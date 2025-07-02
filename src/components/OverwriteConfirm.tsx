import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface OverwriteConfirmProps {
  fileName: string;
  onConfirm: (overwrite: boolean, applyToAll?: boolean) => void;
}

export function OverwriteConfirm({
  fileName,
  onConfirm,
}: OverwriteConfirmProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const options = [
    'Yes, overwrite',
    'No, skip this file',
    'Overwrite all',
    'Skip all',
  ];

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      switch (selectedIndex) {
        case 0: // Yes, overwrite
          onConfirm(true, false);
          break;
        case 1: // No, skip this file
          onConfirm(false, false);
          break;
        case 2: // Overwrite all
          onConfirm(true, true);
          break;
        case 3: // Skip all
          onConfirm(false, true);
          break;
      }
    }
  });

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="yellow"
    >
      <Box marginBottom={1}>
        <Text color="yellow" bold>
          File Conflict
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          File <Text color="cyan">{fileName}</Text> already exists.
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Do you want to overwrite it?</Text>
      </Box>

      {options.map((option, index) => (
        <Box key={index} marginLeft={2}>
          <Text color={index === selectedIndex ? 'green' : 'white'}>
            {index === selectedIndex ? '→ ' : '  '}
            {option}
          </Text>
        </Box>
      ))}

      <Box marginTop={1}>
        <Text color="gray">Use ↑↓ arrows to navigate, Enter to confirm</Text>
      </Box>
    </Box>
  );
}
