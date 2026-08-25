const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const isVoiceSupported = () => {
  return !!SpeechRecognition;
};

// ─── Duplicate command guard ───────────────────────────────────────────────
// Prevents the same transcript from firing twice within DUPLICATE_WINDOW_MS.
const DUPLICATE_WINDOW_MS = 1500;
let _lastTranscript = '';
let _lastTranscriptTime = 0;

const isDuplicate = (transcript) => {
  const now = Date.now();
  if (
    transcript === _lastTranscript &&
    now - _lastTranscriptTime < DUPLICATE_WINDOW_MS
  ) {
    console.log('[AgriRisk Voice] Duplicate transcript suppressed:', transcript);
    return true;
  }
  _lastTranscript = transcript;
  _lastTranscriptTime = now;
  return false;
};

// ─── Transcript normalizer ─────────────────────────────────────────────────
// Trims, collapses spaces, strips leading/trailing punctuation.
// Preserves Unicode (Telugu \u0C00-\u0C7F, Tamil \u0B80-\u0BFF, Hindi \u0900-\u097F).
export const normalizeTranscript = (raw) => {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/\s+/g, ' ')           // collapse repeated spaces
    .replace(/^[.,?!;।\s]+/, '')    // strip leading punctuation
    .replace(/[.,?!;।\s]+$/, '')    // strip trailing punctuation
    .trim();
};

export const isSynthesisSupported = () => {
  return !!window.speechSynthesis;
};

// Map AgriRisk UI languages to Speech Recognition language codes
const getLanguageCode = (langContextCode) => {
  switch(langContextCode) {
    case 'te': return 'te-IN';
    case 'ta': return 'ta-IN';
    case 'hi': return 'hi-IN';
    case 'en': 
    default: return 'en-IN';
  }
}

/**
 * startListening — single-utterance recognition session.
 *
 * onResult(finalTranscript, interimTranscript)
 *   - When interim: finalTranscript=null, interimTranscript=string (for UI display only)
 *   - When final:   finalTranscript=string, interimTranscript=null
 */
export const startListening = (langContextCode, onResult, onError, onEnd) => {
  if (!isVoiceSupported()) {
    onError('Browser does not support SpeechRecognition');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = getLanguageCode(langContextCode);
    // continuous=false → single utterance, ends naturally after silence.
    // interimResults=true → live transcript fed to UI while user speaks.
    // maxAlternatives=3 → browser picks best; improves accuracy on ambiguous words.
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    console.log(`[AgriRisk Voice] Recognition language: ${recognition.lang}`);

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const text = result[0].transcript; // highest-confidence alternative

        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      if (interimTranscript) {
        console.log('[AgriRisk Voice] Interim transcript:', interimTranscript);
        // null final → display only, do NOT execute command
        onResult(null, normalizeTranscript(interimTranscript));
      }

      if (finalTranscript) {
        const normalized = normalizeTranscript(finalTranscript);
        console.log(`[AgriRisk Voice] RAW FINAL TRANSCRIPT: ${finalTranscript}`);
        console.log(`[AgriRisk Voice] NORMALIZED TRANSCRIPT: ${normalized}`);
        if (!normalized) return;
        if (isDuplicate(normalized)) return;
        // null interim → this is the actionable result
        onResult(normalized, null);
      }
    };

    recognition.onerror = (event) => {
      // 'no-speech' and 'aborted' are normal end conditions, not real errors.
      if (event.error === 'no-speech') {
        console.log('[AgriRisk Voice] No speech detected — session ended normally.');
        return;
      }
      if (event.error === 'aborted') {
        console.log('[AgriRisk Voice] Recognition aborted (intentional stop).');
        return;
      }
      console.log('[AgriRisk Voice] Recognition error:', event.error);
      onError(event.error);
    };

    recognition.onend = () => {
      console.log('[AgriRisk Voice] Recognition ended.');
      if (onEnd) onEnd();
    };

    recognition.start();
    return recognition;
  } catch (error) {
    console.log('[AgriRisk Voice] Recognition start error:', error.message);
    onError(error.message);
    return null;
  }
};

let cachedVoices = [];
if (isSynthesisSupported()) {
  const updateVoices = () => { cachedVoices = window.speechSynthesis.getVoices(); };
  window.speechSynthesis.onvoiceschanged = updateVoices;
  updateVoices();
}

let currentAudio = null;

// ─── TTS active state ──────────────────────────────────────────────────────
// Lets VoiceAssistant know when TTS is playing so it blocks mic.
let _isSpeaking = false;
export const isTTSSpeaking = () => _isSpeaking;

let _onTTSEnd = null;
export const setOnTTSEnd = (cb) => { _onTTSEnd = cb; };

const _notifyTTSEnd = () => {
  _isSpeaking = false;
  if (_onTTSEnd) {
    const cb = _onTTSEnd;
    _onTTSEnd = null;
    cb();
  }
};

export const speakResponse = async (text, langContextCode) => {
  _isSpeaking = true;
  if (!text || !text.trim()) return;
  
  // 1. Stop existing browser speech
  if (isSynthesisSupported()) {
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }
  }

  // 2. Stop existing fallback audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  try {
    const targetLang = getLanguageCode(langContextCode);
    
    // Check if we should use fallback (Telugu or Tamil)
    if (langContextCode === 'te' || langContextCode === 'ta') {
      console.log(`[AgriRisk TTS] Using backend fallback for language: ${langContextCode}`);
      console.log("[AgriRisk TTS] COMPLETE TEXT:", text);
      
      const response = await fetch('http://localhost:5000/api/tts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: langContextCode
        })
      });

      if (!response.ok) {
        throw new Error(`Fallback TTS failed with status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      currentAudio = new Audio(audioUrl);
      
      currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        _notifyTTSEnd();
      };
      currentAudio.onerror = () => { _notifyTTSEnd(); };

      await currentAudio.play();
      return;
    }

    // Existing Web Speech API for English and Hindi
    if (!isSynthesisSupported()) { _notifyTTSEnd(); return; }
    const synth = window.speechSynthesis;
    
    let voices = synth.getVoices();
    if (!voices || voices.length === 0) {
      voices = cachedVoices;
    }

    const prefix = targetLang.split("-")[0].toLowerCase();
    const voice =
        voices.find(v => v.lang && v.lang.toLowerCase() === targetLang.toLowerCase()) ||
        voices.find(v => v.lang && v.lang.toLowerCase().startsWith(prefix));

    console.log("[AgriRisk TTS] COMPLETE TEXT:", text);
    console.log("[AgriRisk TTS] TEXT LENGTH:", text.length);
    console.log("[AgriRisk TTS] LANGUAGE:", targetLang);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;

    if (voice) {
        utterance.voice = voice;
        console.log("[AgriRisk TTS] Selected voice:", voice.name);
    } else {
        const langName = targetLang.startsWith('hi') ? 'Hindi' : 'English';
        console.warn(`[AgriRisk TTS] ${langName} native voice unavailable`);
    }

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = _notifyTTSEnd;
    utterance.onerror = _notifyTTSEnd;

    synth.speak(utterance);
  } catch (error) {
    if (langContextCode === 'te' || langContextCode === 'ta') {
      console.error(`[AgriRisk TTS] ${langContextCode === 'te' ? 'Telugu' : 'Tamil'} TTS failed:`, error);
    } else {
      console.warn('Speech synthesis failed:', error);
    }
    _notifyTTSEnd();
  }
};

export const stopSpeaking = () => {
  if (isSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  _isSpeaking = false;
};
