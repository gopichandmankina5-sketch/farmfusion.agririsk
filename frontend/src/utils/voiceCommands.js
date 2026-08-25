export const INTENTS = {
  GREETING: 'GREETING',
  GENERAL_HELP: 'GENERAL_HELP',
  CROP_RISK: 'CROP_RISK',
  CROP_INFORMATION: 'CROP_INFORMATION',
  WEATHER_CURRENT: 'WEATHER_CURRENT',
  WEATHER_TEMPERATURE: 'WEATHER_TEMPERATURE',
  WEATHER_RAIN: 'WEATHER_RAIN',
  WEATHER_RISK: 'WEATHER_RISK',
  DISEASE_RISK: 'DISEASE_RISK',
  RECOMMENDATION_INFORMATION: 'RECOMMENDATION_INFORMATION',
  REGIONAL_RISK_INFORMATION: 'REGIONAL_RISK_INFORMATION',
  IRRIGATION: 'IRRIGATION',
  
  NAVIGATE_REGIONAL_RISK: 'NAVIGATE_REGIONAL_RISK',
  NAVIGATE_RISK_ANALYSIS: 'NAVIGATE_RISK_ANALYSIS',
  NAVIGATE_RECOMMENDATIONS: 'NAVIGATE_RECOMMENDATIONS',
  NAVIGATE_DASHBOARD: 'NAVIGATE_DASHBOARD',
  NAVIGATE_WEATHER: 'NAVIGATE_WEATHER',

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

export const parseVoiceCommand = (text, context = {}) => {
  if (!text) return INTENTS.UNKNOWN;
  
  // 1. Normalize
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
  const hasExactWord = (word) => new RegExp(`(^|\\s)${word.toLowerCase()}(\\s|$)`).test(normalizedText);
  const hasAnyExactWord = (words) => words.some(w => hasExactWord(w));

  // ==========================================
  // EXPLICIT NAVIGATION DETECTION
  // ==========================================
  const isNavigation = hasAny(['open', 'go to', 'show', 'navigate', 'తెరువు', 'చూపించు', 'వెళ్ళు', 'திற', 'காட்டு', 'செல்', 'खोलो', 'खोलें', 'दिखाओ', 'जाएं']);

  // ==========================================
  // DOMAIN INTENTS (Navigation vs Conversational)
  // ==========================================

  // Dashboard
  if (hasAny(['dashboard', 'home', 'డాష్బోర్డ్', 'డాష్ బోర్డ్', 'டாஷ்போர்டு', 'டாஷ்போர்டை', 'डैशबोर्ड'])) {
    return isNavigation ? INTENTS.NAVIGATE_DASHBOARD : INTENTS.NAVIGATE_DASHBOARD; 
  }
  
  // Regional Risk
  if (hasAny(['regional risk', 'regional map', 'ప్రాంతీయ రిస్క్', 'ప్రాంతీయ ప్రమాదం', 'రీజినల్ రిస్క్', 'பிராந்திய ஆபத்து', 'பிராந்திய ரிஸ்க்', 'क्षेत्रीय जोखिम', 'क्षेत्रीय रिस्क'])) {
    return isNavigation ? INTENTS.NAVIGATE_REGIONAL_RISK : INTENTS.REGIONAL_RISK_INFORMATION;
  }
  
  // Risk Analysis
  if (hasAny(['risk analysis', 'రిస్క్ అనాలిసిస్', 'ప్రమాద విశ్లేషణ', 'రిస్క్ విశ్లేషణ', 'ரிஸ்க் அனாலிசிஸை', 'ஆபத்து பகுப்பாய்வை', 'रिस्क एनालिसिस', 'जोखिम विश्लेषण'])) {
    return isNavigation ? INTENTS.NAVIGATE_RISK_ANALYSIS : INTENTS.CROP_RISK;
  }
  
  // Recommendations
  if (hasAny(['recommendation', 'recommendations', 'సూచన', 'సూచనలు', 'సిఫార్సు', 'సిఫార్సులు', 'பரிந்துரை', 'பரிந்துரைகள்', 'सुझाव', 'सिफारिश'])) {
    return isNavigation ? INTENTS.NAVIGATE_RECOMMENDATIONS : INTENTS.RECOMMENDATION_INFORMATION;
  }

  // Crop Information
  if (hasAny(['which crop', 'what crop', 'about my crop', 'my crop', 'this crop', 'what am i analyzing', 'crop is selected', 'tell me the crop', 'looking at', 'ఏ పంట', 'పంట గురించి', 'ఎంచుకున్నారు', 'విశ్లేషిస్తున్నారు', 'విశ్లేషిస్తున్నాం', 'எந்த பயிர்', 'பயிர் பற்றி', 'தேர்வு செய்யப்பட்டுள்ளது', 'பகுப்பாய்வு செய்கிறீர்கள்', 'பார்க்கிறோம்', 'कौन सी फसल', 'फसल के बारे में', 'चुनी गई है', 'विश्लेषण हो रहा है', 'विश्लेषण कर रहा हूँ'])) {
    return INTENTS.CROP_INFORMATION;
  }

  // Weather (General)
  if (hasAny(['weather', 'వాతావరణం', 'வானிலை', 'मौसम'])) {
    if (isNavigation) return INTENTS.NAVIGATE_WEATHER;
    if (hasAny(['risk', 'danger', 'ప్రమాదం', 'రిస్క్', 'ஆபத்து', 'रिस्क', 'जोखिम'])) return INTENTS.WEATHER_RISK;
    return INTENTS.WEATHER_CURRENT;
  }

  // Temperature
  if (hasAny(['temperature', 'how hot', 'ఉష్ణోగ్రత', 'టెంపరేచర్', 'வெப்பநிலை', 'டெம்பரேச்சர்', 'तापमान'])) {
    return INTENTS.WEATHER_TEMPERATURE;
  }
  
  // Rain
  if (hasAny(['rain', 'rainfall', 'వర్షం', 'వర్షాలు', 'மழை', 'बारिश', 'वर्षा'])) {
    return INTENTS.WEATHER_RAIN;
  }

  // Crop risk (general fallback)
  if (
    (hasAny(['crop', 'పంట', 'பயிர்', 'फसल', 'risk', 'safe', 'risky']) && hasAny(['risk', 'condition', 'status', 'ప్రమాదం', 'రిస్క్', 'స్థితి', 'పరిస్థితి', 'ஆபத்து', 'நிலை', 'जोखिम', 'स्थिति', 'safe', 'risky', 'high', 'low'])) ||
    hasAny(['crop risk', 'పంట ప్రమాదం', 'పంట రిస్క్', 'பயிரின் ஆபத்து', 'பயிர் ரிஸ்க்', 'फसल का जोखिम', 'फसल का रिस्क'])
  ) {
    return INTENTS.CROP_RISK;
  }

  // Data queries
  if (hasAny(['disease', 'pest'])) {
    return INTENTS.DISEASE_RISK;
  }
  if (hasAny(['irrigate', 'water'])) {
    return INTENTS.IRRIGATION;
  }

  // ==========================================
  // FOLLOW-UPS (Must interpret using context before navigation/unknown)
  // ==========================================
  // Why / How / Then / What about it / Is that dangerous
  if (hasAnyExactWord(['why', 'how', 'then', 'ఎందుకు', 'ఏమిటి కారణం', 'ஏன்', 'எதனால்', 'क्यों', 'कारण']) || hasAny(['what about it', 'is that dangerous'])) {
    return INTENTS.FOLLOW_UP_EXPLANATION;
  }
  // Weather Impact follow up (Will it affect my crop)
  if (hasAny(['affect my crop', 'affect my risk', 'weather affect', 'వాన పడుతుందా', 'వాతావరణ ప్రభావం', 'வானிலை பாதிக்குமா', 'क्या मौसम प्रभावित करेगा', 'मौसम का प्रभाव'])) {
    return INTENTS.FOLLOW_UP_WEATHER_IMPACT;
  }
  // Recommendation follow up (What should I do, how to reduce)
  if (hasAny(['what should i do', 'what can i do', 'how to reduce', 'reduce it', 'what do you recommend', 'ఏం చేయాలి', 'తగ్గించడానికి', 'என்ன செய்ய வேண்டும்', 'குறைக்க', 'क्या करना चाहिए', 'कम करने के लिए'])) {
    return INTENTS.FOLLOW_UP_RECOMMENDATION;
  }

  // ==========================================
  // GREETINGS & HELP (Fallback)
  // ==========================================
  if (hasAnyExactWord(['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'హలో', 'నమస్కారం', 'హాయ్', 'வணக்கம்', 'ஹலோ', 'ஹாய்', 'नमस्ते', 'नमस्कार', 'हैलो', 'हाय'])) {
    return INTENTS.GREETING;
  }
  if (hasAny(['what can you do', 'help me', 'సహాయం', 'ఉதவி', 'मदद', 'tell me about my farm'])) {
    return INTENTS.GENERAL_HELP;
  }

  
  return INTENTS.UNKNOWN;
};
