// GitHub Repository Sidebar
// Injects a VS Code-style sidebar into GitHub repository pages

(function () {
  "use strict";

  // Check if we're on a GitHub repository page
  if (!isGitHubRepo()) {
    return;
  }

  console.log("GitHub Sidebar: Initializing...");

  // State
  let fileTreeData = null;
  let expandedFolders = new Set();
  let currentRepo = null;
  let currentBranch = "main";
  let sidebarOpen = true;

  // Initialize sidebar
  initSidebar();

  function initSidebar() {
    // Extract repo info
    const repoInfo = extractRepoInfo();
    if (!repoInfo) {
      console.log("GitHub Sidebar: Not on a repository page");
      return;
    }

    currentRepo = repoInfo.repoId;
    currentBranch = repoInfo.branch;

    console.log("GitHub Sidebar: Repository detected:", currentRepo);

    // Inject CSS
    injectStyles();

    // Inject HTML
    injectSidebar();

    // Setup event listeners
    setupEventListeners();

    // Load file tree
    loadFileTree();

    // Adjust page layout
    adjustPageLayout();

    // Load saved state
    loadSidebarState();
  }

  function injectStyles() {
    if (document.getElementById("gh-sidebar-styles")) {
      return;
    }

    const link = document.createElement("link");
    link.id = "gh-sidebar-styles";
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("sidebar.css");
    document.head.appendChild(link);
  }

  function injectSidebar() {
    if (document.getElementById("gh-sidebar-container")) {
      return;
    }

    // Fetch and inject sidebar HTML
    fetch(chrome.runtime.getURL("sidebar.html"))
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const sidebarContainer = doc.getElementById("gh-sidebar-container");
        const sidebarToggle = doc.getElementById("gh-sidebar-toggle");

        if (sidebarContainer) {
          document.body.appendChild(sidebarContainer);
        }

        if (sidebarToggle) {
          document.body.appendChild(sidebarToggle);
        }

        console.log("GitHub Sidebar: HTML injected");
      })
      .catch((error) => {
        console.error("GitHub Sidebar: Failed to inject HTML", error);
      });
  }

  function setupEventListeners() {
    // Wait for elements to be available
    setTimeout(() => {
      const refreshBtn = document.getElementById("refreshTreeBtn");
      const collapseBtn = document.getElementById("collapseSidebarBtn");
      const toggleBtn = document.getElementById("gh-sidebar-toggle");
      const searchInput = document.getElementById("sidebarFileSearch");

      if (refreshBtn) {
        refreshBtn.addEventListener("click", loadFileTree);
      }

      if (collapseBtn) {
        collapseBtn.addEventListener("click", toggleSidebar);
      }

      if (toggleBtn) {
        toggleBtn.addEventListener("click", toggleSidebar);
      }

      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          filterFileTree(e.target.value);
        });
      }
    }, 100);
  }

  function adjustPageLayout() {
    if (sidebarOpen) {
      document.body.classList.add("gh-sidebar-open");
    }
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;

    const container = document.getElementById("gh-sidebar-container");
    const toggle = document.getElementById("gh-sidebar-toggle");

    if (container) {
      container.classList.toggle("collapsed", !sidebarOpen);
    }

    if (toggle) {
      toggle.classList.toggle("collapsed", !sidebarOpen);
    }

    document.body.classList.toggle("gh-sidebar-open", sidebarOpen);

    // Save state
    saveSidebarState();
  }

  function saveSidebarState() {
    localStorage.setItem("gh-sidebar-open", sidebarOpen ? "true" : "false");
  }

  function loadSidebarState() {
    const saved = localStorage.getItem("gh-sidebar-open");
    if (saved === "false") {
      sidebarOpen = false;
      toggleSidebar();
    }
  }

  // ============================================
  // FILE TREE FUNCTIONALITY
  // ============================================

  async function loadFileTree() {
    const loadingEl = document.getElementById("sidebarLoading");
    const emptyEl = document.getElementById("sidebarEmpty");
    const treeEl = document.getElementById("sidebarFileTree");

    if (!treeEl) return;

    if (loadingEl) loadingEl.classList.remove("hidden");
    if (emptyEl) emptyEl.classList.add("hidden");
    treeEl.innerHTML = "";

    try {
      const [owner, repo] = currentRepo.split("/");
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${currentBranch}?recursive=1`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.tree || data.tree.length === 0) {
        if (emptyEl) emptyEl.classList.remove("hidden");
        if (loadingEl) loadingEl.classList.add("hidden");
        return;
      }

      // Build tree structure
      fileTreeData = buildTreeStructure(data.tree);

      // Render tree
      renderFileTree(fileTreeData);

      if (loadingEl) loadingEl.classList.add("hidden");

      console.log("GitHub Sidebar: File tree loaded");
    } catch (error) {
      console.error("GitHub Sidebar: Error loading file tree", error);
      if (emptyEl) {
        emptyEl.classList.remove("hidden");
        emptyEl.querySelector("p").textContent = `⚠️ Error: ${error.message}`;
      }
      if (loadingEl) loadingEl.classList.add("hidden");
    }
  }

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

  function renderFileTree(
    node = fileTreeData,
    container = document.getElementById("sidebarFileTree"),
    level = 0
  ) {
    if (!node || !node.children || !container) return;

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

  function toggleFolder(path) {
    if (expandedFolders.has(path)) {
      expandedFolders.delete(path);
    } else {
      expandedFolders.add(path);
    }

    // Re-render tree
    const treeEl = document.getElementById("sidebarFileTree");
    if (treeEl) {
      treeEl.innerHTML = "";
      renderFileTree();
    }
  }

  function selectTreeItem(element) {
    document.querySelectorAll(".tree-item.selected").forEach((item) => {
      item.classList.remove("selected");
    });
    element.classList.add("selected");
  }

  function openFileInGitHub(filePath) {
    const url = `https://github.com/${currentRepo}/blob/${currentBranch}/${filePath}`;
    window.location.href = url;
  }

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

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function isGitHubRepo() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    return (
      hostname === "github.com" &&
      pathname.split("/").filter(Boolean).length >= 2 &&
      !pathname.startsWith("/search") &&
      !pathname.startsWith("/settings") &&
      !pathname.startsWith("/notifications")
    );
  }

  function extractRepoInfo() {
    const pathname = window.location.pathname;
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length < 2) {
      return null;
    }

    const owner = parts[0];
    const repo = parts[1];

    // Get branch from URL
    let branch = "main";
    const branchMatch = pathname.match(/\/tree\/([^\/]+)/);
    if (branchMatch) {
      branch = branchMatch[1];
    } else {
      // Try to get default branch from page
      const branchButton = document.querySelector('[data-hotkey="w"]');
      if (branchButton) {
        const branchText = branchButton.textContent.trim();
        if (branchText) {
          branch = branchText;
        }
      }
    }

    return {
      owner,
      repo,
      branch,
      repoId: `${owner}/${repo}`,
      url: `https://github.com/${owner}/${repo}`,
    };
  }

  // Monitor for navigation changes (GitHub uses pushState)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      onNavigationChange();
    }
  }).observe(document, { subtree: true, childList: true });

  function onNavigationChange() {
    if (isGitHubRepo()) {
      const newRepoInfo = extractRepoInfo();
      if (newRepoInfo && newRepoInfo.repoId !== currentRepo) {
        console.log("GitHub Sidebar: Navigation detected, reloading...");
        currentRepo = newRepoInfo.repoId;
        currentBranch = newRepoInfo.branch;
        expandedFolders.clear();
        loadFileTree();
      }
    }
  }
})();
