import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBatchUploadProcessor } from '../upload/processor.js';
import { createDownloadProcessor } from '../download/processor.js';
import { generateFilePath, sanitizeFileName } from '../download/document.js';
import type { UploadDependencies } from '../upload/types.js';
import type { DownloadDependencies } from '../download/types.js';

describe('Filename Preservation Tests', () => {
  describe('generateFilePath function', () => {
    it('should never automatically add .txt extension', () => {
      const testCases = [
        { input: 'document.md', expected: '/output/document.md' },
        { input: 'data.json', expected: '/output/data.json' },
        { input: 'styles.css', expected: '/output/styles.css' },
        { input: 'README', expected: '/output/README' },
        { input: 'config.yaml', expected: '/output/config.yaml' },
        { input: 'script.js', expected: '/output/script.js' },
        { input: 'document.txt', expected: '/output/document.txt' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = generateFilePath(input, '/output');
        expect(result).toBe(expected);

        // Critical test: ensure no .txt is ever automatically added
        if (!input.endsWith('.txt')) {
          expect(result).not.toContain('.txt');
        }
      });
    });

    it('should preserve original extensions for all supported file types', () => {
      const supportedExtensions = ['.txt', '.md', '.csv', '.json'];
      const baseFilename = 'document';

      supportedExtensions.forEach(ext => {
        const filename = baseFilename + ext;
        const result = generateFilePath(filename, '/output');

        expect(result).toBe(`/output/${filename}`);
        expect(result.endsWith(ext)).toBe(true);

        // Ensure no double extensions
        expect(result.split('.').length - 1).toBe(1); // Only one dot for extension
      });
    });
  });

  describe('Upload-Download Filename Consistency', () => {
    let mockUploadDeps: UploadDependencies;
    let mockDownloadDeps: DownloadDependencies;

    beforeEach(() => {
      mockUploadDeps = {
        readFileContent: vi.fn().mockResolvedValue('test content'),
        createDocument: vi.fn().mockResolvedValue({ id: 'doc-123' }),
      };

      mockDownloadDeps = {
        fetchDocumentSegments: vi
          .fn()
          .mockResolvedValue([{ content: 'test content', position: 0 }]),
        saveFile: vi.fn().mockResolvedValue(undefined),
        checkFileExists: vi.fn().mockResolvedValue(false),
      };
    });

    it('should maintain filename consistency between upload and download', async () => {
      const testFiles = [
        { name: 'document.md', path: '/test/document.md', size: 100 },
        { name: 'data.json', path: '/test/data.json', size: 200 },
        { name: 'README', path: '/test/README', size: 50 },
        { name: 'config.yaml', path: '/test/config.yaml', size: 150 },
        {
          name: 'sub/subdir_file.txt',
          path: '/test/sub/subdir_file.txt',
          size: 100,
        },
        {
          name: 'docs/api/endpoints.md',
          path: '/test/docs/api/endpoints.md',
          size: 200,
        },
      ];

      const uploadProcessor = createBatchUploadProcessor(mockUploadDeps);

      // Test upload preserves original filenames
      const uploadResults = await uploadProcessor({
        files: testFiles,
        onProgress: vi.fn(),
        onFileComplete: vi.fn(),
      });

      // Verify createDocument was called with original filenames
      testFiles.forEach((file, index) => {
        expect(mockUploadDeps.createDocument).toHaveBeenCalledWith(
          file.name,
          'test content'
        );
      });

      // Test download path generation (simpler test without actual processor)
      testFiles.forEach(file => {
        const downloadPath = generateFilePath(file.name, '/download');
        const expectedPath = `/download/${file.name}`;
        expect(downloadPath).toBe(expectedPath);
      });
    });

    it('should handle files with multiple dots in filename', async () => {
      const complexFilenames = [
        'config.local.json',
        'data.backup.csv',
        'README.dev.md',
        'version.1.2.3.txt',
      ];

      for (const filename of complexFilenames) {
        const file = { name: filename, path: `/test/${filename}`, size: 100 };

        // Test upload
        const uploadProcessor = createBatchUploadProcessor(mockUploadDeps);
        await uploadProcessor({
          files: [file],
          onProgress: vi.fn(),
          onFileComplete: vi.fn(),
        });

        // Verify original filename is preserved in upload
        expect(mockUploadDeps.createDocument).toHaveBeenCalledWith(
          filename,
          'test content'
        );

        // Test download path generation
        const downloadPath = generateFilePath(filename, '/download');
        expect(downloadPath).toBe(`/download/${filename}`);

        // Critical: ensure no .txt is added to files that already have extensions
        const originalExtension = filename.substring(filename.lastIndexOf('.'));
        expect(downloadPath.endsWith(originalExtension)).toBe(true);
        // Only check this for files that don't originally end with .txt
        if (!filename.endsWith('.txt')) {
          expect(downloadPath).not.toMatch(/\.txt$/);
        }
      }
    });

    it('should preserve directory structure in downloads', () => {
      // This test specifically guards against the bug where '/' was replaced with '-'
      const testCases = [
        {
          input: 'sub/subdir_file.txt',
          expected: '/output/sub/subdir_file.txt',
        },
        {
          input: 'docs/api/v1/endpoints.md',
          expected: '/output/docs/api/v1/endpoints.md',
        },
        {
          input: 'src/components/UI/Button.tsx',
          expected: '/output/src/components/UI/Button.tsx',
        },
        {
          input: 'data/2024/01/report.csv',
          expected: '/output/data/2024/01/report.csv',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = generateFilePath(input, '/output');
        expect(result).toBe(expected);

        // Critical test: ensure directory separators are preserved
        expect(result).toContain('/');
        expect(result.split('/').length).toBeGreaterThan(2);
      });
    });

    it('should prevent regression of .txt auto-addition bug', () => {
      // This test specifically guards against the bug where .txt was automatically added
      const nonTxtFiles = [
        'document.md',
        'data.json',
        'styles.css',
        'script.js',
        'config.yaml',
        'README',
        'notes',
      ];

      nonTxtFiles.forEach(filename => {
        const result = generateFilePath(filename, '/output');

        // Critical assertion: NO automatic .txt addition
        if (!filename.includes('.txt')) {
          expect(result).not.toMatch(/\.txt$/);
          expect(result).not.toContain('.txt');
        }

        // Should end with original extension or no extension
        if (filename.includes('.')) {
          const originalExt = filename.substring(filename.lastIndexOf('.'));
          expect(result.endsWith(originalExt)).toBe(true);
        } else {
          expect(result).toBe(`/output/${filename}`);
        }
      });
    });

    it('should handle edge cases with leading/trailing slashes and empty segments', () => {
      const testCases = [
        {
          input: '/document.md',
          expected: 'document.md',
          description: 'leading slash',
        },
        {
          input: 'document.md/',
          expected: 'document.md',
          description: 'trailing slash',
        },
        {
          input: '/document.md/',
          expected: 'document.md',
          description: 'leading and trailing slash',
        },
        {
          input: 'docs//file.md',
          expected: 'docs/file.md',
          description: 'double slash',
        },
        {
          input: '/docs//api///file.md/',
          expected: 'docs/api/file.md',
          description: 'multiple slashes',
        },
        {
          input: '   /docs/file.md   ',
          expected: 'docs/file.md',
          description: 'whitespace with slash',
        },
        {
          input: '/',
          expected: '',
          description: 'root slash only',
        },
        {
          input: '///',
          expected: '',
          description: 'multiple slashes only',
        },
        {
          input: '   ',
          expected: '',
          description: 'whitespace only',
        },
      ];

      testCases.forEach(({ input, expected, description }) => {
        const result = sanitizeFileName(input);
        expect(result).toBe(expected);

        // Ensure no empty segments remain (unless result is empty)
        if (result.length > 0) {
          const segments = result.split('/');
          expect(segments.every(segment => segment.length > 0)).toBe(true);
        }
      });
    });
  });
});
