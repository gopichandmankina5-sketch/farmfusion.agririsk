import { getStateList } from '../i18n/stateTranslations';
import districtTranslations from '../i18n/districtTranslations';
import { districtsByState } from '../data/indiaData';
import { getAgricultureList } from '../i18n/agricultureTranslations';

export const INTENTS = {
  FORM_CONTROL: 'FORM_CONTROL',
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
  NAVIGATE_DECISION_SIMULATOR: 'NAVIGATE_DECISION_SIMULATOR',

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

// ─── District matching helpers ─────────────────────────────────────────────

// Strips common command words so we isolate the actual district/season name.
const COMMAND_WORDS_RE = /\b(select|choose|set|district|season|crop|state|to)\b/gi;
const stripCommandWords = (text) =>
  text.replace(COMMAND_WORDS_RE, ' ').replace(/\s+/g, ' ').trim();

// Normalize a name for fuzzy comparison.
// Lowercases, collapses spaces, removes non-word non-Unicode chars.
// Preserves Telugu/Tamil/Hindi Unicode characters.
const normalizeName = (s) => {
  if (!s) return '';
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, '')  // strip ASCII punctuation, keep Unicode letters
    .replace(/\s+/g, ' ')
    .trim();
};


// Quick character-sequence similarity (0..1) for ASR variation tolerance.
// "ananthapur" vs "anantapur" → ~0.94.  No external libraries needed.
const similarity = (a, b) => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const [longer, shorter] = a.length >= b.length ? [a, b] : [b, a];
  if (longer.length === 0) return 1;
  let matches = 0, j = 0;
  for (let i = 0; i < shorter.length; i++) {
    while (j < longer.length && longer[j] !== shorter[i]) j++;
    if (j < longer.length) { matches++; j++; }
  }
  return matches / longer.length;
};

/**
 * Match a spoken text against a list of candidate district objects.
 * Returns the best { id, confidence } or null.
 * candidateDistricts: [{ id: string, names: { en, hi, te, ta } }]
 */
const matchDistrictFromList = (spokenNormalized, candidateDistricts, logLabel) => {
  if (!candidateDistricts || candidateDistricts.length === 0) return null;

  const spoken = spokenNormalized;
  const spokenStripped = normalizeName(stripCommandWords(spokenNormalized));
  console.log(`[AgriRisk Voice] DISTRICT CANDIDATES (${logLabel}):`, candidateDistricts.map(d => d.id));

  let best = null;
  let bestScore = 0;

  for (const district of candidateDistricts) {
    const rawNames = Object.values(district.names || {}).filter(Boolean);
    for (const rawName of rawNames) {
      const normName = normalizeName(rawName);
      if (!normName || normName.length < 2) continue;

      // 1. Exact substring: spoken sentence contains the full district name.
      if (spoken.includes(normName)) {
        const score = 0.95 + normName.length * 0.001;
        if (score > bestScore) { bestScore = score; best = district; }
        continue;
      }
      // 2. Stripped spoken contains district name.
      if (spokenStripped && spokenStripped.includes(normName)) {
        const score = 0.92 + normName.length * 0.001;
        if (score > bestScore) { bestScore = score; best = district; }
        continue;
      }
      // 3. District name contains stripped spoken (user said just the district).
      if (spokenStripped && normName.includes(spokenStripped) && spokenStripped.length >= 3) {
        const score = 0.75;
        if (score > bestScore) { bestScore = score; best = district; }
        continue;
      }
      // 4. Fuzzy similarity for ASR spelling variations (≥80% match required).
      if (spokenStripped && spokenStripped.length >= 3) {
        const sim = similarity(spokenStripped, normName);
        if (sim >= 0.80 && sim > bestScore) { bestScore = sim; best = district; }
      }
    }
  }

  if (best && bestScore >= 0.75) {
    console.log(`[AgriRisk Voice] DISTRICT MATCH (${logLabel}): "${spokenNormalized}" → ${best.id} (confidence=${bestScore.toFixed(2)})`);
    return { id: best.id, confidence: bestScore };
  }
  return null;
};

