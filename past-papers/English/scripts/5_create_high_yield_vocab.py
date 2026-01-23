import json
import os

# ================= CONFIGURATION =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")
INPUT_LITE_DATA = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_lite.json")
OUTPUT_HIGH_YIELD_DATA = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_high_yield.json")

# "High Yield" Blacklist - Words that 135-score students definitely know
# Simple verbs and high-frequency basic vocabulary
SIMPLE_WORDS_BLACKLIST = {
    'leave', 'keep', 'bring', 'find', 'show', 'use', 'call', 'try', 'ask', 'turn', 'move',
    'hold', 'live', 'stay', 'believe', 'become', 'change', 'grow', 'die', 'kill', 'send', 
    'cut', 'fall', 'wear', 'seem', 'less', 'more', 'most', 'few', 'little', 'much', 'many',
    'intentional', 'actual', 'final', 'simple', 'single', 'total', 'whole', 'main', 'real'
}

def main():
    print(f"Loading Lite vocabulary from {INPUT_LITE_DATA}...")
    
    if not os.path.exists(INPUT_LITE_DATA):
        print("Error: Input file not found.")
        return

    with open(INPUT_LITE_DATA, 'r', encoding='utf-8') as f:
        lite_vocab = json.load(f)
        
    print(f"Lite size: {len(lite_vocab)} words")
    
    high_yield_vocab = []
    dropped_words = []
    
    for item in lite_vocab:
        word = item.get('word', '')
        stats = item.get('stats', {})
        freq = stats.get('freq', 0)
        last_seen = stats.get('last_seen', 0)
        years_count = stats.get('years_count', 0)
        tags = item.get('tags', [])
        pos_dist = stats.get('pos_distribution', {})
        
        is_syllabus = 'syllabus' in tags
        
        # --- Pre-processing: Pos Tag Cleaning ---
        # Fix "Fake Multi-POS" caused by NLP noise (e.g., 'steak' NOUN:2, VERB:1)
        # We rely on pos_distribution if available.
        
        active_pos = set(item.get('pos', [])) # Default to existing pos list
        
        if freq < 20 and pos_dist:
            counts = list(pos_dist.values())
            if counts:
                max_count = max(counts)
                # If we have a dominant tag (>=2), drop the noise (count=1)
                if max_count >= 2:
                    current_valid = set()
                    for pt, count in pos_dist.items():
                        if count > 1: # Strict: Only keep tags appearing > 1 time if max >=2
                            # normalize Spacy tags to our internal format if needed, 
                            # or just use logic flags 
                            # Mapping: NOUN->noun, VERB->verb, ADJ->adj, ADV->adv
                            if pt == 'NOUN' or pt == 'PROPN': current_valid.add('noun')
                            elif pt == 'VERB': current_valid.add('verb')
                            elif pt == 'ADJ': current_valid.add('adj')
                            elif pt == 'ADV': current_valid.add('adv')
                            else: current_valid.add(pt.lower())
                    
                    if current_valid:
                        active_pos = current_valid
        
        is_multi_pos = len(active_pos) > 1
        is_pure_noun = len(active_pos) == 1 and 'noun' in active_pos
        is_pure_adj = len(active_pos) == 1 and 'adj' in active_pos

        # --- 0. Manual Blacklist (HIGHEST PRIORITY) ---
        if word in SIMPLE_WORDS_BLACKLIST:
            dropped_words.append(f"{word} (blacklist)")
            continue
        
        # --- 1. Aggressive Pruning (Universal) ---
        # Apply strict filters to ALL words (Syllabus AND Non-Syllabus).
        # Rules: Drop if Freq > 50 OR Years > 11.
        # EXCEPTION: Keep if "multi-pos" (Polysemy / 熟词生义). 
        # High scoring students need to know the rare parts of speech of common words.
        
        if not is_multi_pos:
            if freq > 50:
                 dropped_words.append(f"{word} (universal_freq_cut, freq={freq})")
                 continue
                 
            if years_count > 11:
                 dropped_words.append(f"{word} (universal_years_cut, years={years_count})")
                 continue

        # --- 2. Tail Pruning (Rare Nouns) ---
        # User Rule: freq < 10 AND strictly Noun (single POS: Noun) -> Drop.
        # These are likely obscure proper nouns, specific objects, or one-off topics.
        if is_pure_noun and freq < 10:
             dropped_words.append(f"{word} (rare_noun_cut, freq={freq})")
             continue

        # --- 3. Faded Words (Legacy Rule) ---

        # --- 3. Faded Words (Legacy Rule) ---
        # Words that haven't been seen since 2015 and are low freq.
        if last_seen < 2015 and freq < 10:
            dropped_words.append(f"{word} (outdated, last={last_seen})")
            continue

        # --- 4. Non-Syllabus Stability (Legacy Rule) ---
        # If not saved by Rule 0 (freq <= 30), require stability.
        # Drop if years < 3 unless recent (2022+).
        if not is_syllabus:
             if years_count < 3 and last_seen < 2022:
                dropped_words.append(f"{word} (unstable_nonsyllabus, years={years_count})")
                continue
                
        # --- 5. Simple Suffix Filter ---
        suffixes = ('ing', 'ed', 'ly', 'er', 'est')
        if word.endswith(suffixes) and freq > 35:
             dropped_words.append(f"{word} (simple_suffix)")
             continue
            
        high_yield_vocab.append(item)
    
    # Sort just to be safe (High freq -> Low freq)
    high_yield_vocab.sort(key=lambda x: (-x['stats']['freq'], x['word']))
    
    print("-" * 30)
    print(f"Refinement complete.")
    print(f"Dropped {len(dropped_words)} simple words: {', '.join(dropped_words[:20])} ...")
    print(f"Final High-Yield Size: {len(high_yield_vocab)} words")
    print("-" * 30)
    
    print(f"Saving to {OUTPUT_HIGH_YIELD_DATA}...")
    with open(OUTPUT_HIGH_YIELD_DATA, 'w', encoding='utf-8') as f:
        json.dump(high_yield_vocab, f, ensure_ascii=False, indent=2)
        
    print("Done! Target 135.")

if __name__ == "__main__":
    main()
