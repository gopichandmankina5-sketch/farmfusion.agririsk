import json
import re

with open('frontend/src/utils/home_translations.json', 'r', encoding='utf-8') as f:
    new_keys = json.load(f)

with open('frontend/src/utils/translations.js', 'r', encoding='utf-8') as f:
    content = f.read()

for lang in ['en', 'hi', 'te']:
    pattern = r'(' + lang + r':\s*\{)'
    keys_str = ''
    for k, v in new_keys[lang].items():
        v_escaped = str(v).replace('\"', '\\\"')
        keys_str += f'\n    \"{k}\": \"{v_escaped}\",'
    content = re.sub(pattern, r'\g<1>' + keys_str, content, count=1)

with open('frontend/src/utils/translations.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated translations.js with home translations')
