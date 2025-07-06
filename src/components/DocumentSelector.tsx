import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Document } from '../core/types/index.js';
import { usePagination } from '../hooks/usePagination.js';
import { DEFAULT_ITEMS_PER_PAGE } from '../constants/pagination.js';

interface DocumentSelectorProps {
  documents: Document[];
  title: string;
  onConfirm: (selectedDocuments: Document[]) => void;
  onCancel: () => void;
  autoConfirm?: boolean;
  itemsPerPage?: number;
}

export function DocumentSelector({
  documents,
  title,
  onConfirm,
  onCancel,
  autoConfirm = false,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
}: DocumentSelectorProps) {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(
    new Set(documents.map((_, index) => index))
  );

  const { currentPage, totalPages, startIndex, endIndex, selectedIndex } =
    usePagination({
      totalItems: documents.length,
      itemsPerPage,
      onCancel,
      onConfirm: () => {
        const selected = Array.from(selectedDocuments).map(
          index => documents[index]
        );
        onConfirm(selected);
      },
      onSelectToggle: index => {
        setSelectedDocuments(prev => {
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
        setSelectedDocuments(new Set(documents.map((_, index) => index)));
      },
      onDeselectAll: () => {
        setSelectedDocuments(new Set());
      },
    });

  const currentPageDocuments = documents.slice(startIndex, endIndex);

  // Auto-confirm if the flag is set
  useEffect(() => {
    if (autoConfirm && documents.length > 0) {
      const selected = documents; // Select all documents
      onConfirm(selected);
    }
  }, [autoConfirm, documents, onConfirm]);

  // Auto-confirm handling is done through useEffect, no need for useInput here

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'indexing':
        return 'yellow';
      case 'waiting':
        return 'gray';
      case 'error':
        return 'red';
      default:
        return 'white';
    }
  };

  if (documents.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">
          {title}
        </Text>
        <Text color="yellow">No documents found</Text>
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

      {currentPageDocuments.map((doc, index) => {
        const globalIndex = startIndex + index;
        return (
          <Box key={doc.id} marginLeft={1} flexDirection="column">
            <Box>
              <Text color={globalIndex === selectedIndex ? 'green' : 'white'}>
                {selectedDocuments.has(globalIndex) ? '☑' : '☐'} {doc.name}
              </Text>
              <Box marginLeft={1}>
                <Text color={getStatusColor(doc.indexing_status)}>
                  [{doc.indexing_status}]
                </Text>
              </Box>
            </Box>
            <Box marginLeft={2}>
              <Text color="gray">
                Words: {doc.word_count} | Created: {formatDate(doc.created_at)}
              </Text>
            </Box>
          </Box>
        );
      })}

      {totalPages > 1 && (
        <Box marginTop={1}>
          <Text color="cyan">
            Page {currentPage + 1} of {totalPages} (Total documents:{' '}
            {documents.length})
          </Text>
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color="green">Selected: {selectedDocuments.size} documents</Text>
        <Text color="gray">
          Space: Select/Deselect, A: Select All, D: Deselect All, ↑↓: Navigate,
          {totalPages > 1 && ' ←→: Page, '}
          Enter: Confirm, Esc: Cancel
        </Text>
      </Box>
    </Box>
  );
}
