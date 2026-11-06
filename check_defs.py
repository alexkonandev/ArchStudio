p = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(p, 'r', encoding='utf-8') as f:
    content = f.read()

for name in ['export function FeaturesBento', 'const PEOPLE', 'const POINTS', 'const CARDS', 'export function CodeGeneration', 'export function Collaboration']:
    idx = content.find(name)
    status = 'FOUND at ' + str(idx) if idx >= 0 else 'NOT FOUND'
    print(name + ': ' + status)
