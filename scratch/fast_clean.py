import re
with open('frontend/src/i18n/districtTranslations.js', 'r', encoding='utf8') as f:
    code = f.read()

# Replace any Error 500 translation string with fallback to English
code = re.sub(r'\"Error 500[^\"]*\"', r'""', code)
code = re.sub(r'\"Error 400[^\"]*\"', r'""', code)

# Ensure the JS falls back properly. Empty string will be falsy, 
# so translation[language] || translation.en will pick up english.

with open('frontend/src/i18n/districtTranslations.js', 'w', encoding='utf8') as f:
    f.write(code)
print("Regex replacement complete.")
