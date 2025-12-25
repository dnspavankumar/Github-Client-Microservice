# Chrome Extension Setup Guide

A quick guide to get your GitHub Repo Assistant Chrome extension up and running!

## 🚀 Quick Start (5 minutes)

### Step 1: Setup Backend API Keys

You need API keys from these services:
- **Groq** (for AI responses) - Free at https://console.groq.com
- **Pinecone** (for vector storage) - Free tier at https://www.pinecone.io
- **OpenAI** (optional, for embeddings) - At https://platform.openai.com

### Step 2: Configure Backend

1. Navigate to the backend directory:
   ```bash
   cd C:\Users\HP\Downloads\Gtihub
   ```

2. Create a `.env` file with your API keys:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # Groq (Required - Free tier available)
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama3-70b-8192

   # Pinecone (Required - Free tier available)
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_ENVIRONMENT=your_environment_here
   PINECONE_INDEX_NAME=github-code-search

   # OpenAI (Optional - for embeddings)
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small

   # Storage
   CACHE_DIR=./cache
   MAX_FILE_SIZE_MB=10
   CHUNK_SIZE=1000
   CHUNK_OVERLAP=200
   ```

   **Note:** Redis is NOT required! The system will use in-memory caching automatically.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the backend:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   Server started on port 3000
   Using in-memory cache (Redis not required)
   Services initialized
   ```

5. Verify it's running by visiting: http://localhost:3000/api/v1/health

### Step 3: Install Chrome Extension

1. Open Chrome and go to: `chrome://extensions/`

2. Enable **Developer mode** (toggle in top-right corner)

3. Click **"Load unpacked"**

4. Select the folder:
   ```
   C:\Users\HP\Downloads\Gtihub\chrome-extension
   ```

5. The extension icon should appear in your Chrome toolbar! 🎉

### Step 5: Configure Extension

1. Click the extension icon in Chrome toolbar

2. Click the settings button (⚙️) or right-click → Options

3. Verify the API URL is: `http://localhost:3000/api/v1`

4. Click **"Test Connection"** - should show "✓ Connection successful!"

5. Click **"Save Settings"**

## 🎯 Using the Extension

### Analyze a Repository

1. Go to any GitHub repository (e.g., https://github.com/microsoft/vscode)

2. Click the extension icon - you'll see the repo name and branch

3. Click **"Analyze Repository"**

4. Wait for analysis to complete (shows progress bar)

5. View the AI-generated summary!

### Ask Questions

1. Switch to the **"Q&A"** tab

2. Type a question like:
   - "How does authentication work?"
   - "What testing framework is used?"
   - "Explain the main architecture"

3. Click **"Ask Question"** or press Ctrl+Enter

4. View answer with source code references!

## 🔧 Troubleshooting

### Backend won't start

**Error:** `GROQ_API_KEY is required`
- Solution: Add your Groq API key to `.env` file

**Error:** `PINECONE_API_KEY is required`
- Solution: Add your Pinecone API key to `.env` file

**Error:** Port 3000 already in use
- Solution: Change PORT in `.env` to another port (e.g., 3001)
- Update extension settings with new URL

### Extension shows "Not connected"

1. Ensure backend is running (`npm run dev`)
2. Check URL in extension settings
3. Visit http://localhost:3000/api/v1/health in browser
4. Check browser console for errors (F12)

### Analysis gets stuck

1. Check backend terminal for errors
2. Verify API keys are valid
3. Try a smaller repository first
4. Check Pinecone index exists in your dashboard

## 📝 Required API Keys

### 1. Groq (Required - FREE)
- Sign up: https://console.groq.com
- Go to API Keys section
- Create a new API key
- Free tier: 14,400 requests/day

### 2. Pinecone (Required - FREE)
- Sign up: https://www.pinecone.io
- Create a new index named `github-code-search`
- Dimension: 1536 (for OpenAI embeddings)
- Metric: cosine
- Free tier: 1 index, 100K vectors

### 3. OpenAI (Optional)
- Sign up: https://platform.openai.com
- Create API key in API section
- Required for embeddings if not using alternatives
- Pay-as-you-go pricing

## 🎁 Features

- ✅ No Redis required (uses in-memory cache)
- ✅ Works with any public GitHub repository
- ✅ AI-powered summaries
- ✅ Context-aware Q&A
- ✅ Source code attribution
- ✅ Query history
- ✅ Folder-scoped search
- ✅ Visual progress tracking

## 💡 Tips

- Start with smaller repositories to test
- Analysis time depends on repository size
- Larger repos may take 2-5 minutes
- Query history is saved locally
- Use folder scope for specific queries
- Copy answers with 📋 button

## 🆘 Need Help?

1. Check backend logs for detailed errors
2. Enable debug logging: Set `LOG_LEVEL=debug` in `.env`
3. Check browser console (F12) for extension errors
4. Verify all API keys are valid and have credits

## 📚 Next Steps

Once everything is working:
1. Try analyzing different repositories
2. Ask various types of questions
3. Use folder scoping for specific queries
4. Export your Q&A sessions
5. Customize the extension popup CSS

Enjoy your AI-powered GitHub assistant! 🚀