path = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bs = chr(92)  # backslash

# Pattern 1: VisualFormats
# broken: {{"[" + "SQL"  (with backslash before quotes)
# correct: {["SQL"
old1 = bs + '"[' + bs + '" + '
new1 = '["SQL"'
content = content.replace(old1, new1)

# Pattern 2: VisualCollab
# broken: {{"[" + [["A"...
# correct: {[[["A"...
old2 = bs + '"['
new2 = '[["A'
content = content.replace(old2, new2)

# Pattern 3: VisualTemplates
# broken: {[[0, 1, 2]
# correct: {[0, 1, 2]
old3 = '{[['
new3 = '{['
content = content.replace(old3, new3)

# Pattern 4: VisualHistory
# broken: {[[Undo2, Redo2]
# correct: {[Undo2, Redo2]
old4 = '{[[Undo2'
new4 = '{[Undo2'
content = content.replace(old4, new4)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed')
print('Pattern1 count:', content.count('["SQL"'))
print('Pattern2 count:', content.count('[' + '["A"'))
print('Pattern3 count:', content.count('{[0, 1, 2]'))
print('Pattern4 count:', content.count('{[Undo2, Redo2]'))
