import json
import os
import re
import time
from deep_translator import GoogleTranslator

# Simple transliteration mapping for fallback
def basic_transliterate(text, lang):
    # This is a highly simplified heuristic fallback just to remove English letters if API fails completely
    # We will map standard english characters to an equivalent in target languages to ensure no A-Z are left.
    # We will mainly rely on Google Translator.
    pass

def is_english(text):
    return bool(re.search(r'[a-zA-Z]', text))

def translate_word_robust(word, lang):
    translator = GoogleTranslator(source='auto', target=lang)
    for _ in range(3):
        try:
            res = translator.translate(word)
            if not is_english(res):
                return res
            # Try with district context
            res2 = translator.translate(f"{word} district")
            res2 = res2.replace("district", "").replace("District", "").replace("जिले", "").replace("ज़िला", "").replace("जिला", "").replace("மாவட்டம்", "").replace("ஜில்லா", "").replace("జిల్లా", "").replace(" ", "").strip()
            if not is_english(res2) and len(res2) > 0:
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
    print(f"Total locations: {len(unique_locations)}")
    
    # Load old translations if they exist to save time
    old_translations = {}
    try:
        import subprocess
        # Hack to extract JS object to JSON
        node_script = """
        const fs = require('fs');
        let code = fs.readFileSync('frontend/src/utils/locationTranslations.js', 'utf8');
        code = code.replace('export const locationTranslations = ', 'module.exports = ');
        fs.writeFileSync('temp_loc.js', code);
        const data = require('./temp_loc.js');
        fs.writeFileSync('temp_loc.json', JSON.stringify(data));
        """
        with open('run_node.js', 'w') as f:
            f.write(node_script)
        subprocess.run(['node', 'run_node.js'])
        with open('temp_loc.json', 'r') as f:
            old_data = json.load(f)
            
        for loc in unique_locations:
            te = old_data.get('te', {}).get(loc, loc)
            ta = old_data.get('ta', {}).get(loc, loc)
            hi = old_data.get('hi', {}).get(loc, loc)
            old_translations[loc] = {'te': te, 'ta': ta, 'hi': hi}
    except Exception as e:
        print("Could not load old translations", e)
        pass

    known = {
        "Guntur": {"en": "Guntur", "te": "గుంటూరు", "ta": "குண்டூர்", "hi": "गुंटूर"},
        "Krishna": {"en": "Krishna", "te": "కృష్ణా", "ta": "கிருஷ்ணா", "hi": "कृष्णा"},
        "East Godavari": {"en": "East Godavari", "te": "తూర్పు గోదావరి", "ta": "கிழக்கு கோதாவரி", "hi": "पूर्वी गोदावरी"},
        "Andhra Pradesh": {"en": "Andhra Pradesh", "te": "ఆంధ్రప్రదేశ్", "ta": "ஆந்திரப் பிரதேசம்", "hi": "आंध्र प्रदेश"}
    }
    
    translations_dict = {}
    
    for i, loc in enumerate(unique_locations):
        if loc in known:
            translations_dict[loc] = known[loc]
            continue
            
        old = old_translations.get(loc, {'te':loc, 'ta':loc, 'hi':loc})
        te = old['te']
        ta = old['ta']
        hi = old['hi']
        
        fixed = False
        
        if is_english(te):
            te = translate_word_robust(loc, 'te')
            fixed = True
        if is_english(ta):
            ta = translate_word_robust(loc, 'ta')
            fixed = True
        if is_english(hi):
            hi = translate_word_robust(loc, 'hi')
            fixed = True
            
        if fixed:
            print(f"Fixed {loc} -> te:{te}, ta:{ta}, hi:{hi}")
            
        translations_dict[loc] = {
            "en": loc,
            "te": te,
            "ta": ta,
            "hi": hi
        }

    print("Writing output...")
    js_content = "const districtTranslations = {\n"
    for loc in sorted(translations_dict.keys()):
        trans = translations_dict[loc]
        js_content += f'  "{loc}": {{\n'
        js_content += f'    en: "{trans["en"]}",\n'
        js_content += f'    te: "{trans["te"]}",\n'
        js_content += f'    ta: "{trans["ta"]}",\n'
        js_content += f'    hi: "{trans["hi"]}"\n'
        js_content += "  },\n"
    js_content += "};\n\n"
    
    js_content += """export const translateDistrict = (district, language) => {
  if (!district) return district;
  if (districtTranslations[district]) {
    const translation = districtTranslations[district][language];
    if (translation) return translation;
    return districtTranslations[district]['en'];
  }
  return district; // safely fall back
};

export default districtTranslations;
"""
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("Done!")

if __name__ == "__main__":
    main()
