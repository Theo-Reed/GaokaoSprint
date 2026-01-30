import os
import re

# Regex to match literal regexes in JS: /.../[gimsuy]*
# This is a bit complex to do perfectly with regex, but we can look for the modern features directly.
MODERN_REGEX_FEATURES = [
    re.compile(rb'/\(\?<=', re.IGNORECASE),  # Lookbehind
    re.compile(rb'/\(\?<!', re.IGNORECASE),  # Negative lookbehind
    re.compile(rb'/\(\?<[a-zA-Z]', re.IGNORECASE), # Named capture group literal
    re.compile(rb'/\\[pP]\{', re.IGNORECASE),      # Unicode property escape literal
    re.compile(rb'/[^/\n]*/[gimsuy]*s[gimsuy]*', re.IGNORECASE), # dotAll flag 's' (risky pattern)
]

def scan_files(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.js'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'rb') as f:
                        content = f.read()
                        for pattern in MODERN_REGEX_FEATURES:
                            if pattern.search(content):
                                print(f"Found modern feature in literal regex in {path}")
                                # Print a bit of context
                                match = pattern.search(content)
                                start = max(0, match.start() - 50)
                                end = min(len(content), match.end() + 50)
                                print(f"Context: {content[start:end]}")
                                print("-" * 40)
                except Exception as e:
                    print(f"Error reading {path}: {e}")

print("Scanning .next/static for literal modern regex...")
scan_files('.next/static')
