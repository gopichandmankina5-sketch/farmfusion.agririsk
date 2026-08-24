import json
import re

def make_id(text):
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')

def main():
    # Read the current districtTranslations.js
    with open('frontend/src/i18n/districtTranslations.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # The file contains `const districtTranslations = { ... }; export default ...`
    # Let's extract the inner content
    match = re.search(r'const districtTranslations = (\{.*?\});\n*export', content, re.DOTALL)
    if not match:
        print("Could not match the dictionary.")
        return

    # We need to evaluate the JS object. Since it has unquoted keys potentially, let's use a regex to parse it.
    # Actually, the python `json` module doesn't parse JS, but we can do string manipulation or regex since the structure is simple.
    
    # regex to find `"CityName": { en: "...", te: "...", ta: "...", hi: "..." }`
    # Also some might have double quotes for keys if the script dumped it that way.
    pattern = r'"([^"]+)"\s*:\s*\{\s*(?:en\s*:\s*"([^"]*)",?\s*)?(?:te\s*:\s*"([^"]*)",?\s*)?(?:ta\s*:\s*"([^"]*)",?\s*)?(?:hi\s*:\s*"([^"]*)",?\s*)?\}'
    matches = re.finditer(pattern, match.group(1))
    
    js_content = "const districtTranslations = {\n"
    
    for m in matches:
        orig_key = m.group(1)
        en = m.group(2) or orig_key
        te = m.group(3) or ""
        ta = m.group(4) or ""
        hi = m.group(5) or ""
        
        # decode unicode escapes
        en = en.encode('utf-8').decode('unicode_escape')
        te = te.encode('utf-8').decode('unicode_escape')
        ta = ta.encode('utf-8').decode('unicode_escape')
        hi = hi.encode('utf-8').decode('unicode_escape')
        
        canon_id = make_id(en)
        
        js_content += f'  "{canon_id}": {{\n'
        js_content += f'    id: "{canon_id}",\n'
        js_content += '    names: {\n'
        js_content += f'      en: {json.dumps(en, ensure_ascii=False)},\n'
        js_content += f'      te: {json.dumps(te, ensure_ascii=False)},\n'
        js_content += f'      ta: {json.dumps(ta, ensure_ascii=False)},\n'
        js_content += f'      hi: {json.dumps(hi, ensure_ascii=False)}\n'
        js_content += '    }\n'
        js_content += '  },\n'
        
    js_content += "};\n\n"
    js_content += "export const getDistrictList = () => Object.values(districtTranslations);\n"
    js_content += "export const translateDistrict = (value, language) => {\n"
    js_content += "  if (!value) return value;\n"
    js_content += "  const normalizedValue = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');\n"
    js_content += "  const translation = districtTranslations[normalizedValue];\n"
    js_content += "  if (!translation) {\n"
    js_content += "    const match = Object.values(districtTranslations).find(t => t.names.en.toLowerCase() === value.toLowerCase());\n"
    js_content += "    if (match) return match.names[language] || match.names.en || value;\n"
    js_content += "    return value;\n"
    js_content += "  }\n"
    js_content += "  return translation.names[language] || translation.names.en || value;\n"
    js_content += "};\n\n"
    js_content += "export default districtTranslations;\n"

    with open('frontend/src/i18n/districtTranslations.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("Fixed districtTranslations.js")

if __name__ == "__main__":
    main()
