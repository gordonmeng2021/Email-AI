/**
 * Background Service Worker
 * Main orchestrator for email processing pipeline
 * Handles: email fetching, classification, labeling, and draft generation
 */

import { fetchUnreadEmails, applyLabel, createDraft } from '../services/gmailAPI.js';
import { summarizeEmail } from '../services/summarizeEmail.js';
import { classifyEmail } from '../services/classifyEmail.js';
import { customClassifyEmail } from '../services/customClassifyEmail.js';
import { generateDraft } from '../services/generateDraft.js';
import { rewriteDraft } from '../services/rewriteDraft.js';
import { translateDraftIfNeeded } from '../services/translateDraft.js';
import { proofreadDraft } from '../services/proofreadDraft.js';
import {
  getSettings,
  markEmailAsProcessed,
  isEmailProcessed,
  incrementStatistic,
  updateStatistics,
  setStorage
} from '../utils/storage.js';
import { isAuthenticated } from '../utils/auth.js';
import { EMAIL_CATEGORIES, PROCESSING_STATUS, STORAGE_KEYS } from '../utils/constants.js';

// Processing state
let isProcessing = false;
let processingQueue = [];

/**
 * Initialize background service worker
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Email AI installed');

  // Set up periodic sync alarm
  chrome.alarms.create('emailSync', {
    delayInMinutes: 1,
    periodInMinutes: 1
  });
});

/**
 * Handle alarm events (periodic sync)
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'emailSync') {
    await syncEmails();
  }
});

/**
 * Handle messages from popup/content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'SYNC_EMAILS':
          await syncEmails();
          sendResponse({ success: true });
          break;

        case 'PROCESS_EMAIL':
          const result = await processEmail(message.emailId);
          sendResponse({ success: true, result });
          break;

        case 'GET_PROCESSING_STATUS':
          sendResponse({
            isProcessing,
            queueLength: processingQueue.length
          });
          break;

        case 'PING':
          sendResponse({ success: true, message: 'pong' });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Return true to indicate async response
  return true;
});

/**
 * Main email sync function
 * Fetches new emails and processes them through AI pipeline
 */
async function syncEmails() {
  try {
    // Check if user is authenticated
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.log('User not authenticated, skipping sync');
      return;
    }

    // Check if auto-sync is enabled
    const settings = await getSettings();
    if (!settings.autoSync) {
      console.log('Auto-sync disabled, skipping');
      return;
    }

    // Prevent concurrent processing
    if (isProcessing) {
      console.log('Already processing emails, skipping this sync');
      return;
    }

    isProcessing = true;
    console.log('Starting email sync...');

    // Fetch unread emails
    const emails = await fetchUnreadEmails(10);
    console.log(`Found ${emails.length} unread emails`);

    if (emails.length === 0) {
      isProcessing = false;
      return;
    }

    // Process each email
    let processedCount = 0;
    for (const email of emails) {
      try {
        // Skip if already processed
        const alreadyProcessed = await isEmailProcessed(email.id);
        if (alreadyProcessed) {
          console.log(`Email ${email.id} already processed, skipping`);
          continue;
        }

        // Process email through AI pipeline
        await processEmail(email);
        processedCount++;

        // Mark as processed
        await markEmailAsProcessed(email.id);
      } catch (error) {
        console.error(`Failed to process email ${email.id}:`, error);
      }
    }

    console.log(`Email sync completed. Processed ${processedCount} emails.`);
    isProcessing = false;

    // Update statistics
    if (processedCount > 0) {
      await incrementStatistic('emailsProcessed', processedCount);
    }

    // Save last sync timestamp
    await setStorage({ [STORAGE_KEYS.LAST_SYNC]: Date.now() });
  } catch (error) {
    console.error('Email sync failed:', error);
    isProcessing = false;
  }
}

