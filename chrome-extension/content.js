// Content script for GitHub Repo Assistant
// Runs on GitHub repository pages

(function() {
  'use strict';

  // Check if we're on a GitHub repository page
  if (!isGitHubRepo()) {
    return;
  }

  console.log('GitHub Repo Assistant content script loaded');

  // Extract repository information
  const repoInfo = extractRepoInfo();

  if (repoInfo) {
    console.log('Repository detected:', repoInfo);

    // Send repo info to background script
    chrome.runtime.sendMessage({
      action: 'repoDetected',
      repoInfo: repoInfo
    });

    // Optionally inject a floating button for quick access
    injectFloatingButton();
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getRepoInfo') {
      sendResponse({ repoInfo: extractRepoInfo() });
    }
    return true;
  });

  // Check if current page is a GitHub repository
  function isGitHubRepo() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    return hostname === 'github.com' &&
           pathname.split('/').filter(Boolean).length >= 2 &&
           !pathname.startsWith('/search') &&
           !pathname.startsWith('/settings') &&
           !pathname.startsWith('/notifications');
  }

  // Extract repository information from the page
  function extractRepoInfo() {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);

    if (parts.length < 2) {
      return null;
    }

    const owner = parts[0];
    const repo = parts[1];

    // Get branch from the page
    let branch = 'main';

    // Try to get branch from branch selector
    const branchButton = document.querySelector('[data-hotkey="w"]');
    if (branchButton) {
      const branchText = branchButton.textContent.trim();
      if (branchText) {
        branch = branchText;
      }
    }

    // Try to extract from URL
    const branchMatch = pathname.match(/\/tree\/([^\/]+)/);
    if (branchMatch) {
      branch = branchMatch[1];
    }

    // Get repository description
    let description = '';
    const descElement = document.querySelector('p.f4.my-3') ||
                       document.querySelector('[data-pjax="#repo-content-pjax-container"] p');
    if (descElement) {
      description = descElement.textContent.trim();
    }

    // Get star count
    let stars = 0;
    const starElement = document.querySelector('#repo-stars-counter-star');
    if (starElement) {
      const starText = starElement.textContent.trim().replace(/,/g, '');
      stars = parseInt(starText) || 0;
    }

    // Get language
    let language = '';
    const langElement = document.querySelector('[itemprop="programmingLanguage"]');
    if (langElement) {
      language = langElement.textContent.trim();
    }

    return {
      owner,
      repo,
      branch,
      repoId: `${owner}/${repo}`,
      url: `https://github.com/${owner}/${repo}`,
      description,
      stars,
      language,
      fullPath: pathname
    };
  }

  // Inject a floating button for quick access
  function injectFloatingButton() {
    // Check if button already exists
    if (document.getElementById('gh-assistant-float-btn')) {
      return;
    }

    const button = document.createElement('button');
    button.id = 'gh-assistant-float-btn';
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>AI Assistant</span>
    `;

    // Style the button
    button.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      background: linear-gradient(135deg, #2da44e 0%, #1a7f37 100%);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(45, 164, 78, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: all 0.3s ease;
      opacity: 0.95;
    `;

    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(45, 164, 78, 0.5)';
      button.style.opacity = '1';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(45, 164, 78, 0.4)';
      button.style.opacity = '0.95';
    });

    // Click handler
    button.addEventListener('click', () => {
      // Open the extension popup
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });

    // Append to body
    document.body.appendChild(button);

    // Hide button on scroll (optional)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      button.style.opacity = '0.5';
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        button.style.opacity = '0.95';
      }, 1000);
    });
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
      if (newRepoInfo) {
        console.log('Navigation detected, new repo info:', newRepoInfo);
        chrome.runtime.sendMessage({
          action: 'repoDetected',
          repoInfo: newRepoInfo
        });
      }
    }
  }

  // Add keyboard shortcut (Alt+Shift+A) to open extension
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'openPopup' });
    }
  });

})();
