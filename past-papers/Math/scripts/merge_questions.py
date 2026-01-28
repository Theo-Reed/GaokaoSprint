
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
TARGET_JSON = os.path.join(BASE_DIR, 'next-app/src/data/math-questions.json')
SOURCE_JSON = os.path.join(os.path.dirname(__file__), 'extracted_2025.json')

def main():
    if not os.path.exists(TARGET_JSON):
        print(f"Target file not found: {TARGET_JSON}")
        return
    
    if not os.path.exists(SOURCE_JSON):
        print(f"Source file not found: {SOURCE_JSON}")
        return

    with open(TARGET_JSON, 'r', encoding='utf-8') as f:
        existing_data = json.load(f)
    
    with open(SOURCE_JSON, 'r', encoding='utf-8') as f:
        new_data = json.load(f)
    
    print(f"Existing questions: {len(existing_data)}")
    print(f"New questions: {len(new_data)}")
    
    # Simple duplicate check based on content string
    existing_contents = set(q['content'] for q in existing_data)
    
    added_count = 0
    for q in new_data:
        if q['content'] not in existing_contents:
            existing_data.append(q)
            existing_contents.add(q['content'])
            added_count += 1
    
    print(f"Added {added_count} unique questions.")
    
    with open(TARGET_JSON, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved to {TARGET_JSON}")

if __name__ == "__main__":
    main()
