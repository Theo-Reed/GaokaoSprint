import json
import os
import time
import re
from tqdm import tqdm
import google.generativeai as genai

# ================= CONFIGURATION =================
# Set your API Key via export GEMINI_API_KEY='...'
API_KEY = os.environ.get("GEMINI_API_KEY")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")
INPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_master.json")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_master_enriched.json")

# Batch size for processing
BATCH_SIZE = 50 

# Words to totally ignore (Elementary level or Noise)
STOP_WORDS = {
    # Noise from OCR
    'unit', 'lesson', 'total', 'vocabulary', 'page', 'list',
    
    # Elementary Words (Too simple for Gaokao review)
    'cat', 'dog', 'pig', 'pen', 'box', 'bus', 'bag', 'bed', 'bee',
    'big', 'red', 'bad', 'sad', 'hot', 'old', 'new', 'wet', 'dry',
    'one', 'two', 'six', 'ten', 'mom', 'dad', 'hi', 'yes', 'no',
    'not', 'and', 'but', 'for', 'nor', 'the', 'she', 'he', 'is',
    'am', 'are', 'was', 'do', 'go', 'me', 'my', 'we', 'us',
    
    # Titles & Honorifics
    'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'miss', 'dr', 'dr.',
    
    # Countries
    'china', 'america', 'japan', 'uk', 'usa', 'england', 'germany', 
    'france', 'russia', 'canada', 'australia', 'italy', 'spain', 
    'brazil', 'india', 'egypt', 'greece', 'ireland', 'scotland', 'wales',
    'china', 'chinese', 'japan', 'japanese',
    
    # Cities/Places
    'beijing', 'shanghai', 'london', 'new york', 'paris', 'tokyo',
    'rome', 'berlin', 'moscow', 'sydney', 'ottawa', 'cairo',
    
    # Continents
    'asia', 'africa', 'europe', 'north america', 'south america',
    'antarctica', 'oceania',

    # Adjectives of Nationality/Region (Strict Filter)
    'african', 'asian', 'american', 'european', 'french', 'german',
    'russian', 'italian', 'spanish', 'chinese', 'japanese', 'indian',
    'canadian', 'australian', 'british', 'english', 'irish', 'scottish', 'welsh',
    'egyptian', 'greek', 'brazilian',
    
    # Specific filtering requests
    't-shirt', 'kilo', 'kilogram', 'centimetre', 'centimeter',
    'kilometre', 'kilometer', 'programme', 'program'
}

# ================= MODEL SETUP =================
if not API_KEY:
    print("⚠️ WARNING: GEMINI_API_KEY not found in environment variables.")
else:
    genai.configure(api_key=API_KEY)

model = genai.GenerativeModel('gemini-1.5-flash')

def load_data():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return []
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def is_valid_word(word_obj):
    word = word_obj.get('word', '').lower().strip()
    
    # 1. Length check
    if len(word) < 2: return False
    
    # 2. Stop words check
    if word in STOP_WORDS: return False
    
    # 3. Simple plurals check (optional, naive)
    if word.endswith('s') and word[:-1] in STOP_WORDS: return False

    return True

def generate_examples_batch(words_chunk):
    """
    Sends a batch of words to Gemini to get simple Gaokao-level examples.
    Returns: Dict { "word": "example_sentence" }
    """
    if not API_KEY:
        return {w['word']: "Example generation skipped (No API Key)" for w in words_chunk}

    word_list_str = ", ".join([w['word'] for w in words_chunk])
    
    prompt = f"""
    I have a list of English words for Gaokao (Chinese College Entrance Exam) students.
    
    Task:
    For each word, write ONE simple, clear English sentence that demonstrates its meaning.
    The sentence should be suitable for a high school student (CEFR B1/B2 level).
    Do NOT use complex grammar or rare words in the sentence.
    
    Words:
    {word_list_str}
    
    Output Format:
    Return ONLY a JSON object where keys are the words and values are the sentences.
    Example:
    {{
        "abandon": "He decided to abandon the broken car on the road.",
        "ability": "She has the ability to learn languages very quickly."
    }}
    """
    
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)
    except Exception as e:
        print(f"❌ API Error: {e}")
        # Return empty examples for this batch so process doesn't stop
        return {w['word']: "" for w in words_chunk}

def main():
    print("--- Step 1: Loading & Filtering ---")
    raw_data = load_data()
    print(f"Raw count: {len(raw_data)}")
    
    # 1. Filter
    prepared_data = [w for w in raw_data if is_valid_word(w)]
    print(f"Filtered count: {len(prepared_data)}")
    
    enriched_data = []
    
    # 2. Batch Process
    print("--- Step 2: Generating Examples (Batch) ---")
    
    # Iterate in chunks
    total_batches = (len(prepared_data) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for i in tqdm(range(0, len(prepared_data), BATCH_SIZE), total=total_batches):
        chunk = prepared_data[i : i + BATCH_SIZE]
        
        # Call LLM
        examples_map = generate_examples_batch(chunk)
        
        # Merge back
        for item in chunk:
            word = item['word']
            # Get example from map, default to empty if missing
            # Note: Map keys might be lowercased or slightly different, match carefully
            ex = examples_map.get(word) or examples_map.get(word.lower()) or ""
            
            new_item = item.copy()
            new_item['example'] = ex
            enriched_data.append(new_item)
            
        # Rate limit safety
        time.sleep(1)

        # Auto-save every 10 batches (500 words)
        if (i // BATCH_SIZE) % 10 == 0:
             with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(enriched_data, f, ensure_ascii=False, indent=2)

    # Final Save
    print("--- Step 3: Saving Final Output ---")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(enriched_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Done! Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
