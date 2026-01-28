
import os
import json
import base64
import time
import re
import requests
from pypdf import PdfReader, PdfWriter

# 1. Setup Environment
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), '.env')
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
    # Try getting it from os.environ
    API_KEY = os.environ.get('GEMINI_API_KEY')
    if not API_KEY:
         print("Error: GEMINI_API_KEY not found in environment either.")
         exit(1)

# 2. Config
MODEL_NAME = 'gemini-2.5-flash'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
# Point to the root Math directory to find all year folders
MATH_PAPERS_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)))

# 3. Prompt
SYSTEM_PROMPT = """
你是一个高考数学试卷数字化专家。你的任务是从上传的 PDF 试卷中提取所有的“解答题”（通常是大题，分值较高，需要写出过程的题目，往往从第15题或17题开始）。

请识别每一道解答题，并通过 JSON 格式返回。
返回格式要求：
一个 JSON 列表，每个元素包含：
- `question_number`: 题号 (例如 "15", "16", "17")
- `large_question_rank`: 这是第几道大题 (例如 "1", "2", "3", "4", "5")。请根据这些大题在试卷中出现的先后顺序来判定。
- `category`: 题目类型，必须是以下之一：[圆锥曲线, 导数, 立体几何, 三角函数, 数列, 概率, 其他]
- `content`: 题目的完整文本内容。数学公式请使用 LaTeX 格式。
  **重要警告：在 JSON 字符串中，LaTeX 的反斜杠必须转义！** 
  例如：不要写 `\frac{1}{2}`，而要写 `\\frac{1}{2}`。不要写 `\alpha`，要写 `\\alpha`。
  一定要保持原题的完整性，包括题干和所有的小问。
- `score`: 该题分值（如果能识别到）。
- `thought_process`: (新增) 针对这道题，给出简要的解题思路提示（不要直接给答案，而是给切入点，例如“先利用正弦定理化简...”, “联立直线与椭圆方程...”）。
- `source`: 试卷来源（这一点请根据试卷标题填写，例如“2024全国甲卷”）。

请忽略选择题和填空题。
确保返回的是纯 JSON 数组，不要用 markdown 包裹。
"""

CATEGORY_MAP = {
    '圆锥曲线': 'conic',
    '导数': 'derivative',
    '立体几何': 'solid_geometry',
    '三角函数': 'trigonometry',
    '数列': 'sequence',
    '概率': 'probability',
    '概率统计': 'probability',
    '其他': 'other'
}

def clean_json_string(text):
    """尝试修复常见的 JSON LaTeX 转义错误"""
    # 1. 移除 Markdown 代码块标记
    text = text.replace('```json', '').replace('```', '').strip()
    return text

def find_answer_section_start(pdf_path):
    """查找'解答题'开始的页码（1-based）"""
    try:
        reader = PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if not text:
                continue
            if re.search(r'[三四五]、\s*解答题', text):
                return i + 1
        return min(3, len(reader.pages))
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
        return 2

def split_math_pdf(input_path):
    """寻找'解答题'关键字并截断"""
    try:
        start_page = find_answer_section_start(input_path)
        reader = PdfReader(input_path)
        total_pages = len(reader.pages)
        
        writer = PdfWriter()
        for i in range(start_page - 1, total_pages):
            writer.add_page(reader.pages[i])
        
        temp_path = input_path.replace('.pdf', '_truncated.pdf')
        with open(temp_path, "wb") as f:
            writer.write(f)
        return temp_path, start_page
    except Exception as e:
        print(f"Error splitting PDF {input_path}: {e}")
        return input_path, 1

