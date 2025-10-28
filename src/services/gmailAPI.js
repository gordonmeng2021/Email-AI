import { getValidToken } from '../utils/auth.js';
import { API_ENDPOINTS, getGmailHeaders } from '../config/apiConfig.js';
import { EMAIL_CATEGORIES } from '../utils/constants.js';

/**
 * Gmail API Service
 * Handles all Gmail API operations: fetching emails, creating labels, drafts, etc.
 */

/**
 * Fetch unread emails from Gmail
 * @param {number} maxResults - Maximum number of emails to fetch (default: 10)
 * @returns {Promise<Array>} Array of email objects
 */
export async function fetchUnreadEmails(maxResults = 10) {
  try {
    const token = await getValidToken();
    const headers = getGmailHeaders(token);

    // Get list of unread message IDs
    const listUrl = `${API_ENDPOINTS.GMAIL_MESSAGES}?q=is:unread&maxResults=${maxResults}`;
    const listResponse = await fetch(listUrl, { headers });

    if (!listResponse.ok) {
      throw new Error(`Failed to fetch email list: ${listResponse.statusText}`);
    }

    const listData = await listResponse.json();
    const messages = listData.messages || [];

    if (messages.length === 0) {
      return [];
    }

    // Fetch full details for each message
    const emailPromises = messages.map(msg => fetchEmailDetails(msg.id, token));
    const emails = await Promise.all(emailPromises);

    return emails;
  } catch (error) {
    console.error('Failed to fetch unread emails:', error);
    throw error;
  }
}

/**
 * Fetch email details by ID
 * @param {string} emailId - Email ID
 * @param {string} token - OAuth token (optional)
 * @returns {Promise<Object>} Email object with details
 */
export async function fetchEmailDetails(emailId, token = null) {
  try {
    if (!token) {
      token = await getValidToken();
    }

    const headers = getGmailHeaders(token);
    const url = `${API_ENDPOINTS.GMAIL_MESSAGES}/${emailId}?format=full`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch email details: ${response.statusText}`);
    }

    const data = await response.json();

    // Parse email data
    return parseEmailData(data);
  } catch (error) {
    console.error('Failed to fetch email details:', error);
    throw error;
  }
}

/**
 * Parse raw Gmail API email data into structured format
 * @param {Object} rawData - Raw email data from Gmail API
 * @returns {Object} Parsed email object
 */
function parseEmailData(rawData) {
  const headers = rawData.payload.headers;
  const getHeader = (name) => {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  };

  // Extract email body
  let body = '';
  if (rawData.payload.body && rawData.payload.body.data) {
    body = decodeBase64(rawData.payload.body.data);
  } else if (rawData.payload.parts) {
    // Check for text/plain or text/html parts
    const textPart = rawData.payload.parts.find(part =>
      part.mimeType === 'text/plain' || part.mimeType === 'text/html'
    );
    if (textPart && textPart.body && textPart.body.data) {
      body = decodeBase64(textPart.body.data);
    }
  }

  return {
    id: rawData.id,
    threadId: rawData.threadId,
    subject: getHeader('Subject'),
    from: getHeader('From'),
    to: getHeader('To'),
    date: getHeader('Date'),
    body: body,
    snippet: rawData.snippet,
    labelIds: rawData.labelIds || []
  };
}

/**
 * Decode base64url encoded string
 * @param {string} str - Base64url encoded string
 * @returns {string} Decoded string
 */
function decodeBase64(str) {
  try {
    // Replace URL-safe characters
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Decode from base64
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    console.error('Failed to decode base64:', error);
    return str;
  }
}

/**
 * Create or get Gmail label
 * @param {string} labelName - Name of the label
 * @returns {Promise<string>} Label ID
 */
export async function createOrGetLabel(labelName) {
  try {
    const token = await getValidToken();
    const headers = getGmailHeaders(token);

    // Get existing labels
    const labelsResponse = await fetch(API_ENDPOINTS.GMAIL_LABELS, { headers });

    if (!labelsResponse.ok) {
      throw new Error(`Failed to fetch labels: ${labelsResponse.statusText}`);
    }

    const labelsData = await labelsResponse.json();
    const existingLabel = labelsData.labels?.find(label => label.name === labelName);

    if (existingLabel) {
      return existingLabel.id;
    }

    // Create new label if it doesn't exist
    const createResponse = await fetch(API_ENDPOINTS.GMAIL_LABELS, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show'
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create label: ${createResponse.statusText}`);
    }

    const newLabel = await createResponse.json();
    return newLabel.id;
  } catch (error) {
    console.error('Failed to create or get label:', error);
    throw error;
  }
}

