
import json
import os

INPUT_FILE = "../../../next-app/src/data/vocabulary_master.json"
OUTPUT_FILE = "../../../next-app/src/data/vocabulary_polysemy.json"

# Heuristic Concept Map for Polysemy
# If a word's definitions contain conflicting core concepts, tag it.
# Simple heuristic: Does it have both Verb and Noun markers in syllabus definition?
# Or does it have > 2 distinct Chinese definitions separated by semicolons?

def tag_polysemy(vocab_list):
    count = 0
    for entry in vocab_list:
        meanings = entry.get("meanings", [])
        pos = entry.get("pos", "")
        
        is_candidate = False
        
        # Criterion 1: Multiple meanings (list length)
        # Shanghai parser split by '；'
        if len(meanings) >= 2:
            # Check length of definitions. If very short, maybe just synonyms.
            # If length distinct, likely polysemy.
            is_candidate = True
            
        # Criterion 2: Mixed POS in definition string (if we parsed it raw)
        # OR check current "pos" field if it contains "&" (e.g. "n & v")
        if "&" in pos:
            is_candidate = True
            
        # Criterion 3: Specific keywords in meaning
        # e.g. "熟词" usually have disparate meanings appearing in the list.
        # We can just marking all "Rich Content" words as candidates for now.
        
        if is_candidate:
            entry["is_polysemy_candidate"] = True
            count += 1
        else:
            entry["is_polysemy_candidate"] = False
            
    print(f"Tagged {count} words as potential polysemy candidates.")
    return vocab_list

def main():
    # Adjust path because script is now deeper
    # Script is in past-papers/English/scripts
    # CWD when running might be project root if run via "python3 past-papers/English/scripts/..."
    # Let's assume CWD is project root /Users/yeatom/VSCodeProjects/gaokao
    
    # Absolute path safety
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Resolve relative to this script file
    input_path = os.path.join(base_dir, "../../../next-app/src/data/vocabulary_master.json")
    output_path = os.path.join(base_dir, "../../../next-app/src/data/vocabulary_master.json") # Overwrite

    if not os.path.exists(input_path):
        print(f"Error: Candidate file not found at {input_path}")
        return

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    tagged_data = tag_polysemy(data)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(tagged_data, f, ensure_ascii=False, indent=2)
        
    print("Done tagging.")

if __name__ == "__main__":
    main()
