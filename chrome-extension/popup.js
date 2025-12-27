// Configuration
const API_BASE_URL = "https://github-client-microservice-evqm.onrender.com/api/v1";
const STORAGE_KEYS = {
  API_URL: "apiUrl",
  INGESTED_REPOS: "ingestedRepos",
  QUERY_HISTORY: "queryHistory",
};

// State
let currentRepo = null;
let currentBranch = null;
let isIngesting = false;
let pollingInterval = null;

// DOM Elements
const elements = {
  repoInfo: document.getElementById("repoInfo"),
  repoName: document.getElementById("repoName"),
  repoBranch: document.getElementById("repoBranch"),
  branchName: document.getElementById("branchName"),
  notOnGithub: document.getElementById("notOnGithub"),
  tabNav: document.getElementById("tabNav"),
  summaryTab: document.getElementById("summaryTab"),
  queryTab: document.getElementById("queryTab"),
  explorerTab: document.getElementById("explorerTab"),
  analyzBtn: document.getElementById("analyzBtn"),
  summaryResult: document.getElementById("summaryResult"),
  summaryContent: document.getElementById("summaryContent"),
  summaryStats: document.getElementById("summaryStats"),
  ingestionStatus: document.getElementById("ingestionStatus"),
  progressFill: document.getElementById("progressFill"),
  statusMessage: document.getElementById("statusMessage"),
  queryInput: document.getElementById("queryInput"),
  folderPath: document.getElementById("folderPath"),
  askBtn: document.getElementById("askBtn"),
  queryResult: document.getElementById("queryResult"),
  answerContent: document.getElementById("answerContent"),
  sources: document.getElementById("sources"),
  sourcesList: document.getElementById("sourcesList"),
  queryStats: document.getElementById("queryStats"),
  queryHistory: document.getElementById("queryHistory"),
  historyList: document.getElementById("historyList"),
  errorMessage: document.getElementById("errorMessage"),
  errorText: document.getElementById("errorText"),
  statusDot: document.getElementById("statusDot"),
  statusLabel: document.getElementById("statusLabel"),
  settingsBtn: document.getElementById("settingsBtn"),
  copySummary: document.getElementById("copySummary"),
  copyAnswer: document.getElementById("copyAnswer"),
  fileTree: document.getElementById("fileTree"),
  fileSearch: document.getElementById("fileSearch"),
  refreshTree: document.getElementById("refreshTree"),
  explorerLoading: document.getElementById("explorerLoading"),
  explorerEmpty: document.getElementById("explorerEmpty"),
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await checkConnection();
  await getCurrentTab();
  setupEventListeners();
  loadQueryHistory();
});

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.API_URL]);
  if (result[STORAGE_KEYS.API_URL]) {
    // Use custom API URL if set
    API_BASE_URL = result[STORAGE_KEYS.API_URL];
  }
}

// Check API connection
async function checkConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      setConnectionStatus(true);
    } else {
      setConnectionStatus(false);
    }
  } catch (error) {
    setConnectionStatus(false);
  }
}

// Set connection status
function setConnectionStatus(connected) {
  if (connected) {
    elements.statusDot.classList.add("connected");
    elements.statusDot.classList.remove("error");
    elements.statusLabel.textContent = "Connected";
  } else {
    elements.statusDot.classList.remove("connected");
    elements.statusDot.classList.add("error");
    elements.statusLabel.textContent = "Not connected";
  }
}

// Get current tab and extract GitHub repo info
async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab || !tab.url) {
      showNotOnGithub();
      return;
    }

    const repoInfo = extractGitHubInfo(tab.url);

    if (repoInfo) {
      currentRepo = `${repoInfo.owner}/${repoInfo.repo}`;
      currentBranch = repoInfo.branch || "main";
      showRepoInfo();
      await checkRepoStatus();
    } else {
      showNotOnGithub();
    }
  } catch (error) {
    console.error("Error getting current tab:", error);
    showNotOnGithub();
  }
}

// Extract GitHub info from URL
function extractGitHubInfo(url) {
  const githubPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
  const match = url.match(githubPattern);

  if (!match) return null;

  const owner = match[1];
  const repo = match[2].split("?")[0].replace(/\.git$/, "");

  // Try to extract branch from URL
  const branchPattern = /\/tree\/([^\/]+)/;
  const branchMatch = url.match(branchPattern);
  const branch = branchMatch ? branchMatch[1] : "main";

  return { owner, repo, branch };
}

