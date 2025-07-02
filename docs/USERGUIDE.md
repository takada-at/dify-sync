# Dify Sync User Guide

Dify Sync is a command-line interface (CLI) tool designed for bidirectional synchronization between local files and Dify knowledge bases. This guide provides comprehensive instructions covering both basic and advanced usage scenarios.

## Table of Contents

- [Initial Setup](#initial-setup)
- [Basic Usage](#basic-usage)
- [Command Line Options](#command-line-options)
- [Interactive Mode](#interactive-mode)
- [File Selection](#file-selection)
- [Error Handling](#error-handling)
- [Frequently Asked Questions](#frequently-asked-questions)

## Initial Setup

### 1. Configuration

Begin by configuring your Dify API settings. Launch dify-sync and navigate to the Settings section to configure your API key and URL.

```bash
dify-sync
 🔄 DIFY SYNC • Knowledge Base Synchronization


 MAIN MENU

    📤 Upload files to Dify
    📥 Download files from Dify
  ❯ ⚙️ Settings (Configure API credentials and preferences)
    🚪 Exit
```

### 2. Environment Variable Configuration

Alternatively, you can specify configuration values using environment variables.

```
DIFY_API_URL=https://api.dify.ai/v1/
DIFY_API_KEY=dataset-xxxxxxxxxxxxxxxxx
DIFY_DATASET_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### How to Retrieve Configuration Values

Follow these steps to obtain the required configuration values:

1. DIFY_API_KEY - Access the "API" tab in the Dify dataset interface and copy the Dataset API Key.
2. DIFY_DATASET_ID - This can be extracted from the dataset's URL or found in the API interface. The value `xxxxxxxx-xxxx-xxxx` in `datasets/xxxxxxxx-xxxx-xxxx/documents` represents the dataset's unique identifier.
3. DIFY_API_URL - Typically `https://api.dify.ai/v1/`. For custom servers, use the URL provided by your system administrator. Note that the path should normally include the `/v1/` prefix.

## Basic Usage

### File Upload

#### 1: Interactive Mode

Launch in interactive mode and select "Upload files to Dify" from the menu.
```bash
dify-sync
 🔄 DIFY SYNC • Knowledge Base Synchronization


 MAIN MENU

  ❯ 📤 Upload files to Dify (Sync local files to your Dify knowledge base)
    📥 Download files from Dify
    ⚙️  Settings
    🚪 Exit
```
Select directory to upload:
```
 🔄 DIFY SYNC • Knowledge Base Synchronization


  Select directory to upload:

  Recursive mode: ON (includes subdirectories)

   → . (current directory)
     docs
```
Select files to upload:
```
  Select files to upload:

   ☑ file1.md  (1 KB)
   ☑ file2.md  (1 KB)
   ☑ sub/subdir_file.md  (1 B)

  Selected: 3 files
  Space: Select/Deselect, A: Select All, D: Deselect All, ↑↓: Navigate, Enter: Confirm, Esc: Cancel
```
#### 2: Command Line Interface

```bash
# Upload all files in the directory recursively
dify-sync --upload ./my-documents
```

### File Download

#### 1: Interactive Mode

Start in interactive mode and select "Download files from Dify" from the menu.
```bash
dify-sync

 🔄 DIFY SYNC • Knowledge Base Synchronization


 MAIN MENU

    📤 Upload files to Dify
  ❯ 📥 Download files from Dify (Export documents from Dify to local storage)
    ⚙️  Settings
    🚪 Exit
```
Select download destination directory
```
  Select download directory:

  Files will be downloaded to the selected directory

   → . (current directory)
     docs
```
Select document to download
```
  Select documents to download:

   ☑ sub/subdir_file.md  [completed]
     Words: 100 | Created: ...
   ☑ file1.md  [completed]
     Words: 100 | Created: ...

  Selected: 2 documents
```

#### 2: Command Line Interface

```bash
# Download all documents
dify-sync --download ./downloads

# Forcefully overwrite existing files
dify-sync --download ./downloads --force
```

## Command Line Options

### Basic Options

The following are the primary available options:

| Option | Abbreviation | Description | Example |
|--------|--------------|-------------|---------|
| `--upload` | `-u` | Upload files from the specified path | `dify-sync -u ./docs` |
| `--download` | `-d` | Download files to the specified path | `dify-sync -d ./backup` |
| `--force` | `-f` | Skip confirmation prompts for overwrite | `dify-sync -d ./backup -f` |
| `--help` | `-h` | Display help information | `dify-sync -h` |
| `--version` | `-V` | Display version information | `dify-sync -V` |

### Usage Examples

```bash
# Basic upload
dify-sync --upload ./documents

# Basic download
dify-sync --download ./backup

# Download with forced overwrite
dify-sync --download ./backup --force

# Combination of multiple options
dify-sync --upload ./src --force
```

## Interactive Mode

### Menu Navigation

In interactive mode, the following keyboard shortcuts are available:

#### Main Menu Navigation

The following key commands are supported in the main menu:

- ↑/↓ arrow keys - Navigate between options
- Enter - Confirm selection
- Ctrl+C - Exit the application

#### Directory Selection

In the directory selection interface, the following operations are supported:

- ↑/↓ arrow keys - Navigate between directories
- R key - Toggle recursive mode on/off
- Enter - Select a directory
- Esc - Return to the previous screen

#### File Selection

In the file selection interface, the following operations are available:

- ↑/↓ arrow keys - Navigate between files
- Spacebar - Select/deselect files
- A key - Select all files
- D key - Deselect all files
- Enter - Begin processing with the selected files
- Esc - Return to the previous screen
### Screen Descriptions

#### Upload Screen
```
🔄 Dify Sync

Select an option:
→ Upload files to Dify    # ← Arrow highlights current selection
  Download files from Dify
  Settings
  Exit
```

#### Directory Selection Screen
```
Select directory to upload:

Recursive mode: ON (includes subdirectories)  # ← R key toggles

→ . (current directory)
  docs/
  src/
  tests/

↑↓: Navigate, R: Toggle recursive mode, Enter: Select, Esc: Cancel
```

#### File Selection Screen
```
Select files to upload:

☑ document1.md (1.2 KB)    # ← ☑ indicates selected, ☐ indicates unselected
☑ document2.txt (856 B)
☐ image.png (45.3 KB)      # ← Current cursor position
☑ README.md (2.1 KB)

Selected: 3 files
Space: Select/Deselect, A: Select All, D: Deselect All, ↑↓: Navigate, Enter: Confirm, Esc: Cancel
```

## File Selection

### Supported File Formats

The following file formats are automatically selected during upload:

- Text files (.txt)
- Markdown files (.md)
- CSV files (.csv)
- JSON files (.json)

### Filename Handling

#### During Upload
- The original filename and extension are preserved
- The directory structure is also maintained (e.g., `docs/api/guide.md`)

#### During Download
- The document name as it appears in Dify is used
- Any included directory structure will be automatically created
- Potentially dangerous characters (`\?%*:|"<>`) are replaced with hyphens (`-`)
