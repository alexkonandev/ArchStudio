path = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(path, 'rb') as f:
    data = f.read()

# Find the broken VisualFormats line
idx = data.find(b'function VisualFormats')
print('VisualFormats pos:', idx)
if idx >= 0:
    # Show 200 bytes around it
    print(repr(data[idx:idx+200]))
    
    # Count backslashes
    print('Number of backslashes:', data.count(b'\\'))
