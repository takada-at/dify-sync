import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { LocalFile } from '../repositories/fileRepository.js';

interface FileSelectorProps {
  files: LocalFile[];
  title: string;
  onConfirm: (selectedFiles: LocalFile[]) => void;
  onCancel: () => void;
  autoConfirm?: boolean;
}

export function FileSelector({
  files,
  title,
  onConfirm,
  onCancel,
  autoConfirm = false,
}: FileSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(
    new Set(files.map((_, index) => index))
  );

  // Auto-confirm if the flag is set
  useEffect(() => {
    if (autoConfirm && files.length > 0) {
      const selected = files; // Select all files
      onConfirm(selected);
    }
  }, [autoConfirm, files, onConfirm]);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : files.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < files.length - 1 ? prev + 1 : 0));
    } else if (input === ' ') {
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        if (newSet.has(selectedIndex)) {
          newSet.delete(selectedIndex);
        } else {
          newSet.add(selectedIndex);
        }
        return newSet;
      });
    } else if (input === 'a' || input === 'A') {
      // Select all
      setSelectedFiles(new Set(files.map((_, index) => index)));
    } else if (input === 'd' || input === 'D') {
      // Deselect all
      setSelectedFiles(new Set());
    } else if (key.return) {
      const selected = Array.from(selectedFiles).map(index => files[index]);
      onConfirm(selected);
    } else if (key.escape) {
      onCancel();
    }
  });

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">
          {title}
        </Text>
        <Text color="yellow">No files found</Text>
        <Text color="gray">Press Escape to go back</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>

      {files.map((file, index) => (
        <Box key={file.path} marginLeft={1}>
          <Text color={index === selectedIndex ? 'green' : 'white'}>
            {selectedFiles.has(index) ? '☑' : '☐'} {file.name}
          </Text>
          <Box marginLeft={1}>
            <Text color="gray">({formatFileSize(file.size)})</Text>
          </Box>
        </Box>
      ))}

      <Box marginTop={1} flexDirection="column">
        <Text color="green">Selected: {selectedFiles.size} files</Text>
        <Text color="gray">
          Space: Select/Deselect, A: Select All, D: Deselect All, ↑↓: Navigate,
          Enter: Confirm, Esc: Cancel
        </Text>
      </Box>
    </Box>
  );
}
