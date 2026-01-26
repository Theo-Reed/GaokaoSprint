
import os
import json
import urllib.request

# Load .env manually
env_path = '/Users/yeatom/VSCodeProjects/gaokao/.env'
keys = {}
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                keys[key] = value

UNIFIED_API_KEY = keys.get('UNIFIED_API_KEY')
SYSTEM_PROMPT = """You are a senior expert in Gaokao English grading with 15 years of experience. You specialize in upgrading student compositions to the highest level (Tier 5, 14-15 points) through detailed expansion and logical depth."""

# Target Data Loading
def get_target_topic(year, region):
    json_path = '/Users/yeatom/VSCodeProjects/gaokao/past-papers/English/scripts/small_compositions.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data:
            regions = item["region"] if isinstance(item["region"], list) else [item["region"]]
            if item["year"] == year and region in regions:
                return item
    return None

def call_openai_style(api_url, api_key, model, system, user):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "temperature": 0.7
    }
    req = urllib.request.Request(api_url, data=json.dumps(payload).encode(), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            data = json.loads(res.read())
            return data['choices'][0]['message']['content'].strip()
    except Exception as e:
        return f"Error ({model}): {str(e)}"

def generate(topic_data):
    chinese_prompt = topic_data["prompt"]
    scaffold = topic_data.get("scaffold", {})
    start_text = scaffold.get("start", "")
    end_text = scaffold.get("end", "")
    start_instr = f"You MUST start exactly with: \"{start_text}\"" if start_text else "Start with an appropriate greeting."
    end_instr = f"You MUST end exactly with: \"{end_text}\"" if end_text else "End with an appropriate closing."

    CLAUDE_USER_PROMPT = f"""Please write a Gaokao English composition based on the following requirements. 

# Target Word Count (CRITICAL)
STRICTLY 80-90 words for the body text. Accuracy is mandatory.

# Structure (STRICT 3-PARAGRAPH)
Format exactly in THREE paragraphs, separated by double newlines:
1. Opening (Exactly 1 sentence): Start with an impactful sentence expressing your choice.
2. Body (2-3 points): Provide specific details and logical depth.
   - Each point must follow the "Point + Specific Detail" principle. 
   - Avoid vague statements (e.g., don't just say "It is good"); follow up with a specific reason, vivid description, or personal experience.
3. Closing (Exactly 1 sentence): Powerful wrap-up statement or summary.
   - Must include a summary and thematic elevation. 
   - Tone should be natural yet powerful, expressing deep feelings, a hope, or a sincere proposal.

# Language Standards
1. Grammar (MUST naturally embed at least 3 of these):
   - Non-finite verbs (V-ing/V-ed)
   - Inversion or Emphasized sentence
   - Clauses (Relative, Noun, or Adverbial)
2. Vocabulary: Use ~5 high-level words (e.g., profound, indispensable, demonstrate, strengthen, consistent).

# Input Topic
{chinese_prompt}

# Scaffold Requirements
- {start_instr}
- {end_instr}

# Output Format
【ONLY the 3-paragraph body text. No greeting, no closing, no title, no metadata.】
"""

    print("Calling Claude 3.7 via Unified API...")
    model = "claude-3-7-sonnet-20250219"
    content = call_openai_style("https://www.yunqiaoai.top/v1/chat/completions", UNIFIED_API_KEY, model, SYSTEM_PROMPT, CLAUDE_USER_PROMPT)

    region_str = topic_data['region'] if isinstance(topic_data['region'], str) else topic_data['region'][0]
    filename = f"小作文_claude_{topic_data['year']}{region_str}.txt"
    filepath = os.path.join('/Users/yeatom/VSCodeProjects/gaokao/past-papers/English/scripts/', filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(f"Prompt: {chinese_prompt}\n")
        f.write("-" * 30 + "\n")
        f.write(content)
    
    print(f"Result saved to {filename}")

if __name__ == "__main__":
    import sys
    year = int(sys.argv[1]) if len(sys.argv) > 1 else 2025
    region = sys.argv[2] if len(sys.argv) > 2 else "全国Ⅰ卷"

    if UNIFIED_API_KEY:
        topic = get_target_topic(year, region)
        if topic:
            generate(topic)
        else:
            print(f"Topic for {year} {region} not found in small_compositions.json")
    else:
        print("UNIFIED_API_KEY not found.")
