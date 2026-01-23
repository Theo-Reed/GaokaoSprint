import json
import os
import time
import google.generativeai as genai
from typing import List, Dict, Any

# ================= CONFIGURATION =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")
INPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_final.json")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_batch_1.json")

# Helper to get API key (assuming it is set in env from previous sessions or .env)
# If not found, please export GEMINI_API_KEY='your_key'
api_key = os.getenv("GEMINI_API_KEY") 
if not api_key:
    # Fallback to try to read from a local .env file if it exists in project root for convenience
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

SYSTEM_PROMPT = """
You are an expert English lexicographer for GaoKao (Chinese College Entrance Exam) students. 

**GOAL**: Refine vocabulary data by 1) simplifying definitions and 2) creating "Gymnastic" example sentences.

**INSTRUCTIONS**:

1. **Refine `meanings_en` (English Definitions)**:
   - You will receive current English meanings.
   - You must REWRITE them to be **extremely concise** (under 10 words).
   - Return them as a LIST of strings (corresponding to the meanings).
   - Example bad: "To intend to convey or refer to (a particular thing); signify"
   - Example good: "To intend or signify; to have in mind."

2. **Create `teach` Examples (Linguistic Gymnastics)**:
   - The `teach` field must be an ARRAY of sentences.
   - **MANDATORY VERB PATTERN**: If the word is a VERB, you MUST create **ONE SINGLE SENTENCE** that forces the student to see the verb in multiple forms (Base, Past, Present Participle, etc.).
     - Pattern: "Subject [verbs]... just as [past verb]... while [verbing]..."
     - Example (Place): "He **places** the cup where he **placed** the others, **placing** it carefully as it was **placed** before."
     - Example (Mean): "I **mean** what I said, just as I **meant** it yesterday, **meaning** no harm."
   - **NOUN/ADJECTIVE Pattern**: Provide one clear, simple sentence.
   - **Multi-POS**: If a word is Noun + Verb, provide TWO sentences (One Gymnastic Verb sentence, One Noun sentence).

**OUTPUT FORMAT**:
Return a JSON LIST of objects:
[{
  "word": "...",
  "meanings_en": ["concise def 1", "concise def 2"],
  "teach": ["Gymnastic Verb Sentence", "Noun Sentence"]
}]
"""

def processing_batch(batch_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Prepare the prompt
    prompt_items = []
    for item in batch_data:
        prompt_items.append({
            "word": item['word'],
            "pos": item.get('pos', []),
            "current_meanings_en": item.get('meanings', {}).get('en', []),
            # "current_meanings_cn": item.get('meanings', {}).get('cn', []) # Reduce context to focus on EN
        })

    prompt = f"""
    You are a lexical data generator.
    
    TASK 1: REWRITE English definitions (`meanings_en`) to be **descriptive** (approx 4-6 words). 
       - Avoid single-word synonyms. 
       - Aim for clarity and simple vocabulary.
       - Example: "To measure the speed or duration." (6 words)
    
    TASK 2: CREATE `teach` examples.
      - MUST be a list of strings.
      - **VERB GYMNASTICS RULE**: For VERBS, create ONE sentence that uses the verb in 3 forms: Present, Past, Participle.
        - Pattern: "He [VERBS] it now, just as he [VERBED] it then, [VERBING] it often."
        - Example: "He **checks** the list that he **checked** yesterday, **checking** it again."
      - If word is Noun+Verb, provide [VerbSentence, NounSentence].

    INPUT DATA:
    {json.dumps(prompt_items, ensure_ascii=False)}

    OUTPUT JSON (List of Objects):
    [
      {{
        "word": "item_word",
        "meanings_en": ["concise def 1", "concise def 2"],
        "teach": ["Gymnastic Verb Sentence", "Noun Sentence"]
      }}
    ]
    """

    try:
        response = model.generate_content(prompt)
        text_response = response.text
        # Clean up potential markdown code blocks
        if text_response.strip().startswith("```json"):
            text_response = text_response.strip()[7:-3]
        elif text_response.strip().startswith("```"):
            text_response = text_response.strip()[3:-3]
        
        # print("DEBUG RESPONSE START:", text_response[:100]) # Debug

        refined_list = json.loads(text_response)
        
        # Map back to original data
        batch_lookup = {item['word']: item for item in batch_data}
        
        results = []
        for refined in refined_list:
            original = batch_lookup.get(refined['word'])
            if original:
                # Update English meanings
                if 'meanings' not in original:
                    original['meanings'] = {}
                
                # Check if we got a list and it's not empty
                new_meanings = refined.get('meanings_en')
                if new_meanings and isinstance(new_meanings, list):
                    original['meanings']['en'] = new_meanings
                
                # Update teach examples
                if 'examples' not in original:
                    original['examples'] = {}
                
                new_teach = refined.get('teach')
                if new_teach and isinstance(new_teach, list):
                    original['examples']['teach'] = new_teach
                
                # Remove top-level definition if it exists from previous runs/sources
                if 'definition' in original:
                    del original['definition']
                
                results.append(original)
        
        return results

    except Exception as e:
        print(f"Error processing batch: {e}")
        # Return original on failure
        return batch_data

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    print(f"Reading from {INPUT_FILE}...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        all_data = json.load(f)

    # Slice for testing: First 50 words
    test_batch = all_data[:50]
    print(f"Processing first {len(test_batch)} words as a test batch...")

    start_time = time.time()
    
    # Process in one go since 50 is small enough for Gemini Flash 1.5 context usually
    # But just to be safe and consistent with future logic, let's just send them all.
    refined_batch = processing_batch(test_batch)

    # Save
    print(f"Saving {len(refined_batch)} words to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(refined_batch, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - start_time
    print(f"Done in {elapsed:.2f} seconds.")

if __name__ == "__main__":
    main()
