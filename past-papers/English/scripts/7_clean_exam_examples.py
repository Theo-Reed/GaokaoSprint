import json
import os
import re

# ================= CONFIGURATION =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")
INPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_refining.json")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_final.json")

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    print("Loading data...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print(f"Loaded {len(data)} words.")
    
    total_removed = 0
    words_affected = 0
    
    # Regex to detect option markers like "A.", "B.", "C.", "D."
    # Matches start of string or following a space
    option_pattern = re.compile(r'(^|\s)[A-D]\.')
    
    for item in data:
        if 'examples' not in item or 'exams' not in item['examples']:
            continue
            
        original_exams = item['examples']['exams']
        cleaned_exams = []
        is_affected = False
        
        for ex in original_exams:
            text = ex.get('text', '').strip()
            
            # Rule 1: Remove if contains A., B., C., D.
            if option_pattern.search(text):
                total_removed += 1
                is_affected = True
                continue
                
            # Rule 2: Remove if length > 100
            if len(text) > 100:
                total_removed += 1
                is_affected = True
                continue
                
            cleaned_exams.append(ex)
            
        item['examples']['exams'] = cleaned_exams
        if is_affected:
            words_affected += 1
            
    print("-" * 30)
    print(f"Refinement complete.")
    print(f"Removed {total_removed} unsuitable exam examples.")
    print(f"Affected {words_affected} words.")
    print("-" * 30)

    print(f"Saving to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print("Done.")

if __name__ == "__main__":
    main()
