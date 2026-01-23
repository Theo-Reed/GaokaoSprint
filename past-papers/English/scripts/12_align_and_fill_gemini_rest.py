import json
import os
import time
import requests
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

MODEL_NAME = "gemini-1.5-flash" # Use stable flash model first
# User requested 2.0-flash-exp in history, but 1.5-flash is extremely stable. 
# I'll stick to 1.5-flash for reliability unless it fails quality checks.
# Actually, the user asked for high quality. 1.5-flash is good. 
# Let's try gemini-2.0-flash-exp if possible, as it's newer/better.
MODEL_NAME = "gemini-2.5-flash"

URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"

def load_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_atomic(filepath, data):
    temp_path = filepath + ".tmp"
    with open(temp_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(temp_path, filepath)

def check_alignment(data):
    print("Auditing structural consistency...")
    mismatches = 0
    for entry in data:
        word = entry['word']
        pos_list = entry.get('pos', [])
        target_len = len(pos_list)
        
        meanings = entry.get('meanings', {})
        cn = meanings.get('cn', [])
        en = meanings.get('en', [])
        
        if len(cn) != target_len or len(en) != target_len:
            mismatches += 1
            
    if mismatches == 0:
        print("✅ Structural Audit Passed: All words have consistent POS/Meaning array lengths.")
    else:
        print(f"⚠️ Structural Audit: Found {mismatches} words with length mismatches (POS vs Meanings).")

def generate_prompt(batch_items):
    items_str = ""
    for item in batch_items:
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
       - Return a valid JSON List of objects.
       - Each object must match the input word.
       
    Example Output Structure:
    [
      {{
        "word": "time",
        "meanings_cn": ["时间；次数", "计时；测定时间"],
        "meanings_en": ["indefinite continued progress of existence", "measure the time taken by"],
        "examples_teach": ["I simply do not have enough time to finish the project.", "The runners were timed at the finish line."]
      }}
    ]
    """
    return prompt

def call_gemini_rest(prompt, retries=5):
    headers = {'Content-Type': 'application/json'}
    data_payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.7 
        }
    }
    
    for attempt in range(retries):
        try:
            response = requests.post(URL, headers=headers, json=data_payload, timeout=60)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code in [429, 503, 500]:
                print(f"Server error {response.status_code}, retrying in {2**attempt}s...")
                time.sleep(2 ** attempt)
            else:
                print(f"Error {response.status_code}: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Network error: {e}, retrying...")
            time.sleep(2 ** attempt)
            
    return None

def process_batch(batch, data_map):
    prompt = generate_prompt(batch)
    response_json = call_gemini_rest(prompt)
    
    if not response_json:
        return 0
        
    try:
        candidates = response_json.get('candidates', [])
        if not candidates:
            # print("No candidates returned.")
            return 0
            
        content_text = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        generated_list = json.loads(content_text)
        
        success_count = 0
        for item in generated_list:
            word = item.get('word')
            if word in data_map:
                entry = data_map[word]
                target_len = len(entry.get('pos', []))
                
                m_cn = item.get('meanings_cn', [])
                m_en = item.get('meanings_en', [])
                ex = item.get('examples_teach', [])
                
                if len(m_cn) == target_len and len(m_en) == target_len and len(ex) == target_len:
                     entry['meanings'] = {
                         'cn': m_cn,
                         'en': m_en
                     }
                     entry['examples'] = ex 
                     entry['_mcp_refined'] = True
                     success_count += 1
                else:
                    # Soft failure log
                    pass
                    
        return success_count
        
    except json.JSONDecodeError:
        print("Failed to parse JSON response")
        return 0
    except Exception as e:
        print(f"Error processing batch: {e}")
        return 0

def main():
    DATA_FILE = "/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/vocabulary_app_data_refined_final.json"
    
    print(f"Loading data from {DATA_FILE}...")
    data = load_data(DATA_FILE)
    data_map = {item['word']: item for item in data}
    
    check_alignment(data)
    
    to_process = [d for d in data if not d.get('_mcp_refined', False)]
    print(f"Processing {len(to_process)} remaining words (Total: {len(data)})...")
    
    BATCH_SIZE = 10 
    
    with tqdm(total=len(to_process)) as pbar:
        for i in range(0, len(to_process), BATCH_SIZE):
            batch = to_process[i:i+BATCH_SIZE]
            if not batch:
                continue
                
            success_count = process_batch(batch, data_map)
            save_atomic(DATA_FILE, data)
            pbar.update(len(batch))
            time.sleep(0.5)

if __name__ == "__main__":
    main()
