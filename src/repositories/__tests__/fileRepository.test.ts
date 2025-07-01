import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  formatFileSize,
  isValidFileType 
} from '../fileRepository.js';

// Only test pure functions without mocking complex file operations
// File system operations will be tested in integration tests

describe('fileRepository', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('isValidFileType', () => {
    it('should validate file types correctly', () => {
      expect(isValidFileType('test.txt')).toBe(true);
      expect(isValidFileType('test.md')).toBe(true);
      expect(isValidFileType('test.csv')).toBe(true);
      expect(isValidFileType('test.json')).toBe(true);
      expect(isValidFileType('test.exe')).toBe(false);
      expect(isValidFileType('test.jpg')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidFileType('test.TXT')).toBe(true);
      expect(isValidFileType('test.MD')).toBe(true);
    });

    it('should accept custom extensions', () => {
      expect(isValidFileType('test.py', ['.py', '.js'])).toBe(true);
      expect(isValidFileType('test.txt', ['.py', '.js'])).toBe(false);
    });
  });
});