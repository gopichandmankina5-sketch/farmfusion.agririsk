import json
import os
import re
import time
import concurrent.futures
# pyrefly: ignore [missing-import]
from deep_translator import GoogleTranslator

def is_english(text):
    return bool(re.search(r'[a-zA-Z]', text))

def translate_word_robust(word, lang):
    translator = GoogleTranslator(source='auto', target=lang)
    try:
        res = translator.translate(word)
        if not is_english(res):
            return res
        
        # If it returned english, try giving it context
        res2 = translator.translate(f"{word} district")
        res2 = res2.replace("district", "").replace("District", "").replace("जिले", "").replace("ज़िला", "").replace("जिला", "").replace("மாவட்டம்", "").replace("ஜில்லா", "").replace("జిల్లా", "").strip()
        if not is_english(res2) and len(res2) > 0:
            return res2
            
        return res
    except Exception as e:
        return word

def process_batch(locations):
    results = {}
    for loc in locations:
        if loc in known:
            results[loc] = known[loc]
            continue
            
        te = translate_word_robust(loc, 'te')
        ta = translate_word_robust(loc, 'ta')
        hi = translate_word_robust(loc, 'hi')
        results[loc] = {
            "en": loc,
            "te": te,
            "ta": ta,
            "hi": hi
        }
        time.sleep(0.1) # Small delay to avoid block
    return results

# Known mappings to guarantee correctness for these
known = {
    "Guntur": {"en": "Guntur", "te": "గుంటూరు", "ta": "குண்டூர்", "hi": "गुंटूर"},
    "Krishna": {"en": "Krishna", "te": "కృష్ణా", "ta": "கிருஷ்ணா", "hi": "कृष्णा"},
    "East Godavari": {"en": "East Godavari", "te": "తూర్పు గోదావరి", "ta": "கிழக்கு கோதாவரி", "hi": "पूर्वी गोदावरी"},
    "Andhra Pradesh": {"en": "Andhra Pradesh", "te": "ఆంధ్రప్రదేశ్", "ta": "ஆந்திரப் பிரதேசம்", "hi": "आंध्र प्रदेश"}
}

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
    
    translations_dict = {}
    
    # Process in batches
    batch_size = 50
    batches = [unique_locations[i:i + batch_size] for i in range(0, len(unique_locations), batch_size)]
    
    print("Starting translation...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(process_batch, batch) for batch in batches]
        for idx, future in enumerate(concurrent.futures.as_completed(futures)):
            result = future.result()
            translations_dict.update(result)
            print(f"Completed batch {idx+1}/{len(batches)}")

    print("Writing to file...")
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

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("Done!")

if __name__ == "__main__":
    main()
