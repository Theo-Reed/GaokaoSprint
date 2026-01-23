import json
import os

# ================= CONFIGURATION =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(BASE_DIR, "../../../")
INPUT_APP_DATA = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data.json")
OUTPUT_LITE_DATA = os.path.join(PROJECT_ROOT, "next-app/src/data/vocabulary_app_data_lite.json")

# The "Aggressive" Threshold
MIN_FREQ_THRESHOLD = 3

# Too simple for high-school students (approx. Primary/Middle school level)
# Split into Noun-heavy set (where Verb is rare) and Verb-heavy/Other set (where Verb is common/basic)
ELEMENTARY_NOUNS = {
    # People & Roles
    'student', 'teacher', 'school', 'class', 'classmate', 'friend', 'family', 'parent', 'father', 'mother', 
    'dad', 'mum', 'mom', 'brother', 'sister', 'son', 'daughter', 'uncle', 'aunt', 'grandfather', 'grandmother',
    'grandpa', 'grandma', 'boy', 'girl', 'man', 'woman', 'child', 'kid', 'person', 'people', 'baby', 'neighbor',
    'king', 'queen', 'doctor', 'nurse',
    
    # Body
    'head', 'face', 'eye', 'nose', 'mouth', 'ear', 'tooth', 'teeth', 'hair', 'hand', 'arm', 'leg', 'foot', 'feet', 'body',
    
    # Home & Objects
    'home', 'house', 'room', 'bedroom', 'kitchen', 'door', 'window', 'floor', 'wall', 'table', 'desk', 'chair', 'bed',
    'pen', 'pencil', 'book', 'paper', 'bag', 'box', 'ball', 'doll', 'toy', 'card', 'picture', 'phone', 'clock', 'watch',
    'computer', 'cup', 'glass', 'plate', 'knife', 'fork', 'spoon', 'word', 'thing', 'way', 'life', 'name',
    
    # Nature & Animals
    'sun', 'moon', 'star', 'sky', 'rain', 'snow', 'wind', 'tree', 'flower', 'grass', 'water', 'fire', 'river', 'sea',
    'dog', 'cat', 'bird', 'fish', 'horse', 'sheep', 'cow', 'pig', 'chicken', 'duck', 'monkey', 'panda', 'tiger', 'lion', 
    'elephant', 'bear', 'rabbit', 'mouse', 'snake', 'animal',
    
    # Food
    'food', 'breakfast', 'lunch', 'dinner', 'meal', 'fruit', 'apple', 'banana', 'orange', 'pear', 'grape', 
    'rice', 'noodle', 'bread', 'cake', 'egg', 'meat', 'beef', 'pork', 'chicken', 'fish', 'milk', 'tea', 'coffee', 'juice',
    'sugar', 'salt', 'sweet',
    
    # Time
    'time', 'year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'morning', 'afternoon', 'evening', 'night',
    'today', 'tomorrow', 'yesterday', 'now', 'spring', 'summer', 'autumn', 'winter', 'birthday', 'holiday',
    
    # Common Places
    'park', 'zoo', 'farm', 'shop', 'store', 'market', 'hospital', 'cinema', 'city', 'town', 'village', 'country', 'world',
    
    # Numbers
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'twenty',
    'hundred', 'thousand', 'million', 'first', 'second', 'third'
}

ELEMENTARY_OTHERS = {
    # Basic Adjectives
    'good', 'bad', 'great', 'fine', 'nice', 'ok', 'okay', 'happy', 'sad', 'glad', 'sorry',
    'big', 'small', 'large', 'little', 'long', 'short', 'tall', 'high', 'low', 'wide',
    'old', 'new', 'young', 'fat', 'thin', 'heavy', 'light',
    'hot', 'cold', 'cool', 'warm', 'dry', 'wet',
    'fast', 'slow', 'quick', 'easy', 'hard', 'difficult', 'clean', 'dirty', 'busy', 'free',
    'red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'orange', 'purple', 'pink', 'color',
    'same', 'different', 'important', 'beautiful', 'pretty', 'delicious', 'interesting', 'right', 'wrong', 'true', 'false',
    
    # Basic Verbs
    'be', 'is', 'am', 'are', 'was', 'were', 'been',
    'do', 'did', 'done', 'does',
    'have', 'has', 'had',
    'go', 'come', 'get', 'give', 'take', 'make', 'put', 'let',
    'see', 'look', 'watch', 'hear', 'listen',
    'say', 'tell', 'talk', 'speak', 'ask', 'answer',
    'eat', 'drink', 'sleep', 'wake', 'stand', 'sit', 'walk', 'run', 'jump', 'swim', 'fly',
    'play', 'work', 'study', 'learn', 'read', 'write', 'draw', 'paint', 'sing', 'dance',
    'buy', 'sell', 'pay', 'open', 'close', 'help', 'love', 'like', 'want', 'need', 'know', 'think', 'understand', 'remember', 'forget',
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
    'start', 'begin', 'stop', 'finish', 'meet', 'visit', 'wait', 'hope', 'wish', 'feel',
    
    # Pronouns & Prepositions
    'i', 'me', 'my', 'mine', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its',
    'we', 'us', 'our', 'uurs', 'they', 'them', 'their', 'theirs',
    'this', 'that', 'these', 'those', 'here', 'there',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by', 'about', 'under', 'over',
    
    # Adverbs
    'also', 'then', 'still', 'more', 'well', 'too', 'very', 'much', 'many', 'most', 'some', 'any', 'no', 'not', 'never', 'always', 'often', 'sometimes'
}

