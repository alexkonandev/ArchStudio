def debug():
    path = 'c:/Users/zoumanji/Desktop/Coding/ArchStudio/landing-page-unified.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the exact pattern in the VisualFormats line
    # The broken pattern should be: {"[" + "SQL"
    # We need to check what the actual characters are
    
    # Find the sequence: backslash, quote, bracket
    pos = content.find('{"[')
    print('Position of {[" :', pos)
    if pos > 0:
        # Show 30 chars before and after
        start = max(0, pos - 15)
        end = min(len(content), pos + 40)
        chunk = content[start:end]
        print('Context:', repr(chunk))
    
    # Count double quotes after the bracket
    # The broken pattern has: {"[  <- this is: bracket, quote, quote
    # The correct pattern is: {[""  <- this is: bracket, quote (one quote)
    
    # Check the file for the exact sequence
    import re
    # Look for the pattern: quote, quote after bracket
    pattern = r'\'"\"'
    matches = list(re.finditer(pattern, content))
    print('Matches of "quotequote":', len(matches))
    
    for m in matches[:5]:
        print('  Position:', m.start(), 'context:', repr(content[m.start()-5:m.end()+5]))

debug()
