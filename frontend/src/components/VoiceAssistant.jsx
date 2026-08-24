import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { startListening, stopSpeaking, speakResponse, isVoiceSupported } from '../services/voiceService';
import { parseVoiceCommand, detectSpeechLanguage, INTENTS } from '../utils/voiceCommands';
import { getVoiceResponse } from '../utils/voiceTranslations';
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
  
  const recognitionRef = useRef(null);

  // Stop recognition and speaking on unmount or close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      stopSpeaking();
    };
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setResponse('');
    setTranscript('');
    setErrorMessage('');
    if (isVoiceSupported()) {
      startVoiceSession();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    stopSpeaking();
    if (isVoiceSupported()) {
      setCurrentState(STATES.IDLE);
    }
  };

  const startVoiceSession = () => {
    stopSpeaking();
    setTranscript('');
    setResponse('');
    setErrorMessage('');
    setCurrentState(STATES.LISTENING);

    const recognition = startListening(
      language,
      (text) => {
        setTranscript(text);
        setCurrentState(STATES.PROCESSING);
        handleIntent(text);
      },
      (err) => {
        setErrorMessage(err);
        setCurrentState(STATES.ERROR);
      },
      () => {
        if (currentState === STATES.LISTENING) {
          // If ended without results
          setCurrentState(STATES.IDLE);
        }
      }
    );
    
    recognitionRef.current = recognition;
  };

  const provideResponse = (text, targetLang) => {
    setResponse(text);
    speakResponse(text, targetLang || language);
    setCurrentState(STATES.IDLE);
  };

  const handleIntent = (text) => {
    const detectedLang = detectSpeechLanguage(text, language);
    const intent = parseVoiceCommand(text);
    
    console.log("[VOICE] Selected language:", language);
    console.log("[VOICE] Detected language:", detectedLang);
    console.log("[VOICE] Detected intent:", intent);

    const cachedRisk = window.__AGRIRISK_LAST_RISK__;
    const weather = cachedRisk?.weather_data;

    try {
      if (intent === INTENTS.DASHBOARD) {
        provideResponse(getVoiceResponse('DASHBOARD', detectedLang), detectedLang);
        navigate('/dashboard');
        
      } else if (intent === INTENTS.REGIONAL_RISK) {
        provideResponse(getVoiceResponse('REGIONAL_RISK', detectedLang), detectedLang);
        navigate('/regional-risk');
        
      } else if (intent === INTENTS.RISK_ANALYSIS) {
        provideResponse(getVoiceResponse('DASHBOARD', detectedLang), detectedLang); // same response as dashboard
        navigate('/risk-analysis');
        
      } else if (intent === INTENTS.RECOMMENDATIONS || intent === INTENTS.IRRIGATION) {
        provideResponse(getVoiceResponse('RECOMMENDATIONS', detectedLang), detectedLang);
        navigate('/recommendations');
        
      } else if (intent === INTENTS.WEATHER_CURRENT || intent === INTENTS.WEATHER) {
        if (weather && weather.temperature !== undefined) {
          provideResponse(getVoiceResponse('WEATHER_CURRENT', detectedLang, {
            temp: weather.temperature,
            condition: weather.condition || 'clear skies',
            rain: weather.rainfall || 0,
            humidity: weather.humidity || 0,
            wind: weather.wind_speed || 0
          }), detectedLang);
        } else {
          provideResponse(getVoiceResponse('WEATHER_CURRENT_UNAVAILABLE', detectedLang), detectedLang);
        }

      } else if (intent === INTENTS.WEATHER_TEMPERATURE) {
        if (weather && weather.temperature !== undefined) {
          provideResponse(getVoiceResponse('WEATHER_TEMPERATURE', detectedLang, { temp: weather.temperature }), detectedLang);
        } else {
          provideResponse(getVoiceResponse('WEATHER_TEMPERATURE_UNAVAILABLE', detectedLang), detectedLang);
        }
        
      } else if (intent === INTENTS.WEATHER_RAIN) {
        if (weather && weather.rainfall !== undefined) {
          provideResponse(getVoiceResponse('WEATHER_RAIN', detectedLang, { rain: weather.rainfall }), detectedLang);
        } else {
          provideResponse(getVoiceResponse('WEATHER_RAIN_UNAVAILABLE', detectedLang), detectedLang);
        }

      } else if (intent === INTENTS.WEATHER_RISK) {
        if (cachedRisk?.breakdown?.weather !== undefined) {
          provideResponse(getVoiceResponse('WEATHER_RISK', detectedLang, { risk: Math.round(cachedRisk.breakdown.weather) }), detectedLang);
        } else {
          provideResponse(getVoiceResponse('WEATHER_RISK_UNAVAILABLE', detectedLang), detectedLang);
        }

      } else if (intent === INTENTS.CROP_RISK || intent === INTENTS.DISEASE_RISK) {
        if (cachedRisk && cachedRisk.risk_score !== undefined) {
          provideResponse(getVoiceResponse('CROP_RISK', detectedLang, { risk: Math.round(cachedRisk.risk_score) }), detectedLang);
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
