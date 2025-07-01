import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Document } from '../core/types/index.js';

interface DocumentSelectorProps {
  documents: Document[];
  title: string;
  onConfirm: (selectedDocuments: Document[]) => void;
  onCancel: () => void;
  autoConfirm?: boolean;
}

export function DocumentSelector({
  documents,
  title,
  onConfirm,
  onCancel,
  autoConfirm = false,
}: DocumentSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(
    new Set(documents.map((_, index) => index))
  );

  // Auto-confirm if the flag is set
  useEffect(() => {
    if (autoConfirm && documents.length > 0) {
      const selected = documents; // Select all documents
      onConfirm(selected);
    }
  }, [autoConfirm, documents, onConfirm]);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : documents.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < documents.length - 1 ? prev + 1 : 0));
    } else if (input === ' ') {
      setSelectedDocuments(prev => {
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
      setSelectedDocuments(new Set(documents.map((_, index) => index)));
    } else if (input === 'd' || input === 'D') {
      // Deselect all
      setSelectedDocuments(new Set());
    } else if (key.return) {
      const selected = Array.from(selectedDocuments).map(
        index => documents[index]
      );
      onConfirm(selected);
    } else if (key.escape) {
      onCancel();
    }
  });

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

      {documents.map((doc, index) => (
        <Box key={doc.id} marginLeft={1} flexDirection="column">
          <Box>
            <Text color={index === selectedIndex ? 'green' : 'white'}>
              {selectedDocuments.has(index) ? '☑' : '☐'} {doc.name}
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
      ))}

      <Box marginTop={1} flexDirection="column">
        <Text color="green">Selected: {selectedDocuments.size} documents</Text>
        <Text color="gray">
          Space: Select/Deselect, A: Select All, D: Deselect All, ↑↓: Navigate,
          Enter: Confirm, Esc: Cancel
        </Text>
      </Box>
    </Box>
  );
}
