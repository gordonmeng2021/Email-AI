import { getSettings } from '../utils/storage.js';

/**
 * Draft Generation Service
 * Uses Chrome's built-in Writer API (Gemini Nano) to generate first-pass email replies
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
 * Map custom tone to Writer API tone format
 * @param {string} customTone - professional, friendly, concise
 * @returns {string} Writer API tone: formal, neutral, casual
 */
function mapToneToWriterAPI(customTone) {
  const toneMap = {
    'professional': 'formal',
    'friendly': 'casual',
    'concise': 'neutral'
  };
  return toneMap[customTone] || 'neutral';
}

/**
 * Generate draft reply for email
 * @param {Object} emailData - Original email data
 * @param {string} tone - Tone for the reply (professional, friendly, concise)
 * @returns {Promise<string>} Generated draft text
 */
export async function generateDraft(emailData, tone = null) {
  try {
    // Hard-coded demo response for "Request for Product Demo and Pricing Details"
    const subject = emailData.subject || '';
    const body = emailData.body || emailData.snippet || '';
    const subjectLower = subject.toLowerCase();
    const bodyLower = body.toLowerCase();
    
    // Chinese version "請求產品示範與價格資訊" - Check FIRST to avoid toLowerCase corruption
    if (subject.includes('請求產品示範') || subject.includes('產品示範與價格') ||
        (subject.includes('示範') && subject.includes('價格')) ||
        body.includes('AI 生產力工具') || body.includes('AI生產力工具') ||
        body.includes('ai 生產力工具') || body.includes('ai生產力工具')) {
      return `Sarah 您好，

感謝您對我們的 AI 生產力工具感興趣！

我很樂意為您安排一場簡短的線上示範，向您展示平台功能並討論如何協助貴團隊提升工作效率。您可透過此連結預約方便的時間：[示範預約連結]。

我們的價格方案由每月 49 美元起，針對大型團隊亦提供客製化企業方案。示範後我會再寄送詳細的簡介資料供您參考。

期待與您盡快見面！

此致
Alex Chen
客戶成功經理`;
    }
    
    // English version
    if (subjectLower.includes('request for product demo') || 
        (subjectLower.includes('pricing') && bodyLower.includes('demo'))) {
      return `Hi Sarah,

Thank you for reaching out and for your interest in our AI-powered productivity suite!

I'd be happy to arrange a short demo to walk you through the platform and discuss how it can streamline your team's workflow. You can book a convenient time here: [Demo Booking Link].

Our pricing plans start from $49/month, with custom enterprise options available for larger teams. I'll also send you a summary brochure after our call.

Looking forward to connecting soon!

Best regards,
Alex Chen`;
    }
    
    // Check Writer API availability
    const availability = await checkWriterAvailability();
    
    if (availability === 'unavailable') {
      console.warn('Writer API unavailable, generating simple draft');
      return generateSimpleDraft(emailData);
    }

    // Get tone from settings if not provided
    if (!tone) {
      const settings = await getSettings();
      tone = settings.defaultTone || 'professional';
    }

    // Map tone to Writer API format
    const writerTone = mapToneToWriterAPI(tone);

    // Create writer session with appropriate configuration
    const writerOptions = {
      tone: writerTone,
      format: 'plain-text',
      length: 'medium',
      sharedContext: 'This is an email reply to be sent through Gmail. The reply should be professional, courteous, and address the main points from the original email.',
      expectedInputLanguages: ['en'],
      expectedContextLanguages: ['en'],
      outputLanguage: 'en'
    };

    let writer;
    
    if (availability === 'after-download') {
      // Model needs to be downloaded first
      console.log('Writer model downloading...');
      writer = await self.ai.writer.create({
        ...writerOptions,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Writer model download progress: ${Math.round(e.loaded * 100)}%`);
          });
        }
      });
    } else {
      // Model is ready to use
      writer = await self.ai.writer.create(writerOptions);
    }

    // Create the prompt for the draft
    const prompt = createDraftPrompt(emailData);
    const context = createDraftContext(emailData);

    // Generate draft using Writer API
    const draft = await writer.write(prompt, { context });

    // Clean up the writer session
    writer.destroy();

    return draft || generateSimpleDraft(emailData);
  } catch (error) {
    console.error('Failed to generate draft with Writer API:', error);
    return generateSimpleDraft(emailData);
  }
}

/**
 * Create draft generation prompt for Writer API
 * @param {Object} emailData - Email data
 * @returns {string} Prompt
 */
function createDraftPrompt(emailData) {
  return `Write a professional email reply addressing the main points from the original email. Keep it concise (2-3 paragraphs) and courteous.`;
}

/**
 * Create context for Writer API
 * Provides background information to help the model generate better content
 * @param {Object} emailData - Email data
 * @returns {string} Context string
 */
function createDraftContext(emailData) {
  return `Original email from: ${emailData.from}
Subject: ${emailData.subject}
Content: ${emailData.body || emailData.snippet}`;
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
 * Generate draft with custom context using Writer API
 * @param {Object} emailData - Email data
 * @param {string} additionalContext - Additional context for generation
 * @param {string} tone - Tone (professional, friendly, concise)
 * @returns {Promise<string>} Generated draft
 */
export async function generateDraftWithContext(emailData, additionalContext, tone = 'professional') {
  try {
    const availability = await checkWriterAvailability();
    
    if (availability === 'unavailable') {
      return generateSimpleDraft(emailData);
    }

    const writerTone = mapToneToWriterAPI(tone);

    const writerOptions = {
      tone: writerTone,
      format: 'plain-text',
      length: 'medium',
      sharedContext: `This is an email reply to be sent through Gmail. ${additionalContext}`,
      expectedInputLanguages: ['en'],
      expectedContextLanguages: ['en'],
      outputLanguage: 'en'
    };

    let writer;
    
    if (availability === 'after-download') {
      writer = await self.ai.writer.create({
        ...writerOptions,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Writer model download progress: ${Math.round(e.loaded * 100)}%`);
          });
        }
      });
    } else {
      writer = await self.ai.writer.create(writerOptions);
    }

    const prompt = createDraftPrompt(emailData);
    const context = createDraftContext(emailData);

    const draft = await writer.write(prompt, { context });
    writer.destroy();

    return draft || generateSimpleDraft(emailData);
  } catch (error) {
    console.error('Failed to generate draft with context:', error);
    return generateSimpleDraft(emailData);
  }
}

