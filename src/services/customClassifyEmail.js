import { getApiKeys, getCustomLabels } from '../utils/storage.js';
import { API_ENDPOINTS, getOpenRouterHeaders, OPENROUTER_CONFIG, API_TIMEOUT } from '../config/apiConfig.js';
import { API_CONFIG_KEYS } from '../utils/constants.js';

/**
 * Custom Email Classification Service
 * Uses user-defined prompts to classify emails into custom categories
 */

/**
 * Classify email using custom labels and prompts
 * @param {string} emailSummary - Summarized email content
 * @param {Object} emailMetadata - Email metadata (subject, sender, etc.)
 * @returns {Promise<Array<string>>} Array of matching custom label names
 */
export async function customClassifyEmail(emailSummary, emailMetadata = {}) {
  try {
    // Get enabled custom labels
    const allLabels = await getCustomLabels();
    const enabledLabels = allLabels.filter(label => label.enabled);

    if (enabledLabels.length === 0) {
      return [];
    }

    // Get API key from storage
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.OPENROUTER];

    if (!apiKey) {
      console.warn('OpenRouter API key not configured, skipping custom classification');
      return [];
    }

    // Classify against each custom label
    const results = await Promise.all(
      enabledLabels.map(label => 
        classifyAgainstLabel(emailSummary, emailMetadata, label, apiKey)
      )
    );

    // Return labels that matched
    const matchedLabels = enabledLabels
      .filter((label, index) => results[index])
      .map(label => label.name);

    return matchedLabels;
  } catch (error) {
    console.error('Failed to perform custom classification:', error);
    return [];
  }
}

/**
 * Classify email against a single custom label
 * @param {string} summary - Email summary
 * @param {Object} metadata - Email metadata
 * @param {Object} label - Custom label with prompt
 * @param {string} apiKey - API key
 * @returns {Promise<boolean>} True if email matches the label
 */
async function classifyAgainstLabel(summary, metadata, label, apiKey) {
  try {
    const prompt = createCustomClassificationPrompt(summary, metadata, label);
    const matches = await makeCustomClassificationRequest(prompt, apiKey);
    return matches;
  } catch (error) {
    console.error(`Failed to classify against label "${label.name}":`, error);
    return false;
  }
}

/**
 * Create custom classification prompt
 * @param {string} summary - Email summary
 * @param {Object} metadata - Email metadata
 * @param {Object} label - Custom label with prompt template
 * @returns {string} Classification prompt
 */
function createCustomClassificationPrompt(summary, metadata, label) {
  const basePrompt = `You are an email classification assistant. Determine if the following email matches the given criteria.

Email Subject: ${metadata.subject || 'No subject'}
Email From: ${metadata.from || 'Unknown sender'}
Email Summary: ${summary}

Classification Criteria:
${label.prompt}

Does this email match the criteria? Respond with ONLY "YES" or "NO".`;

  return basePrompt;
}

/**
 * Make custom classification API request
 * @param {string} prompt - Classification prompt
 * @param {string} apiKey - OpenRouter API key
 * @returns {Promise<boolean>} True if email matches
 */
async function makeCustomClassificationRequest(prompt, apiKey) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.OPENROUTER, {
      method: 'POST',
      headers: getOpenRouterHeaders(apiKey),
      body: JSON.stringify({
        model: OPENROUTER_CONFIG.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenRouter');
    }

    // Parse yes/no response
    const answer = content.trim().toUpperCase();
    return answer === 'YES' || answer.includes('YES');
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Batch classify multiple emails against custom labels
 * @param {Array<{summary: string, metadata: Object}>} emails - Array of emails to classify
 * @returns {Promise<Array<Array<string>>>} Array of matched label arrays for each email
 */
export async function batchCustomClassifyEmails(emails) {
  try {
    const results = await Promise.all(
      emails.map(email => customClassifyEmail(email.summary, email.metadata))
    );
    return results;
  } catch (error) {
    console.error('Batch custom classification failed:', error);
    throw error;
  }
}

