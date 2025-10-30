import { getSettings } from '../utils/storage.js';

/**
 * Translation Service
 * Uses Chrome's built-in Language Detector API and Translator API
 * References:
 * - https://developer.chrome.com/docs/ai/language-detection
 * - https://developer.chrome.com/docs/ai/translator-api
 */

/**
 * Check if Language Detector API is available
 * @returns {Promise<string>} 'available', 'after-download', or 'unavailable'
 */
async function checkLanguageDetectorAvailability() {
  try {
    if (!('LanguageDetector' in self)) {
      console.warn('Language Detector API not supported in this browser');
      return 'unavailable';
    }
    return await self.LanguageDetector.availability();
  } catch (error) {
    console.error('Error checking Language Detector API availability:', error);
    return 'unavailable';
  }
}

/**
 * Check if Translator API is available for a language pair
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<string>} 'available', 'after-download', or 'unavailable'
 */
async function checkTranslatorAvailability(sourceLang, targetLang) {
  try {
    if (!('Translator' in self)) {
      console.warn('Translator API not supported in this browser');
      return 'unavailable';
    }
    return await self.Translator.availability({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    });
  } catch (error) {
    console.error('Error checking Translator API availability:', error);
    return 'unavailable';
  }
}

/**
 * Detect language of text using Chrome's Language Detector API
 * @param {string} text - Text to analyze
 * @returns {Promise<string>} Detected language code (e.g., 'en', 'es', 'fr')
 */
export async function detectLanguage(text) {
  try {
    // Check availability
    const availability = await checkLanguageDetectorAvailability();
    
    if (availability === 'unavailable') {
      console.warn('Language Detector API unavailable, using fallback detection');
      return simpleLanguageDetection(text);
    }

    // Create language detector
    let detector;
    if (availability === 'after-download') {
      console.log('Language Detector model downloading...');
      detector = await self.LanguageDetector.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Language Detector model download progress: ${Math.round(e.loaded * 100)}%`);
          });
        }
      });
    } else {
      detector = await self.LanguageDetector.create();
    }

    // Detect language - returns array of {detectedLanguage, confidence}
    const results = await detector.detect(text);
    
    // Destroy detector
    detector.destroy();

    if (results && results.length > 0) {
      // Get the top result (highest confidence)
      const topResult = results[0];
      console.log(`Detected language: ${topResult.detectedLanguage} (confidence: ${topResult.confidence})`);
      
      // Only return if confidence is reasonably high (>0.5)
      if (topResult.confidence > 0.5) {
        return topResult.detectedLanguage;
      }
    }

    // Fallback to simple detection if confidence is too low
    return simpleLanguageDetection(text);
  } catch (error) {
    console.error('Failed to detect language with API:', error);
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
 * Translate text to target language using Chrome's Translator API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (optional, will detect if not provided)
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, targetLang, sourceLang = null) {
  try {
    // Detect source language if not provided
    if (!sourceLang) {
      sourceLang = await detectLanguage(text);
    }

    // If source and target are the same, no translation needed
    if (sourceLang === targetLang) {
      console.log(`Source and target languages are the same (${sourceLang}), no translation needed`);
      return text;
    }

    console.log(`Translating from ${sourceLang} to ${targetLang}`);

    // Check if translation is available for this language pair
    const availability = await checkTranslatorAvailability(sourceLang, targetLang);
    
    if (availability === 'unavailable') {
      console.warn(`Translation from ${sourceLang} to ${targetLang} is unavailable, returning original text`);
      return text;
    }

    // Create translator
    let translator;
    if (availability === 'after-download') {
      console.log(`Translator model (${sourceLang} → ${targetLang}) downloading...`);
      translator = await self.Translator.create({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Translator model download progress: ${Math.round(e.loaded * 100)}%`);
          });
        }
      });
    } else {
      translator = await self.Translator.create({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      });
    }

    // Translate the text
    const translated = await translator.translate(text);
    
    // Destroy translator
    translator.destroy();

    console.log(`Translation complete: "${text.substring(0, 50)}..." → "${translated.substring(0, 50)}..."`);
    return translated;
  } catch (error) {
    console.error('Failed to translate text with Translator API:', error);
    return text;
  }
}

/**
 * Translate draft to match the language of the original email
 * @param {string} draftText - Draft text (usually in English)
 * @param {string} originalEmailText - Original email text to detect language from
 * @returns {Promise<string>} Translated draft (or original if no translation needed)
 */
export async function translateDraftIfNeeded(draftText, originalEmailText) {
  try {
    // Check if translation is enabled in settings
    const settings = await getSettings();
    if (!settings.enableTranslation) {
      console.log('Translation disabled in settings');
      return draftText;
    }

    console.log('Detecting language of original email...');

    // Detect language of original email
    const detectedLang = await detectLanguage(originalEmailText);

    console.log(`Original email language detected: ${detectedLang}`);

    // If email is in English, no translation needed
    if (detectedLang === 'en') {
      console.log('Email is in English, no translation needed');
      return draftText;
    }

    console.log(`Email is in ${detectedLang}, translating draft...`);

    // Translate draft from English to detected language
    const translated = await translateText(draftText, detectedLang, 'en');
    
    if (translated !== draftText) {
      console.log(`Draft successfully translated to ${detectedLang}`);
    }
    
    return translated;
  } catch (error) {
    console.error('Failed to translate draft:', error);
    // Return original draft on failure
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
