import { getApiKeys } from '../utils/storage.js';
import { API_ENDPOINTS, getOpenRouterHeaders, OPENROUTER_CONFIG, API_TIMEOUT } from '../config/apiConfig.js';
import { API_CONFIG_KEYS } from '../utils/constants.js';

/**
 * Email Priority Classification Service
 * Uses LLM to determine priority level (High, Medium, Low) for emails requiring response
 */

export const PRIORITY_LEVELS = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

/**
 * Determine priority level for an email
 * @param {string} emailSummary - Summarized email content
 * @param {Object} emailMetadata - Email metadata (subject, sender, etc.)
 * @returns {Promise<{priority: string, reasoning: string}>}
 */
export async function prioritizeEmail(emailSummary, emailMetadata = {}) {
  try {
    // Get API key from storage
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.OPENROUTER];

    if (!apiKey) {
      console.warn('OpenRouter API key not configured, using fallback prioritization');
      return fallbackPrioritization(emailSummary, emailMetadata);
    }

    // Create prioritization prompt
    const prompt = createPrioritizationPrompt(emailSummary, emailMetadata);

    // Make API request
    const result = await makePrioritizationRequest(prompt, apiKey);
    return result;
  } catch (error) {
    console.error('Failed to prioritize email:', error);
    // Fallback to simple prioritization
    return fallbackPrioritization(emailSummary, emailMetadata);
  }
}

/**
 * Create prioritization prompt for AI
 * @param {string} summary - Email summary
 * @param {Object} metadata - Email metadata
 * @returns {string} Prioritization prompt
 */
function createPrioritizationPrompt(summary, metadata) {
  return `You are an email prioritization assistant. Analyze the following email and determine its priority level.

Priority Definitions:
- HIGH: Urgent matters, deadlines, important decisions, VIP senders, critical issues
- MEDIUM: Normal work requests, questions needing response, scheduled matters
- LOW: FYI emails, non-urgent inquiries, informational content

Email Subject: ${metadata.subject || 'No subject'}
Email From: ${metadata.from || 'Unknown sender'}
Email Date: ${metadata.date || 'Unknown date'}
Email Summary: ${summary}

Respond ONLY with valid JSON in this exact format:
{
  "priority": "High|Medium|Low",
  "reasoning": "Brief explanation (max 50 chars)"
}`;
}

/**
 * Make prioritization API request to OpenRouter
 * @param {string} prompt - Prioritization prompt
 * @param {string} apiKey - OpenRouter API key
 * @returns {Promise<{priority: string, reasoning: string}>}
 */
async function makePrioritizationRequest(prompt, apiKey) {
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
        temperature: 0.3, // Lower temperature for more consistent prioritization
        max_tokens: 200
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
    const result = parsePrioritizationResponse(content);
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Parse prioritization response
 * @param {string} content - Response content
 * @returns {Object} Parsed prioritization
 */
function parsePrioritizationResponse(content) {
  try {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate priority
      const validPriorities = Object.values(PRIORITY_LEVELS);
      const priority = validPriorities.includes(parsed.priority)
        ? parsed.priority
        : PRIORITY_LEVELS.MEDIUM;

      return {
        priority,
        reasoning: parsed.reasoning || 'No reasoning provided'
      };
    }

    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Failed to parse prioritization response:', error);
    return {
      priority: PRIORITY_LEVELS.MEDIUM,
      reasoning: 'Prioritization failed'
    };
  }
}

/**
 * Fallback prioritization using simple rules
 * @param {string} summary - Email summary
 * @param {Object} metadata - Email metadata
 * @returns {Object} Prioritization result
 */
function fallbackPrioritization(summary, metadata) {
  const subject = (metadata.subject || '').toLowerCase();
  const from = (metadata.from || '').toLowerCase();
  const text = (summary || '').toLowerCase();

  // Check for high priority keywords
  const urgentKeywords = ['urgent', 'asap', 'important', 'critical', 'deadline', 'emergency', 'immediately', 'priority'];
  if (urgentKeywords.some(keyword => text.includes(keyword) || subject.includes(keyword))) {
    return {
      priority: PRIORITY_LEVELS.HIGH,
      reasoning: 'Urgent keywords detected'
    };
  }

  // Check for question marks (questions typically need responses)
  const questionCount = (text.match(/\?/g) || []).length + (subject.match(/\?/g) || []).length;
  if (questionCount >= 2) {
    return {
      priority: PRIORITY_LEVELS.MEDIUM,
      reasoning: 'Multiple questions detected'
    };
  }

  // Check for low priority keywords
  const lowPriorityKeywords = ['fyi', 'for your information', 'heads up', 'just letting you know'];
  if (lowPriorityKeywords.some(keyword => text.includes(keyword) || subject.includes(keyword))) {
    return {
      priority: PRIORITY_LEVELS.LOW,
      reasoning: 'Informational content'
    };
  }

  // Default to medium priority
  return {
    priority: PRIORITY_LEVELS.MEDIUM,
    reasoning: 'Standard request'
  };
}

/**
 * Batch prioritize multiple emails
 * @param {Array<{summary: string, metadata: Object}>} emails - Array of emails to prioritize
 * @returns {Promise<Array<{priority: string, reasoning: string}>>}
 */
export async function batchPrioritizeEmails(emails) {
  try {
    const priorities = await Promise.all(
      emails.map(email => prioritizeEmail(email.summary, email.metadata))
    );
    return priorities;
  } catch (error) {
    console.error('Batch prioritization failed:', error);
    throw error;
  }
}

