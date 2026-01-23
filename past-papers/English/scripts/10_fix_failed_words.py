import json
import os
import time
import google.generativeai as genai
from typing import List, Dict, Any

# ================= CONFIGURATION =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")
# We load the "refined" file to see what's missing, and we will overwrite it with fixes
TARGET_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_refined_final.json")
BATCH_SIZE = 30  # Testing batch size for 3-flash-preview

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

# generation_config removed as requested

model = genai.GenerativeModel(
    model_name="gemini-3-flash-preview",
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

    for attempt in range(3):
        try:
            # Explicitly turning off safety filters to prevent false positives on 'teach' examples
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
            ]
            response = model.generate_content(prompt, safety_settings=safety_settings)
            
            # Safe access to text
            try:
                text_response = response.text
            except ValueError:
                # If text access fails, check if feedback exists via safety ratings or other reasons
                print(f"  Attempt {attempt+1}: generation failed (No text returned). Finish reason: {response.candidates[0].finish_reason if response.candidates else 'Unknown'}")
                continue

            if text_response.strip().startswith("```json"):
                text_response = text_response.strip()[7:-3]
            elif text_response.strip().startswith("```"):
                text_response = text_response.strip()[3:-3]
            
            try:
                refined_list = json.loads(text_response)
            except json.JSONDecodeError:
                print(f"  Attempt {attempt+1}: Invalid JSON received.")
                # Sometimes appending '}' or ']' helps if truncated, but usually retry is better
                continue
            
            # Create a map of success items
            refined_map = {item['word']: item for item in refined_list}
            
            # Update the original batch objects
            results = []
            for original in batch_data:
                refined = refined_map.get(original['word'])
                if refined:
                    # Update Meanings
                    new_meanings = refined.get('meanings_en')
                    if new_meanings and isinstance(new_meanings, list):
                        original['meanings']['en'] = new_meanings
                    
                    # Update Teach Examples
                    new_teach = refined.get('teach')
                    if new_teach:
                        if isinstance(new_teach, str):
                            new_teach = [new_teach]
                        if isinstance(new_teach, list):
                            original['examples']['teach'] = new_teach
                    
                    # Cleanup old definition
                    if 'definition' in original:
                        del original['definition']
                    
                    results.append(original)
                else:
                    # If Gemini missed this word in the response, keep original (still failed)
                    results.append(original)
            
            return results

        except Exception as e:
            if "429" in str(e) or "Resource exhausted" in str(e):
                wait_time = (attempt + 1) * 10
                print(f"  Rate limit hit. Waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            print(f"Error processing batch: {e}")
            return batch_data
    
    return batch_data

def main():
    if not os.path.exists(TARGET_FILE):
        print(f"Error: {TARGET_FILE} not found.")
        return

    print(f"Loading {TARGET_FILE}...")
    with open(TARGET_FILE, 'r', encoding='utf-8') as f:
        all_data = json.load(f)

    # IDENTIFY FAILED ITEMS
    failed_indices = []
    for idx, item in enumerate(all_data):
        examples = item.get('examples', {})
        teach = examples.get('teach')
        
        # Criteria: 'teach' is missing OR 'teach' is a STRING
        if not teach or isinstance(teach, str):
            failed_indices.append(idx)

    total_failed = len(failed_indices)
    print(f"Found {total_failed} words that need repair out of {len(all_data)}.")
    
    if total_failed == 0:
        print("Nothing to fix.")
        return

    start_time = time.time()
    
    # Process failed items in chunks
    # We iterate through the indices to update `all_data` in place
    for i in range(0, total_failed, BATCH_SIZE):
        current_indices = failed_indices[i : i + BATCH_SIZE]
        batch_data = [all_data[ix] for ix in current_indices]
        
        print(f"Reparing batch {i // BATCH_SIZE + 1} / {(total_failed + BATCH_SIZE - 1) // BATCH_SIZE} ({len(batch_data)} words)...")
        
        # Run processing
        fixed_batch = processing_batch(batch_data)
        
        # Update the main list
        for ix, fixed_item in zip(current_indices, fixed_batch):
            all_data[ix] = fixed_item
            
        # Save progress periodically
        if i % (BATCH_SIZE * 2) == 0:
             print(f"  Saving progress...")
             with open(TARGET_FILE, 'w', encoding='utf-8') as f:
                json.dump(all_data, f, ensure_ascii=False, indent=2)
        
        time.sleep(2) # Be gentle

    print(f"Saving FINAL output to {TARGET_FILE}...")
    with open(TARGET_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - start_time
    print(f"Repair complete in {elapsed:.2f} seconds.")

if __name__ == "__main__":
    main()
