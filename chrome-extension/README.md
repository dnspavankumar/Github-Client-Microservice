# GitHub Repo Assistant - Chrome Extension

An AI-powered Chrome extension that provides intelligent summaries and Q&A capabilities for any GitHub repository you're viewing.

## Features

- 🤖 **AI-Powered Summaries**: Automatically analyze and summarize any GitHub repository
- 💬 **Intelligent Q&A**: Ask questions about the codebase and get context-aware answers
- 📁 **VS Code-Style Sidebar**: Browse repository files with a collapsible tree view directly on GitHub pages
- 🔍 **Scoped Search**: Query specific folders or the entire repository
- 📚 **Query History**: Keep track of your previous questions and answers
- 🎯 **Source Attribution**: See exactly which files contributed to each answer
- ⚡ **Real-time Analysis**: Process repositories on-demand with visual progress tracking
- 🔒 **Privacy-Focused**: All data processed through your own backend instance

## Prerequisites

Before using this extension, you need to have the GitHub RAG microservice backend running. The backend handles:
- Repository cloning and analysis
- Code embedding generation
- Vector storage (Pinecone)
- AI query processing (OpenAI)

### Backend Setup

1. Navigate to the microservice directory:
   ```bash
   cd path/to/Gtihub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with required credentials:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Pinecone
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX_NAME=github-code-search

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # Storage
   CACHE_DIR=./cache
   MAX_FILE_SIZE_MB=10
   CHUNK_SIZE=1000
   CHUNK_OVERLAP=200
   ```

4. Ensure Redis is running locally or update the Redis configuration

5. Start the backend:
   ```bash
   npm run dev
   ```

6. Verify the backend is running by visiting: http://localhost:3000/api/v1/health

## Extension Installation

### Load Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`

2. Enable "Developer mode" (toggle in top-right corner)

3. Click "Load unpacked"

4. Select the `chrome-extension` directory from this project

5. The extension icon should appear in your Chrome toolbar

### Configure the Extension

1. Click the extension icon in the toolbar

2. Click the settings button (⚙️) or right-click the extension icon and select "Options"

3. Enter your backend API URL (default: `http://localhost:3000/api/v1`)

4. Click "Test Connection" to verify the backend is reachable

5. Click "Save Settings"

## Usage

### File Explorer Sidebar

When you visit any GitHub repository, a VS Code-style sidebar automatically appears on the left side of the page:

1. **Browse Files**: The sidebar shows the complete repository file tree
   - Click folders to expand/collapse them
   - Click files to navigate to them on GitHub
   - Folder and file icons for easy identification

2. **Search Files**: Use the search box at the top to filter files by name or path
   - Real-time filtering as you type
   - Matches anywhere in the file path

3. **Toggle Sidebar**: 
   - Click the collapse button (◀) in the sidebar header to hide it
   - Click the toggle button on the left edge to show it again
   - Your preference is saved automatically

4. **Refresh**: Click the refresh button (🔄) to reload the file tree

### Analyzing a Repository

1. Navigate to any GitHub repository in Chrome (e.g., https://github.com/microsoft/vscode)

2. Click the extension icon in the toolbar

3. You'll see the repository information displayed at the top

4. Click "Analyze Repository" to start the ingestion process

5. Wait for the analysis to complete (progress bar will show status)

6. Once complete, you'll see an AI-generated summary of the repository

### Asking Questions

1. After a repository has been analyzed, switch to the "Q&A" tab

2. Type your question in the input field, for example:
   - "How does authentication work in this project?"
   - "What testing framework is used?"
   - "Explain the architecture of this application"
   - "Where is the database schema defined?"

3. (Optional) Select a scope:
   - **Full Repository**: Search across all files
   - **Specific Folder**: Limit search to a particular directory (e.g., `src/auth`)

4. Click "Ask Question" or press Ctrl+Enter

5. View the AI-generated answer along with relevant source files

### Additional Features

- **Copy to Clipboard**: Use the 📋 button to copy summaries or answers
- **Query History**: View your recent questions in the Q&A tab
- **Floating Button**: A floating "AI Assistant" button appears on GitHub pages for quick access
- **Keyboard Shortcut**: Press `Alt+Shift+A` while on a GitHub page to open the extension

## Extension Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup logic and API calls
├── sidebar.html          # Sidebar HTML template
├── sidebar.css           # Sidebar styling
├── sidebar.js            # Sidebar logic and file tree
├── background.js         # Background service worker
├── content.js            # Content script for GitHub pages
├── options.html          # Settings page
├── options.js            # Settings page logic
├── icons/                # Extension icons
└── README.md            # This file
```

## API Endpoints Used

The extension communicates with the following backend endpoints:

- `POST /api/v1/ingest` - Start repository ingestion
- `GET /api/v1/status/:jobId` - Check ingestion progress
- `POST /api/v1/query` - Query the repository
- `GET /api/v1/health` - Health check
- `DELETE /api/v1/repo/:repoId` - Delete repository data

## Troubleshooting

### Extension shows "Not connected"

- Ensure the backend server is running (`npm run dev`)
- Check that the API URL in settings is correct
- Verify Redis and required services are running
- Check browser console for error messages

### Analysis fails or gets stuck

- Check backend logs for errors
- Ensure you have valid API keys (OpenAI, Pinecone)
- Verify Redis is accessible
- Check that the repository is public or you have access

### Queries return errors

- Ensure the repository has been fully analyzed first
- Check that Pinecone index exists and is accessible
- Verify OpenAI API key has sufficient credits
- Try refreshing the extension and retrying

### "CORS" errors in console

- The backend should have CORS enabled (already configured in the microservice)
- If using a custom backend URL, ensure CORS is properly configured

## Storage Management

The extension stores:
- **Ingested Repositories**: Tracks which repos have been analyzed
- **Query History**: Stores recent questions and answers (last 20)
- **Settings**: API URL and configuration

To clear data:
1. Open extension options (Settings)
2. Scroll to "Storage Management"
3. Choose what to clear:
   - Query History
   - Repository Cache
   - All Data

## Privacy & Security

- All analysis happens through your own backend instance
- No data is sent to third parties except:
  - OpenAI (for embeddings and completions)
  - Pinecone (for vector storage)
  - GitHub (for repository access)
- API keys are stored securely in your backend `.env` file
- Chrome storage is used only for caching metadata

## Limitations

- Requires the backend to be running locally or accessible
- Large repositories may take several minutes to analyze
- Subject to OpenAI API rate limits and costs
- Pinecone free tier has storage and query limits

## Development

### Making Changes

1. Edit the extension files as needed
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload any GitHub pages to see changes

### Testing

- Test on various repository sizes
- Verify error handling and edge cases
- Check console logs for debugging info
- Use the "Test Connection" feature in settings

## Future Enhancements

- [ ] Support for private repositories (GitHub token integration)
- [ ] Syntax-highlighted code snippets in answers
- [ ] Export summaries and Q&A to Markdown
- [ ] Support for multiple LLM providers
- [ ] Offline mode with local embeddings
- [ ] Repository comparison features
- [ ] Code snippet search and explanation

## License

MIT License - see main project LICENSE file

## Support

For issues related to:
- **Extension UI/UX**: Check this README and extension code
- **Backend API**: See the main project README and backend logs
- **AI Responses**: Check OpenAI API status and your API key

## Credits

Built with:
- Chrome Extensions Manifest V3
- GitHub RAG Microservice backend
- OpenAI API
- Pinecone Vector Database
- Redis Cache