import json
import os
import re
import time
# pyrefly: ignore [missing-import]
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
            # Try with district context
            res2 = translator.translate(f"{word} district")
            res2 = res2.replace("district", "").replace("District", "").replace("जिले", "").replace("ज़िला", "").replace("जिला", "").replace("மாவட்டம்", "").replace("ஜில்லா", "").replace("జిల్లా", "").replace(" ", "").strip()
            if not is_english(res2) and len(res2) > 0 and "Error" not in res2:
                return res2
            return res
        except Exception as e:
            time.sleep(1)
            continue
    return word

def main():
    locations_path = 'frontend/src/data/india_locations.json'
    out_path = 'frontend/src/i18n/districtTranslations.js'
    
    with open(locations_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    unique_locations = set()
    for state, districts in data.items():
        unique_locations.add(state)
        for district in districts:
            if district != "All":
                unique_locations.add(district)
                
    unique_locations = list(unique_locations)
    print(f"Total unique locations: {len(unique_locations)}")
    
    # Pre-defined known ones
    known = {
        "Guntur": {"en": "Guntur", "te": "గుంటూరు", "ta": "குண்டூர்", "hi": "गुंटूर"},
        "Krishna": {"en": "Krishna", "te": "కృష్ణా", "ta": "கிருஷ்ணா", "hi": "कृष्णा"},
        "East Godavari": {"en": "East Godavari", "te": "తూర్పు గోదావరి", "ta": "கிழக்கு கோதாவரி", "hi": "पूर्वी गोदावरी"},
        "Andhra Pradesh": {"en": "Andhra Pradesh", "te": "ఆంధ్రప్రదేశ్", "ta": "ஆந்திரப் பிரதேசம்", "hi": "आंध्र प्रदेश"}
    }
    
    # Try to load existing districtTranslations using regex to salvage what we can
    existing_trans = {}
    try:
        with open(out_path, 'r', encoding='utf-8') as f:
            code = f.read()
        
        # Regex to find: "Name": { en: "Name", te: "...", ta: "...", hi: "..." }
        matches = re.finditer(r'"([^"]+)":\s*{\s*en:\s*"([^"]*)",\s*te:\s*"([^"]*)",\s*ta:\s*"([^"]*)",\s*hi:\s*"([^"]*)"', code)
        for m in matches:
            loc = m.group(1)
            en = m.group(2)
            te = m.group(3)
            ta = m.group(4)
            hi = m.group(5)
            existing_trans[loc] = {"en": en, "te": te, "ta": ta, "hi": hi}
    except Exception as e:
        print("Error parsing old file:", e)
        
    translations_dict = {}
    fixed_count = 0
    
    for loc in unique_locations:
        if loc in known:
            translations_dict[loc] = known[loc]
            continue
            
        trans = existing_trans.get(loc, {"en": loc, "te": loc, "ta": loc, "hi": loc})
        
        te = trans['te']
        ta = trans['ta']
        hi = trans['hi']
        
        if is_english(te) or "Error" in te:
            te = translate_word(loc, 'te')
            fixed_count += 1
            print(f"Fixed {loc} te: {te}")
        if is_english(ta) or "Error" in ta:
            ta = translate_word(loc, 'ta')
            fixed_count += 1
            print(f"Fixed {loc} ta: {ta}")
        if is_english(hi) or "Error" in hi:
            hi = translate_word(loc, 'hi')
            fixed_count += 1
            print(f"Fixed {loc} hi: {hi}")
            
        # safety
        if "Error" in te: te = loc
        if "Error" in ta: ta = loc
        if "Error" in hi: hi = loc
        
        translations_dict[loc] = {
            "en": loc,
            "te": te,
            "ta": ta,
            "hi": hi
        }
        
    print(f"Fixed {fixed_count} words.")
    
    # Safely generate JS code using json.dumps to handle quotes
    js_content = "const districtTranslations = {\n"
    for loc in sorted(translations_dict.keys()):
        trans = translations_dict[loc]
        js_content += f'  {json.dumps(loc)}: {{\n'
        js_content += f'    en: {json.dumps(trans["en"])},\n'
        js_content += f'    te: {json.dumps(trans["te"])},\n'
        js_content += f'    ta: {json.dumps(trans["ta"])},\n'
        js_content += f'    hi: {json.dumps(trans["hi"])}\n'
        js_content += "  },\n"
    js_content += "};\n\n"
    
    js_content += """export const translateDistrict = (district, language) => {
  if (!district) return district;
  const translation = districtTranslations[district];
  if (!translation) {
    return district;
  }
  return translation[language] || translation.en || district;
};

export default districtTranslations;
"""

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("Done!")

if __name__ == "__main__":
    main()
