import { getApiKeys, getSettings } from '../utils/storage.js';
import { API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/apiConfig.js';
import { API_CONFIG_KEYS } from '../utils/constants.js';

/**
 * Translation Service
 * Detects language and translates draft replies if needed
 */

/**
 * Detect language of text
 * @param {string} text - Text to analyze
 * @returns {Promise<string>} Detected language code (e.g., 'en', 'es', 'fr')
 */
export async function detectLanguage(text) {
  try {
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.TRANSLATOR];

    if (!apiKey) {
      // Simple fallback detection
      return simpleLanguageDetection(text);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(API_ENDPOINTS.TRANSLATOR, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        text: text,
        task: 'detect'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.language || data.detected_language || 'en';
  } catch (error) {
    console.error('Failed to detect language:', error);
    return simpleLanguageDetection(text);
  }
}

/**
 * Simple language detection fallback
 * @param {string} text - Text to analyze
 * @returns {string} Language code
 */
function simpleLanguageDetection(text) {
  // Very basic detection - check for common non-English characters
  const hasSpanishChars = /[áéíóúñ¿¡]/i.test(text);
  const hasFrenchChars = /[àâçèéêëîïôùûü]/i.test(text);
  const hasGermanChars = /[äöüß]/i.test(text);
  const hasCyrillicChars = /[а-яА-Я]/i.test(text);
  const hasChineseChars = /[\u4e00-\u9fa5]/.test(text);
  const hasJapaneseChars = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);

  if (hasCyrillicChars) return 'ru';
  if (hasChineseChars) return 'zh';
  if (hasJapaneseChars) return 'ja';
  if (hasSpanishChars) return 'es';
  if (hasFrenchChars) return 'fr';
  if (hasGermanChars) return 'de';

  return 'en'; // Default to English
}

/**
 * Translate text to target language
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (optional)
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, targetLang, sourceLang = null) {
  try {
    const apiKeys = await getApiKeys();
    const apiKey = apiKeys[API_CONFIG_KEYS.TRANSLATOR];

    if (!apiKey) {
      console.warn('Translator API key not configured, returning original text');
      return text;
    }

    // If source and target are the same, no translation needed
    if (sourceLang === targetLang) {
      return text;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const requestBody = {
      text: text,
      target_language: targetLang,
      task: 'translate'
    };

    if (sourceLang) {
      requestBody.source_language = sourceLang;
    }

    const response = await fetch(API_ENDPOINTS.TRANSLATOR, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.translated_text || data.translation || text;
  } catch (error) {
    console.error('Failed to translate text:', error);
    return text;
  }
}

/**
 * Translate draft if email is not in English
 * @param {string} draftText - Draft text in English
 * @param {string} originalEmailText - Original email text
 * @returns {Promise<string>} Translated draft (or original if no translation needed)
 */
export async function translateDraftIfNeeded(draftText, originalEmailText) {
  try {
    // Check if translation is enabled in settings
    const settings = await getSettings();
    if (!settings.enableTranslation) {
      return draftText;
    }

    // Detect language of original email
    const detectedLang = await detectLanguage(originalEmailText);

    // If email is in English, no translation needed
    if (detectedLang === 'en') {
      return draftText;
    }

    console.log(`Translating draft from English to ${detectedLang}`);

    // Translate draft to detected language
    const translated = await translateText(draftText, detectedLang, 'en');
    return translated;
  } catch (error) {
    console.error('Failed to translate draft:', error);
    return draftText;
  }
}

/**
 * Translate email content to English for processing
 * @param {string} emailText - Email text in any language
 * @returns {Promise<string>} Translated text in English
 */
export async function translateToEnglish(emailText) {
  try {
    const detectedLang = await detectLanguage(emailText);

    if (detectedLang === 'en') {
      return emailText;
    }

    return await translateText(emailText, 'en', detectedLang);
  } catch (error) {
    console.error('Failed to translate to English:', error);
    return emailText;
  }
}

/**
 * Get supported languages
 * @returns {Array<{code: string, name: string}>} Supported languages
 */
export function getSupportedLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' }
  ];
}
