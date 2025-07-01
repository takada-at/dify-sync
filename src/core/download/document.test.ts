import { describe, it, expect } from 'vitest';
import { combineSegments, sanitizeFileName, generateFilePath } from './document.js';

describe('combineSegments', () => {
  it('should combine segments in correct order', () => {
    const segments = [
      { content: 'Third', position: 2 },
      { content: 'First', position: 0 },
      { content: 'Second', position: 1 }
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
  it('should replace invalid characters with hyphens', () => {
    expect(sanitizeFileName('file/name')).toBe('file-name');
    expect(sanitizeFileName('file\\name')).toBe('file-name');
    expect(sanitizeFileName('file?name')).toBe('file-name');
    expect(sanitizeFileName('file%name')).toBe('file-name');
    expect(sanitizeFileName('file*name')).toBe('file-name');
    expect(sanitizeFileName('file:name')).toBe('file-name');
    expect(sanitizeFileName('file|name')).toBe('file-name');
    expect(sanitizeFileName('file"name')).toBe('file-name');
    expect(sanitizeFileName('file<name>')).toBe('file-name-');
  });

  it('should keep valid characters unchanged', () => {
    expect(sanitizeFileName('valid_file-name.txt')).toBe('valid_file-name.txt');
    expect(sanitizeFileName('file name with spaces')).toBe('file name with spaces');
  });
});

describe('generateFilePath', () => {
  it('should preserve original file extension', () => {
    expect(generateFilePath('document.md', '/output')).toBe('/output/document.md');
    expect(generateFilePath('document.json', '/output')).toBe('/output/document.json');
    expect(generateFilePath('document.csv', '/output')).toBe('/output/document.csv');
    expect(generateFilePath('document.txt', '/output')).toBe('/output/document.txt');
  });

  it('should handle files without extension', () => {
    expect(generateFilePath('document', '/output')).toBe('/output/document');
  });

  it('should preserve multiple dots in filename', () => {
    expect(generateFilePath('file.backup.md', '/output')).toBe('/output/file.backup.md');
    expect(generateFilePath('config.local.json', '/output')).toBe('/output/config.local.json');
  });

  it('should sanitize file names while preserving extensions', () => {
    expect(generateFilePath('doc/with/slashes.md', '/output')).toBe('/output/doc-with-slashes.md');
    expect(generateFilePath('file*with?special.json', '/output')).toBe('/output/file-with-special.json');
  });

  it('should handle complex paths with various extensions', () => {
    expect(generateFilePath('my document.csv', '/path/to/output')).toBe('/path/to/output/my document.csv');
    expect(generateFilePath('data-file.jsonl', '/output')).toBe('/output/data-file.jsonl');
  });

  it('should handle edge cases with dots', () => {
    expect(generateFilePath('.gitignore', '/output')).toBe('/output/.gitignore');
    expect(generateFilePath('file.', '/output')).toBe('/output/file.');
    expect(generateFilePath('.hidden.txt', '/output')).toBe('/output/.hidden.txt');
  });
});