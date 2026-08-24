import json
import re

def make_id(text):
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')

def parse_dict(code):
    matches = re.finditer(r'"([^"]+)":\s*{\s*en:\s*"([^"]*)",\s*te:\s*"([^"]*)",\s*ta:\s*"([^"]*)",\s*hi:\s*"([^"]*)"', code)
    res = {}
    for m in matches:
        res[m.group(1)] = {
            "en": m.group(2),
            "te": m.group(3),
            "ta": m.group(4),
            "hi": m.group(5)
        }
    return res

def main():
    in_path = 'frontend/src/i18n/agricultureTranslations.js'
    with open(in_path, 'r', encoding='utf-8') as f:
        code = f.read()

    crop_code = code[code.find('crop:'):code.find('season:')]
    season_code = code[code.find('season:'):]

    data = {
        'crop': parse_dict(crop_code),
        'season': parse_dict(season_code)
    }

    js_content = "const agricultureTranslations = {\n"
    for cat in ['crop', 'season']:
        js_content += f'  {cat}: {{\n'
        for key, trans in data[cat].items():
            cid = make_id(key)
            js_content += f'    "{cid}": {{\n'
            js_content += f'      id: "{cid}",\n'
            js_content += '      names: {\n'
            js_content += f'        en: {json.dumps(trans.get("en", key))},\n'
            js_content += f'        te: {json.dumps(trans.get("te", key))},\n'
            js_content += f'        ta: {json.dumps(trans.get("ta", key))},\n'
            js_content += f'        hi: {json.dumps(trans.get("hi", key))}\n'
            js_content += '      }\n'
            js_content += '    },\n'
        js_content += '  },\n'
    js_content += "};\n\n"

    js_content += """export const getAgricultureList = (type) => {
  return Object.values(agricultureTranslations[type] || {});
};

export const translateAgriculture = (type, value, language) => {
  if (!value) return value;
  const category = agricultureTranslations[type];
  if (!category) return value;
  
  const normalizedValue = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const translation = category[normalizedValue];
  
  if (!translation) {
    const match = Object.values(category).find(t => t.names.en.toLowerCase() === value.toLowerCase());
    if (match) return match.names[language] || match.names.en || value;
    return value;
  }
  return translation.names[language] || translation.names.en || value;
};

export default agricultureTranslations;
"""

    with open(in_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print("Agriculture translations refactored safely!")

if __name__ == "__main__":
    main()
