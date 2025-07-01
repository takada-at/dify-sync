import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppState } from '../useAppState.js';

describe('useAppState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current.state).toBe('menu');
    expect(result.current.error).toBe('');
    expect(result.current.conflictFileName).toBe('');
  });

  it('should update state correctly', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setState('upload-progress');
    });

    expect(result.current.state).toBe('upload-progress');
  });

  it('should update error correctly', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');
  });

  it('should update conflict file name correctly', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setConflictFileName('test.txt');
    });

    expect(result.current.conflictFileName).toBe('test.txt');
  });

  it('should handle back navigation', () => {
    const { result } = renderHook(() => useAppState());

    // Set some state and error
    act(() => {
      result.current.setState('error');
      result.current.setError('Some error');
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toBe('Some error');

    // Go back
    act(() => {
      result.current.handleBack();
    });

    expect(result.current.state).toBe('menu');
    expect(result.current.error).toBe('');
  });

  it('should handle error setting', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.handleError('Test error message');
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toBe('Test error message');
  });

  it('should transition through multiple states', () => {
    const { result } = renderHook(() => useAppState());

    const states = [
      'upload-directory-select',
      'upload-file-select',
      'upload-progress',
    ] as const;

    states.forEach(state => {
      act(() => {
        result.current.setState(state);
      });
      expect(result.current.state).toBe(state);
    });
  });
});
