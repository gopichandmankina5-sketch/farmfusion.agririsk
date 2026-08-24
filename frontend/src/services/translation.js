// frontend/src/services/translation.js

const API_BASE = '/api/translation';

/**
 * Translates text using the backend translation service.
 * @param {string} text - The text to translate.
 * @param {string} source - Source language code (e.g., 'en').
 * @param {string} target - Target language code (e.g., 'ta', 'te', 'hi').
 * @param {AbortSignal} signal - Optional signal to abort the fetch request.
 * @returns {Promise<string>} The translated text.
 */
export async function translateText(text, source = 'en', target, signal) {
  if (!text || source === target) return text;
  
  try {
    const response = await fetch(`${API_BASE}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source, target }),
      signal
    });
    
    if (!response.ok) {
      throw new Error('Translation failed');
    }
    
    const data = await response.json();
    return data.translated_text || text;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}
