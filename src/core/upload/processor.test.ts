import { describe, it, expect, vi } from 'vitest';
import {
  createUploadProcessor,
  createBatchUploadProcessor,
  calculateUploadStats,
} from './processor.js';
import type { UploadDependencies, LocalFile, UploadResult } from './types.js';

describe('createUploadProcessor', () => {
  const createMockDependencies = (): UploadDependencies => ({
    readFileContent: vi.fn(),
    createDocument: vi.fn(),
  });

  it('should upload file successfully', async () => {
    const deps = createMockDependencies();
    vi.mocked(deps.readFileContent).mockResolvedValue('file content');
    vi.mocked(deps.createDocument).mockResolvedValue({ id: 'doc-123' });

    const onProgress = vi.fn();
    const processor = createUploadProcessor(deps);

    const file: LocalFile = { name: 'test.txt', path: '/path/test.txt' };
    const result = await processor(file, onProgress);

    expect(result).toEqual({
      fileName: 'test.txt',
      status: 'success',
      documentId: 'doc-123',
    });

    expect(onProgress).toHaveBeenCalledWith('test.txt', 0);
    expect(onProgress).toHaveBeenCalledWith('test.txt', 25);
    expect(onProgress).toHaveBeenCalledWith('test.txt', 50);
    expect(onProgress).toHaveBeenCalledWith('test.txt', 100);

    expect(deps.readFileContent).toHaveBeenCalledWith('/path/test.txt');
    expect(deps.createDocument).toHaveBeenCalledWith(
      'test.txt',
      'file content'
    );
  });

  it('should handle read errors', async () => {
    const deps = createMockDependencies();
    vi.mocked(deps.readFileContent).mockRejectedValue(new Error('Read failed'));

    const processor = createUploadProcessor(deps);
    const file: LocalFile = { name: 'test.txt', path: '/path/test.txt' };
    const result = await processor(file);

    expect(result).toEqual({
      fileName: 'test.txt',
      status: 'error',
      error: 'Read failed',
    });
  });

  it('should handle upload errors', async () => {
    const deps = createMockDependencies();
    vi.mocked(deps.readFileContent).mockResolvedValue('content');
    vi.mocked(deps.createDocument).mockRejectedValue(new Error('API error'));

    const processor = createUploadProcessor(deps);
    const file: LocalFile = { name: 'test.txt', path: '/path/test.txt' };
    const result = await processor(file);

    expect(result).toEqual({
      fileName: 'test.txt',
      status: 'error',
      error: 'API error',
    });
  });
});

describe('createBatchUploadProcessor', () => {
  const createMockDependencies = (): UploadDependencies => ({
    readFileContent: vi.fn(),
    createDocument: vi.fn(),
  });

  it('should process multiple files in sequence', async () => {
    const deps = createMockDependencies();
    vi.mocked(deps.readFileContent).mockResolvedValue('content');
    vi.mocked(deps.createDocument)
      .mockResolvedValueOnce({ id: 'doc-1' })
      .mockResolvedValueOnce({ id: 'doc-2' })
      .mockResolvedValueOnce({ id: 'doc-3' });

    const files: LocalFile[] = [
      { name: 'file1.txt', path: '/path/file1.txt' },
      { name: 'file2.txt', path: '/path/file2.txt' },
      { name: 'file3.txt', path: '/path/file3.txt' },
    ];

    const onProgress = vi.fn();
    const onFileComplete = vi.fn();

    const processor = createBatchUploadProcessor(deps);
    const results = await processor({
      files,
      onProgress,
      onFileComplete,
    });

    expect(results).toHaveLength(3);
    expect(results.every(r => r.status === 'success')).toBe(true);

    expect(onFileComplete).toHaveBeenCalledTimes(3);
    expect(onFileComplete).toHaveBeenCalledWith({
      fileName: 'file1.txt',
      status: 'success',
      documentId: 'doc-1',
    });
  });

  it('should continue processing after errors', async () => {
    const deps = createMockDependencies();
    vi.mocked(deps.readFileContent).mockResolvedValue('content');
    vi.mocked(deps.createDocument)
      .mockResolvedValueOnce({ id: 'doc-1' })
      .mockRejectedValueOnce(new Error('Upload failed'))
      .mockResolvedValueOnce({ id: 'doc-3' });

    const files: LocalFile[] = [
      { name: 'file1.txt', path: '/path/file1.txt' },
      { name: 'file2.txt', path: '/path/file2.txt' },
      { name: 'file3.txt', path: '/path/file3.txt' },
    ];

    const processor = createBatchUploadProcessor(deps);
    const results = await processor({ files });

    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('success');
    expect(results[1].status).toBe('error');
    expect(results[1].error).toBe('Upload failed');
    expect(results[2].status).toBe('success');
  });
});

describe('calculateUploadStats', () => {
  it('should calculate correct statistics', () => {
    const results: UploadResult[] = [
      { fileName: 'file1.txt', status: 'success', documentId: 'doc-1' },
      { fileName: 'file2.txt', status: 'error', error: 'Upload failed' },
      { fileName: 'file3.txt', status: 'success', documentId: 'doc-3' },
      { fileName: 'file4.txt', status: 'error', error: 'Network error' },
    ];

    const stats = calculateUploadStats(results);

    expect(stats).toEqual({
      total: 4,
      successful: 2,
      failed: 2,
      errors: ['file2.txt: Upload failed', 'file4.txt: Network error'],
    });
  });

  it('should handle empty results', () => {
    const stats = calculateUploadStats([]);

    expect(stats).toEqual({
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
    });
  });

  it('should handle all successful uploads', () => {
    const results: UploadResult[] = [
      { fileName: 'file1.txt', status: 'success', documentId: 'doc-1' },
      { fileName: 'file2.txt', status: 'success', documentId: 'doc-2' },
    ];

    const stats = calculateUploadStats(results);

    expect(stats).toEqual({
      total: 2,
      successful: 2,
      failed: 0,
      errors: [],
    });
  });
});
