import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { startListening, stopSpeaking, speakResponse, isVoiceSupported, isTTSSpeaking, setOnTTSEnd } from '../services/voiceService';
import { parseVoiceCommand, detectSpeechLanguage, INTENTS } from '../utils/voiceCommands';
import { getVoiceResponse } from '../utils/voiceTranslations';
import { generateRecommendations } from '../utils/recommendationEngine';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  ERROR: 'ERROR',
  UNSUPPORTED: 'UNSUPPORTED'
};

export default function VoiceAssistant() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentState, setCurrentState] = useState(isVoiceSupported() ? STATES.IDLE : STATES.UNSUPPORTED);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Lightweight conversational context
  const [conversationContext, setConversationContext] = useState({
    lastIntent: null,
    lastTopic: null,
  });
  
  const recognitionRef = useRef(null);
  // Tracks whether we deliberately stopped recognition (to suppress spurious onEnd restarts)
  const intentionalStopRef = useRef(false);
  // Whether the component is still mounted
  const isMountedRef = useRef(true);
  // Ref copy of isOpen to avoid stale closures in async callbacks
  const isOpenRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      intentionalStopRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
      stopSpeaking();
    };
  }, []);

  // Keep isOpenRef in sync with isOpen state
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setResponse('');
    setTranscript('');
    setErrorMessage('');
    if (isVoiceSupported()) {
      // Don't auto-start if TTS is currently speaking (would pick up assistant voice)
      if (!isTTSSpeaking()) {
        startVoiceSession();
      } else {
        setCurrentState(STATES.IDLE);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    intentionalStopRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e) {}
      recognitionRef.current = null;
    }
    stopSpeaking();
    if (isVoiceSupported()) {
      setCurrentState(STATES.IDLE);
    }
    // Keeping conversationContext alive while the app runs is intentional.
  };

  const startVoiceSession = () => {
    // Guard: do not start while TTS is speaking (would pick up assistant voice)
    if (isTTSSpeaking()) {
      console.log('[AgriRisk Voice] Mic blocked — TTS is speaking.');
      // Register callback: start listening after TTS finishes
      setOnTTSEnd(() => {
        if (isMountedRef.current && isOpenRef.current) startVoiceSession();
      });
      return;
    }

    // Guard: abort any existing session before starting a new one
    if (recognitionRef.current) {
      intentionalStopRef.current = true;
      try { recognitionRef.current.abort(); } catch(e) {}
      recognitionRef.current = null;
    }

    intentionalStopRef.current = false;
    stopSpeaking();
    setTranscript('');
    setResponse('');
    setErrorMessage('');
    setCurrentState(STATES.LISTENING);

    const recognition = startListening(
      language,
      // onResult(finalTranscript, interimTranscript)
      (finalText, interimText) => {
        if (!isMountedRef.current) return;

        if (interimText !== null) {
          // Live interim update: show in transcript area while user speaks
          setTranscript(interimText);
          return; // Do NOT execute command on interim
        }

        if (finalText) {
          console.log('[AgriRisk Voice] Executing intent for:', finalText);
          setTranscript(finalText);
          setCurrentState(STATES.PROCESSING);
          handleIntent(finalText);
        }
      },
      (err) => {
        if (!isMountedRef.current) return;
        setErrorMessage(err);
        setCurrentState(STATES.ERROR);
      },
      // onEnd — uses ref to avoid stale closure on currentState
      () => {
        if (!isMountedRef.current) return;
        if (intentionalStopRef.current) return; // deliberate stop, no action
        // Session ended without a result (e.g., no-speech) → go idle
        setCurrentState(prev =>
          prev === STATES.LISTENING ? STATES.IDLE : prev
        );
      }
    );

    recognitionRef.current = recognition;
  };

  const provideResponse = (text, targetLang, newContext = null) => {
    setResponse(text);
    // Stop mic before TTS to prevent feedback loop
    intentionalStopRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e) {}
      recognitionRef.current = null;
    }
    speakResponse(text, targetLang || language);
    setCurrentState(STATES.IDLE);
    if (newContext) {
      setConversationContext(prev => ({ ...prev, ...newContext }));
    }
  };

  // Helper used by the async FORM_CONTROL handler to finalize responses and optionally trigger Analyze.
  // Must be defined before handleIntent since handleIntent references it via closure.
  const finishFormControl = (freshControls, responses, hasAnalyze, actions, detectedLang, intent) => {
    if (hasAnalyze) {
      const stateOk   = !!(freshControls.form.state   || actions.some(a => a.type === 'SELECT_STATE'));
      const districtOk= !!(freshControls.form.district|| actions.some(a => a.type === 'SELECT_DISTRICT'));
      const cropOk    = !!(freshControls.form.crop    || actions.some(a => a.type === 'SELECT_CROP'));
      const seasonOk  = !!(freshControls.form.season  || actions.some(a => a.type === 'SELECT_SEASON'));
      const isComplete = stateOk && districtOk && cropOk && seasonOk;

      if (!isComplete) {
        const missing = [];
        if (!stateOk)    missing.push('state');
        if (!districtOk) missing.push('district');
        if (!cropOk)     missing.push('crop');
        if (!seasonOk)   missing.push('season');
        responses.push(getVoiceResponse('FORM_MISSING_FIELDS', detectedLang, { missing: missing.join(', ') }));
        provideResponse(responses.join(' '), detectedLang, { lastIntent: intent, lastTopic: 'FORM' });
      } else {
        if (actions.length > 1) {
          responses.push(getVoiceResponse('FORM_ALL_SELECTED', detectedLang));
        } else {
          responses.push('Analyzing...');
        }
        provideResponse(responses.join(' '), detectedLang, { lastIntent: intent, lastTopic: 'FORM' });
        console.log('[AgriRisk Voice] ANALYZE REQUEST:', freshControls.form);

        // Poll for district list readiness before clicking Analyze.
        const expectedDistrict = actions.find(a => a.type === 'SELECT_DISTRICT')?.value;
        const hasNewState = actions.some(a => a.type === 'SELECT_STATE');
        const hasNewDistrict = actions.some(a => a.type === 'SELECT_DISTRICT');

        if (hasNewState && hasNewDistrict && expectedDistrict) {
          let pollAttempts = 0;
          const MAX_POLL = 20; // 20 × 200ms = 4s max
          const pollAnalyze = () => {
            pollAttempts++;
            const fc = window.__AGRIRISK_FORM_CONTROLS__;
            const dList = fc?.districts || [];
            if (dList.includes(expectedDistrict) || pollAttempts >= MAX_POLL) {
              console.log('[AgriRisk Voice] Executing handleAnalyze (attempt', pollAttempts, ')');
              if (fc) fc.handleAnalyze();
            } else {
              setTimeout(pollAnalyze, 200);
            }
          };
          setTimeout(pollAnalyze, 200);
        } else {
          // No async dependency — small React flush delay
          setTimeout(() => {
            const fc = window.__AGRIRISK_FORM_CONTROLS__;
            if (fc) fc.handleAnalyze();
          }, 150);
        }
      }
    } else if (responses.length > 0) {
      provideResponse(responses.join(' '), detectedLang, { lastIntent: intent, lastTopic: 'FORM' });
    }
  };

  const handleIntent = (text) => {
    const detectedLang = detectSpeechLanguage(text, language);

    // Pass current form state to the parser so district matching is state-scoped.
    const formControls = window.__AGRIRISK_FORM_CONTROLS__;
    const voiceContext = {
      ...conversationContext,
      currentState: formControls?.form?.state || null,
    };

    let intentResult = parseVoiceCommand(text, voiceContext);
    
    let intent = intentResult;
    let actions = [];
    if (typeof intentResult === 'object') {
      intent = intentResult.intent;
      actions = intentResult.actions || [];
    }
    
    console.log('[AgriRisk Voice] DETECTED INTENT:', intent);
    console.log('[AgriRisk Voice] Actions:', actions);


    const cachedRisk = window.__AGRIRISK_LAST_RISK__;
    const weather = cachedRisk?.weather_data;
    const regionalData = window.__AGRIRISK_REGIONAL_DATA__;
    const isAll = text.toLowerCase().includes('all') || text.includes('అన్ని') || text.includes('எல்லா') || text.includes('सभी');

    if (cachedRisk) {
      console.log("[AgriRisk Voice] CURRENT ANALYSIS:", {
        crop: cachedRisk.crop,
        district: cachedRisk.district,
        season: cachedRisk.season,
        riskLevel: cachedRisk.risk_level,
        riskScore: cachedRisk.risk_score,
        breakdown: cachedRisk.breakdown
      });
    }

    try {
      // 1. GREETING & HELP
      if (intent === INTENTS.GREETING) {
        provideResponse(getVoiceResponse('GREETING', detectedLang), detectedLang, { lastIntent: intent, lastTopic: 'GREETING' });
        return;
      }
      if (intent === INTENTS.GENERAL_HELP) {
        provideResponse(getVoiceResponse('GENERAL_HELP', detectedLang), detectedLang, { lastIntent: intent, lastTopic: 'HELP' });
        return;
      }

      // 1.5 FORM CONTROL
      if (intent === INTENTS.FORM_CONTROL) {
        const controls = window.__AGRIRISK_FORM_CONTROLS__;
        
        if (!controls) {
          provideResponse(getVoiceResponse('FORM_NOT_ON_PAGE', detectedLang), detectedLang);
          return;
        }

        const stateAction   = actions.find(a => a.type === 'SELECT_STATE');
        const districtAction = actions.find(a => a.type === 'SELECT_DISTRICT');
        const cropAction    = actions.find(a => a.type === 'SELECT_CROP');
        const seasonAction  = actions.find(a => a.type === 'SELECT_SEASON');
        const hasAnalyze    = actions.some(a => a.type === 'ANALYZE_RISK');

        // ── STEP 1: Apply state immediately ──────────────────────────────
        if (stateAction) {
          console.log('[AgriRisk Voice] STATE VALUE:', stateAction.value);
          controls.handleChange('state', stateAction.value);
        }

        // ── STEP 2: Apply crop and season (independent, no async deps) ───
        if (cropAction) {
          controls.handleChange('crop', cropAction.value);
        }
        if (seasonAction) {
          console.log('[AgriRisk Voice] SEASON MATCH:', seasonAction.value);
          controls.handleChange('season', seasonAction.value);
        }

        // ── STEP 3: Build confirmation responses + handle district async ─
        // We collect all responses, then call provideResponse once.
        const responses = [];

        if (stateAction) {
          const stateName = stateAction.value.replace(/_/g, ' ');
          responses.push(getVoiceResponse('FORM_STATE_SELECTED', detectedLang, { value: stateName }));
        }
        if (cropAction) {
          responses.push(getVoiceResponse('FORM_CROP_SELECTED', detectedLang, { value: cropAction.value }));
        }
        if (seasonAction) {
          responses.push(getVoiceResponse('FORM_SEASON_SELECTED', detectedLang, { value: seasonAction.value }));
        }

        // ── STEP 4: District selection (with async district-list wait) ───
        const applyDistrictAndFinish = (districtId) => {
          // Get the freshest controls snapshot from the global (updated by RiskAnalysis useEffect)
          const freshControls = window.__AGRIRISK_FORM_CONTROLS__;
          if (!freshControls) {
            provideResponse(responses.join(' '), detectedLang, { lastIntent: intent, lastTopic: 'FORM' });
            return;
          }
          const availableDistricts = freshControls.districts || [];
          console.log('[AgriRisk Voice] AVAILABLE DISTRICTS:', availableDistricts);
          console.log('[AgriRisk Voice] DISTRICT SPOKEN:', districtId);

          if (availableDistricts.includes(districtId)) {
            freshControls.handleChange('district', districtId);
            console.log('[AgriRisk Voice] DISTRICT MATCH confirmed:', districtId);
            responses.push(getVoiceResponse('FORM_DISTRICT_SELECTED', detectedLang, { value: districtId.replace(/_/g, ' ') }));
          } else {
            // District not in list — either wrong state or truly unavailable
            responses.push(getVoiceResponse('FORM_DISTRICT_UNAVAILABLE', detectedLang, { district: districtId.replace(/_/g, ' ') }));
          }

          finishFormControl(freshControls, responses, hasAnalyze, actions, detectedLang, intent);
        };

        const finishWithoutDistrict = () => {
          const freshControls = window.__AGRIRISK_FORM_CONTROLS__;
          finishFormControl(freshControls || controls, responses, hasAnalyze, actions, detectedLang, intent);
        };

        if (districtAction) {
          console.log('[AgriRisk Voice] DISTRICT SPOKEN (raw action):', districtAction.value);

          if (stateAction) {
            // State was JUST changed — district list is loading asynchronously.
            // Poll window.__AGRIRISK_FORM_CONTROLS__.districts until the new list arrives.
            let attempts = 0;
            const MAX_WAIT_MS = 4000; // max 4 seconds
            const POLL_INTERVAL = 150; // check every 150ms
            const MAX_ATTEMPTS = Math.ceil(MAX_WAIT_MS / POLL_INTERVAL);
            const expectedState = stateAction.value;

            const pollForDistricts = () => {
              attempts++;
              const freshControls = window.__AGRIRISK_FORM_CONTROLS__;
              const freshDistricts = freshControls?.districts || [];
              const freshFormState = freshControls?.form?.state;

              // Districts are ready when: the form state matches the new state AND
              // the district list is non-empty.
              const stateReady = freshFormState === expectedState;
              const districtsLoaded = freshDistricts.length > 0;

              console.log(
                `[AgriRisk Voice] Polling districts: attempt=${attempts} state=${freshFormState} districts=${freshDistricts.length}`
              );

              if (stateReady && districtsLoaded) {
                applyDistrictAndFinish(districtAction.value);
              } else if (attempts >= MAX_ATTEMPTS) {
                // Timed out — try with whatever is available
                console.log('[AgriRisk Voice] District poll timed out, applying with current list');
                applyDistrictAndFinish(districtAction.value);
              } else {
                setTimeout(pollForDistricts, POLL_INTERVAL);
              }
            };

            // Give React one render cycle before starting to poll
            setTimeout(pollForDistricts, 80);
          } else {
            // State was NOT changed in this command — districts should already be loaded.
            // We can apply immediately, but give one React tick.
            setTimeout(() => applyDistrictAndFinish(districtAction.value), 80);
          }
        } else {
          // No district in this command — finish immediately
          if (responses.length > 0 || hasAnalyze) {
            setTimeout(finishWithoutDistrict, 80);
          }
        }

        return;
      }

      // 2. CONTEXTUAL FOLLOW-UPS (Safety Rule)
      if (intent === INTENTS.FOLLOW_UP_EXPLANATION) {
        if (conversationContext.lastTopic === 'RISK' || conversationContext.lastIntent === INTENTS.CROP_RISK) {
          const mainFactor = cachedRisk?.breakdown?.weather > cachedRisk?.breakdown?.market ? 'weather conditions' : 'market conditions';
          provideResponse(getVoiceResponse('EXPLANATION_CROP_RISK', detectedLang, { factor: mainFactor }), detectedLang);
        } else if (conversationContext.lastTopic === 'WEATHER') {
          provideResponse(getVoiceResponse('EXPLANATION_WEATHER', detectedLang, { weatherRisk: Math.round(cachedRisk?.breakdown?.weather || 0), condition: weather?.condition || 'current conditions' }), detectedLang);
        } else if (conversationContext.lastTopic === 'RECOMMENDATIONS') {
          const mainFactor = cachedRisk?.breakdown?.weather > cachedRisk?.breakdown?.market ? 'weather' : 'market';
          provideResponse(getVoiceResponse('EXPLANATION_RECOMMENDATION', detectedLang, { factor: mainFactor }), detectedLang);
        } else if (conversationContext.lastTopic === 'REGIONAL') {
           const districtData = regionalData?.find(d => d.district === cachedRisk?.district);
           provideResponse(getVoiceResponse('EXPLANATION_REGIONAL', detectedLang, { level: districtData?.risk_level || 'unknown' }), detectedLang);
        } else {
          provideResponse(getVoiceResponse('CONTEXT_MISSING', detectedLang), detectedLang);
        }
        return;
      }
      
      if (intent === INTENTS.FOLLOW_UP_RECOMMENDATION) {
        // Answer directly with recommendations
        let recs = cachedRisk ? generateRecommendations(cachedRisk.breakdown, cachedRisk.risk_level, cachedRisk.crop, cachedRisk.state, cachedRisk.district, cachedRisk.season) : null;
        if (recs) {
          console.log("[AgriRisk Voice] GENERATED RECOMMENDATIONS:", recs);
          if (!isAll) recs = recs.slice(0, 3);
        }
        provideResponse(getVoiceResponse('RECOMMENDATION_INFORMATION', detectedLang, { recommendations: recs, isAll: isAll, total: cachedRisk ? generateRecommendations(cachedRisk.breakdown, cachedRisk.risk_level, cachedRisk.crop, cachedRisk.state, cachedRisk.district, cachedRisk.season).length : 0 }), detectedLang, { lastIntent: INTENTS.RECOMMENDATION_INFORMATION, lastTopic: 'RECOMMENDATIONS' });
        return;
      }
      
      if (intent === INTENTS.FOLLOW_UP_WEATHER_IMPACT) {
        if (conversationContext.lastTopic === 'WEATHER' || conversationContext.lastIntent === INTENTS.WEATHER_CURRENT) {
          provideResponse(getVoiceResponse('WEATHER_IMPACT_ANALYSIS', detectedLang, { risk: Math.round(cachedRisk?.breakdown?.weather || 0) }), detectedLang);
        } else {
           provideResponse(getVoiceResponse('CONTEXT_MISSING', detectedLang), detectedLang);
        }
        return;
      }

      // 3. EXPLICIT NAVIGATION COMMANDS
      if (intent === INTENTS.NAVIGATE_DASHBOARD) {
        provideResponse(getVoiceResponse('NAVIGATE_DASHBOARD', detectedLang), detectedLang, { lastIntent: intent, lastTopic: 'NAVIGATION' });
        navigate('/dashboard');
        return;
      }
      if (intent === INTENTS.NAVIGATE_DECISION_SIMULATOR) {
        provideResponse(getVoiceResponse('NAVIGATE_DECISION_SIMULATOR', detectedLang), detectedLang, { lastIntent: intent, lastTopic: 'NAVIGATION' });
        navigate('/decision-simulator');
        return;
      }
      if (intent === INTENTS.NAVIGATE_REGIONAL_RISK) {
        provideResponse(getVoiceResponse('NAVIGATE_REGIONAL_RISK', detectedLang), detectedLang, { lastIntent: intent, lastTopic: 'NAVIGATION' });
        navigate('/regional-risk');
        return;
      }
      if (intent === INTENTS.NAVIGATE_RISK_ANALYSIS) {
        provideResponse(getVoiceResponse('NAVIGATE_RISK_ANALYSIS', detectedLang), detectedLang, { lastIntent: intent, lastTopic: 'NAVIGATION' });
        navigate('/risk-analysis');
        return;
      }
      if (intent === INTENTS.NAVIGATE_RECOMMENDATIONS) {
        provideResponse(getVoiceResponse('NAVIGATE_RECOMMENDATIONS', detectedLang), detectedLang, { lastIntent: intent, lastTopic: 'NAVIGATION' });
        navigate('/recommendations');
        return;
      }
      if (intent === INTENTS.NAVIGATE_WEATHER) {
        provideResponse(getVoiceResponse('NAVIGATE_WEATHER', detectedLang), detectedLang, { lastIntent: intent, lastTopic: 'NAVIGATION' });
        navigate('/dashboard'); 
        return;
      }

      // 4. CONVERSATIONAL INFORMATIONAL INTENTS
      if (intent === INTENTS.RECOMMENDATION_INFORMATION || intent === INTENTS.IRRIGATION) {
        let recs = cachedRisk ? generateRecommendations(cachedRisk.breakdown, cachedRisk.risk_level, cachedRisk.crop, cachedRisk.state, cachedRisk.district, cachedRisk.season) : null;
        if (recs) {
          console.log("[AgriRisk Voice] GENERATED RECOMMENDATIONS:", recs);
          if (!isAll) recs = recs.slice(0, 3);
        }
        provideResponse(getVoiceResponse('RECOMMENDATION_INFORMATION', detectedLang, { recommendations: recs, isAll: isAll, total: cachedRisk ? generateRecommendations(cachedRisk.breakdown, cachedRisk.risk_level, cachedRisk.crop, cachedRisk.state, cachedRisk.district, cachedRisk.season).length : 0 }), detectedLang, { lastIntent: intent, lastTopic: 'RECOMMENDATIONS' });

        
      } else if (intent === INTENTS.REGIONAL_RISK_INFORMATION) {
        const districtData = regionalData?.find(d => d.district === cachedRisk?.district);
        provideResponse(getVoiceResponse('REGIONAL_RISK_INFORMATION', detectedLang, { district: cachedRisk?.district, level: districtData?.risk_level }), detectedLang, { lastIntent: intent, lastTopic: 'REGIONAL' });
        
      } else if (intent === INTENTS.CROP_INFORMATION) {
        provideResponse(getVoiceResponse('CROP_INFORMATION', detectedLang, { crop: cachedRisk?.crop, district: cachedRisk?.district }), detectedLang, { lastIntent: intent, lastTopic: 'CROP' });

      } else if (intent === INTENTS.WEATHER_CURRENT || intent === INTENTS.WEATHER) {
        if (weather && weather.temperature !== undefined) {
          provideResponse(getVoiceResponse('WEATHER_CURRENT', detectedLang, {
            temp: weather.temperature,
            condition: weather.condition || 'clear skies',
            rain: weather.rainfall || 0,
            humidity: weather.humidity || 0,
            wind: weather.wind_speed || 0
          }), detectedLang, { lastIntent: intent, lastTopic: 'WEATHER' });
        } else {
          provideResponse(getVoiceResponse('WEATHER_CURRENT_UNAVAILABLE', detectedLang), detectedLang);
        }

      } else if (intent === INTENTS.WEATHER_TEMPERATURE) {
        if (weather && weather.temperature !== undefined) {
          provideResponse(getVoiceResponse('WEATHER_TEMPERATURE', detectedLang, { temp: weather.temperature }), detectedLang, { lastIntent: intent, lastTopic: 'WEATHER' });
        } else {
          provideResponse(getVoiceResponse('WEATHER_TEMPERATURE_UNAVAILABLE', detectedLang), detectedLang);
        }
        
      } else if (intent === INTENTS.WEATHER_RAIN) {
        if (weather && weather.rainfall !== undefined) {
          provideResponse(getVoiceResponse('WEATHER_RAIN', detectedLang, { rain: weather.rainfall }), detectedLang, { lastIntent: intent, lastTopic: 'WEATHER' });
        } else {
          provideResponse(getVoiceResponse('WEATHER_RAIN_UNAVAILABLE', detectedLang), detectedLang);
        }

      } else if (intent === INTENTS.WEATHER_RISK) {
        if (cachedRisk?.breakdown?.weather !== undefined) {
          provideResponse(getVoiceResponse('WEATHER_RISK', detectedLang, { risk: Math.round(cachedRisk.breakdown.weather) }), detectedLang, { lastIntent: intent, lastTopic: 'RISK' });
        } else {
          provideResponse(getVoiceResponse('WEATHER_RISK_UNAVAILABLE', detectedLang), detectedLang);
        }

      } else if (intent === INTENTS.CROP_RISK || intent === INTENTS.DISEASE_RISK) {
        if (cachedRisk && cachedRisk.risk_score !== undefined) {
          provideResponse(getVoiceResponse('CROP_RISK', detectedLang, { risk: Math.round(cachedRisk.risk_score) }), detectedLang, { lastIntent: INTENTS.CROP_RISK, lastTopic: 'RISK' });
        } else {
          provideResponse(getVoiceResponse('CROP_RISK_UNAVAILABLE', detectedLang), detectedLang);
        }

      } else {
        provideResponse(getVoiceResponse('UNKNOWN', detectedLang), detectedLang);
      }
    } catch (error) {
      console.error('Voice Assistant Error:', error);
      provideResponse(getVoiceResponse('ERROR', detectedLang), detectedLang);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 bg-agri-600 hover:bg-agri-700 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 z-50"
        title="Voice Assistant"
      >
        <Mic className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex flex-col">
      {/* Header */}
      <div className="bg-agri-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          <h3 className="font-semibold">AgriRisk Assistant</h3>
        </div>
        <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
        
        {currentState === STATES.UNSUPPORTED && (
          <div className="flex flex-col items-center text-gray-500">
            <AlertTriangle className="w-10 h-10 mb-3 text-orange-400" />
            <p>Voice recognition is not supported in this browser.</p>
          </div>
        )}

        {currentState === STATES.ERROR && (
          <div className="flex flex-col items-center text-red-500">
            <AlertTriangle className="w-10 h-10 mb-3" />
            <p className="font-medium mb-1">Voice Recognition Error</p>
            <p className="text-sm opacity-80">{errorMessage}</p>
            <button onClick={startVoiceSession} className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {currentState === STATES.LISTENING && (
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 flex items-center justify-center mb-4">
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 bg-red-500 rounded-full animate-pulse opacity-40"></div>
              <div className="relative bg-red-600 text-white p-3 rounded-full shadow-lg">
                <Mic className="w-6 h-6" />
              </div>
            </div>
            <p className="font-medium text-gray-800">Listening...</p>
            <p className="text-sm text-gray-400 mt-1">Speak now</p>
          </div>
        )}

        {currentState === STATES.PROCESSING && (
          <div className="flex flex-col items-center text-agri-600">
            <Loader2 className="w-10 h-10 mb-4 animate-spin" />
            <p className="font-medium text-gray-800">Processing...</p>
            <p className="text-sm text-gray-500 mt-1 italic">"{transcript}"</p>
          </div>
        )}

        {currentState === STATES.IDLE && (
          <div className="flex flex-col items-center w-full">
            {transcript && (
              <div className="w-full bg-gray-50 rounded-lg p-3 text-left mb-3 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold">You said</p>
                <p className="text-sm text-gray-700 italic">"{transcript}"</p>
              </div>
            )}
            
            {response && (
              <div className="w-full bg-green-50 rounded-lg p-3 text-left mb-5 border border-green-100">
                <p className="text-xs text-agri-600 uppercase tracking-wider mb-1 font-semibold">AgriRisk</p>
                <p className="text-sm text-gray-800">{response}</p>
              </div>
            )}

            {!transcript && !response && (
              <div className="text-gray-400 mb-5">
                <Mic className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Ready to help</p>
              </div>
            )}

            <button 
              onClick={startVoiceSession}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Tap to speak
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
