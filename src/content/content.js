/**
 * Content Script for Gmail
 * Injects draft replies into Gmail's compose window
 * Runs on mail.google.com
 */

// State
let draftQueue = [];
let isInjecting = false;

/**
 * Initialize content script
 */
function init() {
  console.log('Email AI content script loaded');

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INJECT_DRAFT') {
      injectDraft(message.draft);
      sendResponse({ success: true });
    }
  });

  // Observe DOM changes to detect compose window
  observeComposeWindow();
}

/**
 * Observe DOM for Gmail compose window
 */
function observeComposeWindow() {
  const observer = new MutationObserver((mutations) => {
    // Check if compose window is open
    const composeWindow = document.querySelector('[role="dialog"]');
    if (composeWindow && !isInjecting) {
      // Check if this is a reply window
      const subjectField = composeWindow.querySelector('input[name="subjectbox"]');
      if (subjectField && subjectField.value.startsWith('Re:')) {
        console.log('Reply compose window detected');
        // Could trigger draft injection here if needed
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Inject draft text into Gmail compose window
 * @param {Object} draft - Draft object with text and metadata
 */
async function injectDraft(draft) {
  try {
    isInjecting = true;
    console.log('Injecting draft into compose window...');

    // Find the compose window
    const composeWindow = findComposeWindow(draft.threadId);

    if (!composeWindow) {
      console.error('Compose window not found');
      isInjecting = false;
      return false;
    }

    // Find the compose textarea/editor
    const editor = findEditor(composeWindow);

    if (!editor) {
      console.error('Editor element not found');
      isInjecting = false;
      return false;
    }

    // Inject the draft text
    await insertText(editor, draft.text);

    console.log('Draft injected successfully');
    isInjecting = false;
    return true;
  } catch (error) {
    console.error('Failed to inject draft:', error);
    isInjecting = false;
    return false;
  }
}

/**
 * Find Gmail compose window by thread ID
 * @param {string} threadId - Thread ID (optional)
 * @returns {HTMLElement|null} Compose window element
 */
function findComposeWindow(threadId = null) {
  // Gmail compose windows have role="dialog"
  const dialogs = document.querySelectorAll('[role="dialog"]');

  if (dialogs.length === 0) {
    return null;
  }

  // If no thread ID, return the last opened compose window
  if (!threadId) {
    return dialogs[dialogs.length - 1];
  }

  // Try to find compose window matching thread ID
  for (const dialog of dialogs) {
    // Check if this dialog is a compose window
    const composeArea = dialog.querySelector('[contenteditable="true"]');
    if (composeArea) {
      return dialog;
    }
  }

  return dialogs[0];
}

/**
 * Find editor element in compose window
 * @param {HTMLElement} composeWindow - Compose window element
 * @returns {HTMLElement|null} Editor element
 */
function findEditor(composeWindow) {
  // Gmail uses contenteditable div for the compose area
  const editor = composeWindow.querySelector('[contenteditable="true"][role="textbox"]');

  if (editor) {
    return editor;
  }

  // Fallback: find any contenteditable element
  return composeWindow.querySelector('[contenteditable="true"]');
}

/**
 * Insert text into editor
 * @param {HTMLElement} editor - Editor element
 * @param {string} text - Text to insert
 */
async function insertText(editor, text) {
  // Focus the editor
  editor.focus();

  // Clear existing content
  editor.innerHTML = '';

  // Convert text to HTML (preserve line breaks)
  const htmlText = text.replace(/\n/g, '<br>');

  // Insert text
  editor.innerHTML = htmlText;

  // Trigger input event to notify Gmail
  const inputEvent = new Event('input', {
    bubbles: true,
    cancelable: true
  });
  editor.dispatchEvent(inputEvent);

  // Also trigger change event
  const changeEvent = new Event('change', {
    bubbles: true,
    cancelable: true
  });
  editor.dispatchEvent(changeEvent);

  console.log('Text inserted into editor');
}

/**
 * Get current compose window text
 * @returns {string} Current text in compose window
 */
function getComposeText() {
  const composeWindow = findComposeWindow();
  if (!composeWindow) {
    return '';
  }

  const editor = findEditor(composeWindow);
  if (!editor) {
    return '';
  }

  return editor.innerText || editor.textContent || '';
}

/**
 * Check if compose window is open
 * @returns {boolean} True if compose window is open
 */
function isComposeWindowOpen() {
  return !!findComposeWindow();
}

/**
 * Wait for compose window to open
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<HTMLElement>} Compose window element
 */
function waitForComposeWindow(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkInterval = setInterval(() => {
      const composeWindow = findComposeWindow();

      if (composeWindow) {
        clearInterval(checkInterval);
        resolve(composeWindow);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for compose window'));
      }
    }, 100);
  });
}

/**
 * Add AI Email Manager button to Gmail interface
 */
function addExtensionButton() {
  // Find Gmail toolbar
  const toolbar = document.querySelector('[role="toolbar"]');

  if (!toolbar) {
    console.log('Gmail toolbar not found');
    return;
  }

  // Check if button already exists
  if (document.getElementById('ai-email-manager-btn')) {
    return;
  }

  // Create button
  const button = document.createElement('button');
  button.id = 'ai-email-manager-btn';
  button.textContent = 'AI Draft';
  button.style.cssText = `
    margin-left: 10px;
    padding: 8px 16px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  `;

  button.addEventListener('click', async () => {
    console.log('AI Draft button clicked');
    // Could trigger manual draft generation here
    alert('AI Draft generation - coming soon!');
  });

  toolbar.appendChild(button);
  console.log('Extension button added to Gmail toolbar');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Try to add extension button after page load
// window.addEventListener('load', () => {
//   setTimeout(addExtensionButton, 2000);
// });

console.log('Email AI content script initialized');
