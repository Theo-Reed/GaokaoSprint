import json
import os
import numpy as np

# ================= CONFIGURATION =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")
MASTER_ENRICHED_PATH = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_master_enriched.json")
STATS_REAL_PATH = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_stats_real.json")
OUTPUT_APP_DATA_PATH = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data.json")

# Thresholds
MIN_FREQ_FOR_NON_SYLLABUS = 3  # If word is not in master list, must appear >3 times in exams
POLYSEMY_RATIO_THRESHOLD = 0.10 # Secondary POS must be > 10% to be flagged

# Elementary Nouns that should keep their Verb form even if rare (Common "Noun as Verb" usage)
RESCUE_VERB_NOUNS = {
    # Body parts often used as verbs
    'face', 'head', 'eye', 'hand', 'arm', 'finger', 'back', 'nose', 'shoulder',
    
    # Objects/Actions
    'book', 'park', 'water', 'fire', 'farm', 'fish', 'milk', 'shop', 'store',
    'watch', 'clock', 'phone', 'mail', 'email', 'ship', 'boat', 'train',
    'play', 'show', 'work', 'study', 'help', 'call', 'talk', 'walk', 'run', 
    'start', 'end', 'finish', 'love', 'like', 'hate', 'hope', 'wish',
    'rain', 'snow', 'wind', 'cloud', 'star', 
    'time', 'program', 'record', 'place', 'room',
    'master'
}

def load_json(path):
    if not os.path.exists(path):
        print(f"Error: File not found {path}")
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def calculate_star_rating(freq, percentiles):
    # p95, p80, p50, p20 are values derived from the dataset
    p95, p80, p50, p20 = percentiles
    
    if freq >= p95: return 5
    if freq >= p80: return 4
    if freq >= p50: return 3
    if freq >= p20: return 2
    if freq > 0:    return 1
    return 0 # No stars for 0 frequency

def clean_pos_distribution(pos_dist, keep_rare_verb=False):
    """
    Filters out noise from POS distribution tags.
    Removes tags that account for less than 2% of total occurrences.
    
    keep_rare_verb: If True, do not filter out 'VERB' tag even if it's rare. 
                    Used for elementary nouns (school, water) where rare verb usage is significant content.
    """
    if not pos_dist: return {}
    
    total = sum(pos_dist.values())
    if total == 0: return {}
    
    cleaned = {}
    for pos, count in pos_dist.items():
        ratio = count / total
        
        # Special rescue for verbs if requested
        if keep_rare_verb and pos == 'VERB' and count > 0:
            cleaned[pos] = count
            continue
            
        # Threshold: 2% (0.02)
        if ratio >= 0.02: 
            cleaned[pos] = count
            
    return cleaned

def analyze_pos(pos_dist):
    # pos_dist: {"NOUN": 100, "VERB": 20}
    if not pos_dist:
        return [], False
        
    total = sum(pos_dist.values())
    sorted_pos = sorted(pos_dist.items(), key=lambda x: x[1], reverse=True)
    
    # Primary POS list (just the keys)
    primary_pos_tags = [p[0].lower() for p in sorted_pos]
    
    # Check for polysemy (functional shift)
    is_multi_pos = False
    if len(sorted_pos) >= 2:
        top_share = sorted_pos[0][1] / total
        second_share = sorted_pos[1][1] / total
        
        # If the secondary POS has significant presence (> 10%)
        # OR if even the top POS is not absolutely dominant (< 90%)
        if second_share > POLYSEMY_RATIO_THRESHOLD:
            is_multi_pos = True
            
    return primary_pos_tags, is_multi_pos