// Show repository info
function showRepoInfo() {
  elements.notOnGithub.classList.add("hidden");
  elements.repoInfo.classList.remove("hidden");
  elements.tabNav.classList.remove("hidden");
  elements.repoName.textContent = currentRepo;
  elements.branchName.textContent = currentBranch;
  elements.repoBranch.classList.remove("hidden");
}

// Show not on GitHub message
function showNotOnGithub() {
  elements.repoInfo.classList.add("hidden");
  elements.tabNav.classList.add("hidden");
  elements.notOnGithub.classList.remove("hidden");
  elements.summaryTab.innerHTML = "";
  elements.queryTab.innerHTML = "";
}

// Check if repo is already ingested
async function checkRepoStatus() {
  const result = await chrome.storage.local.get([STORAGE_KEYS.INGESTED_REPOS]);
  const ingestedRepos = result[STORAGE_KEYS.INGESTED_REPOS] || {};

  if (ingestedRepos[currentRepo]) {
    const repoData = ingestedRepos[currentRepo];
    if (repoData.status === "completed") {
      // Repo already analyzed
      elements.analyzBtn.querySelector(".btn-text").textContent =
        "Re-analyze Repository";
      elements.askBtn.disabled = false;
    } else if (repoData.status === "processing" && repoData.jobId) {
      // Verify the job still exists before polling
      try {
        const response = await fetch(
          `${API_BASE_URL}/status/${repoData.jobId}`,
        );
        if (response.ok) {
          // Job exists, continue polling
          startPolling(repoData.jobId);
        } else {
          // Job doesn't exist, clear stale data
          console.log("Stale job ID found, clearing...");
          await saveRepoStatus(currentRepo, {
            status: "failed",
            error: "Job not found",
          });
        }
      } catch (error) {
        console.error("Error checking job status:", error);
        // Clear stale data on error
        await saveRepoStatus(currentRepo, {
          status: "failed",
          error: "Connection error",
        });
      }
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Analyze button
  elements.analyzBtn.addEventListener("click", analyzeRepository);

  // Query input
  elements.queryInput.addEventListener("input", () => {
    elements.askBtn.disabled = !elements.queryInput.value.trim();
  });

  // Ask button
  elements.askBtn.addEventListener("click", askQuestion);

  // Scope radio buttons
  document.querySelectorAll('input[name="scope"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "folder") {
        elements.folderPath.classList.remove("hidden");
      } else {
        elements.folderPath.classList.add("hidden");
      }
    });
  });

  // Settings button
  elements.settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Copy buttons
  elements.copySummary.addEventListener("click", () => {
    copyToClipboard(elements.summaryContent.textContent);
  });

  elements.copyAnswer.addEventListener("click", () => {
    copyToClipboard(elements.answerContent.textContent);
  });

  // Enter key in query input
  elements.queryInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      askQuestion();
    }
  });

  // Explorer tab
  elements.refreshTree.addEventListener("click", loadFileTree);
  
  elements.fileSearch.addEventListener("input", (e) => {
    filterFileTree(e.target.value);
  });
}

// Switch tabs
function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  elements.summaryTab.classList.toggle("hidden", tabName !== "summary");
  elements.queryTab.classList.toggle("hidden", tabName !== "query");
  elements.explorerTab.classList.toggle("hidden", tabName !== "explorer");

  // Load file tree when explorer tab is opened
  if (tabName === "explorer" && currentRepo) {
    if (elements.fileTree.children.length === 0) {
      loadFileTree();
    }
  }
}

