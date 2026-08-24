import json
import re

def make_id(text):
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')

def main():
    # 1. Read existing india_locations.json
    with open('frontend/src/data/india_locations.json', 'r', encoding='utf-8') as f:
        india_locs = json.load(f)

    # 2. Read district translations
    with open('frontend/src/i18n/districtTranslations.js', 'r', encoding='utf-8') as f:
        dt_code = f.read()

    # parse district translations
    matches = re.finditer(r'"([^"]+)":\s*{\s*id:\s*"[^"]+",\s*names:\s*{\s*en:\s*"([^"]*)",\s*te:\s*"([^"]*)",\s*ta:\s*"([^"]*)",\s*hi:\s*"([^"]*)"', dt_code)
    dt_dict = {}
    for m in matches:
        dt_dict[m.group(1)] = {
            "en": m.group(2),
            "te": m.group(3),
            "ta": m.group(4),
            "hi": m.group(5)
        }

    # 3. Create indiaData.js
    js_content = "export const districtsByState = {\n"
    
    for state_name, districts in india_locs.items():
        state_id = make_id(state_name.replace(" (UT)", ""))
        js_content += f'  "{state_id}": [\n'
        for dist in districts:
            if not dist: continue
            dist_name = dist if isinstance(dist, str) else dist.get("name")
            dist_id = make_id(dist_name)
            trans = dt_dict.get(dist_id)
            if not trans:
                # fallback if missing
                trans = {"en": dist_name, "hi": dist_name, "te": dist_name, "ta": dist_name}
                
            js_content += '    {\n'
            js_content += f'      id: "{dist_id}",\n'
            js_content += '      names: {\n'
            js_content += f'        en: {json.dumps(trans["en"], ensure_ascii=False)},\n'
            js_content += f'        hi: {json.dumps(trans["hi"], ensure_ascii=False)},\n'
            js_content += f'        te: {json.dumps(trans["te"], ensure_ascii=False)},\n'
            js_content += f'        ta: {json.dumps(trans["ta"], ensure_ascii=False)}\n'
            js_content += '      }\n'
            js_content += '    },\n'
        js_content += "  ],\n"
        
    js_content += "};\n"
    
    with open('frontend/src/data/indiaData.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print("indiaData.js built successfully.")

if __name__ == "__main__":
    main()
