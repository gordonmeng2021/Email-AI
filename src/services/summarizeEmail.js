import { getApiKeys } from '../utils/storage.js';
import { API_ENDPOINTS, getHeaders, API_TIMEOUT, MAX_RETRIES, RETRY_DELAY } from '../config/apiConfig.js';
import { API_CONFIG_KEYS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Email Summarization Service
 * Uses Summarizer API to compress and extract meaning from raw email text
 */

/**
 * Summarize email content
 * @param {string} emailContent - Raw email content to summarize
 * @returns {Promise<string>} Summarized text
 */
export async function summarizeEmail(emailContent) {
  try {
    // Get API key from storage
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.SUMMARIZER];

    if (!apiKey) {
      console.warn('Summarizer API key not configured, using original content');
      // Return truncated content if API key is missing
      return emailContent.substring(0, 500) + '...';
    }

    // Make API request with retry logic
    const summary = await makeRequestWithRetry(emailContent, apiKey);
    return summary;
  } catch (error) {
    console.error('Failed to summarize email:', error);
    // Fallback to truncated content
    return emailContent.substring(0, 500) + '...';
  }
}

/**
 * Make API request with retry logic
 * @param {string} content - Content to summarize
 * @param {string} apiKey - API key
 * @param {number} attempt - Current attempt number
 * @returns {Promise<string>} Summary
 */
async function makeRequestWithRetry(content, apiKey, attempt = 1) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.SUMMARIZER, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        text: content,
        max_length: 200,
        min_length: 50
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429 && attempt < MAX_RETRIES) {
        // Rate limit - retry after delay
        await sleep(RETRY_DELAY * attempt);
        return makeRequestWithRetry(content, apiKey, attempt + 1);
      }
      throw new Error(`Summarizer API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.summary || data.text || content;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }

    if (attempt < MAX_RETRIES) {
      console.warn(`Summarization attempt ${attempt} failed, retrying...`);
      await sleep(RETRY_DELAY * attempt);
      return makeRequestWithRetry(content, apiKey, attempt + 1);
    }

    throw error;
  }
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Batch summarize multiple emails
 * @param {Array<string>} emailContents - Array of email contents
 * @returns {Promise<Array<string>>} Array of summaries
 */
export async function batchSummarizeEmails(emailContents) {
  try {
    const summaries = await Promise.all(
      emailContents.map(content => summarizeEmail(content))
    );
    return summaries;
  } catch (error) {
    console.error('Batch summarization failed:', error);
    throw error;
  }
}

/**
 * Extract key points from email
 * @param {string} emailContent - Email content
 * @returns {Promise<Array<string>>} Array of key points
 */
export async function extractKeyPoints(emailContent) {
  try {
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.SUMMARIZER];

    if (!apiKey) {
      return ['Summary not available - API key not configured'];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.SUMMARIZER, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        text: emailContent,
        extract_key_points: true,
        max_points: 5
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to extract key points: ${response.statusText}`);
    }

    const data = await response.json();
    return data.key_points || [];
  } catch (error) {
    console.error('Failed to extract key points:', error);
    return [];
  }
}