// Analyze repository
async function analyzeRepository() {
  if (isIngesting) return;

  hideError();
  elements.summaryResult.classList.add("hidden");
  elements.ingestionStatus.classList.remove("hidden");
  setButtonLoading(elements.analyzBtn, true);
  isIngesting = true;

  try {
    const repoUrl = `https://github.com/${currentRepo}`;

    const response = await fetch(`${API_BASE_URL}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repoUrl,
        branch: currentBranch,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Save job info
    await saveRepoStatus(currentRepo, {
      jobId: data.jobId,
      status: "processing",
      repoId: data.repoId,
      startedAt: new Date().toISOString(),
    });

    // Start polling for status
    startPolling(data.jobId);
  } catch (error) {
    console.error("Error analyzing repository:", error);
    showError(`Failed to analyze repository: ${error.message}`);
    elements.ingestionStatus.classList.add("hidden");
    setButtonLoading(elements.analyzBtn, false);
    isIngesting = false;
  }
}

// Start polling for ingestion status
function startPolling(jobId) {
  updateStatusMessage("Initializing...", 0);

  pollingInterval = setInterval(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/status/${jobId}`);

      if (!response.ok) {
        if (response.status === 404) {
          // Job not found - stop polling and clear data
          stopPolling();
          await saveRepoStatus(currentRepo, {
            status: "failed",
            error: "Job not found",
          });
          showError("Analysis job not found. Please try analyzing again.");
          elements.ingestionStatus.classList.add("hidden");
          setButtonLoading(elements.analyzBtn, false);
          isIngesting = false;
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "completed") {
        stopPolling();
        await handleIngestionComplete(data);
      } else if (data.status === "failed") {
        stopPolling();
        handleIngestionFailed(data.error);
      } else {
        const progress = data.progress || 0;
        updateStatusMessage(getStatusMessage(data), progress);
      }
    } catch (error) {
      console.error("Error polling status:", error);
      stopPolling();
      showError(`Failed to check status: ${error.message}`);
      elements.ingestionStatus.classList.add("hidden");
      setButtonLoading(elements.analyzBtn, false);
      isIngesting = false;
    }
  }, 2000); // Poll every 2 seconds
}

// Stop polling
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// Get status message based on progress
function getStatusMessage(data) {
  const progress = data.progress || 0;

  if (progress < 20) {
    return "Cloning repository...";
  } else if (progress < 40) {
    return "Analyzing files...";
  } else if (progress < 70) {
    return "Creating embeddings...";
  } else if (progress < 90) {
    return "Storing in vector database...";
  } else {
    return "Finalizing...";
  }
}

// Update status message
function updateStatusMessage(message, progress) {
  elements.statusMessage.textContent = message;
  elements.progressFill.style.width = `${progress}%`;
}

// Handle ingestion complete
async function handleIngestionComplete(data) {
  isIngesting = false;
  setButtonLoading(elements.analyzBtn, false);
  elements.ingestionStatus.classList.add("hidden");

  // Save completed status
  await saveRepoStatus(currentRepo, {
    jobId: data.jobId,
    status: "completed",
    repoId: data.repoId,
    completedAt: new Date().toISOString(),
    stats: data.stats,
  });

  // Enable query functionality
  elements.askBtn.disabled = false;

  // Generate summary
  await generateSummary(data);
}

// Handle ingestion failed
function handleIngestionFailed(error) {
  isIngesting = false;
  setButtonLoading(elements.analyzBtn, false);
  elements.ingestionStatus.classList.add("hidden");
  showError(`Ingestion failed: ${error || "Unknown error"}`);
}

// Generate summary
async function generateSummary(ingestionData) {
  try {
    // Query for general repository information with focus on README/docs
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repoId: currentRepo,
        query:
          "README documentation overview main features installation setup usage",
        topK: 15,
        minScore: 0.25,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Display summary
    elements.summaryContent.textContent = data.answer;
    elements.summaryResult.classList.remove("hidden");

    // Display stats
    if (ingestionData.stats || data.metadata) {
      const stats = [];

      if (ingestionData.stats?.filesProcessed) {
        stats.push(`📄 ${ingestionData.stats.filesProcessed} files`);
      }
      if (ingestionData.stats?.chunksCreated) {
        stats.push(`📦 ${ingestionData.stats.chunksCreated} chunks`);
      }
      if (data.metadata?.tokensUsed) {
        stats.push(`🔤 ${data.metadata.tokensUsed} tokens`);
      }
      if (data.metadata?.latencyMs) {
        stats.push(`⚡ ${data.metadata.latencyMs}ms`);
      }

      if (stats.length > 0) {
        elements.summaryStats.innerHTML = stats
          .map((s) => `<div class="stat-item">${s}</div>`)
          .join("");
        elements.summaryStats.classList.remove("hidden");
      }
    }
  } catch (error) {
    console.error("Error generating summary:", error);
    showError(`Failed to generate summary: ${error.message}`);
  }
}

