path = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bs = chr(92)  # backslash

# Fix 1: VisualFormats (line 390)
# broken: {\"[\" + "SQL", ... -> correct: ["SQL", ...
content = content.replace(bs + '"[' + bs + '" + ', '["SQL"')

# Fix 2: VisualCollab (line 408)
# broken: {{\"[\" + ... -> correct: {[[... ...
content = content.replace(bs + '"[', '[')

# Fix 3: VisualTemplates (line 421)
# broken: {[[0, 1, 2] -> correct: {[0, 1, 2]
content = content.replace('{[[0, 1, 2]', '{[0, 1, 2]')

# Fix 4: VisualHistory (line 433)
# broken: {[[Undo2, Redo2] -> correct: {[Undo2, Redo2]
content = content.replace('{[[Undo2, Redo2]', '{[Undo2, Redo2]')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
print('Fix1:', '["SQL"' in content)
print('Fix2:', bs + '"[' not in content)
print('Fix3:', '{[0, 1, 2]' in content)
print('Fix4:', '{[Undo2, Redo2]' in content)
