import os
import json
import time
import threading
import glob
import random
import re
from concurrent.futures import ThreadPoolExecutor
from google import genai
from google.genai import types
from pypdf import PdfReader, PdfWriter

# --- Configuration ---
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
    return None

GEMINI_API_KEY = load_api_key()
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found")

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = 'gemini-3-flash-preview' # Use Flash for answers as it's faster and cheaper

# Thread lock
json_lock = threading.Lock()

SYSTEM_PROMPT = r"""你是一个精确的高考生物答案提取助手。
你的任务是从生物试卷解析或答案页中提取选择题的【答案】。

输出一个JSON列表，每一项包含：
1. "question_number": 字符串 (如 "1", "6")
2. "answer": 选项字母 (如 "A", "C", "D")。

约束：
- 只提取选择题答案。
- 如果遇到多选题（虽然少见），且答案由多个字母组成（如 "AC"），请照常输出。
- 忽略非选择题、填空题。
- 忽略解析过程，只提取最终选项。
"""

def get_answer_pages(pdf_path):
    """
    Bio choice questions are usually the first part. 
    Analysis papers usually have answers right after the question or in a summary at the start/end.
    To be safe, we take the first 15 pages.
    """
    try:
        reader = PdfReader(pdf_path)
        total = len(reader.pages)
        # Take first 15 pages or all if less
        return list(range(min(total, 15)))
    except:
        return [0]

def extract_answers_from_gemini(pdf_path):
    safe_name = f"temp_bio_ans_{int(time.time()*1000)}_{random.randint(100,999)}.pdf"
    
    try:
        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        indices = get_answer_pages(pdf_path)
        
        valid_indices = sorted(list(set([i for i in indices if 0 <= i < len(reader.pages)])))
        if not valid_indices:
            return []
            
        for i in valid_indices:
            writer.add_page(reader.pages[i])
            
        with open(safe_name, "wb") as f:
            writer.write(f)
        
        # Give OS a moment to flush
        time.sleep(1)
        
        MAX_RETRIES = 6
        for attempt in range(MAX_RETRIES):
            try:
                # Use 'file' for path string in google-genai SDK
                file_ref = client.files.upload(file=safe_name, config={'display_name': 'bio_ans', 'mime_type': 'application/pdf'})
                
                try:
                    response = client.models.generate_content(
                        model=MODEL_NAME,
                        contents=[types.Content(
                            role="user",
                            parts=[
                                types.Part.from_uri(file_uri=file_ref.uri, mime_type=file_ref.mime_type),
                                types.Part.from_text(text="从PDF中提取所有生物选择题答案。返回JSON格式：[{\"question_number\": \"1\", \"answer\": \"A\", \"explanation\": \"...\"}, ...]")
                            ]
                        )],
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_PROMPT,
                            response_mime_type="application/json"
                        )
                    )
                    
                    # Cleanup file immediately after use
                    try:
                        client.files.delete(name=file_ref.name)
                    except:
                        pass

                    try:
                        return json.loads(response.text)
                    except:
                        # Basic cleanup if markdown leaked
                        text = response.text.replace("```json", "").replace("```", "")
                        return json.loads(text)
                
                except Exception as e:
                    # Cleanup file if request failed
                    try:
                        client.files.delete(name=file_ref.name)
                    except:
                        pass
                    raise e

            except Exception as e:
                error_str = str(e)
                if "503" in error_str or "429" in error_str or "overloaded" in error_str:
                    wait_time = (2 ** attempt) * 5 + random.uniform(0, 5)
                    print(f"      [Server Overloaded] Answers {os.path.basename(pdf_path)} attempt {attempt+1} failed. Retrying in {wait_time:.1f}s...")
                    time.sleep(wait_time)
                else:
                    print(f"Error extracting answers from {os.path.basename(pdf_path)}: {e}")
                    return []
        
        return [] # All retries failed
            
    finally:
        if os.path.exists(safe_name):
            try:
                os.remove(safe_name)
            except:
                pass

def update_json_database(source_name, answers, target_json_path):
    # Match logic
    with json_lock:
        if not os.path.exists(target_json_path):
            print("Target JSON not found, skipping update.")
            return

        with open(target_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Build map: ID -> Index
        # ID is {source_name}-{question_number}
        id_map = {item['id']: i for i, item in enumerate(data)}
        
        count = 0
        for ans in answers:
            q_num = ans.get('question_number')
            ans_val = ans.get('answer')
            if not q_num or not ans_val:
                continue
            
            # Construct ID
            target_id = f"{source_name}-{q_num}".replace(" ", "")
            
            if target_id in id_map:
                idx = id_map[target_id]
                data[idx]['answer'] = ans_val
                count += 1
            else:
                 # Try removing leading zero just in case
                if q_num.startswith("0"):
                     target_id_2 = f"{source_name}-{q_num[1:]}".replace(" ", "")
                     if target_id_2 in id_map:
                        idx = id_map[target_id_2]
                        data[idx]['answer'] = ans_val
                        count += 1

        with open(target_json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"  -> Updated {count} answers for {source_name}")

def worker(file_path):
    filename = os.path.basename(file_path)
    # Remove suffix to get source name (must match extractor's source name)
    source_name = filename.replace("（解析卷）", "").replace(".pdf", "")
    
    if "解析卷" not in filename:
        return

    print(f"[START ANSWERS] {source_name}")
    answers = extract_answers_from_gemini(file_path)
    if answers:
        TARGET_JSON = "/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/biology/small_questions.json"
        update_json_database(source_name, answers, TARGET_JSON)

if __name__ == "__main__":
    BASE_DIR = "/Users/yeatom/VSCodeProjects/gaokao/past-papers/Biology/2025·高考生物真题"
    TARGET_JSON = "/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/biology/small_questions.json"
    
    # Check already answered sources
    answered_sources = set()
    if os.path.exists(TARGET_JSON):
        try:
            with open(TARGET_JSON, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                # A source is "answered" if all its questions have an 'answer' field
                # Actually simpler: if ANY question of that source has an answer, we might skip or re-process.
                # Let's say we skip if more than 80% of questions for that source have answers.
                source_counts = {}
                source_answered = {}
                for q in existing_data:
                    src = q.get('source')
                    if not src: continue
                    source_counts[src] = source_counts.get(src, 0) + 1
                    if q.get('answer'):
                        source_answered[src] = source_answered.get(src, 0) + 1
                
                for src in source_counts:
                    if source_answered.get(src, 0) / source_counts[src] > 0.8:
                        answered_sources.add(src)
        except:
            pass

    tasks = []
    # Find all analytical papers
    search_pattern = os.path.join(BASE_DIR, "**", "*（解析卷）.pdf")
    files = glob.glob(search_pattern, recursive=True)
    pdf_files = [f for f in files if "temp" not in f]
    
    to_process = []
    for f in pdf_files:
        filename = os.path.basename(f)
        source_name = filename.replace("（解析卷）", "").replace(".pdf", "")
        if source_name in answered_sources:
            print(f"  [SKIP] {source_name} answers already populated.")
            continue
        to_process.append(f)
    
    print(f"Found {len(pdf_files)} Analytical Papers. To process: {len(to_process)}")
    
    if not to_process:
        print("All answers already processed.")
        exit(0)
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        executor.map(worker, to_process)

