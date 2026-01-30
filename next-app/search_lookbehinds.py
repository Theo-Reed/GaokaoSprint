import os
import re

def search():
    patterns = [
        re.compile(b"\\(\\?<="),  # (?<=
        re.compile(b"\\(\\?<!")   # (?<!
    ]
    
    root = ".next"
    for dirpath, dirnames, filenames in os.walk(root):
        for filename in filenames:
            if filename.endswith(".js") or filename.endswith(".json"):
                path = os.path.join(dirpath, filename)
                try:
                    with open(path, "rb") as f:
                        content = f.read()
                        for p in patterns:
                            if p.search(content):
                                print(f"FOUND {p.pattern} in {path}")
                except Exception as e:
                    pass

if __name__ == "__main__":
    search()