// Ask question
async function askQuestion() {
  const query = elements.queryInput.value.trim();

  if (!query) return;

  hideError();
  elements.queryResult.classList.add("hidden");
  setButtonLoading(elements.askBtn, true);

  try {
    const scopeType = document.querySelector(
      'input[name="scope"]:checked',
    ).value;
    const requestBody = {
      repoId: currentRepo,
      query,
      topK: 10,
      minScore: 0.25,
    };

    if (scopeType === "folder" && elements.folderPath.value.trim()) {
      requestBody.scope = {
        type: "folder",
        path: elements.folderPath.value.trim(),
      };
    }

    const response = await fetch(`${API_BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Display answer
    elements.answerContent.textContent = data.answer;
    elements.queryResult.classList.remove("hidden");

    // Display sources
    if (data.sources && data.sources.length > 0) {
      elements.sourcesList.innerHTML = data.sources
        .map(
          (source) => `
        <div class="source-item">
          <div class="source-file">
            📄 ${source.file}
            <span class="source-score">${(source.score * 100).toFixed(0)}%</span>
          </div>
          <div class="source-chunk">${escapeHtml(source.chunk || source.content || "")}</div>
        </div>
      `,
        )
        .join("");
      elements.sources.classList.remove("hidden");
    }

    // Display stats
    if (data.metadata) {
      const stats = [];
      if (data.metadata.tokensUsed) {
        stats.push(
          `<div class="stat-item">🔤 ${data.metadata.tokensUsed} tokens</div>`,
        );
      }
      if (data.metadata.latencyMs) {
        stats.push(
          `<div class="stat-item">⚡ ${data.metadata.latencyMs}ms</div>`,
        );
      }
      if (stats.length > 0) {
        elements.queryStats.innerHTML = stats.join("");
        elements.queryStats.classList.remove("hidden");
      }
    }

    // Save to history
    await saveToHistory(query, data.answer);
    loadQueryHistory();
  } catch (error) {
    console.error("Error asking question:", error);
    showError(`Failed to get answer: ${error.message}`);
  } finally {
    setButtonLoading(elements.askBtn, false);
  }
}

// Save repository status
async function saveRepoStatus(repoId, status) {
  const result = await chrome.storage.local.get([STORAGE_KEYS.INGESTED_REPOS]);
  const ingestedRepos = result[STORAGE_KEYS.INGESTED_REPOS] || {};

  ingestedRepos[repoId] = {
    ...ingestedRepos[repoId],
    ...status,
  };

  await chrome.storage.local.set({
    [STORAGE_KEYS.INGESTED_REPOS]: ingestedRepos,
  });
}

// Save to query history
async function saveToHistory(query, answer) {
  const result = await chrome.storage.local.get([STORAGE_KEYS.QUERY_HISTORY]);
  const history = result[STORAGE_KEYS.QUERY_HISTORY] || [];

  history.unshift({
    repo: currentRepo,
    query,
    answer,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 20 items
  if (history.length > 20) {
    history.splice(20);
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.QUERY_HISTORY]: history,
  });
}

// Load query history
async function loadQueryHistory() {
  if (!currentRepo) return;

  const result = await chrome.storage.local.get([STORAGE_KEYS.QUERY_HISTORY]);
  const history = result[STORAGE_KEYS.QUERY_HISTORY] || [];

  const repoHistory = history
    .filter((item) => item.repo === currentRepo)
    .slice(0, 5);

  if (repoHistory.length > 0) {
    elements.historyList.innerHTML = repoHistory
      .map(
        (item, index) => `
      <div class="history-item" data-index="${index}">
        <div class="history-question">${escapeHtml(item.query)}</div>
        <div class="history-time">${formatTime(item.timestamp)}</div>
      </div>
    `,
      )
      .join("");

    elements.historyList
      .querySelectorAll(".history-item")
      .forEach((item, index) => {
        item.addEventListener("click", () => {
          elements.queryInput.value = repoHistory[index].query;
          elements.askBtn.disabled = false;
        });
      });

    elements.queryHistory.classList.remove("hidden");
  } else {
    elements.queryHistory.classList.add("hidden");
  }
}

// Show error
function showError(message) {
  elements.errorText.textContent = message;
  elements.errorMessage.classList.remove("hidden");
  setTimeout(() => {
    elements.errorMessage.classList.add("hidden");
  }, 5000);
}

// Hide error
function hideError() {
  elements.errorMessage.classList.add("hidden");
}

// Set button loading state
function setButtonLoading(button, loading) {
  if (loading) {
    button.classList.add("loading");
    button.disabled = true;
  } else {
    button.classList.remove("loading");
    button.disabled = false;
  }
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showError("✓ Copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
    });
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Format time
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

// ============================================
// FILE EXPLORER FUNCTIONALITY
// ============================================

let fileTreeData = null;
let expandedFolders = new Set();

// Load file tree from GitHub API
async function loadFileTree() {
  if (!currentRepo) return;

  elements.explorerLoading.classList.remove("hidden");
  elements.explorerEmpty.classList.add("hidden");
  elements.fileTree.innerHTML = "";

  try {
    const [owner, repo] = currentRepo.split("/");
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${currentBranch}?recursive=1`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.tree || data.tree.length === 0) {
      elements.explorerEmpty.classList.remove("hidden");
      elements.explorerLoading.classList.add("hidden");
      return;
    }

    // Build tree structure
    fileTreeData = buildTreeStructure(data.tree);

    // Render tree
    renderFileTree(fileTreeData);

    elements.explorerLoading.classList.add("hidden");
  } catch (error) {
    console.error("Error loading file tree:", error);
    showError(`Failed to load file tree: ${error.message}`);
    elements.explorerEmpty.classList.remove("hidden");
    elements.explorerLoading.classList.add("hidden");
  }
}

