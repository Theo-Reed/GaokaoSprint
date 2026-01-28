import os
import json
import base64
import re
import time
from typing import List, Dict
import google.generativeai as genai
from pypdf import PdfReader, PdfWriter

# Configuration
def load_api_key():
    key = os.getenv("GEMINI_API_KEY")
    if key:
        return key
    env_paths = [".env", "next-app/.env", "../../.env", "../../../.env"]
    for path in env_paths:
        abs_path = os.path.join(os.path.dirname(__file__), path)
        if os.path.exists(abs_path):
            with open(abs_path, "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        return line.split("=")[1].strip()
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        return line.split("=")[1].strip()
    return None

GEMINI_API_KEY = load_api_key()
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables or .env")

genai.configure(api_key=GEMINI_API_KEY)

# Using gemini-2.5-pro as requested
MODEL_NAME = 'gemini-2.5-pro' 
model = genai.GenerativeModel(MODEL_NAME)

SYSTEM_PROMPT = """你是一个高水平数学专家和JSON数据提取器。你的任务是从高考数学试卷的前半部分（选择题和填空题）提取题目。

输出必须是一个JSON列表，每个题目必须包含以下字段：
1. "question_number": 字符串，题目在卷面上的原始题号（如 "1", "9", "13"）
2. "type": 字符串，必须是 "single_choice"（单选题）, "multi_choice"（多选题）, 或 "fill_in"（填空题）
3. "type_rank": 数字，在该题型中的序号（例如：第9题是第1道多选题，则 type_rank 为 1）
4. "category": 字符串，必须从以下分类中精准选择：
   - "logic": 集合与逻辑
   - "complex": 复数专题
   - "function": 函数专题（性质、周期性、奇偶性、对称性、基本初等函数）
   - "derivative": 导数专题（切线、极大极小值、单调性）
   - "trigo_func": 三角函数（图象变换、周期、频率、诱导公式）
   - "trigo_sol": 解三角形（正余弦定理、面积）
   - "sequence": 数列专题
   - "vector": 向量专题
   - "inequality": 不等式专题
   - "line_circle": 直线与圆
   - "conic": 圆锥曲线专题（椭圆、双曲线、抛物线）
   - "solid_geometry": 立体几何
   - "probability": 概率统计
5. "content": 题干正文。使用 LaTeX 格式书写数学公式，并用 $ $ 包围。换行符使用 \\n。
6. "options": 如果是选择题，提供列表 [{"label": "A", "text": "..."}, {"label": "B", "text": "..."}, ...]。如果是填空题，此字段为 null。
7. "answer": 选择题为字符串（如 "A"）或多选题数组（如 ["A", "C"]）。填空题为正确答案内容。
8. "explanation": 字符串。提供详细的解题过程、思路和相关的数学公式。
9. "score_rule": 字符串，该题的分值规则（例如："每小题5分，全部选对得5分，部分选对得2分"）。
10. "has_figure": 布尔值，如果题目中包含“如图”、“图中”或者必须看图才能解题，设为 true。

重要提取逻辑：
- 识别指导语：寻找“只有一项符合要求”判断为单选，寻找“有多项符合要求”判断为多选。
- 严禁提取解答题（通常17题及以后）。
- 严禁提取“程序框图”或“程序算法”类题目（新高考已不再考察）。
- 插图判断（has_figure）：必须严谨。题干中出现“如图”、“如图所示”、“图中”等关键词，或者题目涉及几何图形且不看图无法解题时，必须设为 true。
- 分类准则：
  - 如果题目考察正余弦定理或三角形面积，归类为 trigo_sol（解三角形）。
  - 如果题目考察 $\\sin$ 或 $\\cos$ 函数本身的性质（周期、图象），归类为 trigo_func（三角函数）。
  - 如果涉及导数符号 $f'(x)$ 或切线，归类为 derivative。
- 格式细节：
  - 题目末尾表示选择或填空的括号，如果是空心括号，请输出为 $(\\quad)$（注意 quad 在美元符号内）。
- 确保输出是合法的JSON。
"""

def get_dynamic_truncation_page(pdf_path):
    """Find the page where '解答题' or '三、' starts."""
    try:
        reader = PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if "解答题" in text or "三、" in text:
                return i + 1 # Include this page just in case fill-in-the-blanks are there
        return 3 # Fallback
    except Exception as e:
        print(f"Error scanning PDF {pdf_path}: {e}")
        return 3

def truncate_pdf(input_path, output_path):
    """Keep only the first few pages containing small questions."""
    reader = PdfReader(input_path)
    writer = PdfWriter()
    
    end_page = get_dynamic_truncation_page(input_path)
    print(f"Truncating {input_path} up to page {end_page}")
    
    for i in range(0, min(end_page, len(reader.pages))):
        writer.add_page(reader.pages[i])
        
    with open(output_path, "wb") as f:
        writer.write(f)

def fix_json_formatting(text):
    """Basic fix for LaTeX backslashes in JSON strings."""
    # This is a very simple fix. Gemini usually returns good JSON now.
    # But let's handle the most common issue: single backslashes in strings.
    # We want to replace \ (not followed by n, r, t, b, f, u, ", \) with \\
    def escape_latex(match):
        s = match.group(1)
        # Avoid double-escaping already escaped stuff
        s = s.replace('\\', '\\\\')
        s = s.replace('\\\\n', '\\n').replace('\\\\"', '\\"')
        return f'"{s}"'
    
    # Very crude regex for finding string values
    return re.sub(r'":\s*"(.*?)"(?=[\s,}]|$)', lambda m: f'": {escape_latex(m)}', text, flags=re.DOTALL)

def process_paper(pdf_path, source_name):
    temp_pdf = "temp_small_questions.pdf"
    truncate_pdf(pdf_path, temp_pdf)
    
    try:
        # Upload
        myfile = genai.upload_file(temp_pdf)
        print(f"Uploaded {pdf_path} to Gemini...")
        
        # Thinking/Processing
        prompt = f"请从这份试卷中提取所有选择题和填空题。试卷全称是：{source_name}"
        
        response = model.generate_content(
            [SYSTEM_PROMPT, prompt, myfile],
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Basic cleanup of response
        json_text = response.text.strip()
        if json_text.startswith("```json"):
            json_text = json_text[7:-3].strip()
        
        # Sometimes there's extra text
        questions = json.loads(json_text)

        # Inject local fields
        for q in questions:
            q["source"] = source_name
            q["id"] = f"{source_name}-{q['question_number']}".replace(" ", "")
        
        # Cleanup file
        genai.delete_file(myfile.name)
        if os.path.exists(temp_pdf):
            os.remove(temp_pdf)
            
        return questions
    except Exception as e:
        print(f"Error processing {source_name}: {e}")
        return None

def merge_questions(new_questions, target_file):
    if not new_questions:
        return
    
    existing_data = []
    if os.path.exists(target_file):
        with open(target_file, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
    
    existing_ids = {q["id"] for q in existing_data}
    added_count = 0
    
    for q in new_questions:
        if q["id"] not in existing_ids:
            existing_data.append(q)
            added_count += 1
            if q.get("has_figure"):
                print(f"  [!] 需要截图: {q['id']} - {q['source']} 第 {q['question_number']} 题")
            
    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully added {added_count} questions to {target_file}")

if __name__ == "__main__":
    target_json = "/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/math/small_questions.json"
    
    tasks = [
        # 2016 Random
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（理）（新课标Ⅰ）（解析卷）.pdf", "2016年高考数学试卷（理）（新课标Ⅰ）")
    ]
    
    for pdf_path, source in tasks:
        if os.path.exists(pdf_path):
            print(f"\nProcessing {source}...")
            qs = process_paper(pdf_path, source)
            merge_questions(qs, target_json)
        else:
            print(f"File not found: {pdf_path}")
