import json
import os
import time
import google.generativeai as genai
from typing import List, Dict, Any

# ================= CONFIGURATION =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")
INPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_final.json")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_refined_final.json")
BATCH_SIZE = 50

# Helper to get API key
api_key = os.getenv("GEMINI_API_KEY") 
if not api_key:
    env_path = os.path.join(PROJECT_ROOT, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    api_key = line.strip().split("=", 1)[1].strip('"').strip("'")
                    break

if not api_key:
    print("Error: GEMINI_API_KEY not found in environment or .env")
    exit(1)

genai.configure(api_key=api_key)

generation_config = {
    "temperature": 0.2,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
}

model = genai.GenerativeModel(
    model_name="gemini-3-flash-preview",
    generation_config=generation_config,
)

def processing_batch(batch_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Prepare the prompt
    prompt_items = []
    for item in batch_data:
        prompt_items.append({
            "word": item['word'],
            "pos": item.get('pos', []),
            "current_meanings_en": item.get('meanings', {}).get('en', []),
        })

    prompt = f"""
    You are a strict data formatter.
    
    TASK 1: REWRITE `"meanings_en"` to be **descriptive** (4-6 words).
    
    TASK 2: CREATE `"teach"` (MANDATORY ARRAY OF STRINGS).
      - **QUANTITY RULE**: Create EXACTLY ONE sentence for each POS tag found in the word's `pos` list.
        - If `pos` is `["noun", "verb"]` -> generate 2 sentences (1 Verb, 1 Noun).
        - If `pos` is `["noun"]` -> generate 1 sentence.
      - **VERB CONTENT RULE**: The VERB sentence MUST show conjugation (Base + Past + -ing).
        - Pattern: "He [verbs]... just as he [verb-past]... [verb-ing]..."
      - **OTHER CONTENT**: Simple, clear sentences.

    INPUT DATA:
    {json.dumps(prompt_items, ensure_ascii=False)}

    OUTPUT JSON (List of Objects):
    [
      {{
        "word": "word_key",
        "meanings_en": ["def 1", "def 2"],
        "teach": ["Sentence corresponding to POS 1", "Sentence corresponding to POS 2"]
      }}
    ]
    """

    try:
        response = model.generate_content(prompt)
        text_response = response.text
        if text_response.strip().startswith("```json"):
            text_response = text_response.strip()[7:-3]
        elif text_response.strip().startswith("```"):
            text_response = text_response.strip()[3:-3]
        
        refined_list = json.loads(text_response)
        
        batch_lookup = {item['word']: item for item in batch_data}
        
        results = []
        for refined in refined_list:
            original = batch_lookup.get(refined['word'])
            if original:
                if 'meanings' not in original:
                    original['meanings'] = {}
                
                new_meanings = refined.get('meanings_en')
                if new_meanings and isinstance(new_meanings, list):
                    original['meanings']['en'] = new_meanings
                
                if 'examples' not in original:
                    original['examples'] = {}
                
                new_teach = refined.get('teach')
                if new_teach:
                    if isinstance(new_teach, str):
                        # Auto-fix: Wrap single string in list, though content might be sub-optimal
                        new_teach = [new_teach]
                    
                    if isinstance(new_teach, list):
                        original['examples']['teach'] = new_teach
                
                if 'definition' in original:
                    del original['definition']
                
                results.append(original)
        
        return results

    except Exception as e:
        print(f"Error processing batch: {e}")
        return batch_data

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    print(f"Reading from {INPUT_FILE}...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        all_data = json.load(f)

    total_words = len(all_data)
    print(f"Total words to process: {total_words}")

    final_results = []
    
    start_time = time.time()
    
    # Process in chunks
    for i in range(0, total_words, BATCH_SIZE):
        batch = all_data[i : i + BATCH_SIZE]
        print(f"Processing batch {i // BATCH_SIZE + 1} / {(total_words + BATCH_SIZE - 1) // BATCH_SIZE} ({len(batch)} words)...")
        
        refined_batch = processing_batch(batch)
        final_results.extend(refined_batch)
        
        # Save progress every batch
        if True:
             print(f"  Saving intermediate progress to {OUTPUT_FILE}...")
             with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(final_results, f, ensure_ascii=False, indent=2)
        
        # Sleep briefly to avoid aggressive rate limiting
        time.sleep(1)

    print(f"Saving FINAL output to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_results, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - start_time
    print(f"Done in {elapsed:.2f} seconds.")

if __name__ == "__main__":
    main()
