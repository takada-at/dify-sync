import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUpload } from '../useUpload.js';
import * as fs from 'fs/promises';

// Mock the repositories
vi.mock('../../repositories/fileRepository.js', () => ({
  getLocalFiles: vi.fn(),
  getDirectories: vi.fn(),
  readFileContent: vi.fn(),
}));

vi.mock('../../repositories/difyClient.js', () => ({
  createDocumentFromText: vi.fn(),
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
  readFile: vi.fn(),
}));

import * as fileRepository from '../../repositories/fileRepository.js';
import * as difyClient from '../../repositories/difyClient.js';
import * as config from '../../repositories/config.js';

const mockFileRepository = fileRepository as any;
const mockDifyClient = difyClient as any;
const mockConfig = config as any;
const mockFs = fs as any;

describe('useUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useUpload());

    expect(result.current.localFiles).toEqual([]);
    expect(result.current.uploadProgress).toEqual([]);
    expect(result.current.directories).toEqual([]);
  });

  it('should load directories successfully', async () => {
    const mockDirectories = ['src', 'docs', 'test'];
    mockFileRepository.getDirectories.mockResolvedValue(mockDirectories);

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.loadDirectories();
    });

    expect(result.current.directories).toEqual(mockDirectories);
    expect(mockFileRepository.getDirectories).toHaveBeenCalledWith('./');
  });

  it('should handle directory loading error', async () => {
    mockFileRepository.getDirectories.mockRejectedValue(new Error('Directory error'));

    const { result } = renderHook(() => useUpload());

    await expect(act(async () => {
      await result.current.loadDirectories();
    })).rejects.toThrow('Failed to load directories: Directory error');
  });

  it('should load local files successfully', async () => {
    const mockFiles = [
      { name: 'file1.txt', path: '/test/file1.txt', size: 100 },
      { name: 'file2.md', path: '/test/file2.md', size: 200 },
    ];
    mockFileRepository.getLocalFiles.mockResolvedValue(mockFiles);

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.loadLocalFiles('./test', false);
    });

    expect(result.current.localFiles).toEqual(mockFiles);
    expect(mockFileRepository.getLocalFiles).toHaveBeenCalledWith(
      './test',
      ['.txt', '.md', '.csv', '.json'],
      false
    );
  });

  it('should handle upload files successfully', async () => {
    const mockFiles = [
      { name: 'file1.txt', path: '/test/file1.txt', size: 100 },
      { name: 'file2.md', path: '/test/file2.md', size: 200 },
    ];

    const mockConfigData = {
      apiUrl: 'https://test-api.dify.ai/v1',
      datasetId: 'test-dataset',
    };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockFs.readFile
      .mockResolvedValueOnce('content1')
      .mockResolvedValueOnce('content2');
    mockDifyClient.createDocumentFromText
      .mockResolvedValueOnce({ document: { id: 'doc-1' } })
      .mockResolvedValueOnce({ document: { id: 'doc-2' } });

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.handleUploadFiles(mockFiles);
    });

    // Wait for all uploads to complete
    await waitFor(() => {
      expect(result.current.uploadProgress.every(p => p.status === 'completed')).toBe(true);
    });

    expect(result.current.uploadProgress).toHaveLength(2);
    expect(result.current.uploadProgress[0].status).toBe('completed');
    expect(result.current.uploadProgress[1].status).toBe('completed');
    expect(mockDifyClient.createDocumentFromText).toHaveBeenCalledTimes(2);
  });

  it('should handle empty file selection', async () => {
    const { result } = renderHook(() => useUpload());

    // Mock console.log to verify the behavior
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await act(async () => {
      await result.current.handleUploadFiles([]);
    });

    expect(consoleSpy).toHaveBeenCalledWith('No files selected, returning to menu');
    expect(result.current.uploadProgress).toEqual([]);
    
    consoleSpy.mockRestore();
  });

  it('should handle upload errors', async () => {
    const mockFiles = [
      { name: 'file1.txt', path: '/test/file1.txt', size: 100 },
    ];

    const mockConfigData = {
      apiUrl: 'https://test-api.dify.ai/v1',
      datasetId: 'test-dataset',
    };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockFs.readFile.mockResolvedValue('content');
    mockDifyClient.createDocumentFromText.mockRejectedValue(new Error('Upload failed'));

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.handleUploadFiles(mockFiles);
    });

    // Wait for error to be processed
    await waitFor(() => {
      expect(result.current.uploadProgress[0].status).toBe('error');
    });

    expect(result.current.uploadProgress).toHaveLength(1);
    expect(result.current.uploadProgress[0].error).toBe('Upload failed');
  });

  it('should update progress during upload', async () => {
    const mockFiles = [
      { name: 'file1.txt', path: '/test/file1.txt', size: 100 },
    ];

    const mockConfigData = {
      apiUrl: 'https://test-api.dify.ai/v1',
      datasetId: 'test-dataset',
    };

    mockConfig.loadConfig.mockResolvedValue(mockConfigData);
    mockFs.readFile.mockResolvedValue('content');
    mockDifyClient.createDocumentFromText.mockResolvedValue({ document: { id: 'doc-1' } });

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.handleUploadFiles(mockFiles);
    });

    // Wait for upload to complete
    await waitFor(() => {
      expect(result.current.uploadProgress[0].status).toBe('completed');
    });

    expect(result.current.uploadProgress[0].progress).toBe(100);
  });
});