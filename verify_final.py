p = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
with open(p, 'r', encoding='utf-8') as f:
    content = f.read()

# Check for Mojibake patterns
mojibake = ['Ã©', 'Ã¨', 'Ã ', 'Ã»', 'Ã´', 'Ã§', 'Ã‰', 'â€', 'Â©', 'Ã‚', 'ÃŠ']
found = []
for m in mojibake:
    if m in content:
        found.append(m)
print('Mojibake found:', found if found else 'NONE - encoding is clean')

# Check imports
imports = ["import Link from \"next/link\"", "import { gsap }", "import { ScrollTrigger }", "export default function LandingPage"]
for imp in imports:
    print(f'  {"OK" if imp in content else "MISSING"}: {imp}')

# Check sections
sections = ["export function Hero", "export function FeaturesBento", "export function CodeGeneration", "export function Collaboration", "export function HowItWorks", "export function TechProof", "export function FinalCta", "export function Footer", "export function Navbar", "export function LandingLayout"]
for s in sections:
    print(f'  {"OK" if s in content else "MISSING"}: {s}')

# File stats
lines = content.count(chr(10)) + 1
print(f"\nTotal lines: {lines}")
print(f"Total chars: {len(content)}")
