// Options page script for GitHub Repo Assistant

const DEFAULT_API_URL = 'http://localhost:3000/api/v1';

// DOM Elements
const elements = {
  form: document.getElementById('settingsForm'),
  apiUrl: document.getElementById('apiUrl'),
  testBtn: document.getElementById('testBtn'),
  resetBtn: document.getElementById('resetBtn'),
  statusMessage: document.getElementById('statusMessage'),
  connectionStatus: document.getElementById('connectionStatus'),
  statusDot: document.getElementById('statusDot'),
  statusLabel: document.getElementById('statusLabel'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  clearCacheBtn: document.getElementById('clearCacheBtn'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  clearMessage: document.getElementById('clearMessage'),
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await checkConnection();
  setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['apiUrl']);
    elements.apiUrl.value = result.apiUrl || DEFAULT_API_URL;
  } catch (error) {
    console.error('Error loading settings:', error);
    showMessage('Error loading settings', 'error');
  }
}

// Save settings to storage
async function saveSettings(e) {
  e.preventDefault();

  const apiUrl = elements.apiUrl.value.trim();

  if (!apiUrl) {
    showMessage('Please enter an API URL', 'error');
    return;
  }

  // Validate URL format
  try {
    new URL(apiUrl);
  } catch (error) {
    showMessage('Please enter a valid URL', 'error');
    return;
  }

  try {
    await chrome.storage.sync.set({ apiUrl });
    showMessage('✓ Settings saved successfully!', 'success');

    // Recheck connection with new URL
    setTimeout(() => {
      checkConnection();
    }, 500);
  } catch (error) {
    console.error('Error saving settings:', error);
    showMessage('Failed to save settings', 'error');
  }
}

// Test API connection
async function testConnection() {
  const apiUrl = elements.apiUrl.value.trim();

  if (!apiUrl) {
    showMessage('Please enter an API URL', 'error');
    return;
  }

  elements.testBtn.disabled = true;
  elements.testBtn.textContent = '🔄 Testing...';

  try {
    const healthUrl = apiUrl.replace(/\/api\/v1$/, '') + '/api/v1/health';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      showMessage('✓ Connection successful! Backend is reachable.', 'success');
      updateConnectionStatus(true);
    } else {
      showMessage(`⚠ Connection failed: HTTP ${response.status}`, 'error');
      updateConnectionStatus(false);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      showMessage('⚠ Connection timeout. Please check if the backend is running.', 'error');
    } else {
      showMessage(`⚠ Connection failed: ${error.message}`, 'error');
    }
    updateConnectionStatus(false);
  } finally {
    elements.testBtn.disabled = false;
    elements.testBtn.textContent = '🔍 Test Connection';
  }
}

// Check connection status on load
async function checkConnection() {
  try {
    const result = await chrome.storage.sync.get(['apiUrl']);
    const apiUrl = result.apiUrl || DEFAULT_API_URL;
    const healthUrl = apiUrl.replace(/\/api\/v1$/, '') + '/api/v1/health';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      updateConnectionStatus(true);
    } else {
      updateConnectionStatus(false);
    }
  } catch (error) {
    updateConnectionStatus(false);
  }
}

// Update connection status indicator
function updateConnectionStatus(connected) {
  if (connected) {
    elements.statusDot.classList.add('connected');
    elements.statusDot.classList.remove('disconnected');
    elements.statusLabel.textContent = 'Connected to backend';
  } else {
    elements.statusDot.classList.remove('connected');
    elements.statusDot.classList.add('disconnected');
    elements.statusLabel.textContent = 'Not connected - Please check backend';
  }
}

// Reset to default settings
async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default?')) {
    try {
      await chrome.storage.sync.set({ apiUrl: DEFAULT_API_URL });
      elements.apiUrl.value = DEFAULT_API_URL;
      showMessage('✓ Settings reset to default', 'success');

      setTimeout(() => {
        checkConnection();
      }, 500);
    } catch (error) {
      console.error('Error resetting settings:', error);
      showMessage('Failed to reset settings', 'error');
    }
  }
}

// Clear query history
async function clearQueryHistory() {
  if (confirm('Are you sure you want to clear all query history?')) {
    try {
      await chrome.storage.local.remove(['queryHistory']);
      showClearMessage('✓ Query history cleared', 'success');
    } catch (error) {
      console.error('Error clearing history:', error);
      showClearMessage('Failed to clear history', 'error');
    }
  }
}

// Clear repository cache
async function clearRepositoryCache() {
  if (confirm('Are you sure you want to clear all cached repository data?')) {
    try {
      await chrome.storage.local.remove(['ingestedRepos']);
      showClearMessage('✓ Repository cache cleared', 'success');
    } catch (error) {
      console.error('Error clearing cache:', error);
      showClearMessage('Failed to clear cache', 'error');
    }
  }
}

// Clear all data
async function clearAllData() {
  if (confirm('Are you sure you want to clear ALL extension data? This cannot be undone.')) {
    try {
      await chrome.storage.local.clear();
      showClearMessage('✓ All data cleared', 'success');
    } catch (error) {
      console.error('Error clearing data:', error);
      showClearMessage('Failed to clear data', 'error');
    }
  }
}

// Show status message
function showMessage(message, type) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = '';
  elements.statusMessage.classList.add('status-message', `status-${type}`);
  elements.statusMessage.classList.remove('hidden');

  // Auto-hide after 5 seconds
  setTimeout(() => {
    elements.statusMessage.classList.add('hidden');
  }, 5000);
}

// Show clear message
function showClearMessage(message, type) {
  elements.clearMessage.textContent = message;
  elements.clearMessage.className = '';
  elements.clearMessage.classList.add('status-message', `status-${type}`);
  elements.clearMessage.classList.remove('hidden');

  // Auto-hide after 3 seconds
  setTimeout(() => {
    elements.clearMessage.classList.add('hidden');
  }, 3000);
}

// Setup event listeners
function setupEventListeners() {
  elements.form.addEventListener('submit', saveSettings);
  elements.testBtn.addEventListener('click', testConnection);
  elements.resetBtn.addEventListener('click', resetSettings);
  elements.clearHistoryBtn.addEventListener('click', clearQueryHistory);
  elements.clearCacheBtn.addEventListener('click', clearRepositoryCache);
  elements.clearAllBtn.addEventListener('click', clearAllData);

  // Auto-save on blur
  elements.apiUrl.addEventListener('blur', () => {
    const event = new Event('submit');
    elements.form.dispatchEvent(event);
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+S or Cmd+S to save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const event = new Event('submit');
    elements.form.dispatchEvent(event);
  }

  // Ctrl+T or Cmd+T to test connection
  if ((e.ctrlKey || e.metaKey) && e.key === 't') {
    e.preventDefault();
    testConnection();
  }
});

console.log('GitHub Repo Assistant options page loaded');
