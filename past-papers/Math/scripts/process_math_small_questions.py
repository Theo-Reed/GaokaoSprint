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

SYSTEM_PROMPT = """你是一个高水平数学专家和JSON数据提取器。你的任务是从高考数学试卷中完整提取所有选择题和填空题。

输出必须是一个JSON列表，每个题目必须包含：
1. "question_number": 字符串（如 "1", "13"）
2. "type": "single_choice", "multi_choice" (仅新高考), 或 "fill_in"
3. "type_rank": 数字（该题型中的序号）
4. "category": 选择：logic, complex, function, derivative, trigo_func, trigo_sol, sequence, vector, inequality, line_circle, conic, solid_geometry, probability
5. "content": 题干 (LaTeX数学公式用$ $包裹)
6. "options": 选择题用[{"label":"A","text":"..."}], 填空为null
7. "score_rule": 分值说明

重要约束：
- **完整性**：必须根据试卷正文内容，完整提取所有的小题（单选题、多选题、填空题）。
- **严重禁止**：提取任何答案、解析或解题思路。不要包含 "answer" 或 "explanation" 字段。
- **严禁**：提取“解答题”，严禁提取“程序框图”或“算法”类题目。
- **LaTeX 转义**：JSON 字符串中的所有反斜杠必须双重转义。例如：写成 "\\\\sin x" 而不是 "\\sin x"。
- **数学公式**：确保所有数学符号都在 $ $ 内部并使用标准的 LaTeX。"""

def get_dynamic_truncation_page(pdf_path):
    """Find the page where big questions ('解答题') start."""
    try:
        reader = PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            # "解答题" is the safest marker. We want everything BEFORE this page and INCLUDING this page
            # because fill-in-the-blanks might be on the same page.
            if "解答题" in text:
                return i + 1
        return 6 # Fallback
    except Exception as e:
        print(f"Error scanning PDF {pdf_path}: {e}")
        return 6

def truncate_pdf(input_path, output_path):
    """Keep only the first few pages containing small questions."""
    reader = PdfReader(input_path)
    writer = PdfWriter()
    
    end_page = get_dynamic_truncation_page(input_path)
    # Ensure we at least take 2 pages if it's too small
    if end_page < 2:
        end_page = 4
        
    print(f"Truncating {input_path} up to page {end_page}")
    
    for i in range(0, min(end_page, len(reader.pages))):
        writer.add_page(reader.pages[i])
        
    with open(output_path, "wb") as f:
        writer.write(f)

def clean_json_text(text):
    """Attempt to fix common JSON issues from LLM LaTeX output."""
    # 1. Remove markdown code blocks if present
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:-3].strip()
    elif text.startswith("```"):
        text = text[3:-3].strip()
        
    # 2. Fix unescaped backslashes in LaTeX
    # If the LLM returns \sin (invalid JSON), we want \\sin.
    # If it returns \\sin (valid JSON), we want to leave it alone.
    # We use a lambda to avoid backslash confusion in re.sub replacement strings.
    fixed = re.sub(r'\\(?![\\/bfnrtu])', lambda m: r'\\', text)
    
    # 3. Handle literal newlines that might be inside JSON strings from LLM
    # We don't want to replace ALL newlines (because the JSON structure needs them)
    # but we want to avoid newlines within the "content" or "text" values.
    # However, it's safer to do this AFTER parsing if possible, or very carefully here.
    # Let's try to just clean the text field slightly if it's obviously broken.
    
    return fixed

def clean_question_content(questions):
    """Post-process questions to remove accidental newlines in content and fix math shorthand."""
    if not questions: return questions
    
    def fix_text(text):
        if not isinstance(text, str): return text
        # 1. Replace single newlines with space, but keep double newlines (paragraphs)
        content = text.replace('\r', '')
        text = re.sub(r'(?<!\n)\n(?!\n)', ' ', content).strip()
        
        # 2. Fix common math shorthand missing backslash/wrap
        # Use simple lookbehind logic to fix pi/sqrt whether logic thinks it's latex or not
        text = re.sub(r'(?<!\\)\bpi\b', r'\\pi', text)
        text = re.sub(r'(?<!\\)\bsqrt', r'\\sqrt', text)
        
        # Clean up double dollars
        return text.replace('$$', '$')

    for q in questions:
        if "content" in q:
            q["content"] = fix_text(q["content"])
        
        if "options" in q and isinstance(q["options"], list):
            for opt in q["options"]:
                if isinstance(opt, dict) and "text" in opt:
                    opt["text"] = fix_text(opt["text"])
    return questions

