$tsxPath = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
$content = Get-Content $tsxPath -Raw

# Build FeaturesBento block from parts
$featuresBlock = ''
$featuresBlock += Get-Content 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/features_part1.txt' -Raw
$featuresBlock += Get-Content 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/features_part2.txt' -Raw
$featuresBlock += Get-Content 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/features_part3.txt' -Raw
$featuresBlock += Get-Content 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/features_part4.txt' -Raw

# Insert before "export function FinalCta()"
$marker = 'export function FinalCta() {'
$idx = $content.IndexOf($marker)
if ($idx -ge 0) {
    $content = $content.Substring(0, $idx) + $featuresBlock + "`n" + $content.Substring($idx)
    Set-Content $tsxPath -Value $content -Encoding UTF8
    Write-Host "FeaturesBento inserted successfully"
} else {
    Write-Host "Marker not found!"
}