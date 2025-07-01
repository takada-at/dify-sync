import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface OverwriteConfirmProps {
  fileName: string;
  onConfirm: (overwrite: boolean) => void;
}

export function OverwriteConfirm({ fileName, onConfirm }: OverwriteConfirmProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const options = ['Yes, overwrite', 'No, skip this file'];

  useInput((input, key) => {
    if (key.upArrow || key.leftArrow) {
      setSelectedIndex(0);
    } else if (key.downArrow || key.rightArrow) {
      setSelectedIndex(1);
    } else if (key.return) {
      onConfirm(selectedIndex === 0);
    }
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="yellow">
      <Box marginBottom={1}>
        <Text color="yellow" bold>File Conflict</Text>
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
        <Text color="gray">
          Use ↑↓ or ←→ arrows to navigate, Enter to confirm
        </Text>
      </Box>
    </Box>
  );
}