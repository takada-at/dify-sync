import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { LocalFile } from '../repositories/fileRepository.js';
import { usePagination } from '../hooks/usePagination.js';

interface FileSelectorProps {
  files: LocalFile[];
  title: string;
  onConfirm: (selectedFiles: LocalFile[]) => void;
  onCancel: () => void;
  autoConfirm?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function FileSelector({
  files,
  title,
  onConfirm,
  onCancel,
  autoConfirm = false,
}: FileSelectorProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(
    new Set(files.map((_, index) => index))
  );

  const { currentPage, totalPages, startIndex, endIndex, selectedIndex } =
    usePagination({
      totalItems: files.length,
      itemsPerPage: ITEMS_PER_PAGE,
      onCancel,
      onConfirm: () => {
        const selected = Array.from(selectedFiles).map(index => files[index]);
        onConfirm(selected);
      },
      onSelectToggle: index => {
        setSelectedFiles(prev => {
          const newSet = new Set(prev);
          if (newSet.has(index)) {
            newSet.delete(index);
          } else {
            newSet.add(index);
          }
          return newSet;
        });
      },
      onSelectAll: () => {
        setSelectedFiles(new Set(files.map((_, index) => index)));
      },
      onDeselectAll: () => {
        setSelectedFiles(new Set());
      },
    });

  const currentPageFiles = files.slice(startIndex, endIndex);

  // Auto-confirm if the flag is set
  useEffect(() => {
    if (autoConfirm && files.length > 0) {
      const selected = files; // Select all files
      onConfirm(selected);
    }
  }, [autoConfirm, files, onConfirm]);

  // Auto-confirm handling is done through useEffect, no need for useInput here

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

      {currentPageFiles.map((file, index) => {
        const globalIndex = startIndex + index;
        return (
          <Box key={file.path} marginLeft={1}>
            <Text color={globalIndex === selectedIndex ? 'green' : 'white'}>
              {selectedFiles.has(globalIndex) ? '☑' : '☐'} {file.name}
            </Text>
            <Box marginLeft={1}>
              <Text color="gray">({formatFileSize(file.size)})</Text>
            </Box>
          </Box>
        );
      })}

      {totalPages > 1 && (
        <Box marginTop={1}>
          <Text color="cyan">
            Page {currentPage + 1} of {totalPages} (Total files: {files.length})
          </Text>
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color="green">Selected: {selectedFiles.size} files</Text>
        <Text color="gray">
          Space: Select/Deselect, A: Select All, D: Deselect All, ↑↓: Navigate,
          {totalPages > 1 && ' ←→: Page, '}
          Enter: Confirm, Esc: Cancel
        </Text>
      </Box>
    </Box>
  );
}
