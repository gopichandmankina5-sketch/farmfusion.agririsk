export const getVoiceResponse = (intent, lang, data = {}) => {
  const responses = {
    en: {
      DASHBOARD: 'Opening dashboard...',
      REGIONAL_RISK: 'Opening regional risk map...',
      RECOMMENDATIONS: 'Opening recommendations...',
      WEATHER_CURRENT: `The current temperature is ${data.temp} degrees Celsius with ${data.condition}. Rainfall is ${data.rain} millimeters, humidity is ${data.humidity} percent, and wind speed is ${data.wind} kilometers per hour.`,
      WEATHER_CURRENT_UNAVAILABLE: 'Weather data is currently unavailable.',
      WEATHER_TEMPERATURE: `The current temperature is ${data.temp} degrees Celsius.`,
      WEATHER_TEMPERATURE_UNAVAILABLE: 'Temperature data is currently unavailable.',
      WEATHER_RAIN: `The current rainfall is ${data.rain} millimeters.`,
      WEATHER_RAIN_UNAVAILABLE: 'Rainfall data is currently unavailable.',
      WEATHER_RISK: `The current weather risk is ${data.risk} out of 100.`,
      WEATHER_RISK_UNAVAILABLE: 'Weather risk data is currently unavailable.',
      CROP_RISK: `Your current crop risk is ${data.risk} percent.`,
      CROP_RISK_UNAVAILABLE: 'Current risk data is unavailable. Please select a location and crop to analyze.',
      UNKNOWN: "I didn't understand that command. You can ask about crop risk, weather, recommendations, or say 'Open dashboard'.",
      ERROR: 'Sorry, an error occurred while processing your command.'
    },
    te: {
      DASHBOARD: 'డాష్బోర్డ్ తెరుస్తున్నాను...',
      REGIONAL_RISK: 'ప్రాంతీయ ప్రమాద మ్యాప్ తెరుస్తున్నాను...',
      RECOMMENDATIONS: 'సూచనలు తెరుస్తున్నాను...',
      WEATHER_CURRENT: `ప్రస్తుతం ఉష్ణోగ్రత ${data.temp} డిగ్రీల సెల్సియస్ మరియు ${data.condition}. వర్షపాతం ${data.rain} మిల్లీమీటర్లు, తేమ ${data.humidity} శాతం, మరియు గాలి వేగం గంటకు ${data.wind} కిలోమీటర్లు.`,
      WEATHER_CURRENT_UNAVAILABLE: 'వాతావరణ సమాచారం ప్రస్తుతం అందుబాటులో లేదు.',
      WEATHER_TEMPERATURE: `ప్రస్తుతం ఉష్ణోగ్రత ${data.temp} డిగ్రీల సెల్సియస్.`,
      WEATHER_TEMPERATURE_UNAVAILABLE: 'ఉష్ణోగ్రత సమాచారం ప్రస్తుతం అందుబాటులో లేదు.',
      WEATHER_RAIN: `ప్రస్తుతం వర్షపాతం ${data.rain} మిల్లీమీటర్లు.`,
      WEATHER_RAIN_UNAVAILABLE: 'వర్షపాతం సమాచారం ప్రస్తుతం అందుబాటులో లేదు.',
      WEATHER_RISK: `ప్రస్తుత వాతావరణ ప్రమాదం 100 కి ${data.risk}.`,
      WEATHER_RISK_UNAVAILABLE: 'వాతావరణ ప్రమాద సమాచారం ప్రస్తుతం అందుబాటులో లేదు.',
      CROP_RISK: `మీ పంట ప్రమాద స్థాయి ${data.risk} శాతం.`,
      CROP_RISK_UNAVAILABLE: 'ప్రమాద సమాచారం అందుబాటులో లేదు.',
      UNKNOWN: "ఈ ఆదేశాన్ని నేను అర్థం చేసుకోలేకపోయాను. పంట ప్రమాదం, వాతావరణం, సూచనలు లేదా డాష్బోర్డ్ గురించి అడగవచ్చు.",
      ERROR: 'క్షమించండి, లోపం జరిగింది.'
    },
    ta: {
      DASHBOARD: 'டாஷ்போர்டை திறக்கிறது...',
      REGIONAL_RISK: 'பிராந்திய ஆபத்து வரைபடத்தை திறக்கிறது...',
      RECOMMENDATIONS: 'பரிந்துரைகளை திறக்கிறது...',
      WEATHER_CURRENT: `தற்போதைய வெப்பநிலை ${data.temp} டிகிரி செல்சியஸ் மற்றும் ${data.condition}. மழைப்பொழிவு ${data.rain} மில்லிமீட்டர், ஈரப்பதம் ${data.humidity} சதவீதம், மற்றும் காற்றின் வேகம் மணிக்கு ${data.wind} கிலோமீட்டர்.`,
      WEATHER_CURRENT_UNAVAILABLE: 'வானிலை தரவு தற்போது கிடைக்கவில்லை.',
      WEATHER_TEMPERATURE: `தற்போதைய வெப்பநிலை ${data.temp} டிகிரி செல்சியஸ்.`,
      WEATHER_TEMPERATURE_UNAVAILABLE: 'வெப்பநிலை தரவு தற்போது கிடைக்கவில்லை.',
      WEATHER_RAIN: `தற்போதைய மழைப்பொழிவு ${data.rain} மில்லிமீட்டர்.`,
      WEATHER_RAIN_UNAVAILABLE: 'மழைப்பொழிவு தரவு தற்போது கிடைக்கவில்லை.',
      WEATHER_RISK: `தற்போதைய வானிலை ஆபத்து 100 க்கு ${data.risk}.`,
      WEATHER_RISK_UNAVAILABLE: 'வானிலை ஆபத்து தரவு தற்போது கிடைக்கவில்லை.',
      CROP_RISK: `உங்கள் பயிரின் ஆபத்து ${data.risk} சதவீதம்.`,
      CROP_RISK_UNAVAILABLE: 'ஆபத்து தரவு தற்போது கிடைக்கவில்லை.',
      UNKNOWN: "இந்த கட்டளையை என்னால் புரிந்து கொள்ள முடியவில்லை. பயிர் ஆபத்து, வானிலை, பரிந்துரைகள் பற்றி கேட்கலாம்.",
      ERROR: 'மன்னிக்கவும், பிழை ஏற்பட்டுள்ளது.'
    },
    hi: {
      DASHBOARD: 'डैशबोर्ड खोल रहा है...',
      REGIONAL_RISK: 'क्षेत्रीय जोखिम मानचित्र खोल रहा है...',
      RECOMMENDATIONS: 'सुझाव खोल रहा है...',
      WEATHER_CURRENT: `वर्तमान तापमान ${data.temp} डिग्री सेल्सियस और ${data.condition} है। बारिश ${data.rain} मिलीमीटर, नमी ${data.humidity} प्रतिशत, और हवा की गति ${data.wind} किलोमीटर प्रति घंटा है।`,
      WEATHER_CURRENT_UNAVAILABLE: 'मौसम डेटा वर्तमान में अनुपलब्ध है।',
      WEATHER_TEMPERATURE: `वर्तमान तापमान ${data.temp} डिग्री सेल्सियस है।`,
      WEATHER_TEMPERATURE_UNAVAILABLE: 'तापमान डेटा वर्तमान में अनुपलब्ध है।',
      WEATHER_RAIN: `वर्तमान बारिश ${data.rain} मिलीमीटर है।`,
      WEATHER_RAIN_UNAVAILABLE: 'बारिश डेटा वर्तमान में अनुपलब्ध है।',
      WEATHER_RISK: `वर्तमान मौसम जोखिम 100 में से ${data.risk} है।`,
      WEATHER_RISK_UNAVAILABLE: 'मौसम जोखिम डेटा वर्तमान में अनुपलब्ध है।',
      CROP_RISK: `आपकी फसल का जोखिम ${data.risk} प्रतिशत है।`,
      CROP_RISK_UNAVAILABLE: 'जोखिम डेटा अनुपलब्ध है।',
      UNKNOWN: "मैं उस कमांड को समझ नहीं पाया। आप फसल जोखिम, मौसम, सुझाव के बारे में पूछ सकते हैं।",
      ERROR: 'क्षमा करें, एक त्रुटि हुई।'
    }
  };

  const selectedLang = responses[lang] ? lang : 'en';
  return responses[selectedLang][intent] || responses['en'][intent] || '';
};
