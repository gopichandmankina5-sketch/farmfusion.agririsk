import os
import logging
import requests
from backend.config.config import Config

logger = logging.getLogger(__name__)

# Simple in-memory cache for translations
_translation_cache = {}

def get_libretranslate_url():
    """Get the LibreTranslate URL from config, default to localhost:5000"""
    return getattr(Config, 'LIBRETRANSLATE_URL', 'http://localhost:5000')

def translate_text(text, source_language, target_language):
    """
    Translates text using LibreTranslate.
    Uses in-memory caching to avoid redundant requests.
    """
    if not text or not isinstance(text, str):
        return {"success": False, "error": "Invalid text input"}
        
    if source_language == target_language:
        return {"success": True, "translated_text": text, "source": source_language, "target": target_language}

    cache_key = f"{source_language}_{target_language}_{text}"
    if cache_key in _translation_cache:
        return {"success": True, "translated_text": _translation_cache[cache_key], "source": source_language, "target": target_language}

    url = f"{get_libretranslate_url()}/translate"
    payload = {
        "q": text,
        "source": source_language,
        "target": target_language,
        "format": "text"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        translated_text = data.get("translatedText")
        
        if translated_text:
            _translation_cache[cache_key] = translated_text
            return {"success": True, "translated_text": translated_text, "source": source_language, "target": target_language}
        else:
            return {"success": False, "error": "Invalid response format from translation service"}
            
    except requests.exceptions.Timeout:
        logger.warning(f"Translation service timeout for '{text[:20]}...'")
        return {"success": False, "error": "Translation temporarily unavailable"}
    except requests.exceptions.RequestException as e:
        logger.error(f"Translation service error: {e}")
        return {"success": False, "error": "Translation service unavailable"}

def check_health():
    """Check if LibreTranslate is reachable."""
    url = f"{get_libretranslate_url()}/languages"
    try:
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            return {"available": True, "service": "LibreTranslate"}
    except requests.exceptions.RequestException:
        pass
    
    return {"available": False, "service": "LibreTranslate"}
