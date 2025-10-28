import { getApiKeys } from '../utils/storage.js';
import { API_ENDPOINTS, getOpenRouterHeaders, OPENROUTER_CONFIG, API_TIMEOUT } from '../config/apiConfig.js';
import { API_CONFIG_KEYS, EMAIL_CATEGORIES } from '../utils/constants.js';

/**
 * Email Classification Service
 * Uses OpenRouter (Gemini 2.0 Flash Experimental) to classify emails
 * Returns category and summary
 */

/**
 * Classify email into category
 * @param {string} emailSummary - Summarized email content
 * @param {Object} emailMetadata - Email metadata (subject, sender, etc.)
 * @returns {Promise<{category: string, summary: string}>}
 */
export async function classifyEmail(emailSummary, emailMetadata = {}) {
  try {
    // Get API key from storage
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.OPENROUTER];

    if (!apiKey) {
      console.warn('OpenRouter API key not configured, using fallback classification');
      return fallbackClassification(emailSummary, emailMetadata);
    }

    // Create classification prompt
    const prompt = createClassificationPrompt(emailSummary, emailMetadata);

    // Make API request
    const result = await makeClassificationRequest(prompt, apiKey);
    return result;
  } catch (error) {
    console.error('Failed to classify email:', error);
    // Fallback to simple classification
    return fallbackClassification(emailSummary, emailMetadata);
  }
}

/**
 * Create classification prompt for AI
 * @param {string} summary - Email summary
 * @param {Object} metadata - Email metadata
 * @returns {string} Classification prompt
 */
function createClassificationPrompt(summary, metadata) {
  return `You are an email classification assistant. Analyze the following email and:
1. Summarize it again in one concise sentence (max 100 characters)
2. Classify it into exactly ONE of these categories:
   - "Notification" - Automated notifications, receipts, confirmations, newsletters
   - "Respond" - Emails that require a personal response or action
   - "Advertisement" - Marketing emails, promotional content, spam

Email Subject: ${metadata.subject || 'No subject'}
Email From: ${metadata.from || 'Unknown sender'}
Email Summary: ${summary}

Respond ONLY with valid JSON in this exact format:
{
  "category": "Notification|Respond|Advertisement",
  "summary": "Brief one-sentence summary"
}`;
}

/**
 * Make classification API request to OpenRouter
 * @param {string} prompt - Classification prompt
 * @param {string} apiKey - OpenRouter API key
 * @returns {Promise<{category: string, summary: string}>}
 */
async function makeClassificationRequest(prompt, apiKey) {
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
        temperature: OPENROUTER_CONFIG.temperature,
        max_tokens: OPENROUTER_CONFIG.max_tokens
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

    // Parse JSON response
    const result = parseClassificationResponse(content);
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Parse classification response
 * @param {string} content - Response content
 * @returns {Object} Parsed classification
 */
function parseClassificationResponse(content) {
  try {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate category
      const validCategories = Object.values(EMAIL_CATEGORIES);
      const category = validCategories.includes(parsed.category)
        ? parsed.category
        : EMAIL_CATEGORIES.NOTIFICATION;

      return {
        category,
        summary: parsed.summary || 'No summary available'
      };
    }

    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Failed to parse classification response:', error);
    return {
      category: EMAIL_CATEGORIES.NOTIFICATION,
      summary: 'Classification failed'
    };
  }
}

/**
 * Fallback classification using simple rules
 * @param {string} summary - Email summary
 * @param {Object} metadata - Email metadata
 * @returns {Object} Classification result
 */
function fallbackClassification(summary, metadata) {
  const subject = (metadata.subject || '').toLowerCase();
  const from = (metadata.from || '').toLowerCase();
  const text = (summary || '').toLowerCase();

  // Check for advertisement keywords
  const adKeywords = ['unsubscribe', 'promotion', 'discount', 'offer', 'sale', 'marketing', 'advertisement'];
  if (adKeywords.some(keyword => text.includes(keyword) || subject.includes(keyword))) {
    return {
      category: EMAIL_CATEGORIES.ADVERTISEMENT,
      summary: 'Marketing or promotional email'
    };
  }

  // Check for notification keywords
  const notificationKeywords = ['notification', 'alert', 'confirmation', 'receipt', 'automated', 'no-reply', 'noreply'];
  if (notificationKeywords.some(keyword => from.includes(keyword) || subject.includes(keyword))) {
    return {
      category: EMAIL_CATEGORIES.NOTIFICATION,
      summary: 'Automated notification or confirmation'
    };
  }

  // Check for response keywords (questions, requests)
  const responseKeywords = ['?', 'please', 'could you', 'can you', 'need', 'request', 'help', 'question'];
  if (responseKeywords.some(keyword => text.includes(keyword) || subject.includes(keyword))) {
    return {
      category: EMAIL_CATEGORIES.RESPOND,
      summary: 'Email requires response or action'
    };
  }

  // Default to notification
  return {
    category: EMAIL_CATEGORIES.NOTIFICATION,
    summary: summary.substring(0, 100)
  };
}

/**
 * Batch classify multiple emails
 * @param {Array<{summary: string, metadata: Object}>} emails - Array of emails to classify
 * @returns {Promise<Array<{category: string, summary: string}>>}
 */
export async function batchClassifyEmails(emails) {
  try {
    const classifications = await Promise.all(
      emails.map(email => classifyEmail(email.summary, email.metadata))
    );
    return classifications;
  } catch (error) {
    console.error('Batch classification failed:', error);
    throw error;
  }
}
