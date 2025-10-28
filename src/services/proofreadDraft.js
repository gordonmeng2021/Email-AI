import { getApiKeys } from '../utils/storage.js';
import { API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/apiConfig.js';
import { API_CONFIG_KEYS } from '../utils/constants.js';

/**
 * Proofreading Service
 * Final grammar and style correction for email drafts
 */

/**
 * Proofread and correct draft text
 * @param {string} draftText - Draft text to proofread
 * @returns {Promise<string>} Proofread text
 */
export async function proofreadDraft(draftText) {
  try {
    // Get API key from storage
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.PROOFREADER];

    if (!apiKey) {
      console.warn('Proofreader API key not configured, returning original draft');
      return draftText;
    }

    // Make API request
    const proofread = await makeProofreadRequest(draftText, apiKey);
    return proofread;
  } catch (error) {
    console.error('Failed to proofread draft:', error);
    // Return original draft on failure
    return draftText;
  }
}

/**
 * Make proofread API request
 * @param {string} text - Text to proofread
 * @param {string} apiKey - Proofreader API key
 * @returns {Promise<string>} Proofread text
 */
async function makeProofreadRequest(text, apiKey) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.PROOFREADER, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        text: text,
        check_grammar: true,
        check_spelling: true,
        check_punctuation: true,
        check_style: true
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Proofreader API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.corrected_text || data.text || text;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Get proofreading suggestions without applying them
 * @param {string} draftText - Draft text
 * @returns {Promise<Array>} Array of suggestions
 */
export async function getProofreadSuggestions(draftText) {
  try {
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.PROOFREADER];

    if (!apiKey) {
      return [];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.PROOFREADER, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        text: draftText,
        return_suggestions: true,
        auto_correct: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Proofreader API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Failed to get proofread suggestions:', error);
    return [];
  }
}

/**
 * Check grammar only
 * @param {string} text - Text to check
 * @returns {Promise<string>} Grammar-corrected text
 */
export async function checkGrammar(text) {
  try {
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.PROOFREADER];

    if (!apiKey) {
      return text;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.PROOFREADER, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        text: text,
        check_grammar: true,
        check_spelling: false,
        check_punctuation: false,
        check_style: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Proofreader API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.corrected_text || data.text || text;
  } catch (error) {
    console.error('Failed to check grammar:', error);
    return text;
  }
}

/**
 * Fix spelling errors
 * @param {string} text - Text to fix
 * @returns {Promise<string>} Spelling-corrected text
 */
export async function fixSpelling(text) {
  try {
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.PROOFREADER];

    if (!apiKey) {
      return text;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.PROOFREADER, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        text: text,
        check_grammar: false,
        check_spelling: true,
        check_punctuation: false,
        check_style: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Proofreader API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.corrected_text || data.text || text;
  } catch (error) {
    console.error('Failed to fix spelling:', error);
    return text;
  }
}

/**
 * Basic client-side text cleanup (fallback)
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
export function basicCleanup(text) {
  return text
    .replace(/\s+/g, ' ')              // Replace multiple spaces with single space
    .replace(/\n{3,}/g, '\n\n')        // Max 2 consecutive newlines
    .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure space after sentence endings
    .trim();
}
