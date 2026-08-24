import re

with open('frontend/src/i18n/districtTranslations.js', 'r', encoding='utf8') as f:
    code = f.read()

# Replace any translation string containing "error" or "server" or "500" with ""
# This ensures it uses the safe fallback logic
code = re.sub(r'\"[^\"]*error[^\"]*\"', r'""', code, flags=re.IGNORECASE)
code = re.sub(r'\"[^\"]*server[^\"]*\"', r'""', code, flags=re.IGNORECASE)
code = re.sub(r'\"[^\"]*500[^\"]*\"', r'""', code, flags=re.IGNORECASE)

with open('frontend/src/i18n/districtTranslations.js', 'w', encoding='utf8') as f:
    f.write(code)

print("Final aggressive wipe of all error strings complete.")