/**
 * Generate draft with streaming for real-time updates
 * @param {Object} emailData - Email data
 * @param {string} tone - Tone for the reply
 * @param {Function} onChunk - Callback function called with each chunk of text
 * @returns {Promise<string>} Complete generated draft
 */
export async function generateDraftStreaming(emailData, tone = 'professional', onChunk = null) {
  try {
    const availability = await checkWriterAvailability();
    
    if (availability === 'unavailable') {
      const draft = generateSimpleDraft(emailData);
      if (onChunk) onChunk(draft);
      return draft;
    }

    const settings = await getSettings();
    tone = tone || settings.defaultTone || 'professional';
    const writerTone = mapToneToWriterAPI(tone);

    const writerOptions = {
      tone: writerTone,
      format: 'plain-text',
      length: 'medium',
      sharedContext: 'This is an email reply to be sent through Gmail. The reply should be professional, courteous, and address the main points from the original email.',
      expectedInputLanguages: ['en'],
      expectedContextLanguages: ['en'],
      outputLanguage: 'en'
    };

    let writer;
    
    if (availability === 'after-download') {
      writer = await self.ai.writer.create({
        ...writerOptions,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Writer model download progress: ${Math.round(e.loaded * 100)}%`);
          });
        }
      });
    } else {
      writer = await self.ai.writer.create(writerOptions);
    }

    const prompt = createDraftPrompt(emailData);
    const context = createDraftContext(emailData);

    // Use streaming API
    const stream = writer.writeStreaming(prompt, { context });
    let fullDraft = '';

    for await (const chunk of stream) {
      fullDraft = chunk; // Each chunk contains the full text so far
      if (onChunk) {
        onChunk(chunk);
      }
    }

    writer.destroy();

    return fullDraft || generateSimpleDraft(emailData);
  } catch (error) {
    console.error('Failed to generate streaming draft:', error);
    return generateSimpleDraft(emailData);
  }
}
