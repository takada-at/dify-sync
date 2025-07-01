import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDownload } from '../useDownload.js';
import * as fs from 'fs/promises';

// Mock the repositories
vi.mock('../../repositories/fileRepository.js', () => ({
  getDirectories: vi.fn(),
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

// Mock fs/promises
vi.mock('fs/promises', () => ({
  access: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

import * as fileRepository from '../../repositories/fileRepository.js';
import * as difyClient from '../../repositories/difyClient.js';
import * as config from '../../repositories/config.js';

const mockFileRepository = fileRepository as any;
const mockDifyClient = difyClient as any;
const mockConfig = config as any;
const mockFs = fs as any;

describe('useDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for fs.access to simulate file doesn't exist
    mockFs.access.mockRejectedValue({ code: 'ENOENT' });
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

  it('should handle directory loading error', async () => {
    mockFileRepository.getDirectories.mockRejectedValue(
      new Error('Directory read failed')
    );

    const { result } = renderHook(() => useDownload());

    await expect(async () => {
      await act(async () => {
        await result.current.loadDownloadDirectories();
      });
    }).rejects.toThrow(
      'Failed to load download directories: Directory read failed'
    );
  });

  it('should load documents successfully', async () => {
    const mockDocuments = [
      {
        id: '1',
        name: 'doc1.md',
        position: 0,
        data_source_type: 'upload_file',
        created_from: 'api',
        created_by: 'user',
        created_at: 1640995200,
        tokens: 50,
        indexing_status: 'completed',
        enabled: true,
        archived: false,
        word_count: 100,
        hit_count: 0,
        doc_form: 'text_model',
      },
    ];

    const mockResponse = { data: mockDocuments };
    const mockConfigData = { datasetId: 'test-dataset' };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocuments.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDownload());

    await act(async () => {
      await result.current.loadDocuments();
    });

    expect(result.current.documents).toEqual(mockDocuments);
    expect(mockDifyClient.getDocuments).toHaveBeenCalledWith('test-dataset');
  });

  it('should handle multiple files download process', async () => {
    const mockDocuments = [
      {
        id: '1',
        name: 'doc1.md',
        position: 0,
        data_source_type: 'upload_file',
        created_from: 'api',
        created_by: 'user',
        created_at: 1640995200,
        tokens: 50,
        indexing_status: 'completed',
        enabled: true,
        archived: false,
        word_count: 100,
        hit_count: 0,
        doc_form: 'text_model',
      },
      {
        id: '2',
        name: 'doc2.txt',
        position: 1,
        data_source_type: 'upload_file',
        created_from: 'api',
        created_by: 'user',
        created_at: 1640995300,
        tokens: 100,
        indexing_status: 'completed',
        enabled: true,
        archived: false,
        word_count: 200,
        hit_count: 0,
        doc_form: 'text_model',
      },
      {
        id: '3',
        name: 'doc3.json',
        position: 2,
        data_source_type: 'upload_file',
        created_from: 'api',
        created_by: 'user',
        created_at: 1640995400,
        tokens: 75,
        indexing_status: 'completed',
        enabled: true,
        archived: false,
        word_count: 150,
        hit_count: 0,
        doc_form: 'text_model',
      },
    ];

    const mockConfigData = {
      datasetId: 'test-dataset',
    };

    const mockSegments = {
      data: [{ content: 'Content of document', position: 0 }],
    };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockResolvedValue(mockSegments);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDownload());

    // Set download directory first
    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    // Start download process
    await act(async () => {
      await result.current.handleDownloadDocuments(mockDocuments);
    });

    // Wait for all downloads to complete
    await waitFor(() => {
      expect(
        result.current.downloadProgress.every(p => p.status === 'completed')
      ).toBe(true);
    });

    // Verify all downloads were completed
    expect(mockDifyClient.getDocumentSegments).toHaveBeenCalledTimes(3);
    expect(mockFs.writeFile).toHaveBeenCalledTimes(3);

    // Check that all files were processed with correct filenames (preserving extensions)
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      './downloads/doc1.md',
      'Content of document',
      'utf-8'
    );
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      './downloads/doc2.txt',
      'Content of document',
      'utf-8'
    );
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      './downloads/doc3.json',
      'Content of document',
      'utf-8'
    );
  });

  it('should handle download progress updates correctly', async () => {
    const mockDocuments = [
      {
        id: '1',
        position: 0,
        data_source_type: 'upload_file',
        created_from: 'api',
        created_by: 'user',
        created_at: 1640995200,
        tokens: 50,
        indexing_status: 'completed',
        enabled: true,
        archived: false,
        word_count: 100,
        hit_count: 0,
        doc_form: 'text_model',
        name: 'doc1.md',
      },
    ];

    const mockConfigData = { datasetId: 'test-dataset' };
    const mockSegments = { data: [{ content: 'Test content', position: 0 }] };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockResolvedValue(mockSegments);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDownload());

    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    await act(async () => {
      await result.current.handleDownloadDocuments(mockDocuments);
    });

    // Wait for download to complete
    await waitFor(() => {
      expect(result.current.downloadProgress[0].status).toBe('completed');
    });

    // Verify progress was updated
    expect(result.current.downloadProgress[0].progress).toBe(100);
  });

  it('should handle download errors gracefully', async () => {
    const mockDocuments = [
      {
        id: '1',
        name: 'doc1.md',
        position: 0,
        data_source_type: 'upload_file',
        created_from: 'api',
        created_by: 'user',
        created_at: 1640995200,
        tokens: 50,
        indexing_status: 'completed',
        enabled: true,
        archived: false,
        word_count: 100,
        hit_count: 0,
        doc_form: 'text_model',
      },
    ];

    const mockConfigData = { datasetId: 'test-dataset' };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockRejectedValue(
      new Error('API Error')
    );

    const onError = vi.fn();
    const { result } = renderHook(() => useDownload(undefined, onError));

    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    await act(async () => {
      await result.current.handleDownloadDocuments(mockDocuments);
    });

    // Wait for error handling
    await waitFor(() => {
      expect(result.current.downloadProgress[0].status).toBe('error');
    });

    expect(result.current.downloadProgress[0].error).toBe('API Error');
  });

  it('should handle file conflicts', async () => {
    const mockDocuments = [
      {
        id: '1',
        name: 'existing.txt',
        position: 0,
        data_source_type: 'upload_file',
        created_from: 'api',
        created_by: 'user',
        created_at: 1640995200,
        tokens: 50,
        indexing_status: 'completed',
        enabled: true,
        archived: false,
        word_count: 100,
        hit_count: 0,
        doc_form: 'text_model',
      },
    ];

    const mockConfigData = { datasetId: 'test-dataset' };
    const mockSegments = { data: [{ content: 'Test content', position: 0 }] };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockResolvedValue(mockSegments);

    // Simulate file exists
    mockFs.access.mockResolvedValue(undefined);

    const onConflict = vi.fn();
    const { result } = renderHook(() => useDownload(onConflict));

    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    // Start download in a separate act to avoid blocking
    act(() => {
      result.current.handleDownloadDocuments(mockDocuments);
    });

    // Wait for conflict callback
    await waitFor(() => {
      expect(onConflict).toHaveBeenCalledWith('existing.txt');
    });
  });

  it('should handle overwrite decision correctly', async () => {
    const mockDocuments = [
      {
        id: '1',
        name: 'existing.txt',
        position: 0,
        data_source_type: 'upload_file',
        created_from: 'api',
        created_by: 'user',
        created_at: 1640995200,
        tokens: 50,
        indexing_status: 'completed',
        enabled: true,
        archived: false,
        word_count: 100,
        hit_count: 0,
        doc_form: 'text_model',
      },
    ];

    const mockConfigData = { datasetId: 'test-dataset' };
    const mockSegments = { data: [{ content: 'Test content', position: 0 }] };

    // Set up the download state
    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockResolvedValue(mockSegments);
    mockFs.access.mockResolvedValue(undefined); // File exists
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    const onConflict = vi.fn();
    const { result } = renderHook(() => useDownload(onConflict));

    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    // Start download
    act(() => {
      result.current.handleDownloadDocuments(mockDocuments);
    });

    // Wait for conflict
    await waitFor(() => {
      expect(onConflict).toHaveBeenCalled();
    });

    // Handle overwrite decision
    act(() => {
      result.current.handleOverwriteDecision(true);
    });

    // Wait for download to complete
    await waitFor(() => {
      expect(result.current.downloadProgress[0].status).toBe('completed');
    });

    expect(mockFs.writeFile).toHaveBeenCalled();
  });

  it('should expose handleOverwriteDecision function', () => {
    const { result } = renderHook(() => useDownload());
    expect(result.current.handleOverwriteDecision).toBeDefined();
    expect(typeof result.current.handleOverwriteDecision).toBe('function');
  });

  it('should process files sequentially', async () => {
    const mockDocuments = [
      { id: '1', name: 'doc1.txt' },
      { id: '2', name: 'doc2.txt' },
    ] as any[];

    const mockConfigData = { datasetId: 'test-dataset' };
    const mockSegments = { data: [{ content: 'Content', position: 0 }] };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockResolvedValue(mockSegments);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDownload());

    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    const callOrder: string[] = [];
    mockDifyClient.getDocumentSegments.mockImplementation(
      (datasetId: string, docId: string) => {
        callOrder.push(docId);
        return Promise.resolve(mockSegments);
      }
    );

    await act(async () => {
      await result.current.handleDownloadDocuments(mockDocuments);
    });

    // Verify files were processed in order
    expect(callOrder).toEqual(['1', '2']);
  });

  it('should handle API errors during download', async () => {
    const mockDocuments = [
      {
        id: '1',
        name: 'doc1.txt',
        position: 0,
        data_source_type: 'upload_file',
        created_from: 'api',
        created_by: 'user',
        created_at: 1640995200,
        tokens: 50,
        indexing_status: 'completed',
        enabled: true,
        archived: false,
        word_count: 100,
        hit_count: 0,
        doc_form: 'text_model',
      },
    ];

    const mockConfigData = { datasetId: 'test-dataset' };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockDifyClient.getDocumentSegments.mockRejectedValue(
      new Error('Network error')
    );

    const onError = vi.fn();
    const { result } = renderHook(() => useDownload(undefined, onError));

    act(() => {
      result.current.setSelectedDownloadDir('./downloads');
    });

    await act(async () => {
      await result.current.handleDownloadDocuments(mockDocuments);
    });

    // Wait for error to be processed
    await waitFor(() => {
      expect(result.current.downloadProgress[0].status).toBe('error');
    });

    expect(result.current.downloadProgress[0].error).toBe('Network error');
  });
});
