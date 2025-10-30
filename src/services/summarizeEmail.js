/**
 * Email Summarization Service
 * Uses Chrome's built-in Summarizer API (Gemini Nano) to compress and extract meaning from raw email text
 * Reference: https://developer.chrome.com/docs/ai/summarizer-api
 */

/**
 * Check if Summarizer API is available
 * @returns {Promise<string>} 'available', 'after-download', or 'unavailable'
 */
async function checkSummarizerAvailability() {
  try {
    if (!('Summarizer' in self)) {
      console.warn('Summarizer API not supported in this browser');
      return 'unavailable';
    }
    return await self.Summarizer.availability();
  } catch (error) {
    console.error('Error checking Summarizer API availability:', error);
    return 'unavailable';
  }
}

/**
 * Summarize email content using Chrome's Summarizer API
 * @param {string} emailContent - Raw email content to summarize
 * @returns {Promise<string>} Summarized text
 */
export async function summarizeEmail(emailContent) {
  try {
    // Check Summarizer API availability
    console.log('Checking Summarizer API availability...');
    const availability = await checkSummarizerAvailability();
    console.log('Summarizer API availability:', availability);
    if (availability === 'unavailable') {
      console.warn('Summarizer API unavailable, using truncated content');
      return emailContent.substring(0, 500) + '...';
    }

    // Clean the content - remove HTML if present
    const cleanContent = emailContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (cleanContent.length < 50) {
      // Content too short to summarize
      return cleanContent;
    }

    // Create summarizer with appropriate options for email
    const summarizer = await createSummarizer(availability, 'tldr', 'short');
    
    // Summarize the content
    const summary = await summarizer.summarize(cleanContent, {
      context: 'This is an email that needs to be condensed into a brief summary.'
    });
    
    // Clean up
    summarizer.destroy();
    
    return summary || cleanContent.substring(0, 500) + '...';
  } catch (error) {
    console.error('Failed to summarize email:', error);
    // Fallback to truncated content
    return emailContent.substring(0, 500) + '...';
  }
}

/**
 * Create a summarizer session
 * @param {string} availability - Availability status
 * @param {string} type - Type of summary (tldr, key-points, teaser, headline)
 * @param {string} length - Length (short, medium, long)
 * @returns {Promise<Object>} Summarizer instance
 */
async function createSummarizer(availability, type = 'tldr', length = 'short') {
  const options = {
    type,
    length,
    format: 'plain-text',
    sharedContext: 'Summarizing email content for quick understanding.'
  };

  if (availability === 'after-download') {
    console.log('Summarizer model downloading...');
    return await self.Summarizer.create({
      ...options,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`Summarizer model download progress: ${Math.round(e.loaded * 100)}%`);
        });
      }
    });
  } else {
    return await self.Summarizer.create(options);
  }
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
 * Extract key points from email using Summarizer API
 * @param {string} emailContent - Email content
 * @returns {Promise<Array<string>>} Array of key points
 */
export async function extractKeyPoints(emailContent) {
  try {
    const availability = await checkSummarizerAvailability();
    
    if (availability === 'unavailable') {
      return ['Summary not available - Summarizer API unavailable'];
    }

    // Clean the content
    const cleanContent = emailContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (cleanContent.length < 50) {
      return [cleanContent];
    }

    // Create summarizer for key-points extraction
    const summarizer = await createSummarizer(availability, 'key-points', 'short');
    
    // Extract key points (returns as markdown bullet list)
    const keyPointsText = await summarizer.summarize(cleanContent, {
      context: 'Extract the most important points from this email.'
    });
    
    // Clean up
    summarizer.destroy();
    
    // Parse markdown bullet points into array
    const keyPoints = keyPointsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- ') || line.startsWith('* '))
      .map(line => line.substring(2).trim());
    
    return keyPoints.length > 0 ? keyPoints : [keyPointsText];
  } catch (error) {
    console.error('Failed to extract key points:', error);
    return [];
  }
}

/**
 * Create headline for email using Summarizer API
 * @param {string} emailContent - Email content
 * @returns {Promise<string>} Generated headline
 */
export async function createHeadline(emailContent) {
  try {
    const availability = await checkSummarizerAvailability();
    
    if (availability === 'unavailable') {
      return 'Email';
    }

    const cleanContent = emailContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (cleanContent.length < 20) {
      return cleanContent;
    }

    const summarizer = await createSummarizer(availability, 'headline', 'short');
    const headline = await summarizer.summarize(cleanContent, {
      context: 'Create a brief headline that captures the main point.'
    });
    
    summarizer.destroy();
    return headline;
  } catch (error) {
    console.error('Failed to create headline:', error);
    return 'Email';
  }
}
