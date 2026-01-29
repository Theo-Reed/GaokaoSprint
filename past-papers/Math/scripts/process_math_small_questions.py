import os
import json
import base64
import re
import time
from typing import List, Dict
import google.generativeai as genai
import docx

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

SYSTEM_PROMPT = """你是一个高水平数学专家和JSON数据提取器。你的任务是从高考数学试卷（Word文档内容）中完整提取所有选择题和填空题。

输出必须是一个JSON列表，每个题目必须包含：
1. "question_number": 字符串（如 "1", "13"）
2. "type": "single_choice", "multi_choice" (仅新高考), 或 "fill_in"
3. "type_rank": 数字（该题型中的序号）
4. "category": 选择：logic, complex, function, derivative, trigo_func, trigo_sol, sequence, vector, inequality, line_circle, conic, solid_geometry, probability
5. "content": 题干 (LaTeX数学公式用$ $包裹)
6. "options": 选择题用[{"label":"A","text":"..."}], 填空为null
7. "score_rule": 分值说明

重要约束：
- **完整性**：必须根据文本内容，完整提取所有的小题（单选题、多选题、填空题）。
- **严禁**：严谨提取“解答题”。
- **跳过提取**：“程序框图”或“算法”类的选择题要跳过提取，下一道题的type_rank和question_number都相应+1。
- **LaTeX 转义**：JSON 字符串中的所有反斜杠必须双重转义。例如：写成 "\\\\sin x" 而不是 "\\sin x"。
- **数学公式**：确保所有数学符号都在 $ $ 内部并使用标准的 LaTeX。"""

def read_word_file(file_path):
    """Read .docx or .doc (via textutil conversion) and return text."""
    if file_path.endswith('.doc'):
        # Convert .doc to .docx using textutil on macOS
        docx_path = file_path + "x"
        if not os.path.exists(docx_path):
            print(f"Converting {file_path} to docx...")
            os.system(f'textutil -convert docx "{file_path}"')
        file_path = docx_path
    
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            # Skip reading after "解答题" to save tokens and focus on small questions
            if "解答题" in para.text:
                full_text.append(para.text)
                break
            full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        print(f"Error reading Word file {file_path}: {e}")
        return ""

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
        # 1. Replace single newlines with space to merge fragmented lines from PDF
        # We also look for cases where a newline is preceded by math symbols that shouldn't be split
        content = text.replace('\r', '')
        text = re.sub(r'(?<!\n)\n(?!\n)', ' ', content).strip()
        
        # 2. Fix common math shorthand missing backslash
        symbols = [
            'pi', 'sqrt', 'omega', 'alpha', 'beta', 'gamma', 'delta', 'theta', 'phi', 
            'sin', 'cos', 'tan', 'log', 'ln', 'sigma', 'lambda', 'mu'
        ]
        for sym in symbols:
            # Match word boundary, ensuring no backslash already exists
            text = re.sub(r'(?<!\\)\b' + sym + r'\b', r'\\' + sym + ' ', text)
        
        # 3. Handle sqrtN -> \sqrt{N}
        text = re.sub(r'\\sqrt\s*(\d+)', r'\\sqrt{\1}', text)
        
        # 4. Wrap math symbols in $ if they are not already (conservative)
        if any('\\' + sym in text for sym in symbols) and '$' not in text:
            text = f"${text}$"
        
        # Clean up double dollars and excess spaces
        text = text.replace('$$', '$').replace('  ', ' ')
        return text.strip()

    for q in questions:
        if "content" in q:
            q["content"] = fix_text(q["content"])
        
        if "options" in q and isinstance(q["options"], list):
            for opt in q["options"]:
                if isinstance(opt, dict) and "text" in opt:
                    opt["text"] = fix_text(opt["text"])
    return questions

def process_paper(file_path, source_name):
    try:
        full_text = read_word_file(file_path)
        if not full_text:
            print(f"No text extracted from {source_name}")
            return None
            
        print(f"Extracted {len(full_text)} characters from {source_name}")
        
        # Build prompt
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
    base_dir = "/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math"
    
    # 核心提取任务列表 (对应 Word 文件名，不带后缀)
    task_names = [
        # 2025
        "2025年高考数学试卷（全国Ⅰ卷）（空白卷）",
        "2025年高考数学试卷（全国Ⅱ卷）（空白卷）",
        # 2024
        "2024年高考数学试卷（文）（全国甲卷）（空白卷）",
        "2024年高考数学试卷（理）（全国甲卷）（空白卷）",
        "2024年高考数学试卷（新课标Ⅰ卷）（空白卷）",
        "2024年高考数学试卷（新课标Ⅱ卷）（空白卷）",
        # 2023
        "2023年高考数学试卷（文）（全国甲卷）（空白卷）",
        "2023年高考数学试卷（文）（全国乙卷）（空白卷）",
        "2023年高考数学试卷（理）（全国甲卷）（空白卷）",
        "2023年高考数学试卷（理）（全国乙卷）（空白卷）",
        "2023年高考数学试卷（新课标Ⅰ卷）（空白卷）",
        "2023年高考数学试卷（新课标Ⅱ卷）（空白卷）",
        # 2022
        "2022年高考数学试卷（文）（全国甲卷）（空白卷）",
        "2022年高考数学试卷（文）（全国乙卷）（空白卷）",
        "2022年高考数学试卷（理）（全国甲卷）（空白卷）",
        "2022年高考数学试卷（理）（全国乙卷）（空白卷）",
        "2022年高考数学试卷（新高考Ⅰ卷）（空白卷）",
        "2022年高考数学试卷（新高考Ⅱ卷）（空白卷）",
        # 2021
        "2021年高考数学试卷（文）（全国乙卷）（新课标Ⅰ）（空白卷）",
        "2021年高考数学试卷（文）（全国甲卷）（空白卷）",
        "2021年高考数学试卷（新高考Ⅰ卷）（空白卷）",
        "2021年高考数学试卷（新高考Ⅱ卷）（空白卷）",
        "2021年高考数学试卷（理）（全国乙卷）（新课标Ⅰ）（空白卷）",
        "2021年高考数学试卷（理）（全国甲卷）（空白卷）",
        # 2020
        "2020年高考数学试卷（文）（新课标Ⅰ）（空白卷）",
        "2020年高考数学试卷（文）（新课标Ⅱ）（空白卷）",
        "2020年高考数学试卷（文）（新课标Ⅲ）（空白卷）",
        "2020年高考数学试卷（新高考Ⅰ卷）（山东）（空白卷）",
        "2020年高考数学试卷（新高考Ⅱ卷）（海南）（空白卷）",
        "2020年高考数学试卷（理）（新课标Ⅰ）（空白卷）",
        "2020年高考数学试卷（理）（新课标Ⅱ）（空白卷）",
        "2020年高考数学试卷（理）（新课标Ⅲ）（空白卷）",
    ]
    
    for task_name in task_names:
        # 生成 source 名称 (去掉 "（空白卷）" 使标签更美观)
        source_name = task_name.replace("（空白卷）", "")
        
        # 优先尝试 .docx，其次尝试 .doc
        found_path = None
        for ext in ['.docx', '.doc']:
            path = os.path.join(base_dir, task_name + ext)
            if os.path.exists(path):
                found_path = path
                break
        
        if found_path:
            print(f"\nProcessing {source_name} via {found_path}...")
            qs = process_paper(found_path, source_name)
            if qs:
                merge_questions(qs, target_json)
            # 稍微停顿，避免触发 API 限制
            time.sleep(5)
        else:
            print(f"File not found for task: {task_name}")
