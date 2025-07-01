# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm start` - Run the application directly with tsx (preferred for development)
- `npm run dev` - Run with file watching (tsx watch, may cause exit issues)
- `npm run build` - Build TypeScript to JavaScript in dist/
- `npm run typecheck` - Run TypeScript type checking without emitting files

### Environment Setup
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Required environment variables:
- `DIFY_API_URL` - Dify API endpoint (must end with `/v1/`)
- `DIFY_API_KEY` - Dataset API key from Dify
- `DIFY_DATASET_ID` - Target dataset ID
- `LOG_LEVEL` - Logging level (info, debug, error, warn)

## Architecture Overview

This is a CLI application built with React Ink that provides bidirectional file synchronization between local files and Dify knowledge bases.

### Key Architectural Patterns

**Repository Pattern**: Data access is abstracted through repositories in `src/repositories/`:
- `difyClient.ts` - Dify API interactions using Axios
- `fileRepository.ts` - Local file system operations using fs/promises
- `config.ts` - Environment configuration management
- `logger.ts` - Centralized logging utilities

**Functional Programming**: The codebase avoids classes and uses function-based modules exclusively. All repositories export functions rather than class instances.

**React Ink State Management**: The main App component manages application state through React hooks, handling transitions between different UI states (menu, file selection, progress, error).

### Component Architecture

The UI is built with React Ink components that handle keyboard input:
- `App.tsx` - Main application state machine and orchestration
- `Menu.tsx` - Arrow key navigation for main options
- `FileSelector.tsx` - Multi-select interface for local files (Space to select)
- `DocumentSelector.tsx` - Multi-select interface for Dify documents
- `ProgressBar.tsx` - Real-time progress display for uploads/downloads

### API Integration

Dify API integration uses specific endpoints:
- Document creation: `/datasets/{id}/document/create-by-text`
- Document listing: `/datasets/{id}/documents`
- Document segments: `/datasets/{id}/documents/{doc_id}/segments`
- Dataset operations: `/datasets`

The client handles authentication via Bearer tokens and includes comprehensive error handling for 401, 404, and 5xx responses.

### File Processing Flow

**Upload**: Local files → File content reading → Dify API text creation → Progress tracking
**Download**: Dify document listing → Segment content retrieval → Local file assembly → File writing

Downloads reconstruct original content by fetching document segments and combining them, as Dify doesn't provide direct document export.

## Important Implementation Notes

### Module System
The project uses ESM (`"type": "module"`) with TypeScript configured for bundler resolution. Import paths should not include file extensions in source code.

### Error Handling Strategy
The application includes comprehensive error boundaries at multiple levels:
- Repository level: API and file system errors
- Component level: UI state errors and user interaction errors
- Application level: Unhandled promise rejections and exceptions

### TypeScript Configuration
Uses `bundler` module resolution with `allowImportingTsExtensions` for development compatibility with tsx, while building standard JavaScript for distribution.