// Build hierarchical tree structure from flat GitHub tree
function buildTreeStructure(flatTree) {
  const root = { name: "", type: "tree", children: {} };

  flatTree.forEach((item) => {
    const parts = item.path.split("/");
    let current = root;

    parts.forEach((part, index) => {
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          type: index === parts.length - 1 ? item.type : "tree",
          path: parts.slice(0, index + 1).join("/"),
          children: {},
        };
      }
      current = current.children[part];
    });
  });

  return root;
}

// Render file tree
function renderFileTree(node = fileTreeData, container = elements.fileTree, level = 0) {
  if (!node || !node.children) return;

  const entries = Object.values(node.children).sort((a, b) => {
    // Folders first, then files
    if (a.type === "tree" && b.type !== "tree") return -1;
    if (a.type !== "tree" && b.type === "tree") return 1;
    return a.name.localeCompare(b.name);
  });

  entries.forEach((item) => {
    const itemElement = createTreeItem(item, level);
    container.appendChild(itemElement);

    if (item.type === "tree" && Object.keys(item.children).length > 0) {
      const childrenContainer = document.createElement("div");
      childrenContainer.className = "tree-children";
      childrenContainer.dataset.path = item.path;

      if (expandedFolders.has(item.path)) {
        childrenContainer.classList.add("expanded");
        renderFileTree(item, childrenContainer, level + 1);
      }

      container.appendChild(childrenContainer);
    }
  });
}

// Create tree item element
function createTreeItem(item, level) {
  const itemDiv = document.createElement("div");
  itemDiv.className = `tree-item ${item.type === "tree" ? "folder" : "file"}`;
  itemDiv.dataset.path = item.path;
  itemDiv.dataset.type = item.type;

  const contentDiv = document.createElement("div");
  contentDiv.className = "tree-item-content";

  // Indentation
  for (let i = 0; i < level; i++) {
    const indent = document.createElement("span");
    indent.className = "tree-indent";
    contentDiv.appendChild(indent);
  }

  // Chevron for folders
  if (item.type === "tree") {
    const chevron = document.createElement("span");
    chevron.className = "tree-chevron";
    chevron.textContent = "▶";
    if (expandedFolders.has(item.path)) {
      chevron.classList.add("expanded");
    }
    contentDiv.appendChild(chevron);
  } else {
    const spacer = document.createElement("span");
    spacer.className = "tree-indent";
    contentDiv.appendChild(spacer);
  }

  // Icon
  const icon = document.createElement("span");
  icon.className = "tree-icon";
  if (item.type === "tree") {
    icon.textContent = expandedFolders.has(item.path) ? "📂" : "📁";
  } else {
    icon.className += ` ${getFileIconClass(item.name)}`;
  }
  contentDiv.appendChild(icon);

  // Label
  const label = document.createElement("span");
  label.className = "tree-label";
  label.textContent = item.name;
  label.title = item.path;
  contentDiv.appendChild(label);

  itemDiv.appendChild(contentDiv);

  // Click handler
  itemDiv.addEventListener("click", (e) => {
    e.stopPropagation();
    handleTreeItemClick(item, itemDiv);
  });

  return itemDiv;
}

