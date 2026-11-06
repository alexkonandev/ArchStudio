p = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(p, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove unused 'cn' import
content = content.replace('import { cn } from "@/lib/utils";\n', '')

# Fix unescaped apostrophe in JSX
content = content.replace("Tout ce qu'il faut pour", "Tout ce qu&apos;il faut pour")

with open(p, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed: removed unused cn import, fixed unescaped apostrophe')
