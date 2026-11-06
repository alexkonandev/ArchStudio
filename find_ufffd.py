p = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(p, 'r', encoding='utf-8') as f:
    content = f.read()

# Find replacement character
idx = content.find('\ufffd')
if idx >= 0:
    print(f'Found U+FFFD at position {idx}')
    start = max(0, idx - 50)
    end = min(len(content), idx + 50)
    print(f'Context: {repr(content[start:end])}')
else:
    print('No U+FFFD found')

# Also check for any non-ASCII that might be suspicious
import unicodedata
for i, c in enumerate(content):
    if ord(c) > 127:
        name = unicodedata.name(c, 'UNKNOWN')
        if 'REPLACEMENT' in name or 'CHARACTER' in name.upper() and 'UNKNOWN' in name:
            print(f'Suspicious char at {i}: U+{ord(c):04X} {repr(c)} {name}')
            print(f'Context: {repr(content[max(0,i-20):i+20])}')
