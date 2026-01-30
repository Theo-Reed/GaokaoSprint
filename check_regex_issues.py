import os
import re

lookbehind_pattern = re.compile(r'\(\?<=|\(\?<!')
v_flag_pattern = re.compile(r'/[^/]+/[gimsuy]*v[gimsuy]*') # Rough check for v flag
new_regexp_v_pattern = re.compile(r'new RegExp\([^)]*,[^)]*v[^)]*\)') # Check for new RegExp(..., 'v')

search_paths = [
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/tailwindcss',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/@tailwindcss',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/rehype-katex',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/remark-math',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/react-markdown',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/katex',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/lucide-react'
]

print("Scanning for Lookbehinds and v flag...")

for base_path in search_paths:
    if not os.path.exists(base_path):
        print(f"Skipping {base_path} (not found)")
        continue
        
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith(('.js', '.mjs', '.cjs')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                        found_issues = []
                        if lookbehind_pattern.search(content):
                            found_issues.append("Lookbehind")
                        # v flag check is noisy with literals, so we rely on context or just report it for review
                        # But simpler v flag like /foo/v is hard to distinguish from division without parser.
                        # Let's check for new RegExp with 'v'
                        if new_regexp_v_pattern.search(content):
                             found_issues.append("new RegExp with v flag")

                        if found_issues:
                            print(f"{path}: {', '.join(found_issues)}")
                except Exception as e:
                    print(f"Error reading {path}: {e}")
print("Scan complete.")