def process_paper(pdf_path, source_name):
    try:
        reader = PdfReader(pdf_path)
        end_page = get_dynamic_truncation_page(pdf_path)
        if end_page < 2: end_page = 5
        
        full_text = ""
        for i in range(min(end_page, len(reader.pages))):
            full_text += f"\n--- Page {i+1} ---\n"
            full_text += reader.pages[i].extract_text()
            
        print(f"Extracted {len(full_text)} characters from {source_name}")
        
        # Build prompt - removed hardcoded 1-16 range
        prompt = f"以下是从《{source_name}》中提取的文本。请从中完整提取所有的选择题和填空题。\n请注意：不要提供参考答案（answer）和解析（explanation）。\n\n{full_text}"
        
        max_retries = 5
        questions = None
        for attempt in range(max_retries):
            try:
                response = model.generate_content(
                    [SYSTEM_PROMPT, prompt],
                    generation_config={"response_mime_type": "application/json"}
                )
                
                raw_text = response.text.strip()
                cleaned_text = clean_json_text(raw_text)
                
                try:
                    questions = json.loads(cleaned_text)
                except json.JSONDecodeError as je:
                    print(f"  JSON parse failed on attempt {attempt+1}: {je}")
                    # Try a more aggressive fix if the regex failed
                    try:
                        # Replace all backslashes that are not escaping common characters
                        fixed = re.sub(r'\\(?![\\/bfnrtu"])', r'\\\\', raw_text)
                        questions = json.loads(clean_json_text(fixed))
                    except:
                        raise je
                
                if questions and len(questions) >= 8:
                    # CLEAN CONTENT NEWLINES
                    questions = clean_question_content(questions)
                    break
                else:
                    print(f"  Attempt {attempt+1} got only {len(questions) if questions else 0} questions, retrying...")
                    time.sleep(3)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                print(f"  Generation attempt {attempt+1} failed ({e}), retrying...")
                time.sleep(3)

        if questions:
            ordered_questions = []
            for q in questions:
                # 1. Generate ID
                q_id = f"{source_name}-{q['question_number']}".replace(" ", "")
                
                # 2. Create ordered dictionary with 'id' first
                new_q = {"id": q_id}
                
                # 3. Add other fields in order (and skip unwanted ones)
                # Define preferred order for readability
                preferred_order = ["question_number", "type", "type_rank", "category", "content", "options", "score_rule"]
                
                for key in preferred_order:
                    if key in q:
                        new_q[key] = q[key]
                
                # Add any remaining fields that weren't in preferred_order (except forbidden ones)
                for k, v in q.items():
                    if k not in preferred_order and k not in ["id", "answer", "explanation"] and k != "source":
                        new_q[k] = v
                        
                # 4. Add source at the end
                new_q["source"] = source_name
                
                ordered_questions.append(new_q)
            
            return ordered_questions
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
    
    # Map to track existing questions by ID for upsert
    existing_map = {q["id"]: i for i, q in enumerate(existing_data)}
    added_count = 0
    updated_count = 0
    
    for q in new_questions:
        if q["id"] in existing_map:
            # Update existing question
            idx = existing_map[q["id"]]
            # Preserving existing answer if LLM didn't provide it (which it shouldn't)
            existing_ans = existing_data[idx].get("answer")
            existing_data[idx] = q
            if existing_ans:
                existing_data[idx]["answer"] = existing_ans
            updated_count += 1
        else:
            # Add new question
            existing_data.append(q)
            existing_map[q["id"]] = len(existing_data) - 1
            added_count += 1
            
    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully added {added_count} and updated {updated_count} questions in {target_file}")

