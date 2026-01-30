import os

def search_lookbehinds(directory, pattern='(?<!'):
    print(f"Searching for '{pattern}' in {directory}...")
    count = 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            filepath = os.path.join(root, file)
            # Skip likely binary files based on extension if needed,
            # but user said "Ignore binary files issues if possible (read as text, ignore errors)"
            # so we try to open everything with errors='ignore'.
            
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                start_index = 0
                while True:
                    idx = content.find(pattern, start_index)
                    if idx == -1:
                        break
                    
                    # Found a match
                    count += 1
                    start_context = max(0, idx - 50)
                    end_context = min(len(content), idx + len(pattern) + 50)
                    context = content[start_context:end_context]
                    
                    # Make newlines visible
                    context_display = context.replace('\n', '\\n').replace('\r', '\\r')
                    
                    print(f"\nMatch #{count} in {filepath}:")
                    print(f"...{context_display}...")
                    
                    start_index = idx + 1
                    
            except Exception as e:
                print(f"Could not read {filepath}: {e}")

    print(f"\nSearch complete. Found {count} matches.")

if __name__ == "__main__":
    # Adjust path to match user's workspace structure
    # The user mentioned `.next/static` is likely inside `next-app/` based on workspace info.
    search_dir = os.path.join("next-app", ".next", "static")
    
    if os.path.exists(search_dir):
        search_lookbehinds(search_dir)
    else:
        print(f"Directory not found: {search_dir}")
