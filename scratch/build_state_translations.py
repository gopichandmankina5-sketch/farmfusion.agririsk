import json
import re
import time
from deep_translator import GoogleTranslator

def is_english(text):
    return bool(re.search(r'[a-zA-Z]', text))

def translate_word(word, lang):
    translator = GoogleTranslator(source='auto', target=lang)
    for _ in range(3):
        try:
            res = translator.translate(word)
            if not is_english(res) and "Error" not in res and "500" not in res:
                return res
            res2 = translator.translate(f"{word} state")
            res2 = res2.replace("state", "").replace("State", "").replace("राज्य", "").replace("రాష్ట్రం", "").replace("மாநிலம்", "").strip()
            if not is_english(res2) and len(res2) > 0 and "Error" not in res2:
                return res2
            return res
        except Exception as e:
            time.sleep(1)
            continue
    return word

def make_id(text):
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')

def main():
    locations_path = 'frontend/src/data/india_locations.json'
    out_path = 'frontend/src/i18n/stateTranslations.js'
    
    with open(locations_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    states = list(data.keys())
    
    known = {
        "Andhra Pradesh": {"hi": "आंध्र प्रदेश", "te": "ఆంధ్ర ప్రదేశ్", "ta": "ஆந்திரப் பிரதேசம்"},
        "Arunachal Pradesh": {"hi": "अरुणाचल प्रदेश", "te": "అరుణాచల్ ప్రదేశ్", "ta": "அருணாச்சல பிரதேசம்"},
        "Assam": {"hi": "असम", "te": "అస్సాం", "ta": "அசாம்"},
        "Bihar": {"hi": "बिहार", "te": "బీహార్", "ta": "பீகார்"},
        "Chhattisgarh": {"hi": "छत्तीसगढ़", "te": "ఛత్తీస్‌గఢ్", "ta": "சத்தீஸ்கர்"},
        "Goa": {"hi": "गोवा", "te": "గోవా", "ta": "கோவா"},
        "Gujarat": {"hi": "गुजरात", "te": "గుజరాత్", "ta": "குஜராத்"},
        "Haryana": {"hi": "हरियाणा", "te": "హర్యానా", "ta": "ஹரியானா"},
        "Himachal Pradesh": {"hi": "हिमाचल प्रदेश", "te": "హిమాచల్ ప్రదేశ్", "ta": "இமாச்சல பிரதேசம்"},
        "Jharkhand": {"hi": "झारखंड", "te": "జార్ఖండ్", "ta": "ஜார்க்கண்ட்"},
        "Karnataka": {"hi": "कर्नाटक", "te": "కర్ణాటక", "ta": "கர்நாடகா"},
        "Kerala": {"hi": "केरल", "te": "కేరళ", "ta": "கேரளா"},
        "Madhya Pradesh": {"hi": "मध्य प्रदेश", "te": "మధ్య ప్రదేశ్", "ta": "மத்தியப் பிரதேசம்"},
        "Maharashtra": {"hi": "महाराष्ट्र", "te": "మహారాష్ట్ర", "ta": "மகாராஷ்டிரா"},
        "Manipur": {"hi": "मणिपुर", "te": "మణిపూర్", "ta": "மணிப்பூர்"},
        "Meghalaya": {"hi": "मेघालय", "te": "మేఘాలయ", "ta": "மேகாலயா"},
        "Mizoram": {"hi": "मिजोरम", "te": "మిజోరం", "ta": "மிசோரம்"},
        "Nagaland": {"hi": "नागालैंड", "te": "నాగాలాండ్", "ta": "நாகாலாந்து"},
        "Odisha": {"hi": "ओडिशा", "te": "ఒడిశా", "ta": "ஒடிசா"},
        "Punjab": {"hi": "पंजाब", "te": "పంజాబ్", "ta": "பஞ்சாப்"},
        "Rajasthan": {"hi": "राजस्थान", "te": "రాజస్థాన్", "ta": "ராஜஸ்தான்"},
        "Sikkim": {"hi": "सिक्किम", "te": "సిక్కిం", "ta": "சிக்கிம்"},
        "Tamil Nadu": {"hi": "तमिलनाडु", "te": "తమిళనాడు", "ta": "தமிழ்நாடு"},
        "Telangana": {"hi": "तेलंगाना", "te": "తెలంగాణ", "ta": "தெலுங்கானா"},
        "Tripura": {"hi": "त्रिपुरा", "te": "త్రిपुरा", "ta": "திரிபுரா"},
        "Uttar Pradesh": {"hi": "उत्तर प्रदेश", "te": "ఉత్తర ప్రదేశ్", "ta": "உத்தரப் பிரதேசம்"},
        "Uttarakhand": {"hi": "उत्तराखंड", "te": "ఉత్తరాఖండ్", "ta": "உத்தரகண்ட்"},
        "West Bengal": {"hi": "पश्चिम बंगाल", "te": "పశ్చిమ బెంగాల్", "ta": "மேற்கு வங்கம்"},
        
        "Andaman and Nicobar Islands": {"hi": "अंडमान और निकोबार द्वीपसमूह", "te": "అండమాన్ మరియు నికోబార్ దీవులు", "ta": "அந்தமான் மற்றும் நிக்கோபார் தீவுகள்"},
        "Chandigarh": {"hi": "चंडीगढ़", "te": "చండీగఢ్", "ta": "சண்டிகர்"},
        "Dadra and Nagar Haveli and Daman and Diu": {"hi": "दादरा और नगर हवेली और दमन और दीव", "te": "దాద్రా మరియు నగర్ హవేలీ మరియు డామన్ మరియు డయ్యూ", "ta": "தாத்ரா மற்றும் நகர் ஹவேலி மற்றும் டாமன் மற்றும் டையூ"},
        "Delhi": {"hi": "दिल्ली", "te": "ఢిల్లీ", "ta": "டெல்லி"},
        "Jammu and Kashmir": {"hi": "जम्मू और कश्मीर", "te": "జమ్మూ కాశ్మీర్", "ta": "ஜம்மு மற்றும் காஷ்மீர்"},
        "Ladakh": {"hi": "लद्दाख", "te": "లడఖ్", "ta": "லடாக்"},
        "Lakshadweep": {"hi": "लक्षद्वीप", "te": "లక్షద్వీప్", "ta": "லட்சத்தீவு"},
        "Puducherry": {"hi": "पुडुचेरी", "te": "పుదుచ్చేరి", "ta": "புதுச்சேரி"}
    }
    
    js_content = "export const stateTranslations = {\n"
    
    for state in states:
        clean_state = state.replace(" (UT)", "").strip()
        
        en = state
        hi = known.get(clean_state, {}).get("hi")
        te = known.get(clean_state, {}).get("te")
        ta = known.get(clean_state, {}).get("ta")
        
        if not hi: hi = translate_word(clean_state, 'hi')
        if not te: te = translate_word(clean_state, 'te')
        if not ta: ta = translate_word(clean_state, 'ta')
        
        if "(UT)" in state:
            if "केंद्र शासित प्रदेश" not in hi: hi += " (केंद्र शासित प्रदेश)"
            if "కేంద్ర పాలిత ప్రాంతం" not in te: te += " (కేంద్ర పాలిత ప్రాంతం)"
            if "யூனியன் பிரதேசம்" not in ta: ta += " (யூனியன் பிரதேசம்)"
            
        sid = make_id(state)
        
        js_content += f'  "{sid}": {{\n'
        js_content += f'    id: "{sid}",\n'
        js_content += '    names: {\n'
        js_content += f'      en: {json.dumps(en)},\n'
        js_content += f'      hi: {json.dumps(hi)},\n'
        js_content += f'      te: {json.dumps(te)},\n'
        js_content += f'      ta: {json.dumps(ta)}\n'
        js_content += '    }\n'
        js_content += "  },\n"
        
    js_content += "};\n\n"
    js_content += "export const getStateList = () => Object.values(stateTranslations);\n"
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

if __name__ == "__main__":
    main()
