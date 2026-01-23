import json
import os
import time
import google.generativeai as genai
from tqdm import tqdm
from dotenv import load_dotenv

# ================= CONFIGURATION =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

API_KEY = os.environ.get("GEMINI_API_KEY")
INPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_refined_final.json")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_refined_final.json")

# Configure Client
if API_KEY:
    genai.configure(api_key=API_KEY)

MODEL_NAME = "gemini-2.0-flash-exp"
# MODEL_NAME = "gemini-3-flash-preview" # Causing hang issues?
BATCH_SIZE = 25

def load_data():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    # Write to a temp file first for atomic save
    temp_file = OUTPUT_FILE + ".tmp"
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(temp_file, OUTPUT_FILE)
    print(f"Saved update to {OUTPUT_FILE}")

def audit_consistency(data):
    """
    Checks if pos list length matches meanings/examples length in the current file.
    User request: "Check if pos_distribution, pos, meanings-cn, meanings-en are all same length"
    We treat 'pos' as the source of truth for the target length.
    """
    print("Auditing structural consistency...")
    mismatches = 0
    for entry in data:
        word = entry['word']
        pos_list = entry.get('pos', [])
        target_len = len(pos_list)
        
        meanings = entry.get('meanings', {})
        cn = meanings.get('cn', [])
        en = meanings.get('en', [])
        
        # examples = entry.get('examples', {}) # We are regenerating these anyway
        
        if len(cn) != target_len or len(en) != target_len:
            # print(f"Mismatch for '{word}': POS={target_len}, CN={len(cn)}, EN={len(en)}")
            mismatches += 1
            
    if mismatches == 0:
        print("✅ Structural Audit Passed: All words have consistent POS/Meaning array lengths.")
    else:
        print(f"⚠️ Structural Audit: Found {mismatches} words with length mismatches (POS vs Meanings).")
        print("Proceeding with regeneration to fix content and strictly enforce alignment.")

def generate_prompt(batch_items):
    items_str = ""
    for item in batch_items:
        # Explicitly state the POS and the required count
        items_str += f'- Word: "{item["word"]}"\n  Required POS List: {json.dumps(item["pos"])}\n  REQUIRED_COUNT: {len(item["pos"])}\n'

    prompt = f"""
    You are an expert English lexicographer for Chinese Gaokao students.
    
    TASK: Regenerate definitions and examples for the provided words.
    
    INPUT DATA:
    {items_str}
    
    STRICT GENERATION RULES:
    1. **Strict Alignment**: 
       - For each word, you must generate arrays (`meanings_cn`, `meanings_en`, `examples_teach`) that have EXACTLY the same length as the `Required POS List`.
       - Index 0 MUST correspond to the first POS, Index 1 to the second, etc.
       
    2. **Content Quality**:
       - **meanings_cn**: Concise Chinese definition. Use semicolons (；) for distinct meanings within that POS. (e.g., "时间；次").
       - **meanings_en**: Simple, short English definition (4-6 words max). (e.g., "measured period; occurrence").
       - **examples_teach**: A high-quality B2-level sentence.
         - **CRITICAL**: If a word has multiple POS, sentences must be distinct contexts.
         - **VERB GYMNASTICS (CRITICAL)**: For VERBS, create ONE SINGLE sentence that uses the verb in MULTIPLE forms (Present, Past, Participle -ing). 
           - **REQUIRED PATTERN**: "Subject [VERBS]... [VERBED]... [VERBING]..." 
           - **Example**: "He **places** the cup where he **placed** the others, **placing** it carefully as it was **placed** before."
         - **NOUN MORPHOLOGY**: For Nouns, occasionally use Plural forms.
    
    3. **OUTPUT FORMAT**:
       - Return a JSON List of objects.
       - Each object must match the input word.
       
    Example Output Structure:
    [
      {{
        "word": "time",
        "meanings_cn": ["时间；次数", "计时；测定时间"],
        "meanings_en": ["indefinite continued progress of existence", "measure the time taken by"],
        "examples_teach": ["I simply do not have enough time to finish the project.", " The runners were timed at the finish line."]
      }}
    ]
    """
    return prompt

def process_batch(batch_data):
    prompt = generate_prompt(batch_data)
    
    max_retries = 3
    base_delay = 5  # seconds
    
    for attempt in range(max_retries):
        try:
            # print(f"DEBUG: Sending batch request (Attempt {attempt+1})...") # verbose
            model = genai.GenerativeModel(MODEL_NAME)
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(response_mime_type="application/json"),
                request_options={"timeout": 60} # Add timeout validation
            )
            # print("DEBUG: Response received.")
            
            # Parse JSON
            text = response.text
            if text.startswith("```json"): text = text[7:-3]
            try:
                results = json.loads(text)
            except json.JSONDecodeError as je:
                print(f"[Attempt {attempt+1}] JSON Parse Error: {je}")
                print(f"DEBUG RESPONSE: {text[:500]}...") # Show what came back
                if attempt == max_retries - 1: raise je
                continue

            updates_count = 0
            for res in results:
                target_word = res.get('word')
                
                # Find original item
                original = next((item for item in batch_data if item['word'] == target_word), None)
                
                if original:
                    target_len = len(original['pos'])
                    
                    new_cn = res.get('meanings_cn', [])
                    new_en = res.get('meanings_en', [])
                    new_teach = res.get('examples_teach', [])
                    
                    # STRICT VALIDATION
                    if len(new_cn) == target_len and len(new_en) == target_len and len(new_teach) == target_len:
                        original['meanings']['cn'] = new_cn
                        original['meanings']['en'] = new_en
                        original['examples']['teach'] = new_teach
                        original['_mcp_refined'] = True # Mark as refined
                        updates_count += 1
                    else:
                        print(f"❌ Alignment Failed for '{target_word}': Expected {target_len}, Got CN:{len(new_cn)} EN:{len(new_en)} Teach:{len(new_teach)}")
                        print(f"   Target POS: {original['pos']}")
            
            return updates_count # Success, break loop

        except Exception as e:
            print(f"[Attempt {attempt+1}] Error processing batch: {e}")
            if attempt < max_retries - 1:
                sleep_time = base_delay * (2 ** attempt)
                print(f"   Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)
            else:
                print("   Max retries reached. Skipping batch.")
                return 0
    return 0

def main():
    if not API_KEY:
        print("Please set GEMINI_API_KEY.")
        return

    data = load_data()
    
    # 1. Audit
    audit_consistency(data)
    
    # 2. Select Candidates (ALL words that are not yet refined)
    all_candidates = data
    candidates = [w for w in all_candidates if not w.get('_mcp_refined', False)]
    
    print(f"Processing {len(candidates)} remaining words (Total: {len(all_candidates)})...")
    
    total_updates = 0
    with tqdm(total=len(candidates)) as pbar:
        for i in range(0, len(candidates), BATCH_SIZE):
            batch = candidates[i:i+BATCH_SIZE]
            count = process_batch(batch)
            total_updates += count
            pbar.update(len(batch))
            time.sleep(1) # Rate limit safety
            
            # Incremental save (optional, but good for safety)
            if i % (BATCH_SIZE * 5) == 0:
                 save_data(data)

    print(f"Full run complete. Updated {total_updates}/{len(candidates)} words.")
    save_data(data)

if __name__ == "__main__":
    main()
