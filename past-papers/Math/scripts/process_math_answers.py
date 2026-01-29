import os
import json
import time
import re
import threading
from concurrent.futures import ThreadPoolExecutor
from google import genai
from google.genai import types
from pypdf import PdfReader, PdfWriter

# --- 配置 ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") 
# 强制使用 Gemini 3 Flash Preview
MODEL_NAME = 'gemini-3-flash-preview'

# 系统指令：专注于提取答案
SYSTEM_PROMPT = r"""你是一个精准的高考数学答案提取助手。
你的任务是根据提供的“高考数学解析卷”内容，提取选择题和填空题的【最终答案】。

请输出一个JSON列表，每一项包含：
1. "question_number": 字符串 (如 "1", "12")
2. "answer": 
   - 如果是单选/多选题：只输出选项字母，如 "A", "BD", "AC"。
   - 如果是填空题：输出最终结果的 LaTeX 格式。不要包含“故答案为”等废话。例如：$\sqrt{2}$ 或 5.

约束：
- 只提取选择题和填空题，**忽略解答题**。
- 如果一个题号对应多个空（如第16题有两个空），用分号分隔，如 "2; \sqrt{3}"。
- 忽略题干解析过程，只抓取结果。
"""

# Client Setup
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
    raise ValueError("GEMINI_API_KEY not found")

client = genai.Client(api_key=GEMINI_API_KEY)
json_lock = threading.Lock()

def get_answer_pages(pdf_path):
    """
    智能截断：通常选择填空题的答案都在解析卷的前几页。
    只要检测到“解答题”字样且页数足够，就停止扫描。
    """
    try:
        reader = PdfReader(pdf_path)
        relevant_indices = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            relevant_indices.append(i)
            # 大部分解析卷，选择填空答案在前4页就能结束
            if i > 3 and ("解答题" in text or "题型" in text): 
                break
        return relevant_indices
    except:
        return [0, 1, 2] # Fallback: return first 3 pages

def extract_answers_from_gemini(pdf_path):
    """上传 PDF 片段给 Gemini 并获取 JSON"""
    # 使用 ASCII 临时文件名避免中文路径问题
    safe_name = f"temp_ans_{int(time.time())}_{os.path.basename(pdf_path).__hash__()}.pdf"
    file_ref = None
    
    try:
        # 1. 裁剪 PDF (只取前几页)
        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        indices = get_answer_pages(pdf_path)
        
        if not indices:
            return []

        for i in indices:
            writer.add_page(reader.pages[i])
        
        with open(safe_name, "wb") as f:
            writer.write(f)

        # 2. 上传文件到 Gemini Files API
        with open(safe_name, "rb") as f:
            file_ref = client.files.upload(file=f, config={'display_name': 'math_ans_doc', 'mime_type': 'application/pdf'})
        
        # 等待文件处理完成
        while file_ref.state.name == "PROCESSING":
            time.sleep(1)
            file_ref = client.files.get(name=file_ref.name)
            
        if file_ref.state.name == "FAILED":
            raise Exception("File processing failed")

        # 3. 生成内容
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_uri(
                            file_uri=file_ref.uri,
                            mime_type=file_ref.mime_type
                        ),
                        types.Part.from_text(text="请提取这份试卷中所有选择题和填空题的答案。")
                    ]
                )
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        result_text = response.text
        if not result_text:
             return []
        
        # Clean markdown json block if present
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        elif result_text.startswith("```"):
            result_text = result_text[3:-3]
            
        try:
             return json.loads(result_text)
        except Exception as parse_error:
            print(f"JSON Parse Error for {pdf_path}: {parse_error}")
            return []

    except Exception as e:
        print(f"Error processing {pdf_path}: {e}")
        return []
    finally:
        # 4. 清理云端文件
        if file_ref:
            try:
                client.files.delete(name=file_ref.name)
            except:
                pass
        # 清理本地临时文件
        if os.path.exists(safe_name):
            os.remove(safe_name)

def update_json_database(source_name, extracted_answers, target_json_path):
    """将提取的答案回填到主数据库"""
    if not extracted_answers:
        return

    with json_lock:
        if not os.path.exists(target_json_path):
            print("Target JSON not found!")
            return

        with open(target_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 创建查找表：Key = "试卷名-题号" (归一化去除空格) -> Value = index
        id_map = {item['id'].replace(" ", ""): i for i, item in enumerate(data)}
        
        update_count = 0
        
        for ans_item in extracted_answers:
            q_num = ans_item.get("question_number")
            ans_val = ans_item.get("answer")
            
            if not ans_val:
                continue

            # 构造目标 ID 进行匹配
            # 试卷名 + "-" + 题号
            target_id_raw = f"{source_name}-{q_num}"
            target_id = target_id_raw.replace(" ", "")
            
            if target_id in id_map:
                idx = id_map[target_id]
                data[idx]['answer'] = ans_val
                update_count += 1
            else:
                # 模糊匹配逻辑：有时题号 "1" 被提取为 "01" 或 "1."
                try:
                    q_num_clean = str(q_num).strip().replace(".", "")
                    target_id_alt = f"{source_name}-{q_num_clean}".replace(" ", "")
                    
                    if target_id_alt in id_map:
                        idx = id_map[target_id_alt]
                        data[idx]['answer'] = ans_val
                        update_count += 1
                    else:
                         # Try with leading zero removal if present
                        if q_num_clean.startswith("0") and len(q_num_clean) > 1:
                            target_id_alt_2 = f"{source_name}-{q_num_clean[1:]}".replace(" ", "")
                            if target_id_alt_2 in id_map:
                                idx = id_map[target_id_alt_2]
                                data[idx]['answer'] = ans_val
                                update_count += 1

                except:
                    pass

        with open(target_json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"  --> Updated {update_count} answers for {source_name}")

def worker(file_path):
    filename = os.path.basename(file_path)
    # 提取试卷名核心：去除 "（解析卷）" 和后缀
    source_name = filename.replace("（解析卷）", "").replace(".pdf", "")
    
    # 确保只处理解析卷
    if "解析卷" not in filename:
        return

    print(f"[START] Extracting answers: {source_name}")
    answers = extract_answers_from_gemini(file_path)
    
    if answers:
        # 使用配置好的目标路径
        TARGET_JSON = "/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/math/small_questions.json"
        
        update_json_database(source_name, answers, TARGET_JSON)
    
    print(f"[DONE] {source_name}")

if __name__ == "__main__":
    base_dir = "/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math"
    
    # 递归查找所有“解析卷”
    tasks = []
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if "解析卷" in file and file.endswith(".pdf"):
                tasks.append(os.path.join(root, file))
    
    print(f"Found {len(tasks)} analytical papers. Starting batch answer extraction with {MODEL_NAME}...")
    
    # 5线程并发
    with ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(worker, tasks)
    
    print("\nAll answer extraction tasks finished.")
