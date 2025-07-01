import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDownload } from '../useDownload.js';

// Mock the repositories
vi.mock('../../repositories/fileRepository.js', () => ({
  getDirectories: vi.fn(),
  downloadFile: vi.fn(),
}));

vi.mock('../../repositories/difyClient.js', () => ({
  getDocuments: vi.fn(),
  getDocumentSegments: vi.fn(),
}));

vi.mock('../../repositories/config.js', () => ({
  loadConfig: vi.fn(),
}));

vi.mock('../../repositories/logger.js', () => ({
  info: vi.fn(),
  error: vi.fn(),
}));

import * as fileRepository from '../../repositories/fileRepository.js';
import * as difyClient from '../../repositories/difyClient.js';
import * as config from '../../repositories/config.js';

const mockFileRepository = fileRepository as any;
const mockDifyClient = difyClient as any;
const mockConfig = config as any;

describe('useDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useDownload());

    expect(result.current.documents).toEqual([]);
    expect(result.current.downloadProgress).toEqual([]);
    expect(result.current.downloadDirectories).toEqual([]);
    expect(result.current.selectedDownloadDir).toBe('');
  });

  it('should load download directories successfully', async () => {
    const mockDirectories = ['downloads', 'documents', 'temp'];
    mockFileRepository.getDirectories.mockResolvedValue(mockDirectories);

    const { result } = renderHook(() => useDownload());

    await act(async () => {
      await result.current.loadDownloadDirectories();
    });

    expect(result.current.downloadDirectories).toEqual(mockDirectories);
    expect(mockFileRepository.getDirectories).toHaveBeenCalledWith('./');
  });

  it('should load documents successfully', async () => {
    const mockDocuments = [
      { id: '1', name: 'doc1.md', word_count: 100, created_at: 1640995200, indexing_status: 'completed' },
      { id: '2', name: 'doc2.txt', word_count: 200, created_at: 1640995300, indexing_status: 'completed' },
    ];

    const mockConfigData = {
      datasetId: 'test-dataset',
    };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocuments.mockResolvedValue({ data: mockDocuments });

    const { result } = renderHook(() => useDownload());

    await act(async () => {
      await result.current.loadDocuments();
    });

    expect(result.current.documents).toEqual(mockDocuments);
    expect(mockDifyClient.getDocuments).toHaveBeenCalledWith('test-dataset');
  });

  it('should handle multiple files download process', async () => {
    const mockDocuments = [
      { id: '1', name: 'doc1.md', word_count: 100, created_at: 1640995200, indexing_status: 'completed' },
      { id: '2', name: 'doc2.txt', word_count: 200, created_at: 1640995300, indexing_status: 'completed' },
      { id: '3', name: 'doc3.json', word_count: 150, created_at: 1640995400, indexing_status: 'completed' },
    ];

    const mockConfigData = {
      datasetId: 'test-dataset',
    };

    const mockSegments = {
      data: [
        { content: 'Content of document' }
      ]
    };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockResolvedValue(mockSegments);
    mockFileRepository.downloadFile.mockResolvedValue('/downloads/file.txt');

    const { result } = renderHook(() => useDownload());

    // Set download directory first
    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    // Start download process
    await act(async () => {
      await result.current.handleDownloadDocuments(mockDocuments);
    });

    // Verify initial progress state
    expect(result.current.downloadProgress).toHaveLength(3);
    expect(result.current.downloadProgress[0].fileName).toBe('doc1.md');
    expect(result.current.downloadProgress[1].fileName).toBe('doc2.txt');
    expect(result.current.downloadProgress[2].fileName).toBe('doc3.json');

    // Wait for downloads to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify all downloads were completed
    expect(mockDifyClient.getDocumentSegments).toHaveBeenCalledTimes(3);
    expect(mockFileRepository.downloadFile).toHaveBeenCalledTimes(3);
    
    // Check that all files were processed
    expect(mockFileRepository.downloadFile).toHaveBeenCalledWith(
      'doc1.md',
      expect.stringContaining('Content of document'),
      './downloads',
      false
    );
  });

  it('should handle download progress updates correctly', async () => {
    const mockDocuments = [
      { id: '1', name: 'doc1.md', word_count: 100, created_at: 1640995200, indexing_status: 'completed' },
    ];

    const mockConfigData = { datasetId: 'test-dataset' };
    const mockSegments = { data: [{ content: 'Test content' }] };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockResolvedValue(mockSegments);
    mockFileRepository.downloadFile.mockResolvedValue('/downloads/doc1.md');

    const { result } = renderHook(() => useDownload());

    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    await act(async () => {
      await result.current.handleDownloadDocuments(mockDocuments);
    });

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify progress was updated
    expect(result.current.downloadProgress[0].status).toBe('completed');
    expect(result.current.downloadProgress[0].progress).toBe(100);
  });

  it('should handle download errors gracefully', async () => {
    const mockDocuments = [
      { id: '1', name: 'doc1.md', word_count: 100, created_at: 1640995200, indexing_status: 'completed' },
      { id: '2', name: 'doc2.txt', word_count: 200, created_at: 1640995300, indexing_status: 'completed' },
    ];

    const mockConfigData = { datasetId: 'test-dataset' };
    const mockSegments = { data: [{ content: 'Test content' }] };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockResolvedValue(mockSegments);
    
    // First file succeeds, second file fails
    mockFileRepository.downloadFile
      .mockResolvedValueOnce('/downloads/doc1.md')
      .mockRejectedValueOnce(new Error('Download failed'));

    const { result } = renderHook(() => useDownload());

    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    await act(async () => {
      await result.current.handleDownloadDocuments(mockDocuments);
    });

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify first file completed, second file has error
    expect(result.current.downloadProgress[0].status).toBe('completed');
    expect(result.current.downloadProgress[1].status).toBe('error');
    expect(result.current.downloadProgress[1].error).toBe('Download failed');
  });

  it('should handle file conflicts', async () => {
    const mockDocuments = [
      { id: '1', name: 'existing-file.md', word_count: 100, created_at: 1640995200, indexing_status: 'completed' },
    ];

    const mockConfigData = { datasetId: 'test-dataset' };
    const mockSegments = { data: [{ content: 'Test content' }] };
    const onConflict = vi.fn();

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockResolvedValue(mockSegments);
    mockFileRepository.downloadFile.mockRejectedValue(new Error('File already exists'));

    const { result } = renderHook(() => useDownload(onConflict));

    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    await act(async () => {
      await result.current.handleDownloadDocuments(mockDocuments);
    });

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify conflict handler was called
    expect(onConflict).toHaveBeenCalledWith('existing-file.md');
  });

  it('should handle overwrite decision correctly', async () => {
    const mockDocuments = [
      { id: '1', name: 'conflict-file.md', word_count: 100, created_at: 1640995200, indexing_status: 'completed' },
    ];

    const mockConfigData = { datasetId: 'test-dataset' };
    const mockSegments = { data: [{ content: 'Test content' }] };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockResolvedValue(mockSegments);
    mockFileRepository.downloadFile.mockResolvedValue('/downloads/conflict-file.md');

    const { result } = renderHook(() => useDownload());

    // Set up the download state
    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    // Simulate that we're in the middle of a download with conflict
    await act(async () => {
      // Manually set the state as if we were in a conflict situation
      result.current.handleDownloadDocuments(mockDocuments);
    });

    // Simulate overwrite decision (yes)
    await act(async () => {
      await result.current.handleOverwriteDecision(true);
    });

    // Verify file was downloaded with overwrite flag
    expect(mockFileRepository.downloadFile).toHaveBeenCalledWith(
      'conflict-file.md',
      expect.stringContaining('Test content'),
      './downloads',
      true
    );
  });

  it('should expose handleOverwriteDecision function', () => {
    const { result } = renderHook(() => useDownload());
    
    // Verify the function exists and is callable
    expect(typeof result.current.handleOverwriteDecision).toBe('function');
  });

  it('should process files sequentially', async () => {
    const mockDocuments = [
      { id: '1', name: 'file1.md', word_count: 100, created_at: 1640995200, indexing_status: 'completed' },
      { id: '2', name: 'file2.txt', word_count: 200, created_at: 1640995300, indexing_status: 'completed' },
      { id: '3', name: 'file3.json', word_count: 150, created_at: 1640995400, indexing_status: 'completed' },
    ];

    const mockConfigData = { datasetId: 'test-dataset' };
    const mockSegments = { data: [{ content: 'Content' }] };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockResolvedValue(mockSegments);
    mockFileRepository.downloadFile.mockResolvedValue('/downloads/file.txt');

    const { result } = renderHook(() => useDownload());

    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    // Track call order
    const callOrder: string[] = [];
    mockDifyClient.getDocumentSegments.mockImplementation((datasetId: string, docId: string) => {
      callOrder.push(`segments-${docId}`);
      return Promise.resolve(mockSegments);
    });

    mockFileRepository.downloadFile.mockImplementation((fileName: string) => {
      callOrder.push(`download-${fileName}`);
      return Promise.resolve(`/downloads/${fileName}`);
    });

    await act(async () => {
      await result.current.handleDownloadDocuments(mockDocuments);
    });

    // Wait for all async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify files were processed in order
    expect(callOrder).toEqual([
      'segments-1',
      'download-file1.md',
      'segments-2', 
      'download-file2.txt',
      'segments-3',
      'download-file3.json'
    ]);
  });

  it('should handle API errors during download', async () => {
    const mockDocuments = [
      { id: '1', name: 'file1.md', word_count: 100, created_at: 1640995200, indexing_status: 'completed' },
    ];

    const mockConfigData = { datasetId: 'test-dataset' };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useDownload());

    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    await act(async () => {
      await result.current.handleDownloadDocuments(mockDocuments);
    });

    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the error was handled and marked in progress
    expect(result.current.downloadProgress[0].status).toBe('error');
    expect(result.current.downloadProgress[0].error).toContain('API Error');
  });
});