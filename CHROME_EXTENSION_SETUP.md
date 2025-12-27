# Chrome Extension Setup with Deployed Backend

## Backend Status
✅ Your backend is running at: `https://github-client-microservice-evqm.onrender.com`
✅ Health check is working: `/api/v1/health` returns healthy status

## Steps to Fix "Not Connected" Issue

### 1. Redeploy Backend with Updated CORS
The CORS configuration has been updated in `src/server.ts` to allow Chrome extension requests.

**You need to redeploy your backend to Render:**
- Push the changes to your Git repository
- Render will automatically redeploy
- Or manually trigger a deploy from Render dashboard

### 2. Reload Chrome Extension
After updating the extension files, you must reload it:

1. Open Chrome and go to `chrome://extensions/`
2. Find "GitHub Repo Assistant"
3. Click the **Reload** button (circular arrow icon)
4. Or toggle it off and on again

### 3. Clear Extension Storage (Optional)
If still having issues:
1. Right-click the extension icon
2. Select "Inspect popup"
3. In DevTools Console, run:
   ```javascript
   chrome.storage.sync.clear()
   chrome.storage.local.clear()
   ```
4. Reload the extension

### 4. Test Connection
1. Click the extension icon
2. Check if status shows "Connected" at the bottom
3. If not, click the settings icon (⚙️)
4. Click "Test Connection" button
5. Check browser console for any error messages

## Troubleshooting

### Check Browser Console
1. Right-click extension icon → "Inspect popup"
2. Look for errors in Console tab
3. Check Network tab for failed requests

### Common Issues

**CORS Error:**
- Make sure backend is redeployed with new CORS config
- Check Network tab for CORS-related errors

**Network Error:**
- Verify backend URL is correct: `https://github-client-microservice-evqm.onrender.com/api/v1`
- Test health endpoint directly: `https://github-client-microservice-evqm.onrender.com/api/v1/health`

**Extension Not Loading:**
- Make sure all files are in `chrome-extension` folder
- Check for JavaScript errors in console
- Verify manifest.json is valid

## Updated Files
The following files now use the deployed backend URL:
- ✅ `chrome-extension/background.js`
- ✅ `chrome-extension/popup.js`
- ✅ `chrome-extension/options.js`

## Backend CORS Configuration
Updated to allow:
- ✅ Chrome extensions (`chrome-extension://`)
- ✅ Localhost (`http://localhost`)
- ✅ HTTPS requests
- ✅ All origins (for development)

## Next Steps
1. **Commit and push backend changes** (CORS update in `src/server.ts`)
2. **Wait for Render to redeploy** (or trigger manual deploy)
3. **Reload Chrome extension**
4. **Test the connection**