def call_gemini_with_pdf(api_key, model, prompt, pdf_path, source_name="Unknown"):
    work_path, start_page = split_math_pdf(pdf_path)
    
    print(f"[{source_name}] 从第 {start_page} 页开始截断。")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    if not os.path.exists(work_path):
        print(f"File not found: {work_path}")
        return []

    try:
        with open(work_path, "rb") as pdf_file:
            encoded_pdf = base64.b64encode(pdf_file.read()).decode("utf-8")
    except Exception as e:
        print(f"Error reading PDF {work_path}: {e}")
        return []

    final_prompt = prompt + f"\n\n这就是那份试卷（已截取大题部分），来源是：{source_name}。请根据试卷内容，识别并提取所有的解答题。注意：large_question_rank 应该从1开始计数。"

    payload = {
        "contents": [{
            "parts": [
                {"text": final_prompt},
                {
                    "inline_data": {
                        "mime_type": "application/pdf",
                        "data": encoded_pdf
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.4, 
            "response_mime_type": "application/json"
        }
    }
    
    headers = {"Content-Type": "application/json"}
    
    result_questions = []
    for attempt in range(3):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            if response.status_code != 200:
                print(f"API Error ({response.status_code}): {response.text}")
                response.raise_for_status()
                
            data = response.json()
            
            if 'candidates' in data and len(data['candidates']) > 0:
                text_response = data['candidates'][0]['content']['parts'][0]['text']
                cleaned_text = clean_json_string(text_response)
                try:
                    result_questions = json.loads(cleaned_text)
                    break 
                except json.JSONDecodeError as e:
                    print(f"JSON Parse Error (Position {e.pos}): {e.msg}")
                    # Try a very aggressive fix 
                    print("Trying aggressive regex fix for LaTeX backslashes...")
                    fixed_text = re.sub(r'\\(?![\\/bfnrtu"\'`])', r'\\\\', cleaned_text)
                    try:
                        result_questions = json.loads(fixed_text)
                        print("Aggressive fix Success!")
                        break
                    except json.JSONDecodeError as e2:
                        print(f"Aggressive fix Failed: {e2.msg} at {e2.pos}")
                            
                    time.sleep(2)
                    continue

            else:
                print(f"Warning: No candidates returned for {source_name}")
        except requests.exceptions.RequestException as e:
            if hasattr(e.response, 'status_code') and e.response.status_code == 429:
                print("Rate limit hit. Sleeping for 30s...")
                time.sleep(30)
                continue
            print(f"Request failed: {e}")
            time.sleep(5)
            continue
        except Exception as e:
            print(f"Unexpected error: {e}")
            time.sleep(2)
            continue
    
    if work_path != pdf_path and os.path.exists(work_path):
        os.remove(work_path)
        
    return result_questions

def main():
    final_dest = os.path.join(BASE_DIR, 'next-app/src/data/math/questions.json')
    
    # Load existing questions
    if os.path.exists(final_dest):
        with open(final_dest, 'r', encoding='utf-8') as f:
            all_questions = json.load(f)
    else:
        all_questions = []
    
    existing_sources = set(q.get('source', '') for q in all_questions)
    print(f"已存在 {len(all_questions)} 道题，涉及 {len(existing_sources)} 套试卷。")

    # Target Years
    target_years = ['2020', '2021', '2022', '2023', '2024']
    
    tasks = []
    # Scan directories
    for ydir in os.listdir(MATH_PAPERS_ROOT):
        # Match years like "2024·高考数学真题" or just folders starting with the year
        year_match = False
        for y in target_years:
            if y in ydir:
                year_match = True
                break
        
        if year_match and os.path.isdir(os.path.join(MATH_PAPERS_ROOT, ydir)):
            current_year_dir = os.path.join(MATH_PAPERS_ROOT, ydir)
            files = [f for f in os.listdir(current_year_dir) if f.endswith('.pdf') and '空白卷' in f and '_truncated' not in f]
            
            for filename in files:
                name = filename.replace('（空白卷）.pdf', '').replace('.pdf', '')
                # Skip if already processed
                if name in existing_sources or \
                   any(s in name for s in existing_sources if len(s) > 5): # Fuzzy match check
                   pass
                else:
                     tasks.append({
                        'path': os.path.join(current_year_dir, filename),
                        'name': name
                    })

    print(f"--- 阶段 1: 准备处理 {len(tasks)} 套试卷 ---")
    valid_tasks = []
    for task in tasks:
        # Check source again strictly
        if task['name'] in existing_sources:
             print(f"Skip {task['name']}")
             continue
             
        start_page = find_answer_section_start(task['path'])
        print(f"| {task['name']:<50} | 起始页: {start_page}")
        task['start_page'] = start_page
        valid_tasks.append(task)

    print(f"\n检测完毕。即将进入阶段 2: Gemini 提取大题...")
    
    # Process
    for i, task in enumerate(valid_tasks):
        print(f"Playing [{i+1}/{len(valid_tasks)}]: {task['name']}")
        questions = call_gemini_with_pdf(API_KEY, MODEL_NAME, SYSTEM_PROMPT, task['path'], task['name'])
        
        if questions:
            print(f"> {task['name']}，提取了 {len(questions)} 道题。")
            for q in questions:
                cat = q.get('category', '其他')
                q['category'] = CATEGORY_MAP.get(cat, 'other')
                q['source'] = task['name']
                all_questions.append(q)
            
            # Save progressively
            with open(final_dest, 'w', encoding='utf-8') as f:
                json.dump(all_questions, f, ensure_ascii=False, indent=2)
        else:
            print(f"X {task['name']} 提取失败。")
        
        # Sleep to be nice to the API
        time.sleep(5)

    print(f"\n全部任务完成。当前总题目数: {len(all_questions)}")

if __name__ == "__main__":
    main()
