# 🚀 Chrome Extension Setup Checklist

Follow this checklist to get your GitHub Repo Assistant up and running!

## ✅ Backend Setup

- [ ] **Get API Keys**
  - [ ] Groq API key from https://console.groq.com (FREE)
  - [ ] Pinecone API key from https://www.pinecone.io (FREE tier)
  - [ ] OpenAI API key from https://platform.openai.com (Optional)

- [ ] **Create Pinecone Index**
  - [ ] Log into Pinecone dashboard
  - [ ] Create new index named: `github-code-search`
  - [ ] Set dimensions: `1536`
  - [ ] Set metric: `cosine`

- [ ] **Configure Backend**
  - [ ] Create `.env` file in `Gtihub` folder
  - [ ] Copy contents from `.env.example`
  - [ ] Add your Groq API key
  - [ ] Add your Pinecone API key and environment
  - [ ] Add your OpenAI API key (if using)

- [ ] **Install and Start**
  - [ ] Run `npm install` in backend folder
  - [ ] Run `npm run dev` to start server
  - [ ] Verify server starts without errors
  - [ ] Visit http://localhost:3000/api/v1/health
  - [ ] Should see "ok" or health status

## ✅ Extension Setup

- [ ] **Install in Chrome**
  - [ ] Open Chrome browser
  - [ ] Go to `chrome://extensions/`
  - [ ] Enable "Developer mode" (top-right toggle)
  - [ ] Click "Load unpacked"
  - [ ] Select the `chrome-extension` folder
  - [ ] Extension icon appears in toolbar

- [ ] **Configure Extension**
  - [ ] Click extension icon
  - [ ] Click settings button (⚙️)
  - [ ] Verify API URL: `http://localhost:3000/api/v1`
  - [ ] Click "Test Connection"
  - [ ] See "✓ Connection successful!"
  - [ ] Click "Save Settings"

## ✅ Test Extension

- [ ] **First Test**
  - [ ] Go to https://github.com/vercel/next.js
  - [ ] Click extension icon
  - [ ] See repository name displayed
  - [ ] Click "Analyze Repository"
  - [ ] Wait for progress bar to complete
  - [ ] See AI-generated summary

- [ ] **Test Q&A**
  - [ ] Switch to "Q&A" tab
  - [ ] Type: "What is this repository about?"
  - [ ] Click "Ask Question"
  - [ ] See answer with source references

## 🎉 Success Criteria

- ✅ Backend server running without errors
- ✅ Extension installed and visible in Chrome
- ✅ Connection test passes
- ✅ Can analyze a repository
- ✅ Can ask questions and get answers
- ✅ Sources are displayed with answers

## 🔧 If Something Doesn't Work

### Backend Issues
- Check `.env` file has all required keys
- Verify Pinecone index exists and is named correctly
- Check terminal for error messages
- Try restarting: Ctrl+C, then `npm run dev`

### Extension Issues
- Reload extension at `chrome://extensions/`
- Check browser console (F12) for errors
- Verify API URL in settings
- Try test connection again
- Ensure backend is running

### Still Stuck?
- Check `SETUP_CHROME_EXTENSION.md` for detailed troubleshooting
- Review backend logs for specific errors
- Verify all API keys are active and have credits

---

**Estimated Setup Time:** 5-10 minutes  
**Note:** Redis is NOT required! System uses in-memory cache automatically.