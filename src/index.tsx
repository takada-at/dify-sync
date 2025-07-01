#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './components/App.js';

// Parse command line arguments
const program = new Command();

program
  .name('dify-sync')
  .description('CLI tool for syncing files with Dify knowledge base')
  .version('1.0.0')
  .option(
    '-u, --upload <path>',
    'Upload files from the specified path recursively'
  )
  .option('-d, --download <path>', 'Download files to the specified path')
  .option('-f, --force', 'Force overwrite existing files without confirmation')
  .option(
    '--dataset-id <id>',
    'Specify the Dify dataset ID (overrides DIFY_DATASET_ID environment variable)'
  )
  .parse(globalThis.process.argv);

const options = program.opts();

// Handle unhandled promise rejections
globalThis.process.on('unhandledRejection', (reason, promise) => {
  globalThis.console.error(
    'Unhandled Rejection at:',
    promise,
    'reason:',
    reason
  );
  globalThis.process.exit(1);
});

// Handle uncaught exceptions
globalThis.process.on('uncaughtException', error => {
  globalThis.console.error('Uncaught Exception:', error);
  globalThis.process.exit(1);
});

// Render the app
render(
  <App
    uploadPath={options.upload}
    downloadPath={options.download}
    forceOverwrite={options.force}
    datasetId={options.datasetId}
  />
);
