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
  it('should generate correct file path with .txt extension', () => {
    expect(generateFilePath('document', '/output')).toBe('/output/document.txt');
  });

  it('should not duplicate .txt extension', () => {
    expect(generateFilePath('document.txt', '/output')).toBe('/output/document.txt');
  });

  it('should sanitize file names', () => {
    expect(generateFilePath('doc/with/slashes', '/output')).toBe('/output/doc-with-slashes.txt');
  });

  it('should handle complex paths', () => {
    expect(generateFilePath('my document', '/path/to/output')).toBe('/path/to/output/my document.txt');
  });
});