import os
import re
import json
import spacy
from docx import Document
from collections import defaultdict, Counter
from tqdm import tqdm

# ================= CONFIGURATION =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")
EXAMS_ROOT = os.path.join(PROJECT_ROOT, "past-papers/English")
STATS_OUTPUT_PATH = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_stats_real.json")

# Model
print("Loading NLP Model (this may take a moment)...")
nlp = spacy.load("en_core_web_sm")
nlp.max_length = 2000000

# --- FILTERS ---
# 1. POS whitelist: Only keep content words
POS_KEEP = {'NOUN', 'VERB', 'ADJ', 'ADV'}

# 2. Entity whitelist to exclude: Remove names, places, orgs
ENT_EXCLUDE = {
    'PERSON', 'GPE', 'ORG', 'DATE', 'TIME', 
    'CARDINAL', 'ORDINAL', 'LOC', 'FAC', 'NORP',
    'EVENT', 'LAW', 'WORK_OF_ART', 'LANGUAGE', 
    'PERCENT', 'MONEY', 'QUANTITY'
}

# 3. Elementary & Stopwords Blacklist (>2 chars but too simple)
ELEMENTARY_BLACKLIST = {
    # Animals / Nature
    'cat', 'dog', 'pig', 'cow', 'hen', 'bee', 'ant', 'fox', 'sun', 'sky', 'lion', 'bear',
    # Objects
    'pen', 'bag', 'box', 'bus', 'car', 'bed', 'hat', 'cup', 'map', 'key', 'fan', 'toy',
    # Body
    'eye', 'ear', 'arm', 'leg', 'toe', 'lip',
    # Basic Adjectives
    'big', 'hot', 'new', 'old', 'red', 'bad', 'sad', 'fat', 'dry', 'wet', 
    # Basic Verbs
    'see', 'say', 'eat', 'run', 'sit', 'ask', 'buy', 'pay', 'cry', 'fly', 'put', 'get', 'got', 'let', 'try',
    # Pronouns/Particles
    'she', 'her', 'him', 'his', 'our', 'its', 'who', 'how', 'why', 'yes', 'not', 'nor', 'and', 'but', 'for', 'the',
    'you', 'all', 'any', 'can', 'may', 'one', 'two', 'six', 'ten',
    # Greetings
    'bye', 'hey',
    # Common stopwords supplement
    'was', 'were', 'had', 'has', 'have', 'are', 'been', 'did', 'does', 'doing', 'will', 'would', 'should', 'could',
    'this', 'that', 'these', 'those', 'there', 'here', 'when', 'where', 'what', 'which', 'whom', 'whose'
}

# 4. Lemma Correction (Fixing SpaCy oddities)
LEMMA_CORRECTIONS = {
    'specie': 'species', # SpaCy often lemmatizes 'species' -> 'specie' (coins), but we want biological species
    'datum': 'data',     # High schoolers learn 'data', not 'datum' (freq 110 in exams!)
    'bacterium': 'bacteria', # Common usage is plural
}

# ================= DATA STRUCTURES =================
vocab_stats = defaultdict(lambda: {
    "freq": 0,
    "years_dist": Counter(),
    "pos_distribution": Counter(),
    "examples": []
})

def scan_folder(root_path):
    files = []
    for dirpath, _, filenames in os.walk(root_path):
        for f in filenames:
            if f.endswith(".docx") and not f.startswith("~$"):
                path_parts = dirpath.split(os.sep)
                year = None
                for part in path_parts:
                    if part.isdigit() and len(part) == 4 and 2000 < int(part) < 2030:
                        year = int(part)
                        break
                
                if year:
                    files.append((os.path.join(dirpath, f), year))
    
    files.sort(key=lambda x: x[1], reverse=True)
    return files

def read_docx(filepath):
    try:
        doc = Document(filepath)
        full_text = []
        for p in doc.paragraphs:
            txt = p.text.strip()
            if txt:
                full_text.append(txt)
        return "\n".join(full_text)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return ""

def process_text(text, year):
    doc = nlp(text)
    
    # Pre-compile regex for Chinese characters
    chinese_pattern = re.compile(r'[\u4e00-\u9fff]')
    
    for sent in doc.sents:
        sent_text = sent.text.strip()
        
        # Strict Filter: No Chinese characters in example sentences
        if chinese_pattern.search(sent_text):
            continue

        en_chars = len(re.findall(r'[a-zA-Z]', sent_text))
        if len(sent_text) < 10 or en_chars / (len(sent_text) + 1) < 0.5:
            continue
            
        for token in sent:
            # --- 1. PRE-FILTER ---
            if len(token.text) <= 2: continue
            if not token.is_alpha: continue
            if chinese_pattern.search(token.text): continue

            # --- 2. NLP FILTER ---
            if token.ent_type_ in ENT_EXCLUDE: continue
            if token.pos_ not in POS_KEEP: continue
                
            lemma = token.lemma_.lower().strip()
            
            # --- 2.5 CORRECTION ---
            if lemma in LEMMA_CORRECTIONS:
                lemma = LEMMA_CORRECTIONS[lemma]
            
            # --- 3. BLACKLIST CHECK ---
            if len(lemma) <= 2: continue
            if lemma in ELEMENTARY_BLACKLIST: continue
            
            # --- 4. RECORD STATS ---
            entry = vocab_stats[lemma]
            entry["freq"] += 1
            entry["years_dist"][year] += 1
            entry["pos_distribution"][token.pos_] += 1
            
            # --- 5. EXAMPLE SNIPPET ---
            if len(entry["examples"]) < 5:
                is_duplicate = False
                for ex in entry["examples"]:
                    if sent_text in ex["text"] or ex["text"] in sent_text:
                        is_duplicate = True
                        break
                
                if not is_duplicate:
                    clean_sent = sent_text.replace('\n', ' ').replace('\r', '')
                    clean_sent = re.sub(r'\s+', ' ', clean_sent)
                    entry["examples"].append({
                        "year": year,
                        "text": clean_sent
                    })

def main():
    files = scan_folder(EXAMS_ROOT)
    print(f"Found {len(files)} exam files. Scanning (Year Descending)...")
    
    for filepath, year in tqdm(files, unit="file"):
        content = read_docx(filepath)
        if not content: continue
        process_text(content, year)
        
    print(f"\nScan complete. Total unique lemmas found: {len(vocab_stats)}")
    
    # Save output
    output_data = {}
    for word, stats in vocab_stats.items():
        output_data[word] = {
            "freq": stats["freq"],
            "last_seen": max(stats["years_dist"].keys()) if stats["years_dist"] else 0,
            "years_dist": dict(stats["years_dist"]),
            "pos_distribution": dict(stats["pos_distribution"]),
            "examples": stats["examples"]
        }
    
    final_output = {
        "scan_meta": {
            "total_files": len(files),
            "total_unique_words": len(output_data)
        },
        "data": output_data
    }
    
    print(f"Saving to {STATS_OUTPUT_PATH}...")
    with open(STATS_OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, ensure_ascii=False, indent=2)
    print("Done.")

if __name__ == "__main__":
    main()