/**
 * Process single email through AI pipeline
 * Pipeline: Summarize → Classify → Label → [If Respond: Draft → Rewrite → Translate → Proofread → Create Draft]
 * @param {Object} email - Email object
 * @returns {Promise<Object>} Processing result
 */
async function processEmail(email) {
  console.log(`Processing email ${email.id}: "${email.subject}"`);

  try {
    // Step 1: Summarize email content
    console.log('Step 1: Summarizing email...');
    const summary = await summarizeEmail(email.body || email.snippet);

    // Step 2: Classify email
    console.log('Step 2: Classifying email...');
    const classification = await classifyEmail(summary, {
      subject: email.subject,
      from: email.from
    });

    console.log(`Classified as: ${classification.category}`);

    // Step 3: Apply label in Gmail
    console.log('Step 3: Applying label...');
    const settings = await getSettings();
    if (settings.autoApplyLabels) {
      await applyLabel(email.id, classification.category);
    }

    // Note: Priority calculation is now done on-demand in the UI when user opens Respond tab
    // This improves background processing speed and only generates priorities when needed

    // Step 3c: Check custom labels
    console.log('Step 3c: Checking custom labels...');
    let customLabels = [];
    try {
      customLabels = await customClassifyEmail(summary, {
        subject: email.subject,
        from: email.from
      });
      
      // Apply custom labels to Gmail
      if (customLabels.length > 0 && settings.autoApplyLabels) {
        for (const labelName of customLabels) {
          await applyLabel(email.id, labelName);
        }
        console.log(`Applied custom labels: ${customLabels.join(', ')}`);
      }
    } catch (error) {
      console.error('Failed to check custom labels:', error);
    }

    // Step 4: If category is "Respond", generate draft reply
    if (classification.category === EMAIL_CATEGORIES.RESPOND && settings.autoDraft) {
      console.log('Step 4: Generating draft reply...');
      await generateDraftReply(email);

      // Increment drafts generated counter
      await incrementStatistic('draftsGenerated', 1);

      // Estimate time saved (assume 5 minutes per email)
      const currentStats = await incrementStatistic('hoursSaved', 5 / 60);
    }

    return {
      success: true,
      emailId: email.id,
      category: classification.category,
      summary: classification.summary,
      customLabels: customLabels
    };
  } catch (error) {
    console.error(`Failed to process email ${email.id}:`, error);
    return {
      success: false,
      emailId: email.id,
      error: error.message
    };
  }
}

/**
 * Generate draft reply for email
 * Pipeline: Generate → Rewrite → Translate → Proofread → Create Draft
 * @param {Object} email - Email object
 * @returns {Promise<Object>} Draft object
 */
async function generateDraftReply(email) {
  try {
    // Step 1: Generate initial draft
    console.log('  4a: Generating initial draft...');
    let draft = await generateDraft(email);

    // Step 2: Rewrite for polish
    console.log('  4b: Rewriting draft...');
    draft = await rewriteDraft(draft);

    // Step 3: Translate if needed
    console.log('  4c: Translating if needed...');
    draft = await translateDraftIfNeeded(draft, email.body || email.snippet);

    // Step 4: Proofread
    console.log('  4d: Proofreading draft...');
    draft = await proofreadDraft(draft);

    // Step 5: Create draft in Gmail
    console.log('  4e: Creating draft in Gmail...');
    const created = await createDraft(
      email.threadId,
      email.from,
      email.subject,
      draft
    );

    console.log(`Draft created successfully for email ${email.id}`);
    return created;
  } catch (error) {
    console.error('Failed to generate draft reply:', error);
    throw error;
  }
}

/**
 * Force sync emails (triggered manually from popup)
 */
async function forceSyncEmails() {
  isProcessing = false; // Reset processing flag
  await syncEmails();
}

/**
 * Clear processing queue
 */
function clearQueue() {
  processingQueue = [];
  isProcessing = false;
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    syncEmails,
    processEmail,
    generateDraftReply
  };
}

console.log('Background service worker initialized');
