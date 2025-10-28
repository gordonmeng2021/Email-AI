import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants.js';

/**
 * Storage utility module for Chrome storage API operations
 * Provides helpers for storing and retrieving extension data
 */

/**
 * Get data from Chrome storage
 * @param {string|string[]} keys - Storage key(s) to retrieve
 * @returns {Promise<any>} Retrieved data
 */
export async function getStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Set data in Chrome storage
 * @param {Object} data - Data to store
 * @returns {Promise<void>}
 */
export async function setStorage(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Remove data from Chrome storage
 * @param {string|string[]} keys - Storage key(s) to remove
 * @returns {Promise<void>}
 */
export async function removeStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(keys, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get API keys from storage
 * @returns {Promise<Object>} API keys object
 */
export async function getApiKeys() {
  const result = await getStorage(STORAGE_KEYS.API_KEYS);
  return result[STORAGE_KEYS.API_KEYS] || {};
}

/**
 * Save API keys to storage
 * @param {Object} apiKeys - API keys to save
 * @returns {Promise<void>}
 */
export async function saveApiKeys(apiKeys) {
  await setStorage({ [STORAGE_KEYS.API_KEYS]: apiKeys });
}

/**
 * Get user settings from storage
 * @returns {Promise<Object>} User settings
 */
export async function getSettings() {
  const result = await getStorage(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
}

/**
 * Save user settings to storage
 * @param {Object} settings - Settings to save
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  await setStorage({ [STORAGE_KEYS.SETTINGS]: settings });
}

/**
 * Get statistics from storage
 * @returns {Promise<Object>} Statistics object
 */
export async function getStatistics() {
  const result = await getStorage(STORAGE_KEYS.STATISTICS);
  return result[STORAGE_KEYS.STATISTICS] || {
    emailsProcessed: 0,
    draftsGenerated: 0,
    hoursSaved: 0,
    lastUpdated: Date.now()
  };
}

/**
 * Update statistics in storage
 * @param {Object} updates - Statistics updates
 * @returns {Promise<void>}
 */
export async function updateStatistics(updates) {
  const currentStats = await getStatistics();
  const newStats = {
    ...currentStats,
    ...updates,
    lastUpdated: Date.now()
  };
  await setStorage({ [STORAGE_KEYS.STATISTICS]: newStats });
}

/**
 * Increment statistics counters
 * @param {string} counter - Counter name (emailsProcessed, draftsGenerated, etc.)
 * @param {number} amount - Amount to increment (default: 1)
 * @returns {Promise<void>}
 */
export async function incrementStatistic(counter, amount = 1) {
  const stats = await getStatistics();
  stats[counter] = (stats[counter] || 0) + amount;
  stats.lastUpdated = Date.now();
  await setStorage({ [STORAGE_KEYS.STATISTICS]: stats });
}

/**
 * Get processed emails from storage
 * @returns {Promise<Array>} Array of processed email IDs
 */
export async function getProcessedEmails() {
  const result = await getStorage(STORAGE_KEYS.PROCESSED_EMAILS);
  return result[STORAGE_KEYS.PROCESSED_EMAILS] || [];
}

/**
 * Add email to processed list
 * @param {string} emailId - Email ID to add
 * @returns {Promise<void>}
 */
export async function markEmailAsProcessed(emailId) {
  const processed = await getProcessedEmails();
  if (!processed.includes(emailId)) {
    processed.push(emailId);
    // Keep only last 1000 emails to prevent storage overflow
    const trimmed = processed.slice(-1000);
    await setStorage({ [STORAGE_KEYS.PROCESSED_EMAILS]: trimmed });
  }
}

/**
 * Check if email has been processed
 * @param {string} emailId - Email ID to check
 * @returns {Promise<boolean>}
 */
export async function isEmailProcessed(emailId) {
  const processed = await getProcessedEmails();
  return processed.includes(emailId);
}

/**
 * Get email priorities from storage
 * @returns {Promise<Object>} Object mapping email IDs to priority data
 */
export async function getEmailPriorities() {
  const result = await getStorage(STORAGE_KEYS.EMAIL_PRIORITIES);
  return result[STORAGE_KEYS.EMAIL_PRIORITIES] || {};
}

/**
 * Set priority for an email
 * @param {string} emailId - Email ID
 * @param {Object} priorityData - Priority data {priority, reasoning}
 * @returns {Promise<void>}
 */
export async function setEmailPriority(emailId, priorityData) {
  const priorities = await getEmailPriorities();
  priorities[emailId] = {
    ...priorityData,
    timestamp: Date.now()
  };
  
  // Keep only last 500 email priorities to prevent storage overflow
  const entries = Object.entries(priorities);
  if (entries.length > 500) {
    const sorted = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    const trimmed = Object.fromEntries(sorted.slice(0, 500));
    await setStorage({ [STORAGE_KEYS.EMAIL_PRIORITIES]: trimmed });
  } else {
    await setStorage({ [STORAGE_KEYS.EMAIL_PRIORITIES]: priorities });
  }
}

/**
 * Get priority for an email
 * @param {string} emailId - Email ID
 * @returns {Promise<Object|null>} Priority data or null if not found
 */
export async function getEmailPriority(emailId) {
  const priorities = await getEmailPriorities();
  return priorities[emailId] || null;
}

/**
 * Get custom labels from storage
 * @returns {Promise<Array>} Array of custom label objects
 */
export async function getCustomLabels() {
  const result = await getStorage(STORAGE_KEYS.CUSTOM_LABELS);
  return result[STORAGE_KEYS.CUSTOM_LABELS] || [];
}

/**
 * Save custom labels to storage
 * @param {Array} customLabels - Array of custom label objects
 * @returns {Promise<void>}
 */
export async function saveCustomLabels(customLabels) {
  await setStorage({ [STORAGE_KEYS.CUSTOM_LABELS]: customLabels });
}

/**
 * Add a custom label
 * @param {Object} label - Label object {id, name, prompt, enabled}
 * @returns {Promise<void>}
 */
export async function addCustomLabel(label) {
  const labels = await getCustomLabels();
  labels.push({
    ...label,
    id: label.id || Date.now().toString(),
    enabled: label.enabled !== undefined ? label.enabled : true,
    createdAt: Date.now()
  });
  await saveCustomLabels(labels);
}

/**
 * Update a custom label
 * @param {string} labelId - Label ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export async function updateCustomLabel(labelId, updates) {
  const labels = await getCustomLabels();
  const index = labels.findIndex(l => l.id === labelId);
  if (index !== -1) {
    labels[index] = { ...labels[index], ...updates };
    await saveCustomLabels(labels);
  }
}

/**
 * Delete a custom label
 * @param {string} labelId - Label ID
 * @returns {Promise<void>}
 */
export async function deleteCustomLabel(labelId) {
  const labels = await getCustomLabels();
  const filtered = labels.filter(l => l.id !== labelId);
  await saveCustomLabels(filtered);
}

/**
 * Clear all storage data (use with caution)
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.clear(() => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}
