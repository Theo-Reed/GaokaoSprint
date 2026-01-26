
import os
import json
import urllib.request

# Load .env manually to ensure keys are available
env_path = '/Users/yeatom/VSCodeProjects/gaokao/.env'
keys = {}
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                keys[key] = value

GEMINI_API_KEY = keys.get('GEMINI_API_KEY')
SYSTEM_PROMPT = """You are a senior expert in Gaokao English grading with 15 years of experience. You specialize in upgrading student compositions to the highest level (Tier 5, 14-15 points) through detailed expansion and logical depth."""

# Target Data Loading
def get_target_topic(year, region):
    json_path = '/Users/yeatom/VSCodeProjects/gaokao/past-papers/English/scripts/small_compositions.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data:
            # item["region"] could be a list or a string
            regions = item["region"] if isinstance(item["region"], list) else [item["region"]]
            if item["year"] == year and region in regions:
                return item
    return None

def call_gemini(api_key, model, system, user):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [{"text": f"System Instruction: {system}\n\nUser Request: {user}"}]
        }],
        "generationConfig": {"temperature": 0.7}
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            data = json.loads(res.read())
            return data['candidates'][0]['content']['parts'][0]['text'].strip()
    except Exception as e:
        return f"Error ({model}): {str(e)}"

def generate(topic_data):
    chinese_prompt = topic_data["prompt"]
    scaffold = topic_data.get("scaffold", {})
    start_text = scaffold.get("start", "")
    end_text = scaffold.get("end", "")
    start_instr = f"You MUST start exactly with: \"{start_text}\"" if start_text else "Start with an appropriate greeting."
    end_instr = f"You MUST end exactly with: \"{end_text}\"" if end_text else "End with an appropriate closing."

    GEMINI_USER_PROMPT = f"""Please write a Gaokao English composition based on the following requirements.

# Target Word Count (CRITICAL)
STRICTLY 80-90 words for the body text. Accuracy is mandatory.

# Structure (STRICT 3-PARAGRAPH)
Format exactly in THREE paragraphs, separated by double newlines:
1. Opening (Exactly 1 sentence): Express intent clearly using high-level patterns.
2. Body (2-3 points): Provide specific details and logical depth.
   - Each point must follow the "Point + Specific Detail" principle. 
   - Avoid vague statements (e.g., don't just say "It is good"); follow up with a specific reason, vivid description, or personal experience.
3. Closing (Exactly 1 sentence): Powerful wrap-up statement or summary.
   - Must include a summary and thematic elevation. 
   - Tone should be natural yet powerful, expressing deep feelings, a hope, or a sincere proposal.

# Language Standards
1. Grammar (MUST naturally embed at least 3 of these):
   - Non-finite verbs (V-ing/V-ed as adverbial or attributive)
   - Inversion or Emphasized sentence (It is... that...)
   - Clauses (Relative, Noun, or Adverbial)
2. Vocabulary: Use ~5 B2/C1 level words (e.g., profound, indispensable, demonstrate, strengthen, consistent).

# Input Topic
{chinese_prompt}

# Scaffold Requirements
- {start_instr}
- {end_instr}

# Output Format
【ONLY the 3-paragraph body text. No greeting, no closing, no title, no metadata.】
"""

    print("Calling Gemini-3-pro...")
    model = "gemini-3-pro-preview"
    content = call_gemini(GEMINI_API_KEY, model, SYSTEM_PROMPT, GEMINI_USER_PROMPT)

    # Save format
    region_str = topic_data['region'] if isinstance(topic_data['region'], str) else topic_data['region'][0]
    filename = f"小作文_gemini_{topic_data['year']}{region_str}.txt"
    filepath = os.path.join('/Users/yeatom/VSCodeProjects/gaokao/past-papers/English/scripts/', filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(f"Topic: {chinese_prompt}\n")
        f.write("-" * 30 + "\n")
        f.write(content)
    
    print(f"Result saved to {filename}")

if __name__ == "__main__":
    import sys
    year = int(sys.argv[1]) if len(sys.argv) > 1 else 2025
    region = sys.argv[2] if len(sys.argv) > 2 else "全国Ⅰ卷"
    
    if GEMINI_API_KEY:
        topic = get_target_topic(year, region)
        if topic:
            generate(topic)
        else:
            print(f"Topic for {year} {region} not found in small_compositions.json")
    else:
        print("GEMINI_API_KEY not found.")
