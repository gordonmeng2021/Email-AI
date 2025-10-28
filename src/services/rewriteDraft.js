import { getApiKeys } from '../utils/storage.js';
import { API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/apiConfig.js';
import { API_CONFIG_KEYS } from '../utils/constants.js';

/**
 * Draft Rewriting Service
 * Uses Rewriter API to polish and make drafts natural and ready-to-send
 */

/**
 * Rewrite draft to make it more natural and polished
 * @param {string} draftText - Original draft text
 * @param {string} style - Rewriting style (natural, formal, casual)
 * @returns {Promise<string>} Rewritten draft
 */
export async function rewriteDraft(draftText, style = 'natural') {
  try {
    // Get API key from storage
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.REWRITER];

    if (!apiKey) {
      console.warn('Rewriter API key not configured, returning original draft');
      return draftText;
    }

    // Make API request
    const rewritten = await makeRewriteRequest(draftText, style, apiKey);
    return rewritten;
  } catch (error) {
    console.error('Failed to rewrite draft:', error);
    // Return original draft on failure
    return draftText;
  }
}

/**
 * Make rewrite API request
 * @param {string} text - Text to rewrite
 * @param {string} style - Rewriting style
 * @param {string} apiKey - Rewriter API key
 * @returns {Promise<string>} Rewritten text
 */
async function makeRewriteRequest(text, style, apiKey) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.REWRITER, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        text: text,
        style: style,
        task: 'polish',
        preserve_meaning: true
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Rewriter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.rewritten_text || data.text || text;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Polish draft for professionalism
 * @param {string} draftText - Draft text
 * @returns {Promise<string>} Polished draft
 */
export async function polishDraft(draftText) {
  return rewriteDraft(draftText, 'professional');
}

/**
 * Make draft more concise
 * @param {string} draftText - Draft text
 * @returns {Promise<string>} Concise draft
 */
export async function makeConcise(draftText) {
  try {
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.REWRITER];

    if (!apiKey) {
      return draftText;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.REWRITER, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        text: draftText,
        task: 'shorten',
        preserve_key_points: true
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Rewriter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rewritten_text || data.text || draftText;
  } catch (error) {
    console.error('Failed to make draft concise:', error);
    return draftText;
  }
}

/**
 * Improve draft clarity and readability
 * @param {string} draftText - Draft text
 * @returns {Promise<string>} Improved draft
 */
export async function improveClarity(draftText) {
  try {
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.REWRITER];

    if (!apiKey) {
      return draftText;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.REWRITER, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        text: draftText,
        task: 'improve_clarity',
        enhance_readability: true
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Rewriter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rewritten_text || data.text || draftText;
  } catch (error) {
    console.error('Failed to improve clarity:', error);
    return draftText;
  }
}
