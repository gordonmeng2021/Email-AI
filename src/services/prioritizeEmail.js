import { EMAIL_CATEGORIES } from '../utils/constants.js';

/**
 * Email Prioritization Service
 * Uses Chrome's Writer API to determine priority level (High, Medium, Low) for emails requiring response
 * Reference: https://developer.chrome.com/docs/ai/writer-api
 */

/**
 * Priority levels
 */
export const PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

/**
 * Check if Writer API is available
 * @returns {Promise<string>} 'available', 'after-download', or 'unavailable'
 */
async function checkWriterAvailability() {
  try {
    if (!('Writer' in self)) {
      console.warn('Writer API not supported in this browser');
      return 'unavailable';
    }
    return await self.ai.writer.availability();
  } catch (error) {
    console.error('Error checking Writer API availability:', error);
    return 'unavailable';
  }
}

/**
 * Determine priority level for an email using Writer API
 * @param {string} emailSummary - Summary of email content
 * @param {Object} emailMetadata - Email metadata
 * @returns {Promise<string>} Priority level (High, Medium, Low)
 */
export async function prioritizeEmail(emailSummary, emailMetadata) {
  try {
    // Check Writer API availability
    const availability = await checkWriterAvailability();
    
    if (availability === 'unavailable') {
      console.warn('Writer API unavailable, using fallback prioritization');
      return fallbackPrioritization(emailSummary, emailMetadata);
    }

    // Create writer session
    const writer = await createPrioritizationWriter(availability);

    // Create prioritization task and context
    const task = 'Write the priority level (High, Medium, or Low) for this email.';
    const context = createPrioritizationContext(emailSummary, emailMetadata);

    // Get prioritization from Writer API
    const result = await writer.write(task, { context });
    
    // Clean up
    writer.destroy();

    // Parse and validate result
    return parsePriorityResult(result);
  } catch (error) {
    console.error('Failed to prioritize email with Writer API:', error);
    return fallbackPrioritization(emailSummary, emailMetadata);
  }
}

/**
 * Create a prioritization writer with Writer API
 * @param {string} availability - Availability status
 * @returns {Promise<Object>} Writer session
 */
async function createPrioritizationWriter(availability) {
  const sharedContext = `You are an expert email prioritization assistant. Your job is to:
1. Analyze email content, subject, sender, and context
2. Determine urgency based on:
   - Time sensitivity (deadlines, meetings, urgent requests)
   - Importance of sender (managers, clients, key stakeholders)
   - Action required (decisions needed, questions to answer)
   - Impact (high-priority projects, critical issues)

Priority Levels:
- High: Urgent/time-sensitive, requires immediate attention, from important senders, critical decisions
- Medium: Important but not urgent, can be addressed within 24 hours, standard work emails
- Low: Informational, no immediate action needed, can be addressed later

Respond with ONLY the priority level: High, Medium, or Low. No explanation or additional text.`;

  const options = {
    tone: 'neutral',
    format: 'plain-text',
    length: 'short',
    sharedContext,
    expectedInputLanguages: ['en'],
    expectedContextLanguages: ['en'],
    outputLanguage: 'en'
  };

  if (availability === 'after-download') {
    console.log('Writer API model downloading...');
    return await self.ai.writer.create({
      ...options,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`Writer API model download progress: ${Math.round(e.loaded * 100)}%`);
        });
      }
    });
  } else {
    return await self.ai.writer.create(options);
  }
}

/**
 * Create prioritization context for Writer API
 * @param {string} summary - Email summary
 * @param {Object} metadata - Email metadata
 * @returns {string} Context string
 */
function createPrioritizationContext(summary, metadata) {
  return `Analyze this email and determine its priority:

Subject: ${metadata.subject || 'No subject'}
From: ${metadata.from || 'Unknown sender'}
Date: ${metadata.date || 'Unknown date'}
Category: ${metadata.category || 'Unknown'}
Content: ${summary}`;
}

/**
 * Parse priority result from Writer API response
 * @param {string} result - API response
 * @returns {string} Validated priority level
 */
function parsePriorityResult(result) {
  const cleanResult = result.trim().toLowerCase();
  
  if (cleanResult.includes('high')) {
    return PRIORITY.HIGH;
  } else if (cleanResult.includes('medium')) {
    return PRIORITY.MEDIUM;
  } else if (cleanResult.includes('low')) {
    return PRIORITY.LOW;
  }
  
  // Default to medium if unclear
  return PRIORITY.MEDIUM;
}

/**
 * Fallback prioritization using simple rules
 * @param {string} summary - Email summary
 * @param {Object} metadata - Email metadata
 * @returns {string} Priority level
 */
function fallbackPrioritization(summary, metadata) {
  const subject = (metadata.subject || '').toLowerCase();
  const text = (summary || '').toLowerCase();
  
  // High priority keywords
  const highPriorityKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'deadline', 'today'];
  if (highPriorityKeywords.some(keyword => subject.includes(keyword) || text.includes(keyword))) {
    return PRIORITY.HIGH;
  }
  
  // Low priority indicators
  if (metadata.category === EMAIL_CATEGORIES.NOTIFICATION || 
      metadata.category === EMAIL_CATEGORIES.ADVERTISEMENT) {
    return PRIORITY.LOW;
  }
  
  // Question marks often indicate need for response (medium-high)
  if (subject.includes('?') || text.includes('?')) {
    return PRIORITY.MEDIUM;
  }
  
  // Default to medium
  return PRIORITY.MEDIUM;
}

/**
 * Batch prioritize multiple emails
 * @param {Array<{summary: string, metadata: Object}>} emails - Array of emails to prioritize
 * @returns {Promise<Array<string>>} Array of priority levels
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
