p = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(p, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix line 390 (index 389) - VisualFormats
lines[389] = '      {["SQL", "Prisma", "TypeScript", "Zod"].map((f) => <span key={f} className="chip">{f}</span>)}\n'

# Fix line 408 (index 407) - VisualCollab
lines[407] = '      {["A", "#e5421b", "K", "#2f4bff", "L", "#1f8a5b"].map(([i, c], idx) => (\n'

with open(p, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Fixed lines 390 and 408')
print('Line 390 now:', repr(lines[389]))
print('Line 408 now:', repr(lines[407]))