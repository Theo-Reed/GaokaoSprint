import os
import json
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from google import genai
from google.genai import types
from pypdf import PdfReader, PdfWriter
import glob
import re

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
    raise ValueError("GEMINI_API_KEY not found in environment variables or .env")

# Initialize Client
client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = 'gemini-3-flash-preview'

# Thread lock for safe JSON writing
json_lock = threading.Lock()
MAX_WORKERS = 3

SYSTEM_PROMPT = r"""你是一个高水平高考生物专家和JSON数据提取器。你的任务是从高考生物试卷中完整提取所有选择题。

输出必须是一个JSON列表，每个题目必须包含：
1. "question_number": 字符串（如 "1", "6"）
2. "type": 必须为 "single_choice" (生物通常无填空题或不定项选择题，仅提取单选)
3. "category": 请根据题目内容极其严谨地从以下分类中选择最合适的一项：
   - molecular_basis (元素、化合物与无机物)
   - cell_structure (细胞器与生物膜系统)
   - transport (物质跨膜运输)
   - enzymes_atp (酶与 ATP 的机制)
   - photo_resp (光合与呼吸)
   - cell_lifecycle (细胞生命历程 - 含分裂、分化、衰老、凋亡、癌变)
   - genetics_laws (孟德尔遗传定律)
   - meiosis (减数分裂与受精)
   - molecular_genetics (分子遗传机制 - DNA复制/转录/翻译/基因本质)
   - variation_evolution (变异、育种与进化)
   - internal_environment (内环境稳态)
   - nervous_system (神经调节)
   - hormonal_reg (激素/体液调节)
   - immune_system (免疫调节)
   - plant_hormones (植物激素调节)
   - ecology_system (生态系统及其稳态 - 种群/群落/生态系统)
   - bio_engineering (基因与细胞工程)
   - fermentation (发酵工程与微生物)
5. "content": 题干 (LaTeX数学/化学/生物符号用$ $包裹，如 $CO_2$, $H^+$)。
6. "has_figure": 布尔值。如果题目（题干或选项）包含图形、图表、曲线图，设为 true。
7. "options": [{"label":"A","text":"..."}, {"label":"B","text":"..."}, ...]
8. "score_rule": "每题X分" (通常生物选择题为2分或6分，请根据试卷说明推断，若未知则留空)

重要约束：
- **只提取选择题**：忽略填空题（非选择题）、解答题、实验题（如果是非选择形式）。
- **忽略多选**：如果遇到多选题（虽然少见），请标记为 type="single_choice" 并在 content 中注明（多选）。但主要关注单选题。
- **完整性**：提取所有可见的选择题。
- **格式**：Strict JSON. No markdown formatting in output just parsed JSON list.
"""

def extract_relevant_pages(pdf_path):
    """
    Identify pages containing choice questions.
    Stops when '非选择题' section header is found.
    """
    try:
        reader = PdfReader(pdf_path)
        relevant_indices = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            # 改进正则：避免误判首页的“考试说明”或“目录”
            # 通常第二部分会有明显的序号开头，如“二、非选择题”或“第二部分”占一行
            # 我们忽略第 1 页（index 0）的判断，因为首页常出现“本卷分第一部分和第二部分”等文字
            if i > 0:
                # 匹配：以“二、”、“三、”、“第二部分”、“第II卷”开头，且后面紧跟非选择题相关词汇
                if re.search(r'^[ \t]*([二三][、．]|第二部分|第[ⅡII]卷|Part\s*[ⅡIIB])\s*(非选择题|简答题|填空题|本部分共)', text, re.MULTILINE) or \
                   re.search(r'^[ \t]*非选择题[ \t]*$', text, re.MULTILINE):
                    relevant_indices.append(i)
                    break
            relevant_indices.append(i)
        
        # Fallback if nothing found: Bio MCQs are usually in the first 5-8 pages
        if not relevant_indices:
            relevant_indices = list(range(min(len(reader.pages), 6)))
        return relevant_indices
    except:
        return [0, 1, 2, 3]

