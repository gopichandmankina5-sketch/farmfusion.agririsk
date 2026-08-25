export const getVoiceResponse = (intent, lang, data = {}) => {
  const getRecText = (recs, l, d = {}) => {
    if (!recs || recs.length === 0) return null;
    let text = recs.map((r, i) => `${i + 1}. ${r.title[l] || r.title.en}`).join('. ');
    if (d.isAll) {
       const prefix = l === 'te' ? `మీ ప్రస్తుత విశ్లేషణకు ${d.total} సూచనలు ఉన్నాయి. ` :
                      l === 'ta' ? `உங்கள் தற்போதைய பகுப்பாய்விற்கு ${d.total} பரிந்துரைகள் உள்ளன. ` :
                      l === 'hi' ? `आपके वर्तमान विश्लेषण के लिए ${d.total} सिफारिशें हैं। ` :
                                   `There are ${d.total} recommendations for your current analysis. `;
       return prefix + text;
    }
    return text;
  };

  const responses = {
    en: {
      GREETING: 'Hello! How can I help you with your farm today?',
      GENERAL_HELP: 'I can help you understand your crop risk, weather conditions, risk factors, and recommendations. You can also ask me to open different parts of AgriRisk.',
      NAVIGATE_DASHBOARD: 'Opening dashboard...',
      NAVIGATE_REGIONAL_RISK: 'Opening regional risk map...',
      NAVIGATE_RECOMMENDATIONS: 'Opening recommendations...',
      NAVIGATE_RISK_ANALYSIS: 'Opening risk analysis...',
      NAVIGATE_WEATHER: 'Opening weather...',
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
      CROP_INFORMATION: data.crop ? `You are currently analyzing ${data.crop}.` : 'Crop information is currently unavailable.',
      EXPLANATION_CROP_RISK: `The current risk is primarily influenced by ${data.factor} identified in your analysis.`,
      EXPLANATION_WEATHER: `The current weather has a risk score of ${data.weatherRisk} out of 100.`,
      EXPLANATION_RECOMMENDATION: `These recommendations are designed to mitigate your primary risk factor which is ${data.factor}.`,
      EXPLANATION_REGIONAL: `The regional risk is ${data.level} based on data from surrounding districts.`,
      WEATHER_IMPACT_ANALYSIS: `Based on current weather, the weather risk impact on your crop is ${data.risk} out of 100.`,
      RECOMMENDATION_INFORMATION: getRecText(data.recommendations, 'en', data) ? `Based on your current analysis, I recommend: ${getRecText(data.recommendations, 'en', data)}` : 'Recommendation data is currently unavailable.',
      REGIONAL_RISK_INFORMATION: data.level ? `The regional risk for ${data.district} is currently ${data.level}.` : 'Regional risk data is currently unavailable.',
      CONTEXT_MISSING: 'I can help with that. Please ask about your crop risk, weather, or recommendations first.',
      UNKNOWN: "I didn't quite understand that. You can ask me about your crop, risk, weather, or recommendations.",
      ERROR: 'Sorry, an error occurred while processing your command.'
    },
    te: {
      GREETING: 'హలో! మీ వ్యవసాయానికి నేను ఎలా సహాయం చేయగలను?',
      GENERAL_HELP: 'పంట ప్రమాదం, వాతావరణ పరిస్థితులు, ప్రమాద కారకాలు మరియు సిఫార్సులను అర్థం చేసుకోవడంలో నేను మీకు సహాయం చేయగలను. మీరు అగ్రిరిస్క్ లోని వివిధ విభాగాలను తెరవమని కూడా నన్ను అడగవచ్చు.',
      NAVIGATE_DASHBOARD: 'డాష్బోర్డ్ తెరుస్తున్నాను...',
      NAVIGATE_REGIONAL_RISK: 'ప్రాంతీయ ప్రమాద మ్యాప్ తెరుస్తున్నాను...',
      NAVIGATE_RECOMMENDATIONS: 'సూచనలు తెరుస్తున్నాను...',
      NAVIGATE_RISK_ANALYSIS: 'ప్రమాద విశ్లేషణ తెరుస్తున్నాను...',
      NAVIGATE_WEATHER: 'వాతావరణం తెరుస్తున్నాను...',
      WEATHER_CURRENT: `ప్రస్తుతం ఉష్ణోగ్రత ${data.temp} డిగ్రీల సెల్సియస్ మరియు ${data.condition}. వర్షపాతం ${data.rain} మిల్లీమీటర్లు, తేమ ${data.humidity} శాతం, మరియు గాలి వేగం గంటకు ${data.wind} కిలోమీటర్లు.`,
      WEATHER_CURRENT_UNAVAILABLE: 'వాతావరణ సమాచారం ప్రస్తుతం అందుబాటులో లేదు.',
      WEATHER_TEMPERATURE: `ప్రస్తుతం ఉష్ణోగ్రత ${data.temp} డిగ్రీల సెల్సియస్.`,
      WEATHER_TEMPERATURE_UNAVAILABLE: 'ఉష్ణోగ్రత సమాచారం ప్రస్తుతం అందుబాటులో లేదు.',
      WEATHER_RAIN: `ప్రస్తుతం వర్షపాతం ${data.rain} మిల్లీమీటర్లు.`,
      WEATHER_RAIN_UNAVAILABLE: 'వర్షపాతం సమాచారం ప్రస్తుతం అందుబాటులో లేదు.',
      WEATHER_RISK: `ప్రస్తుత వాతావరణ ప్రమాదం 100 కి ${data.risk}.`,
      WEATHER_RISK_UNAVAILABLE: 'వాతావరణ ప్రమాద సమాచారం ప్రస్తుతం అందుబాటులో లేదు.',
      CROP_RISK: `మీ పంట ప్రమాద స్థాయి ${data.risk} శాతం.`,
      CROP_RISK_UNAVAILABLE: 'ప్రమాద సమాచారం అందుబాటులో లేదు. దయచేసి విశ్లేషించడానికి స్థానం మరియు పంటను ఎంచుకోండి.',
      CROP_INFORMATION: data.crop ? `ప్రస్తుతం మీరు ${data.crop} పంటను విశ్లేషిస్తున్నారు.` : 'పంట సమాచారం ప్రస్తుతం అందుబాటులో లేదు.',
      EXPLANATION_CROP_RISK: `ప్రధానంగా ప్రస్తుత ${data.factor === 'weather conditions' ? 'వాతావరణ పరిస్థితులు' : 'మార్కెట్ పరిస్థితులు'} కారణంగా ప్రమాద స్థాయి ప్రభావితం చేయబడింది.`,
      EXPLANATION_WEATHER: `ప్రస్తుత వాతావరణ ప్రమాద స్థాయి 100 కి ${data.weatherRisk}.`,
      EXPLANATION_RECOMMENDATION: `మీ ప్రధాన ప్రమాద కారకాలను తగ్గించడానికి ఈ సూచనలు రూపొందించబడ్డాయి.`,
      EXPLANATION_REGIONAL: `చుట్టుపక్కల జిల్లాల డేటా ఆధారంగా ప్రాంతీయ ప్రమాదం అంచనా వేయబడింది.`,
      WEATHER_IMPACT_ANALYSIS: `ప్రస్తుత వాతావరణం ఆధారంగా, మీ పంటపై వాతావరణ ప్రమాద ప్రభావం 100 కి ${data.risk}.`,
      RECOMMENDATION_INFORMATION: getRecText(data.recommendations, 'te', data) ? `మీ ప్రస్తుత విశ్లేషణను బట్టి, నేను ఈ విధంగా సిఫార్సు చేస్తున్నాను: ${getRecText(data.recommendations, 'te', data)}` : 'సిఫార్సు సమాచారం ప్రస్తుతం అందుబాటులో లేదు.',
      REGIONAL_RISK_INFORMATION: data.level ? `${data.district} కి ప్రాంతీయ ప్రమాదం ప్రస్తుతం ${data.level}.` : 'ప్రాంతీయ ప్రమాద సమాచారం ప్రస్తుతం అందుబాటులో లేదు.',
      CONTEXT_MISSING: 'నేను సహాయం చేయగలను. దయచేసి ముందుగా మీ పంట ప్రమాదం లేదా వాతావరణం గురించి అడగండి.',
      UNKNOWN: "మీ ప్రశ్న నాకు పూర్తిగా అర్థం కాలేదు. మీరు మీ పంట, ప్రమాదం, వాతావరణం లేదా సిఫార్సుల గురించి అడగవచ్చు.",
      ERROR: 'క్షమించండి, లోపం జరిగింది.'
    },
    ta: {
      GREETING: 'வணக்கம்! உங்கள் விவசாயத்திற்கு நான் எப்படி உதவலாம்?',
      GENERAL_HELP: 'உங்கள் பயிர் ஆபத்து, வானிலை நிலைமைகள், ஆபத்து காரணிகள் மற்றும் பரிந்துரைகளைப் புரிந்துகொள்ள நான் உதவ முடியும்.',
      NAVIGATE_DASHBOARD: 'டாஷ்போர்டை திறக்கிறது...',
      NAVIGATE_REGIONAL_RISK: 'பிராந்திய ஆபத்து வரைபடத்தை திறக்கிறது...',
      NAVIGATE_RECOMMENDATIONS: 'பரிந்துரைகளை திறக்கிறது...',
      NAVIGATE_RISK_ANALYSIS: 'ஆபத்து பகுப்பாய்வை திறக்கிறது...',
      NAVIGATE_WEATHER: 'வானிலை திறக்கிறது...',
      WEATHER_CURRENT: `தற்போதைய வெப்பநிலை ${data.temp} டிகிரி செல்சியஸ் மற்றும் ${data.condition}. மழைப்பொழிவு ${data.rain} மில்லிமீட்டர், ஈரப்பதம் ${data.humidity} சதவீதம், மற்றும் காற்றின் வேகம் மணிக்கு ${data.wind} கிலோமீட்டர்.`,
      WEATHER_CURRENT_UNAVAILABLE: 'வானிலை தரவு தற்போது கிடைக்கவில்லை.',
      WEATHER_TEMPERATURE: `தற்போதைய வெப்பநிலை ${data.temp} டிகிரி செல்சியஸ்.`,
      WEATHER_TEMPERATURE_UNAVAILABLE: 'வெப்பநிலை தரவு தற்போது கிடைக்கவில்லை.',
      WEATHER_RAIN: `தற்போதைய மழைப்பொழிவு ${data.rain} மில்லிமீட்டர்.`,
      WEATHER_RAIN_UNAVAILABLE: 'மழைப்பொழிவு தரவு தற்போது கிடைக்கவில்லை.',
      WEATHER_RISK: `தற்போதைய வானிலை ஆபத்து 100 க்கு ${data.risk}.`,
      WEATHER_RISK_UNAVAILABLE: 'வானிலை ஆபத்து தரவு தற்போது கிடைக்கவில்லை.',
      CROP_RISK: `உங்கள் பயிரின் தற்போதைய ஆபத்து நிலை ${data.risk} சதவீதம்.`,
      CROP_RISK_UNAVAILABLE: 'ஆபத்து தரவு தற்போது கிடைக்கவில்லை. பகுப்பாய்வு செய்ய ஒரு இருப்பிடம் மற்றும் பயிரைத் தேர்ந்தெடுக்கவும்.',
      CROP_INFORMATION: data.crop ? `தற்போது நீங்கள் ${data.crop} பயிரை பகுப்பாய்வு செய்கிறீர்கள்.` : 'பயிர் தகவல் தற்போது கிடைக்கவில்லை.',
      EXPLANATION_CROP_RISK: `தற்போதைய ஆபத்து முக்கியமாக ${data.factor === 'weather conditions' ? 'வானிலை நிலைமைகளால்' : 'சந்தை நிலைமைகளால்'} பாதிக்கப்பட்டுள்ளது.`,
      EXPLANATION_WEATHER: `தற்போதைய வானிலை ஆபத்து நிலை 100 க்கு ${data.weatherRisk}.`,
      EXPLANATION_RECOMMENDATION: `உங்கள் முக்கிய ஆபத்து காரணிகளை குறைப்பதற்காக இந்த பரிந்துரைகள் வடிவமைக்கப்பட்டுள்ளன.`,
      EXPLANATION_REGIONAL: `சுற்றியுள்ள மாவட்டங்களின் தரவுகளின் அடிப்படையில் பிராந்திய ஆபத்து மதிப்பிடப்பட்டுள்ளது.`,
      WEATHER_IMPACT_ANALYSIS: `தற்போதைய வானிலை அடிப்படையில், உங்கள் பயிரில் வானிலை ஆபத்து தாக்கம் 100 க்கு ${data.risk}.`,
      RECOMMENDATION_INFORMATION: getRecText(data.recommendations, 'ta', data) ? `உங்கள் தற்போதைய பகுப்பாய்வின் அடிப்படையில், நான் இதை பரிந்துரைக்கிறேன்: ${getRecText(data.recommendations, 'ta', data)}` : 'பரிந்துரை தரவு தற்போது கிடைக்கவில்லை.',
      REGIONAL_RISK_INFORMATION: data.level ? `${data.district} க்கான பிராந்திய ஆபத்து தற்போது ${data.level}.` : 'பிராந்திய ஆபத்து தரவு தற்போது கிடைக்கவில்லை.',
      CONTEXT_MISSING: 'நான் உதவ முடியும். முதலில் உங்கள் பயிர் ஆபத்து அல்லது வானிலை பற்றி கேட்கவும்.',
      UNKNOWN: "உங்கள் கேள்வியை முழுமையாக புரிந்துகொள்ள முடியவில்லை. உங்கள் பயிர், ஆபத்து, வானிலை அல்லது பரிந்துரைகள் பற்றி கேட்கலாம்.",
      ERROR: 'மன்னிக்கவும், பிழை ஏற்பட்டுள்ளது.'
    },
    hi: {
      GREETING: 'नमस्ते! मैं आपकी खेती में कैसे मदद कर सकता हूँ?',
      GENERAL_HELP: 'मैं आपको आपकी फसल के जोखिम, मौसम की स्थिति, जोखिम कारकों और सुझावों को समझने में मदद कर सकता हूं।',
      NAVIGATE_DASHBOARD: 'डैशबोर्ड खोल रहा है...',
      NAVIGATE_REGIONAL_RISK: 'क्षेत्रीय जोखिम मानचित्र खोल रहा है...',
      NAVIGATE_RECOMMENDATIONS: 'सुझाव खोल रहा है...',
      NAVIGATE_RISK_ANALYSIS: 'जोखिम विश्लेषण खोल रहा है...',
      NAVIGATE_WEATHER: 'मौसम खोल रहा है...',
      WEATHER_CURRENT: `वर्तमान तापमान ${data.temp} डिग्री सेल्सियस और ${data.condition} है। बारिश ${data.rain} मिलीमीटर, नमी ${data.humidity} प्रतिशत, और हवा की गति ${data.wind} किलोमीटर प्रति घंटा है।`,
      WEATHER_CURRENT_UNAVAILABLE: 'मौसम डेटा वर्तमान में अनुपलब्ध है।',
      WEATHER_TEMPERATURE: `वर्तमान तापमान ${data.temp} डिग्री सेल्सियस है।`,
      WEATHER_TEMPERATURE_UNAVAILABLE: 'तापमान डेटा वर्तमान में अनुपलब्ध है।',
      WEATHER_RAIN: `वर्तमान बारिश ${data.rain} मिलीमीटर है।`,
      WEATHER_RAIN_UNAVAILABLE: 'बारिश डेटा वर्तमान में अनुपलब्ध है।',
      WEATHER_RISK: `वर्तमान मौसम जोखिम 100 में से ${data.risk} है।`,
      WEATHER_RISK_UNAVAILABLE: 'मौसम जोखिम डेटा वर्तमान में अनुपलब्ध है।',
      CROP_RISK: `आपकी फसल का जोखिम ${data.risk} प्रतिशत है।`,
      CROP_RISK_UNAVAILABLE: 'जोखिम डेटा वर्तमान में उपलब्ध नहीं है। कृपया विश्लेषण करने के लिए एक स्थान और फसल का चयन करें।',
      CROP_INFORMATION: data.crop ? `आप वर्तमान में ${data.crop} का विश्लेषण कर रहे हैं।` : 'फसल की जानकारी वर्तमान में अनुपलब्ध है।',
      EXPLANATION_CROP_RISK: `वर्तमान जोखिम मुख्य रूप से विश्लेषण में पहचाने गए ${data.factor === 'weather conditions' ? 'मौसम की स्थिति' : 'बाजार की स्थिति'} से प्रभावित है।`,
      EXPLANATION_WEATHER: `वर्तमान मौसम जोखिम स्कोर 100 में से ${data.weatherRisk} है।`,
      EXPLANATION_RECOMMENDATION: `ये सुझाव आपके प्राथमिक जोखिम कारकों को कम करने के लिए डिज़ाइन किए गए हैं।`,
      EXPLANATION_REGIONAL: `आसपास के जिलों के डेटा के आधार पर क्षेत्रीय जोखिम का आकलन किया गया है।`,
      WEATHER_IMPACT_ANALYSIS: `वर्तमान मौसम के आधार पर, आपकी फसल पर मौसम के जोखिम का प्रभाव 100 में से ${data.risk} है।`,
      RECOMMENDATION_INFORMATION: getRecText(data.recommendations, 'hi', data) ? `आपके वर्तमान विश्लेषण के आधार पर, मैं सुझाव देता हूं: ${getRecText(data.recommendations, 'hi', data)}` : 'सिफारिश डेटा वर्तमान में अनुपलब्ध है।',
      REGIONAL_RISK_INFORMATION: data.level ? `${data.district} के लिए क्षेत्रीय जोखिम वर्तमान में ${data.level} है।` : 'क्षेत्रीय जोखिम डेटा वर्तमान में अनुपलब्ध है।',
      CONTEXT_MISSING: 'मैं इसमें आपकी मदद कर सकता हूं। कृपया पहले अपनी फसल के जोखिम या मौसम के बारे में पूछें।',
      UNKNOWN: "मैं आपकी बात पूरी तरह समझ नहीं पाया। आप अपनी फसल, जोखिम, मौसम या सिफारिशों के बारे में पूछ सकते हैं।",
      ERROR: 'क्षमा करें, त्रुटि हुई.'
    }
  };

  const selectedLang = responses[lang] ? lang : 'en';
  return responses[selectedLang][intent] || responses['en'][intent] || '';
};
