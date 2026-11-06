path = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the broken patterns
# Pattern 1: " + \"SQL\"  (broken, should be " + "SQL" with only one quote)
# Pattern 2: {{\"[\" +  (broken, should be {[[["A"...)
# Pattern 3: {[[0, 1, 2]  (broken, should be {[0, 1, 2])
# Pattern 4: {[[Undo2, Redo2]  (broken, should be {[Undo2, Redo2])

# Let me show the exact bytes for each pattern
import sys

for pattern_name in ['Pattern 1 (VisualFormats)', 'Pattern 2 (VisualCollab)', 'Pattern 3 (VisualTemplates)', 'Pattern 4 (VisualHistory)']:
    if pattern_name == 'Pattern 1 (VisualFormats)':
        search = 'SQL', 'Prisma'
        start = content.find('SQL')
        end = content.find('].map', start)
        chunk = content[start-10:end+5]
    elif pattern_name == 'Pattern 2 (VisualCollab)':
        start = content.find('A", "#e5421b"')
        end = content.find('].map', start)
        chunk = content[start-20:end+5]
    elif pattern_name == 'Pattern 3 (VisualTemplates)':
        start = content.find('0, 1, 2')
        end = content.find('.map', start)
        chunk = content[start-10:end+5]
    elif pattern_name == 'Pattern 4 (VisualHistory)':
        start = content.find('Undo2')
        end = content.find('.map', start)
        chunk = content[start-10:end+5]
    
    print('=' * 50)
    print(pattern_name)
    print(repr(chunk))
    print('Chars:')
    for i, c in enumerate(chunk):
        print(f'  [{i}] {repr(c)} U+{ord(c):04X}')
