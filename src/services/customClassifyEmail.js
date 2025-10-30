/**
 * Custom Email Classification Service
 * Uses Chrome's Writer API with user-defined prompts to classify emails into custom categories
 * Reference: https://developer.chrome.com/docs/ai/writer-api
 */

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
 * Classify email using custom labels and prompts
 * @param {string} summary - Email summary
 * @param {Object} metadata - Email metadata
 * @param {Array<Object>} customLabels - Array of custom labels with prompts
 * @returns {Promise<Array<string>>} Array of matched label names
 */
export async function classifyWithCustomLabels(summary, metadata, customLabels) {
  try {
    if (!customLabels || customLabels.length === 0) {
      return [];
    }

    // Check Writer API availability
    const availability = await checkWriterAvailability();
    
    if (availability === 'unavailable') {
      console.warn('Writer API unavailable, skipping custom classification');
      return [];
    }

    // Test each custom label
    const results = await Promise.all(
      customLabels.map(label => 
        classifyAgainstLabel(summary, metadata, label, availability)
      )
    );

    // Return labels that matched
    return customLabels
      .filter((_, index) => results[index])
      .map(label => label.name);
      
  } catch (error) {
    console.error('Custom classification failed:', error);
    return [];
  }
}

/**
 * Classify email against a single custom label using Writer API
 * @param {string} summary - Email summary
 * @param {Object} metadata - Email metadata
 * @param {Object} label - Custom label with prompt
 * @param {string} availability - Writer API availability
 * @returns {Promise<boolean>} True if email matches the label criteria
 */
async function classifyAgainstLabel(summary, metadata, label, availability) {
  let writer = null;
  
  try {
    // Create writer session for this label
    writer = await createCustomClassificationWriter(label, availability);
    
    // Create task and context
    const task = 'Write "YES" if this email matches the criteria, or "NO" if it does not.';
    const context = createCustomClassificationContext(summary, metadata);

    // Get response from Writer API
    const response = await writer.write(task, { context });
    
    // Parse response (YES/NO)
    const matches = response.trim().toUpperCase().includes('YES');
    
    return matches;
  } catch (error) {
    console.error(`Failed to classify against label "${label.name}":`, error);
    return false;
  } finally {
    if (writer) {
      writer.destroy();
    }
  }
}

/**
 * Create a custom classification writer with Writer API
 * @param {Object} label - Custom label with prompt
 * @param {string} availability - Availability status
 * @returns {Promise<Object>} Writer session
 */
async function createCustomClassificationWriter(label, availability) {
  const sharedContext = `You are an email classification assistant. Your job is to determine if an email matches specific criteria.

Criteria for label "${label.name}":
${label.prompt}

Respond with ONLY "YES" if the email matches these criteria, or "NO" if it does not. No explanation needed.`;

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
 * Create custom classification context
 * @param {string} summary - Email summary
 * @param {Object} metadata - Email metadata
 * @returns {string} Context string
 */
function createCustomClassificationContext(summary, metadata) {
  return `Email to classify:

Subject: ${metadata.subject || 'No subject'}
From: ${metadata.from || 'Unknown sender'}
Date: ${metadata.date || 'Unknown date'}
Content: ${summary}`;
}

/**
 * Get custom labels from storage
 * @returns {Promise<Array<Object>>} Array of custom labels
 */
export async function getCustomLabels() {
  try {
    const result = await chrome.storage.sync.get(['customLabels']);
    return result.customLabels || [];
  } catch (error) {
    console.error('Failed to get custom labels:', error);
    return [];
  }
}

/**
 * Save custom labels to storage
 * @param {Array<Object>} labels - Array of custom labels
 * @returns {Promise<void>}
 */
export async function saveCustomLabels(labels) {
  try {
    await chrome.storage.sync.set({ customLabels: labels });
  } catch (error) {
    console.error('Failed to save custom labels:', error);
    throw error;
  }
}
