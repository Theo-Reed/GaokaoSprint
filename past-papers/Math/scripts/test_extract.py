
import os
import json
import base64
import urllib.request
import urllib.error
import time

# 1. Setup Environment
ENV_PATH = '/Users/yeatom/VSCodeProjects/gaokao/.env'
keys = {}
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, 'r') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                keys[key] = value

API_KEY = keys.get('GEMINI_API_KEY')

if not API_KEY:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

# 2. Config
# Using gemini-2.5-flash as requested.
MODEL_NAME = 'gemini-2.5-flash' 
TARGET_FILE = '/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2024·高考数学真题/2024年高考数学试卷（新课标Ⅰ卷）（空白卷）.pdf'

# 3. Prompt
SYSTEM_PROMPT = """
你是一个高考数学试卷数字化专家。你的任务是从上传的 PDF 试卷中提取所有的“解答题”（通常是大题，分值较高，需要写出过程的题目）。

请识别每一道解答题，并通过 JSON 格式返回。
返回格式要求：
一个 JSON 列表，每个元素包含：
- `question_number`: 题号 (例如 "15", "16", "17")
- `category`: 题目类型，必须是以下之一：[圆锥曲线, 导数, 立体几何, 三角函数, 数列, 概率, 其他]
- `content`: 题目的完整文本内容。数学公式请使用 LaTeX 格式（尽量用 $ 包裹）。
- `score`: 该题分值（如果能识别到）。
- `thought_process`: (新增) 针对这道题，给出简要的解题思路提示（不要直接给答案，而是给切入点，例如“先利用正弦定理化简...”, “联立直线与椭圆方程...”）。这一步非常关键，是用来启发学生的。

请忽略选择题和填空题。
"""

def call_gemini_with_pdf(api_key, model, prompt, pdf_path):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    # Check file size
    if not os.path.exists(pdf_path):
        return f"Error: File not found at {pdf_path}"

    file_size = os.path.getsize(pdf_path)
    print(f"Reading file: {pdf_path} ({file_size/1024:.2f} KB)...")
    
    with open(pdf_path, "rb") as pdf_file:
        encoded_pdf = base64.b64encode(pdf_file.read()).decode("utf-8")

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "application/pdf",
                        "data": encoded_pdf
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.5,
            "response_mime_type": "application/json"
        }
    }
    
    print("Sending request to Gemini...")
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode(), 
        headers={"Content-Type": "application/json"}, 
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            data = json.loads(res.read())
            # Parse response
            if 'candidates' in data and len(data['candidates']) > 0:
                return data['candidates'][0]['content']['parts'][0]['text']
            else:
                return f"Error: No candidates returned. {json.dumps(data)}"
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"HTTP Error {e.code}: {e.reason}")
        print(f"Error Body: {error_body}")
        return f"Error calling API: HTTP {e.code}"
    except Exception as e:
        # Retry logic for IncompleteRead or other transient errors
        print(f"Error {str(e)}, retrying once...")
        time.sleep(2)
        try:
            with urllib.request.urlopen(req, timeout=120) as res:
                data = json.loads(res.read())
                if 'candidates' in data and len(data['candidates']) > 0:
                    return data['candidates'][0]['content']['parts'][0]['text']
        except Exception as retry_e:
             return f"Error calling API: {str(retry_e)}"


if __name__ == "__main__":
    result = call_gemini_with_pdf(API_KEY, MODEL_NAME, SYSTEM_PROMPT, TARGET_FILE)
    
    print("\n=== Extraction Result ===")
    print(result)
    
    # Save to file
    output_file = os.path.join(os.path.dirname(__file__), 'extracted_questions_test.json')
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(result)
        print(f"\nSaved to {output_file}")
    except Exception as e:
        print(f"Failed to save content (might be an error message): {result}")
