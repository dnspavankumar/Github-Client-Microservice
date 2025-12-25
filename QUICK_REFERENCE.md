# 🚀 Quick Reference Card

## Essential Commands

### Backend
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Check for errors
npm run lint
```

### Navigate to folders
```bash
# Backend
cd C:\Users\HP\Downloads\Gtihub

# Extension
cd C:\Users\HP\Downloads\Gtihub\chrome-extension
```

## Important URLs

### Local Development
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/v1/health
- **API Root:** http://localhost:3000/api/v1

### Chrome Extension
- **Extensions Page:** chrome://extensions/
- **Extension Settings:** Right-click extension icon → Options

### Get API Keys
- **Groq (FREE):** https://console.groq.com
- **Pinecone (FREE tier):** https://www.pinecone.io
- **OpenAI (Optional):** https://platform.openai.com

## File Locations

### Must Create
```
Gtihub\.env                    # Your API keys (copy from .env.example)
```

### Must Generate
```
chrome-extension\icons\icon16.png
chrome-extension\icons\icon32.png
chrome-extension\icons\icon48.png
chrome-extension\icons\icon128.png
```

## Required .env Variables

```env
GROQ_API_KEY=your_key_here
PINECONE_API_KEY=your_key_here
PINECONE_ENVIRONMENT=your_env_here
PINECONE_INDEX_NAME=github-code-search
```

## API Endpoints

### Ingest Repository
```
POST /api/v1/ingest
Body: { "repoUrl": "https://github.com/user/repo", "branch": "main" }
```

### Check Status
```
GET /api/v1/status/:jobId
```

### Query Repository
```
POST /api/v1/query
Body: { "repoId": "user/repo", "query": "your question" }
```

### Health Check
```
GET /api/v1/health
```

## Extension Keyboard Shortcuts

- **Open Extension:** `Alt + Shift + A` (on GitHub pages)
- **Ask Question:** `Ctrl + Enter` (in query input)
- **Save Settings:** `Ctrl + S` (in options page)
- **Test Connection:** `Ctrl + T` (in options page)

## Common Issues & Quick Fixes

### Backend won't start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process if needed (replace PID)
taskkill /PID <pid_number> /F

# Or change port in .env
PORT=3001
```

### Extension not connecting
1. Check backend is running
2. Visit http://localhost:3000/api/v1/health
3. Check extension settings API URL
4. Click "Test Connection" in settings

### Missing icons error
```bash
# Open in browser
chrome-extension\icons\generate-icons.html

# Download all 4 sizes and save in icons folder
```

### Pinecone errors
1. Log into Pinecone dashboard
2. Create index: `github-code-search`
3. Set dimensions: `1536`
4. Set metric: `cosine`

## Status Indicators

### Backend
- ✅ "Server started" = Running
- ✅ "Services initialized" = Ready
- ✅ "Using in-memory cache" = Redis not needed

### Extension
- 🟢 Green dot = Connected
- 🔴 Red dot = Not connected
- ✓ Badge on icon = On GitHub repo page

## Typical Workflow

1. Start backend: `npm run dev`
2. Open GitHub repo in Chrome
3. Click extension icon
4. Click "Analyze Repository"
5. Wait for completion (~1-5 min)
6. View summary
7. Switch to Q&A tab
8. Ask questions!

## Testing Repositories

### Good for Testing (Small, Fast)
- https://github.com/sindresorhus/got
- https://github.com/chalk/chalk
- https://github.com/tj/commander.js

### Medium Size
- https://github.com/expressjs/express
- https://github.com/axios/axios

### Large (Will take time)
- https://github.com/vercel/next.js
- https://github.com/facebook/react

## Example Questions

- "What is this repository about?"
- "How does the main feature work?"
- "What testing framework is used?"
- "Explain the project structure"
- "Where is error handling implemented?"
- "What are the main dependencies?"

## Logs & Debugging

### View Backend Logs
Terminal where `npm run dev` is running

### View Extension Logs
1. Go to chrome://extensions/
2. Click "Inspect views: service worker"
3. Or right-click extension → Inspect popup

### Enable Debug Mode
```env
# In .env file
LOG_LEVEL=debug
```

## Storage Limits

### Pinecone Free Tier
- 1 index
- 100,000 vectors
- ~1,000 small repos

### Groq Free Tier
- 14,400 requests/day
- Plenty for personal use

### Chrome Extension
- Local storage: ~5MB
- Sync storage: ~100KB

## Important Notes

- ⚠️ Redis is NOT required
- ⚠️ First analysis takes longer (downloads repo)
- ⚠️ Subsequent queries are instant
- ⚠️ Large repos may take 2-5 minutes
- ⚠️ Free tier limits apply

## Emergency Reset

### Clear Extension Data
1. Open extension options
2. Scroll to "Storage Management"
3. Click "Clear All Data"

### Clear Backend Cache
```bash
# Delete cache folder
rm -rf cache

# Or on Windows
rmdir /s cache
```

### Restart Everything
```bash
# Stop backend
Ctrl + C

# Clear node modules (if needed)
rm -rf node_modules
npm install

# Restart
npm run dev
```

## Version Info
- Extension Version: 1.0.0
- Node.js Required: >=18.0.0
- Chrome Manifest: V3

## Documentation Files
- `SETUP_CHROME_EXTENSION.md` - Full setup guide
- `CHECKLIST.md` - Setup checklist
- `SUMMARY.md` - System overview
- `README.md` - Backend docs
- `chrome-extension/README.md` - Extension docs

---

**Pro Tip:** Bookmark this file for quick reference! 📌