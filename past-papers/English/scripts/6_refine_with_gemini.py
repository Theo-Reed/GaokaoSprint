import json
import os
import time
import google.generativeai as genai
from tqdm import tqdm

# ================= CONFIGURATION =================
API_KEY = os.environ.get("GEMINI_API_KEY")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")
INPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_high_yield.json")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_refining.json")

# Configure Gemini
if not API_KEY:
    print("Warning: GEMINI_API_KEY not found in environment variables.")
else:
    genai.configure(api_key=API_KEY)

MODEL_NAME = "gemini-2.0-flash-exp"  # Or your preferred model

def get_candidates(data):
    """
    Selects candidates for LLM review:
    1. Words marked 'multi-pos' (verify accuracy of secondary POS).
    2. Words with missing definitions (empty 'cn' or 'en' list).
    3. Non-syllabus words (need AI examples).
    """
    candidates = []
    
    for idx, item in enumerate(data):
        needs_review = False
        reasons = []
        tags = item.get('tags', [])
        
        # Check Multi-POS accuracy
        if 'multi-pos' in tags:
            needs_review = True
            reasons.append("verify_multipos")
            
        # Check Missing Definitions
        meanings = item.get('meanings', {})
        if not meanings.get('cn') or not meanings.get('en'):
            needs_review = True
            reasons.append("missing_defs")

        # Check Non-Syllabus for Examples
        # If not syllabus, and no 'teach' example, prioritize getting one
        if 'syllabus' not in tags:
            current_examples = item.get('examples', {})
            # If no teach example, OR just to be safe for all non-syllabus
            if not current_examples.get('teach'): 
                needs_review = True
                reasons.append("generate_example")
            
        if needs_review:
            candidates.append({
                'index': idx,
                'word': item['word'],
                'current_pos': item.get('pos', []),
                'current_meanings': meanings,
                'reasons': reasons,
                'stats': item.get('stats', {})
            })
            
    return candidates

def batch_process_candidates(candidates, data):
    """
    Processes candidates in batches using Gemini.
    """
    batch_size = 20
    model = genai.GenerativeModel(MODEL_NAME)
    
    total_batches = (len(candidates) + batch_size - 1) // batch_size
    print(f"Processing {len(candidates)} candidates in {total_batches} batches...")
    
    for i in range(0, len(candidates), batch_size):
        batch = candidates[i:i+batch_size]
        batch_indices = {c['word']: c['index'] for c in batch}
        
        prompt_items = []
        for c in batch:
            prompt_items.append({
                "word": c['word'],
                "current_pos": c['current_pos'],
                "reasons": c['reasons']
            })
            
        prompt = f"""
        You are an expert English lexicographer for advanced ESL students (Gaokao/IELTS level).
        Review the following list of words. For each word, perform these checks based on 'reasons':
        
        1. **POS Verification** (if 'verify_multipos'): Check if the listed parts of speech are LEGITIMATELY distinct and common enough for a high-school student to know. 
           - Example noise: "steak" might be listed as NOUN and VERB. But "steak" as a verb is extremely rare/slang. REMOVE the noise POS. 
           - Example valid: "book" (Noun: written work, Verb: to reserve) -> Keep both.
           - Return the CLEANED list of POS.
           
        2. **Definitions** (if 'missing_defs' or POS cleaned): Provide concise definitions.
           - "cn": Chinese definitions for each active POS.
           - "en": English definitions for each active POS.

        3. **Examples** (if 'generate_example'): Provide ONE high-quality, academic or sophisticated example sentence.
           - The sentence should demonstrate the word's usage clearly.
           - Avoid simple "I like..." sentences. Use Gaokao/IELTS reading passage style.
           
        Output JSON format ONLY (Array of Objects):
        [
            {{
                "word": "word_here",
                "clean_pos": ["noun", "verb"],
                "meanings": {{
                    "cn": ["noun_def", "verb_def"],
                    "en": ["noun_def", "verb_def"]
                }},
                "example": "The scientist conducted an experiment to test the hypothesis."
            }}
        ]
        
        Words to process:
        {json.dumps(prompt_items, indent=2)}
        """
        
        try:
            response = model.generate_content(prompt)
            cleaned_text = response.text.strip()
            # Handle markdown code blocks
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:-3]
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:-3]
                
            results = json.loads(cleaned_text)
            
            # Update Main Data
            for res in results:
                word = res['word']
                if word in batch_indices:
                    idx = batch_indices[word]
                    
                    # Update POS
                    new_pos =  [p.lower() for p in res.get('clean_pos', [])]
                    # Filter only valid POS strings
                    valid_pos_set = {'noun', 'verb', 'adj', 'adv', 'prep', 'conj', 'pron', 'article', 'num', 'interj'}
                    new_pos = [p for p in new_pos if p in valid_pos_set]
                    
                    if new_pos:
                        data[idx]['pos'] = new_pos
                        
                        # Update Tags: Recalculate multi-pos
                        tags = set(data[idx].get('tags', []))
                        if len(new_pos) > 1:
                            tags.add('multi-pos')
                        elif 'multi-pos' in tags:
                            tags.remove('multi-pos')
                        data[idx]['tags'] = list(tags)

                    # Update Meanings
                    if res.get('meanings'):
                        data[idx]['meanings'] = res['meanings']

                    # Update Example
                    if res.get('example'):
                        if 'examples' not in data[idx]:
                            data[idx]['examples'] = {}
                        # We use 'teach' key for the instructional example
                        data[idx]['examples']['teach'] = res['example']
                        
        except Exception as e:
            print(f"Error in batch {i//batch_size}: {e}")
            time.sleep(2)
            
        time.sleep(1.5) # Rate limit simple handling

def final_filtering(data):
    """
    Applies the final filter: Drop 'is_pure_noun' items with freq < 10.
    This runs AFTER LLM might have cleaned up POS tags (converting fake multi-pos to pure nouns).
    """
    kept_data = []
    dropped_count = 0
    
    for item in data:
        stats = item.get('stats', {})
        freq = stats.get('freq', 0)
        pos = item.get('pos', [])
        
        is_pure_noun = len(pos) == 1 and ('noun' in pos or 'n' in pos)
        
        if is_pure_noun and freq < 10:
            dropped_count += 1
            # print(f"Dropping post-clean word: {item['word']} (freq {freq}, now pure noun)")
            continue
            
        kept_data.append(item)
        
    print(f"Final Filtering dropping {dropped_count} words that became rare nouns after cleaning.")
    return kept_data

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    print("Loading data...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    candidates = get_candidates(data)
    print(f"Found {len(candidates)} words needing verification/enrichment.")
    
    if API_KEY and candidates:
        batch_process_candidates(candidates, data)
    else:
        print("Skipping LLM process (No API Key or No Candidates).")

    print("Running final filtering...")
    final_data = final_filtering(data)
    
    # Sort
    final_data.sort(key=lambda x: (-x['stats']['freq'], x['word']))

    print(f"Saving {len(final_data)} words to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
        
    print("Done.")

if __name__ == "__main__":
    main()
