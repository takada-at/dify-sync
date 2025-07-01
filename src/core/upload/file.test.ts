import { describe, it, expect } from 'vitest';
import { 
  isSupportedFile, 
  filterSupportedFiles, 
  createLocalFile,
  getFileExtension,
  isTextFile 
} from './file.js';

describe('isSupportedFile', () => {
  it('should return true for supported extensions', () => {
    expect(isSupportedFile('document.txt')).toBe(true);
    expect(isSupportedFile('README.md')).toBe(true);
    expect(isSupportedFile('data.csv')).toBe(true);
    expect(isSupportedFile('config.json')).toBe(true);
  });

  it('should return false for unsupported extensions', () => {
    expect(isSupportedFile('image.png')).toBe(false);
    expect(isSupportedFile('video.mp4')).toBe(false);
    expect(isSupportedFile('archive.zip')).toBe(false);
    expect(isSupportedFile('noextension')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isSupportedFile('document.TXT')).toBe(true);
    expect(isSupportedFile('README.MD')).toBe(true);
    expect(isSupportedFile('DATA.CSV')).toBe(true);
  });
});

describe('filterSupportedFiles', () => {
  it('should filter only supported files', () => {
    const files = [
      'doc1.txt',
      'image.png',
      'readme.md',
      'data.csv',
      'video.mp4',
      'config.json'
    ];
    
    const result = filterSupportedFiles(files);
    expect(result).toEqual(['doc1.txt', 'readme.md', 'data.csv', 'config.json']);
  });

  it('should return empty array for no supported files', () => {
    const files = ['image.png', 'video.mp4', 'archive.zip'];
    expect(filterSupportedFiles(files)).toEqual([]);
  });
});

describe('createLocalFile', () => {
  it('should create local file with relative path', () => {
    const result = createLocalFile('/home/user/docs/file.txt', '/home/user');
    expect(result).toEqual({
      name: 'file.txt',
      path: 'docs/file.txt'
    });
  });

  it('should use filename when in same directory', () => {
    const result = createLocalFile('/home/user/file.txt', '/home/user');
    expect(result).toEqual({
      name: 'file.txt',
      path: 'file.txt'
    });
  });

  it('should handle paths correctly', () => {
    // Test with Unix-style paths which work consistently across platforms
    const result = createLocalFile('/users/docs/file.txt', '/users');
    expect(result.name).toBe('file.txt');
    expect(result.path).toBe('docs/file.txt');
  });
});

describe('getFileExtension', () => {
  it('should return lowercase extension', () => {
    expect(getFileExtension('file.txt')).toBe('.txt');
    expect(getFileExtension('FILE.TXT')).toBe('.txt');
    expect(getFileExtension('document.MD')).toBe('.md');
  });

  it('should handle files without extension', () => {
    expect(getFileExtension('README')).toBe('');
    expect(getFileExtension('Makefile')).toBe('');
  });

  it('should handle multiple dots', () => {
    expect(getFileExtension('file.backup.txt')).toBe('.txt');
    expect(getFileExtension('my.file.name.json')).toBe('.json');
  });
});

describe('isTextFile', () => {
  it('should return true for text file extensions', () => {
    expect(isTextFile('file.txt')).toBe(true);
    expect(isTextFile('README.md')).toBe(true);
    expect(isTextFile('data.csv')).toBe(true);
    expect(isTextFile('config.json')).toBe(true);
  });

  it('should return false for non-text extensions', () => {
    expect(isTextFile('image.png')).toBe(false);
    expect(isTextFile('video.mp4')).toBe(false);
    expect(isTextFile('document.pdf')).toBe(false);
  });
});