if __name__ == "__main__":
    target_json = "/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/math/small_questions.json"
    
    # Process one by one to avoid large simultaneous overhead
    tasks = [
        # 2021
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（文）（全国乙卷）（新课标Ⅰ）（空白卷）.pdf", "2021年高考数学试卷（文）（全国乙卷）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（文）（全国甲卷）（空白卷）.pdf", "2021年高考数学试卷（文）（全国甲卷）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（新高考Ⅰ卷）（空白卷）.pdf", "2021年高考数学试卷（新高考Ⅰ卷）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（新高考Ⅱ卷）（空白卷）.pdf", "2021年高考数学试卷（新高考Ⅱ卷）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（理）（全国乙卷）（新课标Ⅰ）（空白卷）.pdf", "2021年高考数学试卷（理）（全国乙卷）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（理）（全国甲卷）（空白卷）.pdf", "2021年高考数学试卷（理）（全国甲卷）"),
        # 2020
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（文）（新课标Ⅰ）（空白卷）.pdf", "2020年高考数学试卷（文）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（文）（新课标Ⅱ）（空白卷）.pdf", "2020年高考数学试卷（文）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（文）（新课标Ⅲ）（空白卷）.pdf", "2020年高考数学试卷（文）（新课标Ⅲ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（新高考Ⅰ卷）（山东）（空白卷）.pdf", "2020年高考数学试卷（新高考Ⅰ卷）（山东）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（新高考Ⅱ卷）（海南）（空白卷）.pdf", "2020年高考数学试卷（新高考Ⅱ卷）（海南）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（理）（新课标Ⅰ）（空白卷）.pdf", "2020年高考数学试卷（理）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（理）（新课标Ⅱ）（空白卷）.pdf", "2020年高考数学试卷（理）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（理）（新课标Ⅲ）（空白卷）.pdf", "2020年高考数学试卷（理）（新课标Ⅲ）"),
        # 2019
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（文）（新课标Ⅰ）（空白卷）.pdf", "2019年高考数学试卷（文）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（文）（新课标Ⅱ）（空白卷）.pdf", "2019年高考数学试卷（文）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（文）（新课标Ⅲ）（空白卷）.pdf", "2019年高考数学试卷（文）（新课标Ⅲ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（理）（新课标Ⅰ）（空白卷）.pdf", "2019年高考数学试卷（理）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（理）（新课标Ⅱ）（空白卷）.pdf", "2019年高考数学试卷（理）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（理）（新课标Ⅲ）（空白卷）.pdf", "2019年高考数学试卷（理）（新课标Ⅲ）"),
        # 2018
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（文）（新课标Ⅰ）（空白卷）.pdf", "2018年高考数学试卷（文）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（文）（新课标Ⅱ）（空白卷）.pdf", "2018年高考数学试卷（文）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（文）（新课标Ⅲ）（空白卷）.pdf", "2018年高考数学试卷（文）（新课标Ⅲ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（理）（新课标Ⅰ）（空白卷）.pdf", "2018年高考数学试卷（理）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（理）（新课标Ⅱ）（空白卷）.pdf", "2018年高考数学试卷（理）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（理）（新课标Ⅲ）（空白卷）.pdf", "2018年高考数学试卷（理）（新课标Ⅲ）"),
        # 2017
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（文）（新课标Ⅰ）（空白卷）.pdf", "2017年高考数学试卷（文）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（文）（新课标Ⅱ）（空白卷）.pdf", "2017年高考数学试卷（文）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（文）（新课标Ⅲ）（空白卷）.pdf", "2017年高考数学试卷（文）（新课标Ⅲ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（理）（新课标Ⅰ）（空白卷）.pdf", "2017年高考数学试卷（理）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（理）（新课标Ⅱ）（空白卷）.pdf", "2017年高考数学试卷（理）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（理）（新课标Ⅲ）（空白卷）.pdf", "2017年高考数学试卷（理）（新课标Ⅲ）"),
        # 2016
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（文）（新课标Ⅰ）（空白卷）.pdf", "2016年高考数学试卷（文）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（文）（新课标Ⅱ）（空白卷）.pdf", "2016年高考数学试卷（文）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（文）（新课标Ⅲ）（空白卷）.pdf", "2016年高考数学试卷（文）（新课标Ⅲ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（理）（新课标Ⅰ）（空白卷）.pdf", "2016年高考数学试卷（理）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（理）（新课标Ⅱ）（空白卷）.pdf", "2016年高考数学试卷（理）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（理）（新课标Ⅲ）（空白卷）.pdf", "2016年高考数学试卷（理）（新课标Ⅲ）"),
    ]
    
    for pdf_path, source in tasks:
        if os.path.exists(pdf_path):
            print(f"\nProcessing {source}...")
            # We already have some questions, merge_questions handles duplicates
            qs = process_paper(pdf_path, source)
            if qs:
                merge_questions(qs, target_json)
            # Small delay between papers to keep API happy
            time.sleep(5)
        else:
            print(f"File not found: {pdf_path}")