export const parseVoiceCommand = (text, context = {}) => {

  if (!text) return INTENTS.UNKNOWN;

  // context.currentState = currently selected state ID (e.g. 'tamil_nadu')
  // context.availableDistricts = district objects from window.__AGRIRISK_FORM_CONTROLS__.districts
  //   passed in as IDs — we'll resolve to full objects using indiaData
  const currentStateId = context.currentState || null;
  
  // 1. Normalize — preserve Unicode, strip punctuation, lowercase
  const normalizedText = text
    .normalize('NFC')
    .replace(/[?!.,।;]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  console.log('[AgriRisk Voice] RAW FINAL TRANSCRIPT:', text);
  console.log('[AgriRisk Voice] NORMALIZED TRANSCRIPT:', normalizedText);
  
  // 2. Helper functions for matching
  const has = (word) => normalizedText.includes(word.toLowerCase());
  const hasAny = (words) => words.some(w => has(w));
  const hasExactWord = (word) => new RegExp(`(^|\\s)${word.toLowerCase()}(\\s|$)`).test(normalizedText);
  const hasAnyExactWord = (words) => words.some(w => hasExactWord(w));

  // ==========================================
  // EXPLICIT NAVIGATION DETECTION
  // ==========================================
  const isNavigation = hasAny(['open', 'go to', 'show', 'navigate', 'take me', 'తెరువు', 'తెరవండి', 'చూపించు', 'వెళ్ళు', 'వెళ్ళండి', 'திற', 'காட்டு', 'செல்', 'खोलो', 'खोलें', 'दिखाओ', 'जाएं', 'जाओ']);

  // ==========================================
  // DOMAIN INTENTS (Navigation vs Conversational)
  // ==========================================

  // Form Controls (Select State, District, Crop, Season)
  const isAction = hasAnyExactWord(['select', 'choose', 'set', 'எంచుకో', 'చూపించు', 'चुनो', 'चुने', 'தேர்வு செய்', 'தேர்ந்தெடு']) || hasAny(['ఎంచుకో', 'चुनें']);
  const isAnalyze = hasAny(['analyze', 'analyse', 'విశ్లేషించు', 'విశ్లేషణ చేయి', 'विश्लेषण करो', 'பகுப்பாய்வு செய்']) && !hasAny(['what', 'how', 'why', 'ఏమిటి', 'எப்படி']);

  if (isAction || isAnalyze) {
    let actions = [];
    
    if (isAction) {
      // ── States ──────────────────────────────────────────────────────────
      getStateList().forEach(state => {
        const stateNames = Object.values(state.names).map(n => n.toLowerCase());
        if (hasAny(stateNames)) {
          console.log('[AgriRisk Voice] STATE SPOKEN matched:', state.names.en, '→ STATE VALUE:', state.id);
          actions.push({ type: 'SELECT_STATE', value: state.id });
        }
      });

      // ── Seasons (checked BEFORE districts to avoid false district matches) ──
      getAgricultureList('season').forEach(season => {
        const seasonNames = Object.values(season.names).map(n => n.toLowerCase());
        if (hasAny(seasonNames)) {
          console.log('[AgriRisk Voice] SEASON CANDIDATES:', seasonNames);
          console.log('[AgriRisk Voice] SEASON MATCH:', season.id);
          actions.push({ type: 'SELECT_SEASON', value: season.id });
        }
      });

      // ── Crops ───────────────────────────────────────────────────────────
      getAgricultureList('crop').forEach(crop => {
        if (hasAny(Object.values(crop.names).map(n => n.toLowerCase()))) {
          actions.push({ type: 'SELECT_CROP', value: crop.id });
        }
      });

      // ── Districts ──────────────────────────────────────────────
      // Strategy:
      // 1. If a state is being selected in this command, note the new state ID.
      // 2. Look up that state's districts from indiaData (most complete source).
      // 3. If no state context, use the currently active state's districts.
      // 4. Fall back to global districtTranslations only if no state context.
      const seasonIds = new Set(actions.filter(a => a.type === 'SELECT_SEASON').map(a => a.value));
      const newStateId = actions.find(a => a.type === 'SELECT_STATE')?.value;
      const stateIdForDistricts = newStateId || currentStateId;

      console.log('[AgriRisk Voice] CURRENT STATE:', stateIdForDistricts || '(none)');

      // Build the candidate list: state-scoped districts from indiaData first.
      let districtCandidates = [];
      if (stateIdForDistricts && districtsByState[stateIdForDistricts]) {
        districtCandidates = districtsByState[stateIdForDistricts];
        console.log('[AgriRisk Voice] AVAILABLE DISTRICTS:', districtCandidates.map(d => d.id));
      } else {
        // No state selected — search global districtTranslations (less accurate).
        districtCandidates = Object.values(districtTranslations);
        console.log('[AgriRisk Voice] AVAILABLE DISTRICTS: (global fallback, no state selected)');
      }

      // Skip districts whose ID matches an already-matched season.
      const filteredCandidates = districtCandidates.filter(d => !seasonIds.has(d.id));

      // Run the fuzzy/exact matcher.
      const districtMatch = matchDistrictFromList(
        normalizedText,
        filteredCandidates,
        stateIdForDistricts || 'global'
      );

      if (districtMatch) {
        actions.push({ type: 'SELECT_DISTRICT', value: districtMatch.id });
      }
    } // end if (isAction)

    if (isAnalyze) actions.push({ type: 'ANALYZE_RISK' });

    if (actions.length > 0) {
      return { intent: INTENTS.FORM_CONTROL, actions };
    }
  }

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

  // Decision Simulator
  if (hasAny(['decision simulator', 'డెసిషన్ సిమ్యులేటర్', 'டிசிஷன் சிமுலேட்ட', 'डिसीजन सिम्युलेटर'])) {
    return isNavigation ? INTENTS.NAVIGATE_DECISION_SIMULATOR : INTENTS.UNKNOWN;
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
