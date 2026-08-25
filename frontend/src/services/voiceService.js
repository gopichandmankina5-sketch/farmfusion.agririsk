const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const isVoiceSupported = () => {
  return !!SpeechRecognition;
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

export const startListening = (langContextCode, onResult, onError, onEnd) => {
  if (!isVoiceSupported()) {
    onError('Browser does not support SpeechRecognition');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = getLanguageCode(langContextCode);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          onResult(transcript);
        }
      }
    };

    recognition.onerror = (event) => {
      onError(event.error);
    };

    recognition.onend = () => {
      if(onEnd) onEnd();
    };

    recognition.start();
    return recognition;
  } catch (error) {
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

export const speakResponse = async (text, langContextCode) => {
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
      };

      await currentAudio.play();
      return;
    }

    // Existing Web Speech API for English and Hindi
    if (!isSynthesisSupported()) return;
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

    synth.speak(utterance);
  } catch (error) {
    if (langContextCode === 'te' || langContextCode === 'ta') {
      console.error(`[AgriRisk TTS] ${langContextCode === 'te' ? 'Telugu' : 'Tamil'} TTS failed:`, error);
    } else {
      console.warn('Speech synthesis failed:', error);
    }
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
};
