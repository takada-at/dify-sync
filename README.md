# Dify Sync

A CLI tool for bidirectional file synchronization between local files and Dify knowledge bases.

## Features

- **Bidirectional Sync**: Upload local files to Dify or download documents from Dify
- **Interactive UI**: Terminal-based interface with keyboard navigation
- **Progress Tracking**: Real-time progress display for uploads and downloads
- **File Selection**: Multi-select interface for choosing files and documents
- **Error Handling**: Comprehensive error handling and logging

## Installation

```bash
npm install
npm run build
```

## Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```
DIFY_API_URL=https://api.dify.ai/v1/
DIFY_API_KEY=your_api_key_here
DIFY_DATASET_ID=your_dataset_id
LOG_LEVEL=info
```

### Environment Variables

- `DIFY_API_URL` - Dify API endpoint (must end with `/v1/`)
- `DIFY_API_KEY` - Dataset API key from Dify
- `DIFY_DATASET_ID` - Target dataset ID
- `LOG_LEVEL` - Logging level (info, debug, error, warn)

## Usage

### Development Mode
```bash
npm start
```

### Watch Mode
```bash
npm run dev
```

### Built Version
```bash
npm run build
dify-sync
```

## Commands

### Development
- `npm start` - Run the application directly with tsx (preferred for development)
- `npm run dev` - Run with file watching (tsx watch)
- `npm run build` - Build TypeScript to JavaScript in dist/
- `npm run typecheck` - Run TypeScript type checking

### Testing
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## How It Works

The application provides an interactive terminal interface where you can:

1. **Upload Files**: Select local files to upload to your Dify knowledge base
2. **Download Documents**: Select documents from Dify to download as local files
3. **Track Progress**: Monitor upload/download progress in real-time

### Navigation

- Use **arrow keys** to navigate menus
- Press **Space** to select/deselect files
- Press **Enter** to confirm selections
- Press **Ctrl+C** to exit

## Architecture

Built with:
- **React Ink** - Terminal UI framework
- **TypeScript** - Type-safe development
- **Axios** - HTTP client for Dify API
- **Commander** - CLI argument parsing

The application follows a functional programming approach with repository pattern for data access.

## API Integration

Integrates with Dify API endpoints:
- Document creation and management
- Dataset operations
- Document segments retrieval

## License

MIT