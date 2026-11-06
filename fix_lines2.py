p = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(p, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix line 408 (index 407) - VisualCollab - restore correct pair structure
lines[407] = '      {[["A", "#e5421b"], ["K", "#2f4bff"], ["L", "#1f8a5b"]].map(([i, c], idx) => (\n'

with open(p, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Fixed line 408 with correct pair structure')
print('Line 408 now:', repr(lines[407]))