import { getApiKeys, getSettings } from '../utils/storage.js';
import { API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/apiConfig.js';
import { API_CONFIG_KEYS } from '../utils/constants.js';

/**
 * Draft Generation Service
 * Uses Writer API to generate first-pass email replies
 */

/**
 * Generate draft reply for email
 * @param {Object} emailData - Original email data
 * @param {string} tone - Tone for the reply (professional, friendly, concise)
 * @returns {Promise<string>} Generated draft text
 */
export async function generateDraft(emailData, tone = null) {
  try {
    // Get API key and settings
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.WRITER];

    if (!apiKey) {
      console.warn('Writer API key not configured, generating simple draft');
      return generateSimpleDraft(emailData);
    }

    // Get tone from settings if not provided
    if (!tone) {
      const settings = await getSettings();
      tone = settings.defaultTone || 'professional';
    }

    // Create draft generation prompt
    const prompt = createDraftPrompt(emailData, tone);

    // Make API request
    const draft = await makeDraftRequest(prompt, apiKey);
    return draft;
  } catch (error) {
    console.error('Failed to generate draft:', error);
    return generateSimpleDraft(emailData);
  }
}

/**
 * Create draft generation prompt
 * @param {Object} emailData - Email data
 * @param {string} tone - Desired tone
 * @returns {string} Prompt
 */
function createDraftPrompt(emailData, tone) {
  return `You are an world class email draft generation assistant. Generate a ${tone} email reply to the following email.

Original Email:
From: ${emailData.from}
Subject: ${emailData.subject}
Content: ${emailData.body || emailData.snippet}

Instructions:
- Keep the response ${tone} and appropriate
- Address the main points from the original email
- Keep it concise (2-3 paragraphs maximum)
- Ensure the reply content is meaningful and helpful.

Draft Reply:`;
}

/**
 * Make draft generation API request
 * @param {string} prompt - Generation prompt
 * @param {string} apiKey - Writer API key
 * @returns {Promise<string>} Generated draft
 */
async function makeDraftRequest(prompt, apiKey) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.WRITER, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Writer API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || data.generated_text || data.content || '';
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Generate simple draft without API
 * @param {Object} emailData - Email data
 * @returns {string} Simple draft
 */
function generateSimpleDraft(emailData) {
  const sender = extractName(emailData.from);

  return `Thank you for your email, ${sender}.

I've received your message regarding "${emailData.subject}" and will review it carefully.

I'll get back to you with a detailed response shortly.

Best regards`;
}

/**
 * Extract name from email address
 * @param {string} from - From field
 * @returns {string} Extracted name
 */
function extractName(from) {
  if (!from) return 'there';

  // Try to extract name from "Name <email@example.com>" format
  const nameMatch = from.match(/^([^<]+)</);
  if (nameMatch) {
    return nameMatch[1].trim();
  }

  // Extract from email address
  const emailMatch = from.match(/([^@]+)@/);
  if (emailMatch) {
    return emailMatch[1].replace(/[._]/g, ' ').trim();
  }

  return 'there';
}

/**
 * Generate draft with custom context
 * @param {Object} emailData - Email data
 * @param {string} context - Additional context for generation
 * @param {string} tone - Tone
 * @returns {Promise<string>} Generated draft
 */
export async function generateDraftWithContext(emailData, context, tone = 'professional') {
  try {
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.WRITER];

    if (!apiKey) {
      return generateSimpleDraft(emailData);
    }

    const prompt = `${createDraftPrompt(emailData, tone)}

Additional Context: ${context}

Draft Reply:`;

    const draft = await makeDraftRequest(prompt, apiKey);
    return draft;
  } catch (error) {
    console.error('Failed to generate draft with context:', error);
    return generateSimpleDraft(emailData);
  }
}
