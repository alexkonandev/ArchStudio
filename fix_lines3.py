p = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(p, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix line 412 (index 411) - close map but not div
lines[411] = '      ))}\n'

with open(p, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Fixed line 412')
print('Line 412 now:', repr(lines[411]))