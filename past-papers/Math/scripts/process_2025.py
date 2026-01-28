
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
SEARCH_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), '2025·高考数学真题')

# 3. Prompt
SYSTEM_PROMPT = """
你是一个高考数学试卷数字化专家。你的任务是从上传的 PDF 试卷中提取所有的“解答题”（通常是大题，分值较高，需要写出过程的题目，往往从第15题或17题开始）。

请识别每一道解答题，并通过 JSON 格式返回。
返回格式要求：
一个 JSON 列表，每个元素包含：
- `question_number`: 题号 (例如 "15", "16", "17")
- `large_question_rank`: 这是第几道大题 (例如 "1", "2", "3", "4", "5")。请根据这些大题在试卷中出现的先后顺序来判定。
- `category`: 题目类型，必须是以下之一：[圆锥曲线, 导数, 立体几何, 三角函数, 数列, 概率, 其他]
- `content`: 题目的完整文本内容。数学公式请使用 LaTeX 格式（尽量用 $ 包裹）。
- `score`: 该题分值（如果能识别到）。
- `thought_process`: (新增) 针对这道题，给出简要的解题思路提示（不要直接给答案，而是给切入点，例如“先利用正弦定理化简...”, “联立直线与椭圆方程...”）。
- `source`: 试卷来源（这一点请根据试卷标题填写，例如“2025全国甲卷”）。

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
    '概率统计': 'probability', # Handle variation
    '其他': 'other'
}

def find_answer_section_start(pdf_path):
    """查找'解答题'开始的页码（1-based）"""
    try:
        reader = PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if not text:
                continue
            # 匹配 “三、解答题” 或 “四、解答题” 等模式
            if re.search(r'[三四五]、\s*解答题', text):
                return i + 1
        # 如果没搜到，默认返回中间偏后的页码（通常是第2或第3页）
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
        # 从识别到的页码开始，到最后一页
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
    # Use truncated PDF
    work_path, start_page = split_math_pdf(pdf_path)
    
    # 打印题目截断信息
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
            "temperature": 0.5,
            "response_mime_type": "application/json"
        }
    }
    
    headers = {"Content-Type": "application/json"}
    
    result_questions = []
    for attempt in range(3):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
            data = response.json()
            
            if 'candidates' in data and len(data['candidates']) > 0:
                text_response = data['candidates'][0]['content']['parts'][0]['text']
                text_response = text_response.replace('```json', '').replace('```', '').strip()
                result_questions = json.loads(text_response)
                break 
            else:
                print(f"Warning: No candidates returned for {source_name}")
        except requests.exceptions.RequestException as e:
            if hasattr(e.response, 'status_code') and e.response.status_code == 429:
                time.sleep(15)
                continue
            time.sleep(5)
            continue
        except Exception as e:
            time.sleep(2)
            continue
    
    # Clean up temp file
    if work_path != pdf_path and os.path.exists(work_path):
        os.remove(work_path)
        
    return result_questions

def main():
    all_questions = []
    final_dest = os.path.join(BASE_DIR, 'next-app/src/data/math-questions.json')
    
    # 1. 搜集 2025 年全国卷 (只跑 2025)
    year_dirs = [d for d in os.listdir(os.path.dirname(SEARCH_DIR)) if '2025·高考数学真题' in d]
    # year_dirs.sort(reverse=True)
    
    tasks = []
    for ydir in year_dirs:
        current_year_dir = os.path.join(os.path.dirname(SEARCH_DIR), ydir)
        files = [f for f in os.listdir(current_year_dir) if f.endswith('（空白卷）.pdf')]
        for filename in files:
            tasks.append({
                'path': os.path.join(current_year_dir, filename),
                'name': filename.replace('（空白卷）.pdf', '')
            })

    print(f"--- 阶段 1: 截断检测 (确认解答题起始页) ---")
    valid_tasks = []
    for task in tasks:
        start_page = find_answer_section_start(task['path'])
        print(f"| {task['name']:<50} | 起始页: {start_page}")
        task['start_page'] = start_page
        valid_tasks.append(task)

    print(f"\n检测完毕。即将进入阶段 2: Gemini 提取大题...")
    # 提前清空
    with open(final_dest, 'w', encoding='utf-8') as f:
        json.dump([], f)

    for task in valid_tasks:
        # 这里实际上调用了 call_gemini_with_pdf，它内部会再次进行真正的截断文件创建
        questions = call_gemini_with_pdf(API_KEY, MODEL_NAME, SYSTEM_PROMPT, task['path'], task['name'])
        
        if questions:
            print(f"> {task['name']}，跑了 {len(questions)} 道大题。")
            for q in questions:
                cat = q.get('category', '其他')
                q['category'] = CATEGORY_MAP.get(cat, 'other')
                q['source'] = task['name']
                all_questions.append(q)
            
            with open(final_dest, 'w', encoding='utf-8') as f:
                json.dump(all_questions, f, ensure_ascii=False, indent=2)
        else:
            print(f"X {task['name']} 提取失败。")
        
        time.sleep(5)

    print(f"\n全部任务完成。共捕获 {len(all_questions)} 道大题。")


if __name__ == "__main__":
    main()

