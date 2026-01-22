
import json
import re
import os

# Paths
NATIONAL_FILE = "past-papers/English/vocabulary/考纲单词（全国）.txt"
SHANGHAI_FILE = "past-papers/English/vocabulary/考纲单词（上海）.txt"
OUTPUT_FILE = "next-app/src/data/vocabulary_master.json"

def parse_national(filepath):
    """
    Parses National Syllabus: "abandon v"
    Returns a dict: { "abandon": { "word": "abandon", "pos": "v", "tags": ["National"], "meanings": [] } }
    """
    vocab_map = {}
    
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line or len(line) == 1: # Skip empty or section headers A, B...
            continue
            
        # Regex to capture "word     pos"
        # Some lines might have "&" like "ability n & v" or "about ad & prep"
        # Strategy: The first contiguous string is the word. The rest is PoS.
        parts = line.split(maxsplit=1)
        if len(parts) < 2:
            # Maybe just a word? 
            word = parts[0]
            pos = ""
        else:
            word = parts[0]
            pos = parts[1]
            
        # Clean word (remove brackets if any, e.g. "a(an)")
        # Actually, keep "a(an)" as main key might be tricky. Let's process "a(an)" -> "a"
        clean_word = word.split('(')[0]
            
        vocab_map[clean_word] = {
            "word": clean_word,
            "raw_word": word, # keep original for reference
            "pos": pos,
            "tags": ["National"],
            "meanings": [], # No definitions in National TXT
            "source": "National"
        }
        
    print(f"Loaded {len(vocab_map)} words from National Syllabus.")
    return vocab_map

def parse_shanghai(filepath):
    """
    Parses Shanghai Syllabus: "ability n. 能力，才能"
    Returns a dict: { "ability": { "word": "ability", "pos": "n.", "meanings": ["能力", "才能"] } }
    """
    vocab_map = {}
    
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line or len(line) == 1:
            continue
            
        # Structure: word [pos.] definition
        # Regex: Start with word, then maybe space, then pos (ending with dot preferably, but regex loose), then rest is def
        # Shanghai file format seems to be: "ability n. 能力，才能"
        # Let's split by first space? No, "a bit" is a phrase. But this is word file.
        # Most words are single token.
        
        parts = line.split(maxsplit=1)
        word = parts[0]
        rest = parts[1] if len(parts) > 1 else ""
        
        # Try to extract PoS and Definition from "rest"
        # "n. 能力，才能"
        # "v. & n.  something"
        # "adj. something"
        
        # Simple heuristic: Split rest by first dot? 
        # "n." -> split gives "n", " 能力..."
        # "v. & n." -> split by dot might satisfy.
        
        pos = ""
        definition = rest
        
        # Look for the first occurrence of a Chinese character to split?
        # Or look for standard POS markers.
        match = re.search(r'([a-z&.]+)\s+(.*)', rest)
        if match:
            pos = match.group(1)
            definition = match.group(2)
        else:
            # Fallback
            pos = "unknown"
        
        clean_word = word.split('(')[0] # "awake(awoke...)" -> "awake"

        vocab_map[clean_word] = {
            "word": clean_word,
            "raw_word": word,
            "pos": pos,
            "meanings": [d.strip() for d in definition.split('；')], # Split by Chinese semicolon
            "source": "Shanghai"
        }
        
    print(f"Loaded {len(vocab_map)} words from Shanghai Syllabus.")
    return vocab_map

def merge_vocab(national_map, shanghai_map):
    master_list = []
    
    # Start with National as base
    all_keys = set(national_map.keys()) | set(shanghai_map.keys())
    
    print(f"Total unique words to process: {len(all_keys)}")
    
    merged_count = 0
    shanghai_only_count = 0
    national_only_count = 0
    
    for key in sorted(all_keys):
        entry = {}
        
        in_nat = key in national_map
        in_sh = key in shanghai_map
        
        if in_nat and in_sh:
            # MERGE: Use Shanghai definitions (higher quality)
            merging = national_map[key]
            sh_data = shanghai_map[key]
            
            entry = merging
            entry["meanings"] = sh_data["meanings"]
            entry["tags"].append("Shanghai")
            # Update PoS if Shanghai is more detailed? Let's keep National's or append?
            # Let's just keep National's POS string for now, it's usually standard "v", "n".
            merged_count += 1
            
        elif in_nat and not in_sh:
            # Only National
            entry = national_map[key]
            national_only_count += 1
            
        elif not in_nat and in_sh:
            # Only Shanghai (Supplement)
            entry = shanghai_map[key]
            entry["tags"] = ["Shanghai"]
            shanghai_only_count += 1
            
        # Common fields normalization
        entry["word_len"] = len(entry["word"])
        
        master_list.append(entry)
        
    print(f"Stats: Merged={merged_count}, NationalOnly={national_only_count}, ShanghaiOnly={shanghai_only_count}")
    return master_list

def main():
    if not os.path.exists(NATIONAL_FILE):
        print(f"Error: {NATIONAL_FILE} not found.")
        return
        
    nat_map = parse_national(NATIONAL_FILE)
    sh_map = parse_shanghai(SHANGHAI_FILE)
    
    master_db = merge_vocab(nat_map, sh_map)
    
    # Save
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(master_db, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully saved Master Vocabulary to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