# Combine for easy lookup
ELEMENTARY_BLACKLIST = ELEMENTARY_NOUNS.union(ELEMENTARY_OTHERS)

def main():
    print(f"Loading full vocabulary from {INPUT_APP_DATA}...")
    
    if not os.path.exists(INPUT_APP_DATA):
        print("Error: Input file found.")
        return

    with open(INPUT_APP_DATA, 'r', encoding='utf-8') as f:
        full_vocab = json.load(f)
        
    print(f"Original size: {len(full_vocab)} words")
    
    # Filtering Logic
    lite_vocab = []
    dropped_examples = []
    
    for item in full_vocab:
        stats = item.get('stats', {})
        freq = stats.get('freq', 0)
        word = item.get('word', '')
        tags = item.get('tags', [])
        years_count = stats.get('years_count', 0)
        is_syllabus = "syllabus" in tags
        
        # --- Logic Update (User Request) ---
        # 1. Non-syllabus words: Must appear in at least 3 different years
        # 2. Syllabus words: Must appear in at least 2 different years
        
        keep = False
        
        if is_syllabus:
            if years_count >= 2:
                keep = True
        else:
            if years_count >= 3:
                keep = True
        
        # --- Rule 3: Elementary Filter (New) ---
        # "Student" class words -> everyone knows them
        
        # Exception Logic:
        # If the word is in the "Elementary Nouns" set (People, Places, etc.),
        # BUT it has appeared as a VERB in the exams (e.g. "school" students, "book" a ticket),
        # then we KEEP it because the verb usage is likely not elementary.
        
        if word.lower() in ELEMENTARY_BLACKLIST:
            should_drop = True
            
            # Check for rescue condition (N -> V usage)
            if word.lower() in ELEMENTARY_NOUNS:
                 # EXCEPTION: Family terms like 'dad', 'mum', 'grandpa' often get mis-tagged as verbs due to capitalization
                 # "Dad said..." -> SpaCy might think Dad is proper noun acting as verb? No, usually noun.
                 # Regardless, "to dad" is not a syllabus concept.
                 # Block rescue for specific family informal terms.
                 FAMILY_BLOCKLIST = {'dad', 'mum', 'mom', 'grandpa', 'grandma', 'uncle', 'aunt', 'boy', 'girl'}
                 
                 if word.lower() not in FAMILY_BLOCKLIST:
                     pos_dist = stats.get('pos_distribution', {})
                     if 'VERB' in pos_dist:
                         should_drop = False # Rescue!
            
            if should_drop:
                if len(dropped_examples) < 15:
                    dropped_examples.append(f"{word} (Elementary)")
                keep = False

        if keep:
            lite_vocab.append(item)
        else:
            if len(dropped_examples) < 10:
                dropped_examples.append(f"{word} (years={years_count}, syl={is_syllabus})")
    
    # Sort again just to be safe (High freq -> Low freq)
    lite_vocab.sort(key=lambda x: (-x['stats']['freq'], x['word']))
    
    print("-" * 30)
    print(f"Filtering complete with threshold: freq >= {MIN_FREQ_THRESHOLD}")
    print(f"Dropped words (examples): {', '.join(dropped_examples)} ...")
    print(f"Final Lite Size: {len(lite_vocab)} words")
    print("-" * 30)
    
    print(f"Saving to {OUTPUT_LITE_DATA}...")
    with open(OUTPUT_LITE_DATA, 'w', encoding='utf-8') as f:
        json.dump(lite_vocab, f, ensure_ascii=False, indent=2)
        
    print("Done! Future 135-score students will thank you.")

if __name__ == "__main__":
    main()
