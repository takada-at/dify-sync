import { useState, useMemo } from 'react';
import { useInput } from 'ink';

interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage: number;
  onCancel?: () => void;
  onConfirm?: () => void;
  onSelectToggle?: (index: number) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
}

interface UsePaginationResult {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  selectedIndex: number;
  pageSelectedIndex: number;
  setSelectedIndex: (index: number) => void;
}

export function usePagination({
  totalItems,
  itemsPerPage,
  onCancel,
  onConfirm,
  onSelectToggle,
  onSelectAll,
  onDeselectAll,
}: UsePaginationOptions): UsePaginationResult {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pageSelectedIndex = selectedIndex - startIndex;
  const currentPageItems = endIndex - startIndex;

  useInput((input, key) => {
    if (key.upArrow) {
      if (pageSelectedIndex > 0) {
        setSelectedIndex(prev => prev - 1);
      } else if (currentPage > 0) {
        // Move to previous page
        setCurrentPage(prev => prev - 1);
        setSelectedIndex((currentPage - 1) * itemsPerPage + itemsPerPage - 1);
      }
    } else if (key.downArrow) {
      if (pageSelectedIndex < currentPageItems - 1) {
        setSelectedIndex(prev => prev + 1);
      } else if (currentPage < totalPages - 1) {
        // Move to next page
        setCurrentPage(prev => prev + 1);
        setSelectedIndex((currentPage + 1) * itemsPerPage);
      }
    } else if (key.leftArrow) {
      // Previous page
      if (currentPage > 0) {
        setCurrentPage(prev => prev - 1);
        const newPageStart = (currentPage - 1) * itemsPerPage;
        setSelectedIndex(newPageStart);
      }
    } else if (key.rightArrow) {
      // Next page
      if (currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
        const newPageStart = (currentPage + 1) * itemsPerPage;
        setSelectedIndex(newPageStart);
      }
    } else if (input === ' ' && onSelectToggle) {
      onSelectToggle(selectedIndex);
    } else if ((input === 'a' || input === 'A') && onSelectAll) {
      onSelectAll();
    } else if ((input === 'd' || input === 'D') && onDeselectAll) {
      onDeselectAll();
    } else if (key.return && onConfirm) {
      onConfirm();
    } else if (key.escape && onCancel) {
      onCancel();
    }
  });

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    selectedIndex,
    pageSelectedIndex,
    setSelectedIndex,
  };
}
