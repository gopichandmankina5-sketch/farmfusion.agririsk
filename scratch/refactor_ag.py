import json
import re
import os

def make_id(text):
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')

def main():
    in_path = 'frontend/src/i18n/agricultureTranslations.js'
    
    with open(in_path, 'r', encoding='utf-8') as f:
        code = f.read()

    with open('temp_ag_script.js', 'w', encoding='utf-8') as f:
        code_replaced = code.replace('export const agricultureTranslations = ', 'module.exports = ').replace('export const translateAgriculture', '//')
        f.write(code_replaced)

    os.system('node -e "const d = require(\'./temp_ag_script.js\'); require(\'fs\').writeFileSync(\'temp_ag_dict.json\', JSON.stringify(d))"')

    with open('temp_ag_dict.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    js_content = "const agricultureTranslations = {\n"
    for cat in ['crop', 'season']:
        if cat not in data:
            continue
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
  
  // Find by ID or English name to be robust
  const normalizedValue = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const translation = category[normalizedValue];
  
  if (!translation) {
    // try finding by en name just in case
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
    
    print("Agriculture translations refactored!")

if __name__ == "__main__":
    main()