/**
 * Apply label to email
 * @param {string} emailId - Email ID
 * @param {string} category - Email category (Notification, Respond, Advertisement)
 * @returns {Promise<void>}
 */
export async function applyLabel(emailId, category) {
  try {
    const token = await getValidToken();
    const headers = getGmailHeaders(token);

    // Get or create label
    const labelId = await createOrGetLabel(category);

    // Apply label to email
    const url = `${API_ENDPOINTS.GMAIL_MESSAGES}/${emailId}/modify`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        addLabelIds: [labelId]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to apply label: ${response.statusText}`);
    }

    console.log(`Applied label "${category}" to email ${emailId}`);
  } catch (error) {
    console.error('Failed to apply label:', error);
    throw error;
  }
}

/**
 * Create draft email
 * @param {string} threadId - Thread ID to reply to
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {Promise<Object>} Created draft object
 */
export async function createDraft(threadId, to, subject, body) {
  try {
    const token = await getValidToken();
    const headers = getGmailHeaders(token);

    // Create email message in RFC 2822 format
    const email = [
      `To: ${to}`,
      `Subject: Re: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].join('\n');

    // Encode to base64url
    const encodedMessage = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const draftBody = {
      message: {
        raw: encodedMessage,
        threadId: threadId
      }
    };

    const response = await fetch(API_ENDPOINTS.GMAIL_DRAFTS, {
      method: 'POST',
      headers,
      body: JSON.stringify(draftBody)
    });

    if (!response.ok) {
      throw new Error(`Failed to create draft: ${response.statusText}`);
    }

    const draft = await response.json();
    console.log(`Created draft for thread ${threadId}`);
    return draft;
  } catch (error) {
    console.error('Failed to create draft:', error);
    throw error;
  }
}

/**
 * Get emails by label
 * @param {string} category - Email category (Notification, Respond, Advertisement)
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} Array of emails
 */
export async function getEmailsByLabel(category, maxResults = 5) {
  try {
    const token = await getValidToken();
    const headers = getGmailHeaders(token);

    // Get label ID
    const labelId = await createOrGetLabel(category);

    // Fetch emails with this label
    const url = `${API_ENDPOINTS.GMAIL_MESSAGES}?labelIds=${labelId}&maxResults=${maxResults}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch emails by label: ${response.statusText}`);
    }

    const data = await response.json();
    const messages = data.messages || [];

    if (messages.length === 0) {
      return [];
    }

    // Fetch full details for each message
    const emailPromises = messages.map(msg => fetchEmailDetails(msg.id, token));
    const emails = await Promise.all(emailPromises);

    return emails;
  } catch (error) {
    console.error('Failed to get emails by label:', error);
    throw error;
  }
}

/**
 * Mark email as read
 * @param {string} emailId - Email ID
 * @returns {Promise<void>}
 */
export async function markAsRead(emailId) {
  try {
    const token = await getValidToken();
    const headers = getGmailHeaders(token);

    const url = `${API_ENDPOINTS.GMAIL_MESSAGES}/${emailId}/modify`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        removeLabelIds: ['UNREAD']
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to mark as read: ${response.statusText}`);
    }

    console.log(`Marked email ${emailId} as read`);
  } catch (error) {
    console.error('Failed to mark as read:', error);
    throw error;
  }
}
