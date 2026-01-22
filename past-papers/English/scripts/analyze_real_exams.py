
import os
import re
import json
import spacy
from docx import Document
from collections import defaultdict, Counter

# ================= CONFIGURATION =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # scripts/ folder
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")   # Adjust based on depth
EXAMS_ROOT = os.path.join(PROJECT_ROOT, "past-papers/English")
DATA_OUTPUT_PATH = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_stats_real.json")

# Start from 2008 to 2025
YEARS = [str(y) for y in range(2008, 2026)]

print(f"Loading Spacy Model 'en_core_web_sm'...")
nlp = spacy.load("en_core_web_sm")
print("Model Loaded.")

# Data Structures
# word_stats = { 
#   "challenge": { 
#       "total_count": 0, 
#       "years": { "2024": 2, "2023": 1 }, 
#       "papers": set(),
#       "examples": [] 
#   } 
# }
word_stats = defaultdict(lambda: {
    "total_count": 0,
    "years": Counter(),
    "papers": set(),
    "examples": []
})

def process_file(filepath, year):
    filename = os.path.basename(filepath)
    print(f"  -> Processing {filename} ...")
    
    try:
        doc = Document(filepath)
        full_text = []
        for p in doc.paragraphs:
            if p.text.strip():
                full_text.append(p.text.strip())
        
        text_content = " ".join(full_text)
        
        # NLP Processing
        # Process in chunks if text is huge, but typical exam is < 5000 words, safe for one go.
        doc_nlp = nlp(text_content)
        
        for sent in doc_nlp.sents:
            sent_text = sent.text.strip()
            if len(sent_text) < 10: continue 
            
            # Simple deduplication for words within the SAME sentence to avoid over-counting context?
            # Actually we want per-token stats.
            
            seen_in_sent = set()
            
            for token in sent:
                if not token.is_alpha or token.is_stop or len(token.text) < 2:
                    continue
                
                # Entity Filtering
                if token.ent_type_ in ['PERSON', 'GPE', 'ORG', 'DATE', 'TIME', 'CARDINAL', 'ORDINAL']:
                    continue
                
                lemma = token.lemma_.lower()
                
                # Update Stats
                entry = word_stats[lemma]
                entry["total_count"] += 1
                entry["years"][year] += 1
                entry["papers"].add(filename)
                
                # Save Example Sentence (Limit to 3 per word to save space)
                # Strategy: Prioritize Recent Years (2024, 2025)
                # Or just keep the first 3 found. 
                # Better: Keep "New Curriculum" examples preferentially.
                
                # Only add unique examples
                if len(entry["examples"]) < 3:
                     # Check for near-duplicates
                    is_dup = False
                    for ex in entry["examples"]:
                        # Simple Jaccard or substring check
                        if sent_text in ex["sentence"] or ex["sentence"] in sent_text:
                            is_dup = True
                            break
                    
                    if not is_dup:
                        entry["examples"].append({
                            "sentence": sent_text,
                            "year": year,
                            "paper": filename
                        })
                        
    except Exception as e:
        print(f"    [ERROR] Failed to process {filename}: {e}")

def main():
    print(f"Scanning exams in {EXAMS_ROOT}...")
    
    for year in YEARS:
        year_dir = os.path.join(EXAMS_ROOT, year)
        if not os.path.exists(year_dir):
            continue
            
        print(f"Scanning Year {year}...")
        for fname in os.listdir(year_dir):
            if fname.endswith(".docx") and not fname.startswith("~$"):
                fpath = os.path.join(year_dir, fname)
                process_file(fpath, year)
                
    # Post-process sets to lists for JSON
    final_output = {}
    for word, data in word_stats.items():
        # Filter very low freq noise? Let's keep everything > 1 freq for now.
        # Single occurrence in 15 years might be noise, but let's keep it to label "Cold Zone".
        if data["total_count"] <= 0:
            continue
            
        final_output[word] = {
            "freq": data["total_count"],
            "last_seen": max([int(y) for y in data["years"].keys()]) if data["years"] else 0,
            "years_dist": dict(data["years"]), # Convert Counter to dict
            "papers": list(data["papers"]),
            "examples": data["examples"]
        }
        
    # Sort by frequency desc
    sorted_output = dict(sorted(final_output.items(), key=lambda item: item[1]["freq"], reverse=True))
    
    print(f"Analyzed {len(sorted_output)} unique words.")
    print(f"Saving stats to {DATA_OUTPUT_PATH}...")
    
    os.makedirs(os.path.dirname(DATA_OUTPUT_PATH), exist_ok=True)
    with open(DATA_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(sorted_output, f, ensure_ascii=False, indent=2)
        
    print("Done.")

if __name__ == "__main__":
    main()