def main():
    print(">>> 1. Loading Datasets...")
    master_list = load_json(MASTER_ENRICHED_PATH) # List [ {word, example...} ]
    stats_wrapper = load_json(STATS_REAL_PATH)    # { scan_meta, data: { word: stats } }
    
    if not master_list or not stats_wrapper:
        print("Failed to load inputs.")
        return

    stats_data = stats_wrapper.get("data", {})
    
    print(f"    Master Vocab Size: {len(master_list)}")
    print(f"    Real Exam Stats Size: {len(stats_data)}")

    # --- Step 2: Calculate Percentiles for Star Rating ---
    # Extract all frequencies > 0 to have a meaningful distribution
    all_freqs = [s['freq'] for s in stats_data.values() if s['freq'] > 0]
    if not all_freqs:
        print("Warning: No frequency data found. Defaulting stars to 1.")
        percentiles = (100, 50, 10, 1)
    else:
        # Calculate thresholds
        p95 = np.percentile(all_freqs, 95)
        p80 = np.percentile(all_freqs, 80)
        p50 = np.percentile(all_freqs, 50)
        p20 = np.percentile(all_freqs, 20)
        percentiles = (p95, p80, p50, p20)
        print(f"    Star Thresholds (Freq): 5★ >={int(p95)}, 4★ >={int(p80)}, 3★ >={int(p50)}, 2★ >={int(p20)}")

    final_vocab_map = {} # word -> entry

    # --- Step 3: Process Syllabus Words (Group A) ---
    print(">>> 3. Merging Syllabus Words...")
    
    processed_syllabus_words = set()
    
    for item in master_list:
        word = item.get('word', '').lower().strip()
        if not word: continue
        
        processed_syllabus_words.add(word)
        
        # Get stats
        stat_entry = stats_data.get(word, {})
        freq = stat_entry.get('freq', 0)
        
        # Clean POS distribution (Remove noise like ADJ: 1 for 'work')
        # Exception: For elementary nouns, we want to KEEP rare verb usage (e.g. school -> verb)
        raw_pos_dist = stat_entry.get('pos_distribution', {})
        
        need_limit_rescue = word in RESCUE_VERB_NOUNS
        cleaned_pos_dist = clean_pos_distribution(raw_pos_dist, keep_rare_verb=need_limit_rescue)
        
        # Calculate derived attributes
        stars = calculate_star_rating(freq, percentiles)
        pos_list, is_multi_pos = analyze_pos(cleaned_pos_dist)
        years_count = len(stat_entry.get('years_dist', {}))
        
        # Tags construction
        tags = ["syllabus"]
        if stars >= 4: tags.append("core")
        if stars >= 5: tags.append("high-freq")
        if is_multi_pos: tags.append("multi-pos")
        if stars <= 1 and freq == 0: tags.append("rare") # Sleeping words

        # Example Construction (Hybrid)
        examples_final = {
            "teach": item.get('example', ''), # The AI generated one
            "exams": stat_entry.get('examples', []) # List of {year, text}
        }
        
        # Definition Construction
        meanings_cn = item.get('meanings_cn', [])
        meanings_en = item.get('meanings_en', [])
        
        final_vocab_map[word] = {
            "word": word,
            "stats": {
                "freq": freq,
                "years_count": years_count,
                "last_seen": stat_entry.get('last_seen', 0),
                "stars": stars,
                "pos_distribution": cleaned_pos_dist # Use Cleaned
            },
            "tags": tags,
            "pos": pos_list, # e.g. ["noun", "verb"]
            # definition removed as requested
            "meanings": {
                "cn": meanings_cn,
                "en": meanings_en
            },
            "examples": examples_final
        }

    # --- Step 4: Process Non-Syllabus High-Freq Words (Group B) ---
    print(">>> 4. Minning Non-Syllabus High-Freq Words...")
    
    added_non_syllabus_count = 0
    
    for word, stat_entry in stats_data.items():
        if word in processed_syllabus_words:
            continue
            
        freq = stat_entry.get('freq', 0)
        
        # Filter: Must be frequent enough
        if freq < MIN_FREQ_FOR_NON_SYLLABUS:
            continue
            
        # Add this "Dark Horse" word
        added_non_syllabus_count += 1
        
        # Clean POS
        raw_pos_dist = stat_entry.get('pos_distribution', {})
        
        need_limit_rescue = word in RESCUE_VERB_NOUNS
        cleaned_pos_dist = clean_pos_distribution(raw_pos_dist, keep_rare_verb=need_limit_rescue)
        
        stars = calculate_star_rating(freq, percentiles)
        pos_list, is_multi_pos = analyze_pos(cleaned_pos_dist)
        years_count = len(stat_entry.get('years_dist', {}))
        
        tags = ["non-syllabus"]
        if stars >= 4: tags.append("core") # Even if non-syllabus, it's core if freq is high
        if stars >= 5: tags.append("high-freq")
        if is_multi_pos: tags.append("multi-pos")
        
        examples_final = {
            "teach": "", # No AI example for these (unless we generate later)
            "exams": stat_entry.get('examples', [])
        }
        
        final_vocab_map[word] = {
            "word": word,
            "stats": {
                "freq": freq,
                "years_count": years_count,
                "last_seen": stat_entry.get('last_seen', 0),
                "stars": stars,
                "pos_distribution": cleaned_pos_dist
            },
            "tags": tags,
            "pos": pos_list,
            # definition removed as requested
            "meanings": {
                "cn": [],
                "en": []
            },
            "examples": examples_final
        }

    print(f"    Added {added_non_syllabus_count} non-syllabus words.")

    # --- Step 5: Final Output Generation ---
    # Convert map to list and sort
    # Sort Logic: 
    # 1. Frequency DOscending
    # 2. Then Alphabetical
    
    final_list = list(final_vocab_map.values())
    final_list.sort(key=lambda x: (-x['stats']['freq'], x['word']))
    
    print(f">>> 5. Saving {len(final_list)} words to app data...")
    
    with open(OUTPUT_APP_DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, ensure_ascii=False, indent=2)
        
    print("Done. Fusion Complete.")

if __name__ == "__main__":
    main()
