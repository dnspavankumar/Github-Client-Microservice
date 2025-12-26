# 📁 File Explorer Feature

## Overview
Added a VS Code-style file explorer sidebar to the GitHub Repo Assistant Chrome extension. This allows users to browse and navigate the repository file structure directly from the extension popup.

## Features

### 🌲 File Tree View
- **Hierarchical Display**: Shows folders and files in a tree structure
- **Expandable Folders**: Click folders to expand/collapse their contents
- **Smart Sorting**: Folders appear first, then files (alphabetically)
- **Visual Icons**: Different icons for file types (JS, TS, Python, etc.)

### 🔍 Search Functionality
- **Real-time Filter**: Search box to filter files by name/path
- **Instant Results**: Updates as you type
- **Path Matching**: Searches through full file paths

### 🎯 Navigation
- **Click to Open**: Click any file to open it in GitHub
- **Visual Selection**: Selected files are highlighted
- **Breadcrumb Paths**: Hover to see full file paths

### 🎨 UI/UX
- **VS Code Style**: Familiar interface for developers
- **Smooth Animations**: Chevron rotations and hover effects
- **Responsive Design**: Works within the 400px popup width
- **Scrollable**: Handles large repositories gracefully

## How to Use

1. **Open Extension**: Click the extension icon on any GitHub repository page
2. **Navigate to Explorer**: Click the "📁 Explorer" tab
3. **Load Files**: Click the refresh button (🔄) or it loads automatically
4. **Browse**: 
   - Click folders to expand/collapse
   - Click files to open them in GitHub
5. **Search**: Type in the search box to filter files

## Technical Details

### GitHub API Integration
- Uses GitHub's Tree API: `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
- Fetches entire repository structure in one request
- Handles up to 100,000 files (GitHub API limit)

### Data Structure
```javascript
{
  name: "filename.js",
  type: "blob" | "tree",
  path: "src/components/filename.js",
  children: {} // for folders
}
```

### State Management
- `fileTreeData`: Stores the hierarchical tree structure
- `expandedFolders`: Set of currently expanded folder paths
- Persists expansion state during session

### File Type Icons
Supports 20+ file types with custom icons:
- JavaScript/TypeScript (📜/📘)
- React (⚛️)
- Python (🐍)
- JSON (📋)
- Markdown (📝)
- CSS/SCSS (🎨)
- And more...

## Benefits

1. **Quick Navigation**: Browse files without leaving the extension
2. **Context Awareness**: See repository structure while asking questions
3. **Better UX**: Familiar VS Code-like interface
4. **Efficient**: Single API call loads entire tree
5. **Integrated**: Works seamlessly with existing Summary and Q&A features

## Future Enhancements

Potential improvements:
- File preview on hover
- Copy file path to clipboard
- Filter by file type
- Show file sizes
- Display last commit info
- Keyboard navigation
- Drag & drop to query specific files
- Integration with Q&A (auto-fill folder path)
