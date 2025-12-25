// Background service worker for GitHub Repo Assistant

const API_BASE_URL = "http://localhost:3000/api/v1";

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("GitHub Repo Assistant installed");

    // Set default settings
    chrome.storage.sync.set({
      apiUrl: API_BASE_URL,
    });

    // Open options page
    chrome.runtime.openOptionsPage();
  } else if (details.reason === "update") {
    console.log("GitHub Repo Assistant updated");
  }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getRepoInfo") {
    // Extract repo info from current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const repoInfo = extractGitHubInfo(tabs[0].url);
        sendResponse({ repoInfo });
      } else {
        sendResponse({ repoInfo: null });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === "checkApiHealth") {
    // Check if API is reachable
    checkApiHealth().then((healthy) => {
      sendResponse({ healthy });
    });
    return true;
  }

  if (request.action === "openOptions") {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "notification") {
    // Show notification with a simple data URL icon
    chrome.notifications.create({
      type: "basic",
      iconUrl:
        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%232da44e' width='100' height='100'/><text x='50' y='50' font-size='50' text-anchor='middle' dominant-baseline='central' fill='white'>🤖</text></svg>",
      title: request.title || "GitHub Repo Assistant",
      message: request.message,
      priority: 2,
    });
    sendResponse({ success: true });
    return true;
  }
});

// Handle tab updates to detect GitHub navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const repoInfo = extractGitHubInfo(tab.url);

    if (repoInfo) {
      // Update badge to show we're on a GitHub repo
      chrome.action.setBadgeText({ text: "✓", tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#2da44e", tabId });
    } else {
      // Clear badge if not on GitHub
      chrome.action.setBadgeText({ text: "", tabId });
    }
  }
});

// Handle tab activation to update badge
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);

  if (tab.url) {
    const repoInfo = extractGitHubInfo(tab.url);

    if (repoInfo) {
      chrome.action.setBadgeText({ text: "✓", tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({
        color: "#2da44e",
        tabId: tab.id,
      });
    } else {
      chrome.action.setBadgeText({ text: "", tabId: tab.id });
    }
  }
});

// Extract GitHub repository information from URL
function extractGitHubInfo(url) {
  if (!url) return null;

  const githubPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
  const match = url.match(githubPattern);

  if (!match) return null;

  const owner = match[1];
  const repo = match[2].split("?")[0].replace(/\.git$/, "");

  // Try to extract branch from URL
  const branchPattern = /\/tree\/([^\/]+)/;
  const branchMatch = url.match(branchPattern);
  const branch = branchMatch ? branchMatch[1] : "main";

  return {
    owner,
    repo,
    branch,
    repoId: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`,
  };
}

// Check API health
async function checkApiHealth() {
  try {
    const settings = await chrome.storage.sync.get(["apiUrl"]);
    const apiUrl = settings.apiUrl || API_BASE_URL;

    const response = await fetch(`${apiUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
}

// Periodic health check (every 5 minutes)
setInterval(() => {
  checkApiHealth().then((healthy) => {
    if (!healthy) {
      console.warn("API is not reachable");
    }
  });
}, 300000);

// Handle storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.apiUrl) {
    console.log("API URL updated:", changes.apiUrl.newValue);
  }
});

// Clean up old data periodically (once per day)
const ONE_DAY = 24 * 60 * 60 * 1000;

setInterval(() => {
  cleanupOldData();
}, ONE_DAY);

async function cleanupOldData() {
  try {
    const result = await chrome.storage.local.get([
      "queryHistory",
      "ingestedRepos",
    ]);

    // Clean up query history older than 30 days
    if (result.queryHistory) {
      const thirtyDaysAgo = Date.now() - 30 * ONE_DAY;
      const filteredHistory = result.queryHistory.filter((item) => {
        return new Date(item.timestamp).getTime() > thirtyDaysAgo;
      });

      if (filteredHistory.length < result.queryHistory.length) {
        await chrome.storage.local.set({ queryHistory: filteredHistory });
        console.log("Cleaned up old query history");
      }
    }

    // Clean up ingested repos older than 7 days
    if (result.ingestedRepos) {
      const sevenDaysAgo = Date.now() - 7 * ONE_DAY;
      const repos = result.ingestedRepos;
      let cleaned = false;

      for (const [repoId, repoData] of Object.entries(repos)) {
        if (repoData.completedAt) {
          const completedTime = new Date(repoData.completedAt).getTime();
          if (completedTime < sevenDaysAgo) {
            delete repos[repoId];
            cleaned = true;
          }
        }
      }

      if (cleaned) {
        await chrome.storage.local.set({ ingestedRepos: repos });
        console.log("Cleaned up old ingested repos");
      }
    }
  } catch (error) {
    console.error("Error cleaning up old data:", error);
  }
}

console.log("GitHub Repo Assistant background service worker loaded");
