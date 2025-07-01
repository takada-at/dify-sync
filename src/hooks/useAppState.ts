import { useState } from 'react';

export type AppState =
  | 'menu'
  | 'upload-directory-select'
  | 'upload-file-select'
  | 'upload-progress'
  | 'download-directory-select'
  | 'download-document-select'
  | 'download-progress'
  | 'overwrite-confirm'
  | 'settings'
  | 'error';

export function useAppState() {
  const [state, setState] = useState<AppState>('menu');
  const [error, setError] = useState<string>('');
  const [conflictFileName, setConflictFileName] = useState<string>('');

  const handleBack = () => {
    setState('menu');
    setError('');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setState('error');
  };

  return {
    state,
    setState,
    error,
    setError,
    conflictFileName,
    setConflictFileName,
    handleBack,
    handleError,
  };
}
