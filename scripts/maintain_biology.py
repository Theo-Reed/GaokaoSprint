import json
import os
import re
from docx import Document
from docx.document import Document as _Document
from docx.oxml.text.paragraph import CT_P
from docx.oxml.table import CT_Tbl
from docx.table import _Cell, Table
from docx.text.paragraph import Paragraph

# --- Configuration ---
JSON_PATH = 'next-app/src/data/biology/small_questions.json'
WORD_ROOT = 'past-papers/Biology/word'
OUTPUT_DIR = 'next-app/public/biology-images'
KEYWORDS = ['如图', '下图', '图中', '图1', '图2', '图3', '系谱图', '示意图', '曲线图', '流程图', '结构图', '模式图', '柱形图']

# --- Flag Repair Logic ---
def repair_flags(data):
    repaired = 0
    for q in data:
        content = q.get('content', '')
        all_text = content + "".join([opt.get('text', '') for opt in q.get('options', [])])
        
        should_have = False
        for kw in KEYWORDS:
            if kw in all_text:
                should_have = True
                break
        
        if should_have and not q.get('has_figure'):
            q['has_figure'] = True
            repaired += 1
    return repaired

# --- Docx Extraction Logic ---
def iter_block_items(parent):
    if isinstance(parent, _Document):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        raise ValueError("Unknown parent type")
    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)

def get_question_number(text):
    text = text.strip().replace('1l.', '11.').replace('1l．', '11．')
    match = re.match(r'^\s*(\d+)[\.．、]', text)
    return match.group(1) if match else None

def extract_images_from_docx(docx_path):
    doc = Document(docx_path)
    current_q_num = None
    images_by_q = {'pre': []}

    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            new_num = get_question_number(block.text)
            if new_num:
                current_q_num = new_num
                if current_q_num not in images_by_q:
                    images_by_q[current_q_num] = []
            
            # Find drawings and picts in runs
            target = current_q_num if current_q_num else 'pre'
            for run in block.runs:
                # 1. Drawing ML
                for drawing in run._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing'):
                    for blip in drawing.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip'):
                        embed = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                        if embed:
                            images_by_q[target].append(doc.part.related_parts[embed])
                # 2. VML Pict
                for pict in run._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pict'):
                    for idata in pict.findall('.//{urn:schemas-microsoft-com:vml}imagedata'):
                         rId = idata.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                         if rId:
                            images_by_q[target].append(doc.part.related_parts[rId])
    return images_by_q

def find_docx_file(source_name):
    candidates = []
    for root, dirs, files in os.walk(WORD_ROOT):
        for f in files:
            if f.endswith('.docx') and not f.startswith('~$') and source_name in f:
                 candidates.append(os.path.join(root, f))
    if not candidates: return None
    for c in candidates:
        if '空白卷' in c: return c
    return candidates[0]

# --- Main Sync Logic ---
def sync_flags_with_files(data):
    """Final check: if file doesn't exist, set has_figure=False"""
    files_in_dir = set(os.listdir(OUTPUT_DIR))
    linked = 0
    for q in data:
        q_id = q.get('id', '')
        source = q.get('source', '')
        q_num = q.get('question_number', '')
        
        # Candidate names
        candidates = [f"{q_id}.png", f"{source}-{q_num}.png"]
        found = any(c in files_in_dir for c in candidates)
        
        if found:
            q['has_figure'] = True
            linked += 1
        else:
            q['has_figure'] = False
    return linked

def process_biology():
    print("--- Starting Biology Maintenance ---")
    if not os.path.exists(JSON_PATH):
        print(f"Error: {JSON_PATH} not found.")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Repair flags based on text keywords
    print("Step 1: Repairing flags based on text content...")
    repaired = repair_flags(data)
    print(f"  Fixed {repaired} missing figure flags.")

    # 2. Extract images from Docx
    print("Step 2: Extracting images from Word docs...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    sources = sorted(list(set(q.get('source', '') for q in data if q.get('source'))))
    ext_count = 0
    for source in sources:
        docx_path = find_docx_file(source)
        if not docx_path: continue
        
        images_by_q = extract_images_from_docx(docx_path)
        for q_num, img_list in images_by_q.items():
            if q_num == 'pre' or not img_list: continue
            # Save first image for each question
            out_path = os.path.join(OUTPUT_DIR, f"{source}-{q_num}.png")
            with open(out_path, 'wb') as f:
                f.write(img_list[0].blob)
            ext_count += 1
    print(f"  Extracted {ext_count} images.")

    # 3. Final Sync (Verify files exist)
    print("Step 3: Syncing JSON flags with physical files...")
    linked = sync_flags_with_files(data)
    print(f"  Final linked questions: {linked}")

    # Save
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("--- Biology Maintenance Complete ---")

if __name__ == '__main__':
    process_biology()
