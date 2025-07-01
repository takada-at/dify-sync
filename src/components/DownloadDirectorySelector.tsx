import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface DownloadDirectorySelectorProps {
  directories: string[];
  title: string;
  onConfirm: (selectedPath: string) => void;
  onCancel: () => void;
}

export function DownloadDirectorySelector({ directories, title, onConfirm, onCancel }: DownloadDirectorySelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Add current directory and available subdirectories to options
  const options = [
    { label: '. (current directory)', value: '.' },
    ...directories.map(dir => ({ label: dir, value: dir }))
  ];

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      onConfirm(options[selectedIndex].value);
    } else if (key.escape) {
      onCancel();
    }
  });

  if (options.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">{title}</Text>
        <Text color="yellow">No directories found</Text>
        <Text color="gray">Press Escape to go back</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">{title}</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text color="yellow">
          Files will be downloaded to the selected directory
        </Text>
      </Box>
      
      {options.map((option, index) => (
        <Box key={option.value} marginLeft={1}>
          <Text color={index === selectedIndex ? 'green' : 'white'}>
            {index === selectedIndex ? '→ ' : '  '}
            {option.label}
          </Text>
        </Box>
      ))}
      
      <Box marginTop={1} flexDirection="column">
        <Text color="gray">
          ↑↓: Navigate, Enter: Select, Esc: Cancel
        </Text>
      </Box>
    </Box>
  );
}