def merge_questions(new_questions, target_json_path):
    with json_lock:
        data = []
        if os.path.exists(target_json_path):
            with open(target_json_path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except:
                    pass
        
        # 使用 ID 作为 key 建立索引，方便更新
        id_map = {q.get('id'): i for i, q in enumerate(data)}
        
        for q in new_questions:
            qid = q.get('id')
            if qid in id_map:
                # 更新已有条目（合并字段，特别是 extracted_from_pages）
                idx = id_map[qid]
                # 合并页码记录
                existing_pages = set(data[idx].get('extracted_from_pages', []))
                new_pages = set(q.get('extracted_from_pages', []))
                data[idx].update(q) # 更新其他内容
                data[idx]['extracted_from_pages'] = list(existing_pages | new_pages)
            else:
                data.append(q)
                id_map[qid] = len(data) - 1
        
        with open(target_json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

import random

# ... (rest of imports remains)

def process_page_batch(reader, page_indices, source_name, target_json):
    """Process a batch of pages with retry logic"""
    # Create temp PDF
    writer = PdfWriter()
    for i in page_indices:
        writer.add_page(reader.pages[i])
    
    temp_path = f"temp_batch_{int(time.time()*1000)}_{page_indices[0]}.pdf"
    with open(temp_path, "wb") as f:
        writer.write(f)
        
    MAX_RETRIES = 6
    for attempt in range(MAX_RETRIES):
        try:
            # Upload using path
            file_ref = client.files.upload(file=temp_path, config={'display_name': f'bio_batch_{page_indices[0]}', 'mime_type': 'application/pdf'})
            
            try:
                # Generate
                prompt = "请提取这几页中的所有生物选择题。"
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=[types.Content(
                        role="user",
                        parts=[
                            types.Part.from_uri(file_uri=file_ref.uri, mime_type=file_ref.mime_type),
                            types.Part.from_text(text=prompt)
                        ]
                    )],
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        response_mime_type="application/json"
                    )
                )
                
                # Parse
                try:
                    questions = json.loads(response.text)
                except:
                    raw = response.text
                    if "```json" in raw:
                        raw = raw.split("```json")[1].split("```")[0]
                    elif "```" in raw:
                        raw = raw.split("```")[1].split("```")[0]
                    questions = json.loads(raw)
                    
                if questions:
                    ordered_questions = []
                    for q in questions:
                        # 移除不再需要的 type_rank
                        if 'type_rank' in q:
                            del q['type_rank']
                        
                        q_num = q.get('question_number', '0')
                        q['id'] = f"{source_name}-{q_num}".replace(" ", "")
                        q['source'] = source_name
                        q['subject'] = 'biology'
                        q['extracted_from_pages'] = page_indices  # 记录来源页码以支持断点继传
                        ordered_questions.append(q)
                    
                    merge_questions(ordered_questions, target_json)
                    print(f"    Batch parsed: {len(ordered_questions)} questions from pages {page_indices}")
                    
                    # Cleanup file
                    try:
                        client.files.delete(name=file_ref.name)
                    except:
                        pass
                    
                    return len(ordered_questions)
                return 0

            except Exception as e:
                # Cleanup file before retry
                try:
                    client.files.delete(name=file_ref.name)
                except:
                    pass
                raise e

        except Exception as e:
            error_str = str(e)
            if "503" in error_str or "429" in error_str or "overloaded" in error_str:
                wait_time = (2 ** attempt) * 5 + random.uniform(0, 5)
                print(f"      [Server Overloaded] Batch {page_indices} attempt {attempt+1} failed. Retrying in {wait_time:.1f}s...")
                time.sleep(wait_time)
            else:
                print(f"      Batch {page_indices} error: {e}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(5)
                else:
                    break
    
    if os.path.exists(temp_path):
        os.remove(temp_path)
    return 0

def process_paper(file_path, source_name, target_json, already_processed_pages):
    relevant_indices = extract_relevant_pages(file_path)
    if not relevant_indices:
        return []
    
    print(f"  {source_name}: Scanned {len(relevant_indices)} relevant pages.")
    reader = PdfReader(file_path)
    
    # Batch size can be larger for biology as questions are shorter text-wise than math sometimes, but images are frequent.
    # 2 pages is safe.
    BATCH_SIZE = 2
    total = 0
    for i in range(0, len(relevant_indices), BATCH_SIZE):
        batch = relevant_indices[i:i+BATCH_SIZE]
        
        # 检查该 batch 中的页码是否全部已处理
        if all(p in already_processed_pages for p in batch):
            print(f"    [SKIP] Pages {batch} already processed for {source_name}")
            continue
            
        count = process_page_batch(reader, batch, source_name, target_json)
        total += count
        time.sleep(1) # Rate limit guard
        
    return [1] * total

def process_task(file_path, target_json, already_processed_pages):
    filename = os.path.basename(file_path)
    source_name = filename.replace(".pdf", "").replace("（空白卷）", "")
    print(f"Processing: {source_name}")
    try:
        qs = process_paper(file_path, source_name, target_json, already_processed_pages)
        return f"  [DONE] {source_name}: Extracted {len(qs)} questions."
    except Exception as e:
        return f"  [ERROR] {source_name}: {e}"

if __name__ == "__main__":
    BASE_DIR = "/Users/yeatom/VSCodeProjects/gaokao/past-papers/Biology"
    TARGET_JSON = "/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/biology/small_questions.json"
    
    os.makedirs(os.path.dirname(TARGET_JSON), exist_ok=True)
    
    # 建立 Source -> Set(ProcessedPages) 的映射
    source_processed_map = {} 
    if os.path.exists(TARGET_JSON):
        try:
            with open(TARGET_JSON, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                for q in existing_data:
                    src = q.get('source')
                    pages = q.get('extracted_from_pages', [])
                    if src:
                        if src not in source_processed_map:
                            source_processed_map[src] = set()
                        for p in pages:
                            source_processed_map[src].add(p)
        except Exception as e:
            print(f"Error reading checkpoint info: {e}")
    
    # Search patterns
    search_pattern = os.path.join(BASE_DIR, "**", "*（空白卷）.pdf")
    files = glob.glob(search_pattern, recursive=True)
    pdf_files = [f for f in files if "temp_batch" not in f]
    
    to_process = []
    for f in pdf_files:
        filename = os.path.basename(f)
        source_name = filename.replace(".pdf", "").replace("（空白卷）", "")
        # 如果一页都没跑过，或者跑了一部分，都加入待处理队列（内部会按页跳过）
        to_process.append(f)
    
    print(f"Found {len(pdf_files)} Biology PDF files. Resuming logic enabled.")
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(process_task, f, TARGET_JSON, source_processed_map.get(os.path.basename(f).replace(".pdf", "").replace("（空白卷）", ""), set())): f 
            for f in to_process
        }
        for future in as_completed(futures):
            print(future.result())
