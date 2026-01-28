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
    
    # Try loading from .env
    env_paths = [".env", "next-app/.env", "../../.env", "../../../.env"]
    for path in env_paths:
        abs_path = os.path.join(os.path.dirname(__file__), path)
        if os.path.exists(abs_path):
            with open(abs_path, "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        return line.split("=")[1].strip()
        # Also check current working directory
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

# Use the latest model
model = genai.GenerativeModel('gemini-2.5-flash')

SYSTEM_PROMPT = """你是一个高水平数学专家和JSON数据提取器。你的任务是从高考数学试卷的解答题部分提取题目。

输出必须是一个JSON列表，每个题目包含以下字段：
1. "id": 字符串，格式如 "2019-理-新课标I-17"
2. "type": 始终为 "解答题"
3. "category": 题目所属领域（如：三角函数、数列、立体几何、概率统计、解析几何、导数、选修等）
4. "content": 题目的正文，包含所有分词和小题（如 (1), (2)）。
   - 必须使用 LaTeX 格式书写所有数学公式，并用 $ $ 包围。
   - 换行符使用 \\n（JSON转移字符）。
   - 保留小题序号 (1) (2)。
5. "thought_process": 简要的解题思路（1-2句话）。
6. "source": 试卷全称，例如 "2019年高考数学试卷（理）（新课标Ⅰ）"
7. "sourceRank": 始终为 "全国卷"

重要准则：
- 只要解答题（通常是17题到22/23题）。
- 数学公式必须用 $ $ 包围，例如 $f(x) = x^2$。
- 如果题目中有 (1) (2) 这种小题，请在提取内容中保留它们。
- 确保输出是合法的JSON。
"""

def truncate_pdf(input_path, output_path, start_page=2):
    """Keep only the last few pages where big questions are located."""
    reader = PdfReader(input_path)
    writer = PdfWriter()
    
    total_pages = len(reader.pages)
    # Usually math papers are 4 pages, questions 17-23 are on pages 3-4
    for i in range(max(0, start_page - 1), total_pages):
        writer.add_page(reader.pages[i])
        
    with open(output_path, "wb") as f:
        writer.write(f)
    print(f"Truncated {input_path} to {output_path}")

def fix_json_formatting(text):
    """Fix common JSON issues in Gemini's LaTeX output."""
    # 1. Fix unescaped backslashes in LaTeX
    # Find all content strings and double-escape backslashes that are not already escaped
    def escape_latex(match):
        content = match.group(1)
        # Only escape backslashes that aren't already part of an escape sequence like \n, \", etc.
        # This is a bit tricky, so we'll just do a global replace of \ to \\ 
        # but avoid double-escaping existing \\
        content = content.replace('\\', '\\\\')
        # Re-fix common sequences that should NOT have been double-escaped if they were already correct
        content = content.replace('\\\\n', '\\n').replace('\\\\"', '\\"')
        return f'"{content}"'

    # Simple regex to find content values in JSON
    fixed = re.sub(r'":\s*"(.*?)"(?=[\s,}]|$)', lambda m: f'": {escape_latex(m)}', text, flags=re.DOTALL)
    return fixed

def process_single_paper(pdf_path, source_name, max_retries=3):
    # 1. Truncate
    temp_pdf = "temp_process.pdf"
    truncate_pdf(pdf_path, temp_pdf)
    
    # 2. Upload to Gemini
    print(f"Uploading {pdf_path} to Gemini...")
    sample_file = genai.upload_file(path=temp_pdf, display_name=source_name)
    
    # Wait for processing
    while sample_file.state.name == "PROCESSING":
        time.sleep(2)
        sample_file = genai.get_file(sample_file.name)
        
    # 3. Generate content with retries
    print(f"Generating content for {source_name}...")
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                [sample_file, SYSTEM_PROMPT],
                generation_config={"response_mime_type": "application/json"}
            )
            
            raw_text = response.text
            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                print("Initial JSON parse failed, attempting fix...")
                fixed_text = fix_json_formatting(raw_text)
                data = json.loads(fixed_text)

            # Cleanup
            try:
                genai.delete_file(sample_file.name)
            except:
                pass
            if os.path.exists(temp_pdf):
                os.remove(temp_pdf)
                
            # Ensure it's a list
            if isinstance(data, dict) and "questions" in data:
                data = data["questions"]
            return data
        except Exception as e:
            if "429" in str(e) or "ResourceExhausted" in str(e):
                wait_time = (attempt + 1) * 30
                print(f"Rate limited (429). Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
            elif "403" in str(e) or "PermissionDenied" in str(e):
                print(f"Permission denied (403), likely file issue. Retrying upload...")
                # In this case we might need to re-upload, but for now we'll just retry the call
                # as sometimes it's transient
                time.sleep(5)
            else:
                print(f"Error for {source_name}: {e}")
                if attempt == max_retries - 1:
                    try:
                        genai.delete_file(sample_file.name)
                    except:
                        pass
                    if os.path.exists(temp_pdf):
                        os.remove(temp_pdf)
                    return []
    return []

def main():
    target_paper = "/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（理）（新课标Ⅰ）（空白卷）.pdf"
    source_name = "2019年高考数学试卷（理）（新课标Ⅰ）"
    
    if not os.path.exists(target_paper):
        print(f"Error: Could not find {target_paper}")
        return
        
    new_questions = process_single_paper(target_paper, source_name)
    
    if not new_questions:
        print("No questions extracted.")
        return
        
    # Load existing
    json_path = "/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/math/questions.json"
    with open(json_path, "r", encoding="utf-8") as f:
        all_questions = json.load(f)
    
    # Add new ones (check for duplicates by id)
    existing_ids = {q["id"] for q in all_questions}
    added_count = 0
    for q in new_questions:
        if q["id"] not in existing_ids:
            all_questions.append(q)
            added_count += 1
            
    # Save back
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully added {added_count} questions from {source_name}")

if __name__ == "__main__":
    main()
