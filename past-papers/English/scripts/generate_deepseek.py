
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

DEEPSEEK_API_KEY = keys.get('DEEPSEEKER_API_KEY')
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
    chinese_topic = topic_data["prompt"]
    scaffold = topic_data.get("scaffold", {})
    start_text = scaffold.get("start", "")
    end_text = scaffold.get("end", "")
    
    start_instr = f"开头必须接续: \"{start_text}\"" if start_text else "请按情境拟定合适开头。"
    end_instr = f"结尾必须接续: \"{end_text}\"" if end_text else "请按情境拟定合适落款。"

    DEEPSEEK_USER_PROMPT = f"""请根据以下要求写一篇高考英语作文。

# 字数要求 (极其重要)
必须严格控制在 80-90 词之间（正文总字数）。

# 结构要求 (必须严格三段式)
强制分为三个段落，段落间空一行：
1. 第一段 (仅 1 句): 开门见山，使用高级句式。
2. 第二段 (2-3 个要点): 提供具体细节。
   - 每个要点必须遵循“要点 + 具体细节”原则。
   - 拒绝空泛陈述（例如：不要只说 "It is good"），必须跟上 1 个具体原因、生动描述或个人经历细节。
3. 第三段 (仅 1 句): 总结并升华主题。
   - 必须包含“总结全文”和“主题升华”。
   - 语气要自然且有力，通过表达深层感受、提出希望或发出真诚倡议来结尾。

# 语言标准
1. 语法要求 (必须自然嵌入至少 3 种):
   - 非谓语动词（V-ing/V-ed 作状语或定语）
   - 倒装句或强调句
   - 定语从句/名词性从句/状语从句
2. 词汇升级: 使用 5 个左右的 B2/C1 级别高阶词汇（如：profound, indispensable, demonstrate, strengthen, consistent）。

# 题目内容
{chinese_topic}

# 续写要求 (Scaffold)
- {start_instr}
- {end_instr}

# 输出格式
【仅输出作文的 3 段正文。不要输出问候语、落款或其他任何解释性文字。】
"""

    print("Calling DeepSeek-R1...")
    content = call_openai_style("https://api.deepseek.com/v1/chat/completions", DEEPSEEK_API_KEY, "deepseek-reasoner", SYSTEM_PROMPT, DEEPSEEK_USER_PROMPT)

    region_str = topic_data['region'] if isinstance(topic_data['region'], str) else topic_data['region'][0]
    filename = f"小作文_deepseek_{topic_data['year']}{region_str}.txt"
    filepath = os.path.join('/Users/yeatom/VSCodeProjects/gaokao/past-papers/English/scripts/', filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(f"要求: {chinese_topic}\n")
        f.write("-" * 30 + "\n")
        f.write(content)
    
    print(f"Result saved to {filename}")

if __name__ == "__main__":
    import sys
    year = int(sys.argv[1]) if len(sys.argv) > 1 else 2025
    region = sys.argv[2] if len(sys.argv) > 2 else "全国Ⅰ卷"

    if DEEPSEEK_API_KEY:
        topic = get_target_topic(year, region)
        if topic:
            generate(topic)
        else:
            print(f"Topic for {year} {region} not found in small_compositions.json")
    else:
        print("DEEPSEEKER_API_KEY not found.")
