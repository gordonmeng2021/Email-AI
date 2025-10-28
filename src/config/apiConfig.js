/**
 * API Configuration
 * Centralized configuration for all external API endpoints
 */

export const API_ENDPOINTS = {
  // Gmail API
  GMAIL_BASE: 'https://www.googleapis.com/gmail/v1/users/me',
  GMAIL_MESSAGES: 'https://www.googleapis.com/gmail/v1/users/me/messages',
  GMAIL_LABELS: 'https://www.googleapis.com/gmail/v1/users/me/labels',
  GMAIL_DRAFTS: 'https://www.googleapis.com/gmail/v1/users/me/drafts',

  // OpenRouter (Gemini 2.0 Flash Experimental)
  OPENROUTER: 'https://openrouter.ai/api/v1/chat/completions',

  // Note: These are placeholder URLs - replace with actual API endpoints
  // User will need to configure their own API endpoints in settings
  SUMMARIZER: 'https://api.example.com/summarize',
  WRITER: 'https://api.example.com/write',
  REWRITER: 'https://api.example.com/rewrite',
  TRANSLATOR: 'https://api.example.com/translate',
  PROOFREADER: 'https://api.example.com/proofread'
};

export const OPENROUTER_CONFIG = {
  model: 'google/gemini-2.0-flash-exp:free',
  temperature: 0.7,
  max_tokens: 1000
};

export const API_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second

/**
 * Get headers for API requests
 * @param {string} apiKey - API key for authentication
 * @param {string} contentType - Content type (default: application/json)
 * @returns {Object} Headers object
 */
export function getHeaders(apiKey, contentType = 'application/json') {
  return {
    'Content-Type': contentType,
    'Authorization': `Bearer ${apiKey}`
  };
}

/**
 * Get OpenRouter specific headers
 * @param {string} apiKey - OpenRouter API key
 * @returns {Object} Headers object
 */
export function getOpenRouterHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': chrome.runtime.getURL(''),
    'X-Title': 'Email AI'
  };
}

/**
 * Get Gmail API headers
 * @param {string} token - OAuth token
 * @returns {Object} Headers object
 */
export function getGmailHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}
