
import os
import re

def search_in_chunks():
    chunks_path = '.next/static/chunks'
    patterns = [r'\(\?<']
    
    if not os.path.exists(chunks_path):
        print(f"Path {chunks_path} not found")
        return

    for root, dirs, files in os.walk(chunks_path):
        for file in files:
            if file.endswith('.js'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf8', errors='ignore') as f:
                    content = f.read()
                    for p in patterns:
                        if re.search(p, content):
                            print(f"Found {p} in {path}")
                            # Print a bit of context
                            match = re.search(p, content)
                            start = max(0, match.start() - 50)
                            end = min(len(content), match.end() + 50)
                            print(f"Context: ...{content[start:end]}...")

if __name__ == "__main__":
    search_in_chunks()
