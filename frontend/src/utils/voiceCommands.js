export const INTENTS = {
  CROP_RISK: 'CROP_RISK',
  WEATHER_CURRENT: 'WEATHER_CURRENT',
  WEATHER_TEMPERATURE: 'WEATHER_TEMPERATURE',
  WEATHER_RAIN: 'WEATHER_RAIN',
  WEATHER_RISK: 'WEATHER_RISK',
  DISEASE_RISK: 'DISEASE_RISK',
  RECOMMENDATIONS: 'RECOMMENDATIONS',
  IRRIGATION: 'IRRIGATION',
  REGIONAL_RISK: 'REGIONAL_RISK',
  RISK_ANALYSIS: 'RISK_ANALYSIS',
  DASHBOARD: 'DASHBOARD',
  FOLLOW_UP_EXPLANATION: 'FOLLOW_UP_EXPLANATION',
  FOLLOW_UP_RECOMMENDATION: 'FOLLOW_UP_RECOMMENDATION',
  FOLLOW_UP_WEATHER_IMPACT: 'FOLLOW_UP_WEATHER_IMPACT',
  UNKNOWN: 'UNKNOWN'
};

export const detectSpeechLanguage = (text, defaultLang) => {
  if (!text) return defaultLang;
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[a-zA-Z]/.test(text)) return 'en';
  return defaultLang;
};

export const parseVoiceCommand = (text) => {
  if (!text) return INTENTS.UNKNOWN;
  
  // 1. Normalize: trim whitespace, normalize unicode, remove punctuation, collapse spaces
  const normalizedText = text
    .normalize('NFC')
    .replace(/[?!.,।;]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  console.log("[VOICE] Raw transcript:", text);
  console.log("[VOICE] Normalized transcript:", normalizedText);
  
  // 2. Helper functions for matching
  const has = (word) => normalizedText.includes(word.toLowerCase());
  const hasAny = (words) => words.some(w => has(w));
  const hasAll = (words) => words.every(w => has(w));

  // Dashboard
  if (hasAny(['dashboard', 'home', 'డాష్బోర్డ్', 'డాష్ బోర్డ్', 'டாஷ்போர்டு', 'டாஷ்போர்டை', 'डैशबोर्ड'])) {
    return INTENTS.DASHBOARD;
  }
  
  // Regional Risk
  if (hasAny(['regional risk', 'map', 'ప్రాంతీయ రిస్క్', 'ప్రాంతీయ ప్రమాదం', 'రీజినల్ రిస్క్', 'பிராந்திய ஆபத்து', 'பிராந்திய ரிஸ்க்', 'क्षेत्रीय जोखिम', 'क्षेत्रीय रिस्क'])) {
    return INTENTS.REGIONAL_RISK;
  }
  
  // Risk Analysis
  if (hasAny(['risk analysis', 'రిస్క్ అనాలిసిస్', 'ప్రమాద విశ్లేషణ', 'రిస్క్ విశ్లేషణ', 'ரிஸ்க் அனாலிசிஸை', 'ஆபத்து பகுப்பாய்வை', 'रिस्क एनालिसिस', 'जोखिम विश्लेषण'])) {
    return INTENTS.RISK_ANALYSIS;
  }
  
  // Follow-up: Explanation (Why?)
  if (hasAny(['why', 'ఎందుకు', 'ఏమిటి కారణం', 'ஏன்', 'எதனால்', 'क्यों', 'कारण'])) {
    return INTENTS.FOLLOW_UP_EXPLANATION;
  }

  // Follow-up: Weather Impact
  if (hasAny(['affect my crop', 'weather affect', 'వాన పడుతుందా', 'వాతావరణ ప్రభావం', 'வானிலை பாதிக்குமா', 'क्या मौसम प्रभावित करेगा', 'मौसम का प्रभाव'])) {
    return INTENTS.FOLLOW_UP_WEATHER_IMPACT;
  }

  // Follow-up: Recommendation / Mitigation
  if (hasAny(['what should i do', 'how to reduce', 'reduce it', 'ఏం చేయాలి', 'తగ్గించడానికి', 'என்ன செய்ய வேண்டும்', 'குறைக்க', 'क्या करना चाहिए', 'कम करने के लिए'])) {
    return INTENTS.FOLLOW_UP_RECOMMENDATION;
  }

  // Recommendations (General fallback)
  if (hasAny(['recommendation', 'సూచన', 'సూచనలు', 'సిఫార్సు', 'సిఫార్సులు', 'பரிந்துரை', 'பரிந்துரைகள்', 'सुझाव', 'सिफारिश'])) {
    return INTENTS.RECOMMENDATIONS;
  }
  
  // Weather Risk
  if (
    (hasAny(['weather', 'వాతావరణ', 'வானிலை', 'मौसम']) && hasAny(['risk', 'danger', 'ప్రమాదం', 'రిస్క్', 'ஆபத்து', 'रिस्क', 'जोखिम'])) ||
    hasAny(['weather risk', 'వాతావరణ ప్రమాదం', 'வானிலை ஆபத்து', 'मौसम का जोखिम'])
  ) {
    return INTENTS.WEATHER_RISK;
  }
  
  // Temperature
  if (hasAny(['temperature', 'how hot', 'ఉష్ణోగ్రత', 'టెంపరేచర్', 'வெப்பநிலை', 'டெம்பரேச்சர்', 'तापमान'])) {
    return INTENTS.WEATHER_TEMPERATURE;
  }
  
  // Rain
  if (hasAny(['rain', 'rainfall', 'వర్షం', 'వర్షాలు', 'మழை', 'बारिश', 'वर्षा'])) {
    return INTENTS.WEATHER_RAIN;
  }
  
  // Current Weather
  if (hasAny(['weather', 'వాతావరణం', 'வானிலை', 'मौसम'])) {
    return INTENTS.WEATHER_CURRENT;
  }

  // Data queries
  if (hasAny(['disease', 'pest'])) {
    return INTENTS.DISEASE_RISK;
  }
  if (hasAny(['irrigate', 'water'])) {
    return INTENTS.IRRIGATION;
  }
  
  // Crop risk (general)
  if (
    (hasAny(['crop', 'పంట', 'பயிர்', 'फसल']) && hasAny(['risk', 'condition', 'status', 'ప్రమాదం', 'రిస్క్', 'స్థితి', 'పరిస్థితి', 'ஆபத்து', 'நிலை', 'जोखिम', 'स्थिति'])) ||
    hasAny(['crop risk', 'పంట ప్రమాదం', 'పంట రిస్క్', 'பயிரின் ஆபத்து', 'பயிர் ரிஸ்க்', 'फसल का जोखिम', 'फसल का रिस्क'])
  ) {
    return INTENTS.CROP_RISK;
  }

  return INTENTS.UNKNOWN;
};
