p = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(p, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove lines 354-452 (1-indexed), i.e., indices 353-451
# Keep line 453 (empty) and onwards
del lines[353:452]

with open(p, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Removed duplicate FeaturesBento block (lines 354-452)')
print(f'File now has {len(lines)} lines')
