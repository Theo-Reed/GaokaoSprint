
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
    API_KEY = os.environ.get('GEMINI_API_KEY')
    if not API_KEY:
         print("Error: GEMINI_API_KEY not found in environment either.")
         exit(1)

# 2. Config
MODEL_NAME = 'gemini-2.5-flash'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
MATH_PAPERS_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)))

# 3. Prompt
SYSTEM_PROMPT = """
你是一个高考数学试卷数字化专家。你的任务是从上传的 PDF 试卷中提取所有的“解答题”。

要求：
1. **题目完整性**：提取每一道大题，题目中包含的所有子问（如 (1), (2), (i), (ii)）必须完整保留。
2. **格式规范**：
   - 数学公式、符号、变量、几何标记（如 △ABC, ∠ADC, 向量, 希腊字母）**必须且只能**使用 LaTeX 格式进行转义，并用单个 `$` 包裹。
   - **换行处理**：在 `content` 内部，每一小问（如 (1), (2)）之前插入换行符 `\\n`。
   - **JSON 转义**：返回的 JSON 中，LaTeX 的反斜杠必须双重转义（即 `\\` 变成 `\\\\`）。
3. **字段定义**：
   - `question_number`: 题号。
   - `large_question_rank`: 第几道大题（从1开始）。
   - `category`: [圆锥曲线, 导数, 立体几何, 三角函数, 数列, 概率, 其他]。
   - `content`: 完整题目文本（包含换行和 LaTeX）。
   - `score`: 分值（若有）。
   - `thought_process`: 简要的解题思路。
   - `source`: 试卷名称。

请忽略选择题和填空题。
确保返回的是纯 JSON 数组。
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
    text = text.replace('```json', '').replace('```', '').strip()
    return text

def find_answer_section_start(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if not text: continue
            if re.search(r'[三四五]、\s*解答题', text): return i + 1
        return min(3, len(reader.pages))
    except Exception as e:
        return 2

def split_math_pdf(input_path):
    try:
        start_page = find_answer_section_start(input_path)
        reader = PdfReader(input_path)
        writer = PdfWriter()
        for i in range(start_page - 1, len(reader.pages)):
            writer.add_page(reader.pages[i])
        temp_path = input_path.replace('.pdf', '_truncated.pdf')
        with open(temp_path, "wb") as f:
            writer.write(f)
        return temp_path, start_page
    except Exception as e:
        return input_path, 1

def call_gemini_with_pdf(api_key, model, prompt, pdf_path, source_name="Unknown"):
    work_path, start_page = split_math_pdf(pdf_path)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    try:
        with open(work_path, "rb") as pdf_file:
            encoded_pdf = base64.b64encode(pdf_file.read()).decode("utf-8")
    except: return []

    final_prompt = prompt + f"\n\n来源是：{source_name}。"

    payload = {
        "contents": [{"parts": [{"text": final_prompt}, {"inline_data": {"mime_type": "application/pdf", "data": encoded_pdf}}]}],
        "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
    }
    
    headers = {"Content-Type": "application/json"}
    result_questions = []
    for attempt in range(3):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            if response.status_code != 200: continue
            text_response = response.json()['candidates'][0]['content']['parts'][0]['text']
            cleaned_text = clean_json_string(text_response)
            try:
                result_questions = json.loads(cleaned_text)
                break 
            except:
                fixed_text = re.sub(r'\\(?![\\/bfnrtu"\'`])', r'\\\\', cleaned_text)
                try:
                    result_questions = json.loads(fixed_text)
                    break
                except: continue
        except: continue
    
    if work_path != pdf_path and os.path.exists(work_path):
        os.remove(work_path)
    return result_questions

def main():
    final_dest = os.path.join(BASE_DIR, 'next-app/src/data/math/questions.json')
    if os.path.exists(final_dest):
        with open(final_dest, 'r', encoding='utf-8') as f: all_questions = json.load(f)
    else: all_questions = []
    
    existing_sources = set(q.get('source', '') for q in all_questions)
    
    # Target range: 2016 - 2019
    target_years = ['2016', '2017', '2018', '2019'] 
    
    tasks = []
    for ydir in os.listdir(MATH_PAPERS_ROOT):
        actual_path = os.path.join(MATH_PAPERS_ROOT, ydir)
        if not os.path.isdir(actual_path): continue
        
        if any(y in ydir for y in target_years):
            files = [f for f in os.listdir(actual_path) if f.endswith('.pdf') and '空白卷' in f and '_truncated' not in f]
            for filename in files:
                name = filename.replace('（空白卷）.pdf', '').replace('.pdf', '')
                if name not in existing_sources:
                    tasks.append({'path': os.path.join(actual_path, filename), 'name': name})

    print(f"--- 阶段 1: 准备处理 {len(tasks)} 套 2016-2019 试卷 ---")

    for i, task in enumerate(tasks):
        print(f"Processing [{i+1}/{len(tasks)}]: {task['name']}")
        questions = call_gemini_with_pdf(API_KEY, MODEL_NAME, SYSTEM_PROMPT, task['path'], task['name'])
        if questions:
            for q in questions:
                cat = q.get('category', '其他')
                q['category'] = CATEGORY_MAP.get(cat, 'other')
                q['source'] = task['name']
                all_questions.append(q)
            
            with open(final_dest, 'w', encoding='utf-8') as f:
                json.dump(all_questions, f, ensure_ascii=False, indent=2)
            print(f"> {task['name']} Done.")
            time.sleep(5)
        else:
            print(f"X {task['name']} Failed.")

    print(f"\n任务完成。")

if __name__ == "__main__":
    main()