// Handle tree item click
function handleTreeItemClick(item, element) {
  if (item.type === "tree") {
    // Toggle folder
    toggleFolder(item.path);
  } else {
    // Select file and open in GitHub
    selectTreeItem(element);
    openFileInGitHub(item.path);
  }
}

// Toggle folder expansion
function toggleFolder(path) {
  if (expandedFolders.has(path)) {
    expandedFolders.delete(path);
  } else {
    expandedFolders.add(path);
  }

  // Re-render tree
  elements.fileTree.innerHTML = "";
  renderFileTree();
}

// Select tree item
function selectTreeItem(element) {
  document.querySelectorAll(".tree-item.selected").forEach((item) => {
    item.classList.remove("selected");
  });
  element.classList.add("selected");
}

// Open file in GitHub
async function openFileInGitHub(filePath) {
  const url = `https://github.com/${currentRepo}/blob/${currentBranch}/${filePath}`;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab) {
      await chrome.tabs.update(tab.id, { url });
    }
  } catch (error) {
    console.error("Error opening file:", error);
    showError("Failed to open file");
  }
}

// Get file icon class based on extension
function getFileIconClass(filename) {
  const ext = filename.split(".").pop().toLowerCase();

  const iconMap = {
    js: "file-icon-js",
    ts: "file-icon-ts",
    jsx: "file-icon-jsx",
    tsx: "file-icon-tsx",
    json: "file-icon-json",
    md: "file-icon-md",
    css: "file-icon-css",
    scss: "file-icon-scss",
    sass: "file-icon-scss",
    html: "file-icon-html",
    py: "file-icon-py",
    java: "file-icon-java",
    go: "file-icon-go",
    rs: "file-icon-rs",
    cpp: "file-icon-cpp",
    c: "file-icon-c",
    sh: "file-icon-sh",
    bash: "file-icon-sh",
    yml: "file-icon-yml",
    yaml: "file-icon-yaml",
    xml: "file-icon-xml",
    svg: "file-icon-svg",
    png: "file-icon-png",
    jpg: "file-icon-jpg",
    jpeg: "file-icon-jpg",
    gif: "file-icon-gif",
  };

  return iconMap[ext] || "file-icon-default";
}

// Filter file tree based on search
function filterFileTree(searchTerm) {
  if (!fileTreeData) return;

  const term = searchTerm.toLowerCase().trim();

  if (!term) {
    // Show all items
    document.querySelectorAll(".tree-item").forEach((item) => {
      item.style.display = "";
    });
    document.querySelectorAll(".tree-children").forEach((container) => {
      container.style.display = "";
    });
    return;
  }

  // Filter items
  document.querySelectorAll(".tree-item").forEach((item) => {
    const path = item.dataset.path.toLowerCase();
    const matches = path.includes(term);

    if (matches) {
      item.style.display = "";
      // Show parent folders
      let parent = item.previousElementSibling;
      while (parent && parent.classList.contains("tree-item")) {
        if (parent.dataset.type === "tree") {
          parent.style.display = "";
        }
        parent = parent.previousElementSibling;
      }
    } else {
      item.style.display = "none";
    }
  });

  // Show/hide children containers
  document.querySelectorAll(".tree-children").forEach((container) => {
    const hasVisibleChildren = Array.from(container.children).some(
      (child) => child.style.display !== "none"
    );
    container.style.display = hasVisibleChildren ? "" : "none";
  });
}
