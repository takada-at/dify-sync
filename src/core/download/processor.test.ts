import { describe, it, expect, vi } from 'vitest';
import {
  createDownloadProcessor,
  createBatchDownloadProcessor,
} from './processor.js';
import type { DownloadDependencies, Document, FileConflict } from './types.js';

describe('createDownloadProcessor', () => {
  const createMockDependencies = (): DownloadDependencies => ({
    fetchDocumentSegments: vi.fn(),
    checkFileExists: vi.fn(),
    saveFile: vi.fn(),
  });

  it('should download document successfully when file does not exist', async () => {
    const deps = createMockDependencies();
    vi.mocked(deps.checkFileExists).mockResolvedValue(false);
    vi.mocked(deps.fetchDocumentSegments).mockResolvedValue([
      { content: 'Hello', position: 0 },
      { content: 'World', position: 1 },
    ]);

    const processor = createDownloadProcessor(deps);
    const result = await processor({
      document: { id: '1', name: 'test' },
      outputDir: '/output',
      overwriteHandler: { onConflict: vi.fn() },
    });

    expect(result).toEqual({
      documentId: '1',
      documentName: 'test',
      status: 'success',
    });

    expect(deps.saveFile).toHaveBeenCalledWith(
      '/output/test',
      'Hello\n\nWorld',
      false
    );
  });

  it('should handle file conflict with overwrite decision', async () => {
    const deps = createMockDependencies();
    const onConflict = vi.fn().mockResolvedValue('overwrite');

    vi.mocked(deps.checkFileExists).mockResolvedValue(true);
    vi.mocked(deps.fetchDocumentSegments).mockResolvedValue([
      { content: 'Content', position: 0 },
    ]);

    const processor = createDownloadProcessor(deps);
    const result = await processor({
      document: { id: '1', name: 'test' },
      outputDir: '/output',
      overwriteHandler: { onConflict },
    });

    expect(onConflict).toHaveBeenCalledWith({
      documentId: '1',
      documentName: 'test',
      filePath: '/output/test',
    });

    expect(result.status).toBe('success');
    expect(deps.saveFile).toHaveBeenCalledWith('/output/test', 'Content', true);
  });

  it('should handle file conflict with skip decision', async () => {
    const deps = createMockDependencies();
    const onConflict = vi.fn().mockResolvedValue('skip');

    vi.mocked(deps.checkFileExists).mockResolvedValue(true);

    const processor = createDownloadProcessor(deps);
    const result = await processor({
      document: { id: '1', name: 'test' },
      outputDir: '/output',
      overwriteHandler: { onConflict },
    });

    expect(result).toEqual({
      documentId: '1',
      documentName: 'test',
      status: 'skipped',
    });

    expect(deps.fetchDocumentSegments).not.toHaveBeenCalled();
    expect(deps.saveFile).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const deps = createMockDependencies();
    const error = new Error('Network error');
    vi.mocked(deps.fetchDocumentSegments).mockRejectedValue(error);
    vi.mocked(deps.checkFileExists).mockResolvedValue(false);

    const processor = createDownloadProcessor(deps);
    const result = await processor({
      document: { id: '1', name: 'test' },
      outputDir: '/output',
      overwriteHandler: { onConflict: vi.fn() },
    });

    expect(result).toEqual({
      documentId: '1',
      documentName: 'test',
      status: 'error',
      error: 'Network error',
    });
  });
});

describe('createBatchDownloadProcessor', () => {
  const createMockDependencies = (): DownloadDependencies => ({
    fetchDocumentSegments: vi.fn(),
    checkFileExists: vi.fn(),
    saveFile: vi.fn(),
  });

  it('should process multiple documents in sequence', async () => {
    const deps = createMockDependencies();
    vi.mocked(deps.checkFileExists).mockResolvedValue(false);
    vi.mocked(deps.fetchDocumentSegments).mockResolvedValue([
      { content: 'Content', position: 0 },
    ]);

    const documents: Document[] = [
      { id: '1', name: 'doc1' },
      { id: '2', name: 'doc2' },
      { id: '3', name: 'doc3' },
    ];

    const onProgress = vi.fn();
    const processor = createBatchDownloadProcessor(deps);

    const results = await processor({
      documents,
      outputDir: '/output',
      overwriteHandler: { onConflict: vi.fn() },
      onProgress,
    });

    expect(results).toHaveLength(3);
    expect(results.every(r => r.status === 'success')).toBe(true);

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenNthCalledWith(1, 0, 3, 'doc1');
    expect(onProgress).toHaveBeenNthCalledWith(2, 1, 3, 'doc2');
    expect(onProgress).toHaveBeenNthCalledWith(3, 2, 3, 'doc3');
  });

  it('should continue processing after errors', async () => {
    const deps = createMockDependencies();
    vi.mocked(deps.checkFileExists).mockResolvedValue(false);
    vi.mocked(deps.fetchDocumentSegments)
      .mockResolvedValueOnce([{ content: 'Content1', position: 0 }])
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce([{ content: 'Content3', position: 0 }]);

    const documents: Document[] = [
      { id: '1', name: 'doc1' },
      { id: '2', name: 'doc2' },
      { id: '3', name: 'doc3' },
    ];

    const processor = createBatchDownloadProcessor(deps);
    const results = await processor({
      documents,
      outputDir: '/output',
      overwriteHandler: { onConflict: vi.fn() },
    });

    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('success');
    expect(results[1].status).toBe('error');
    expect(results[1].error).toBe('Failed');
    expect(results[2].status).toBe('success');
  });
});
