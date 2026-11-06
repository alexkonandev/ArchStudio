path = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(path, 'rb') as f:
    data = f.read()

# Find the broken VisualFormats line
# The broken content should be: {{"[" + "SQL" (with backslashes)
# In bytes: 7B 7B 5C 22 5B 5C 22 20 2B 20 5C 22 22 ...

# The Python script will work with the content as text
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Fix 1: Replace the VisualFormats broken pattern
# The broken pattern: {{"[" + "SQL" where \" is backslash+quote
# In regex: \{\{\\\"\[\"
pattern1 = r'\{\{\\\"\[\s*\+?\s*\\\"SQL\\\",'
replacement1 = '["SQL",'
text = re.sub(pattern1, replacement1, text)

# Fix 2: VisualCollab
# The broken pattern: {{"[" + [["A", "#e5421b"...
# In regex: \{\{\\\"\[\s*\+\s*\\\[\[
pattern2 = r'\{\{\\\"\[\s*\+'
replacement2 = '{[["A'
text = re.sub(pattern2, replacement2, text)

# Fix 3: VisualTemplates
# The broken pattern: {[[0, 1, 2]
# In regex: \{\[\[0,
pattern3 = r'\{\{'
# Wait, this is too broad. Let me use a more specific pattern.
# The broken pattern is: {[[0, 1, 2] (where the first [ is the JSX expression container)
# Actually, the file has {{[[0, 1, 2] which is: {{ + [[0, 1, 2]
# We want to change {{[[0, 1, 2] to {[[0, 1, 2]
# Wait, that's not right either.
# Let me re-read the file content.

# From the earlier debug, the VisualFormats line contained {"[" which is:
# { (0x7B), { (0x7B), \ (0x5C), " (0x22), [ (0x5B), \ (0x5C), " (0x22), ...

# So the actual content has: {{ + \" + [ + \" + ...
# Which is: {, {, \, ", [, \, ", ...

# This is very confusing. Let me just try a different approach.

print('Debug: examine the content around the broken patterns')
# Find the VisualFormats function
idx = text.find('VisualFormats')
print('Position of VisualFormats:', idx)
if idx >= 0:
    # Show 300 chars from idx
    chunk = text[idx:idx+300]
    print('Chunk:', repr(chunk[:300]))
