import { describe, it, expect } from 'vitest';
import {
  combineSegments,
  sanitizeFileName,
  generateFilePath,
} from './document.js';

describe('combineSegments', () => {
  it('should combine segments in correct order', () => {
    const segments = [
      { content: 'Third', position: 2 },
      { content: 'First', position: 0 },
      { content: 'Second', position: 1 },
    ];

    expect(combineSegments(segments)).toBe('First\n\nSecond\n\nThird');
  });

  it('should handle empty segments', () => {
    expect(combineSegments([])).toBe('');
  });

  it('should handle single segment', () => {
    const segments = [{ content: 'Only content', position: 0 }];
    expect(combineSegments(segments)).toBe('Only content');
  });
});

describe('sanitizeFileName', () => {
  it('should replace invalid characters with hyphens but preserve directory structure', () => {
    expect(sanitizeFileName('sub/subdir_file')).toBe('sub/subdir_file');
    expect(sanitizeFileName('path/to/file\\name')).toBe('path/to/file-name');
    expect(sanitizeFileName('dir/file?name')).toBe('dir/file-name');
    expect(sanitizeFileName('dir/file%name')).toBe('dir/file-name');
    expect(sanitizeFileName('dir/file*name')).toBe('dir/file-name');
    expect(sanitizeFileName('dir/file:name')).toBe('dir/file-name');
    expect(sanitizeFileName('dir/file|name')).toBe('dir/file-name');
    expect(sanitizeFileName('dir/file"name')).toBe('dir/file-name');
    expect(sanitizeFileName('dir/file<name>')).toBe('dir/file-name-');
  });

  it('should keep valid characters unchanged', () => {
    expect(sanitizeFileName('valid_file-name.txt')).toBe('valid_file-name.txt');
    expect(sanitizeFileName('file name with spaces')).toBe(
      'file name with spaces'
    );
    expect(sanitizeFileName('path/to/valid_file-name.txt')).toBe(
      'path/to/valid_file-name.txt'
    );
  });

  it('should handle complex directory structures', () => {
    expect(sanitizeFileName('docs/api/v1/endpoints.md')).toBe(
      'docs/api/v1/endpoints.md'
    );
    expect(sanitizeFileName('src/components/UI/Button.tsx')).toBe(
      'src/components/UI/Button.tsx'
    );
    expect(sanitizeFileName('data/2024/01/report.csv')).toBe(
      'data/2024/01/report.csv'
    );
  });

  it('should sanitize each path component separately', () => {
    expect(sanitizeFileName('dir:name/file:name.txt')).toBe(
      'dir-name/file-name.txt'
    );
    expect(sanitizeFileName('bad?dir/bad?file.txt')).toBe(
      'bad-dir/bad-file.txt'
    );
  });
});

describe('generateFilePath', () => {
  it('should preserve original file extension', () => {
    expect(generateFilePath('document.md', '/output')).toBe(
      '/output/document.md'
    );
    expect(generateFilePath('document.json', '/output')).toBe(
      '/output/document.json'
    );
    expect(generateFilePath('document.csv', '/output')).toBe(
      '/output/document.csv'
    );
    expect(generateFilePath('document.txt', '/output')).toBe(
      '/output/document.txt'
    );
  });

  it('should handle files without extension', () => {
    expect(generateFilePath('document', '/output')).toBe('/output/document');
  });

  it('should preserve multiple dots in filename', () => {
    expect(generateFilePath('file.backup.md', '/output')).toBe(
      '/output/file.backup.md'
    );
    expect(generateFilePath('config.local.json', '/output')).toBe(
      '/output/config.local.json'
    );
  });

  it('should preserve directory structure while sanitizing file names', () => {
    expect(generateFilePath('doc/with/slashes.md', '/output')).toBe(
      '/output/doc/with/slashes.md'
    );
    expect(generateFilePath('dir/file*with?special.json', '/output')).toBe(
      '/output/dir/file-with-special.json'
    );
  });

  it('should handle complex paths with various extensions', () => {
    expect(generateFilePath('my document.csv', '/path/to/output')).toBe(
      '/path/to/output/my document.csv'
    );
    expect(generateFilePath('data-file.jsonl', '/output')).toBe(
      '/output/data-file.jsonl'
    );
  });

  it('should handle edge cases with dots', () => {
    expect(generateFilePath('.gitignore', '/output')).toBe(
      '/output/.gitignore'
    );
    expect(generateFilePath('file.', '/output')).toBe('/output/file.');
    expect(generateFilePath('.hidden.txt', '/output')).toBe(
      '/output/.hidden.txt'
    );
  });
});
