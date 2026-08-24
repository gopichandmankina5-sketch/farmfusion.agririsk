import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { translateText } from '../services/translation';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('agririsk_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('agririsk_language', language);
  }, [language]);

  const t = useCallback((key) => {
    if (!translations[language] || !translations[language][key]) {
      return translations['en'][key] || key; // Fallback to English or the key itself
    }
    return translations[language][key];
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Custom hook to translate text dynamically.
 * @param {string} text - The original English text.
 * @returns {string} The translated text or original text if English.
 */
export function useTranslation(text) {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState(text);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // If the language is English or text is empty, just use the original text.
    if (language === 'en' || !text) {
      setTranslated(text);
      return;
    }

    // Cancel any ongoing translation request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // We can show a loading state if we want, but for now we'll just wait for the response
    // without changing the text until it arrives to avoid blinking text.
    translateText(text, 'en', language, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setTranslated(result);
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          // If translation fails, keep showing the original or previous text
          console.warn('Translation fallback to English');
        }
      });

    return () => {
      controller.abort();
    };
  }, [text, language]);

  return translated;
}
