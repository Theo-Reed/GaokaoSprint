import json
import os
import re
from docx import Document
from docx.document import Document as _Document
from docx.oxml.text.paragraph import CT_P
from docx.oxml.table import CT_Tbl
from docx.table import _Cell, Table
from docx.text.paragraph import Paragraph

# Configuration
JSON_PATH = 'next-app/src/data/biology/small_questions.json'
WORD_ROOT = 'past-papers/Biology/word'
OUTPUT_DIR = 'next-app/public/biology-images' # Use the unified name

os.makedirs(OUTPUT_DIR, exist_ok=True)

def iter_block_items(parent):
    if isinstance(parent, _Document):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        raise ValueError("something's not right")

    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)

def get_question_number(text):
    # Matches "1.", "1．", "1、", " (1) " at start of line
    # Sometimes OCR errors like 1l instead of 11 or l2 instead of 12
    # We replace common mistakes
    text = text.strip()
    # Replace common OCR misreads in the first few characters
    text = text.replace('1l.', '11.').replace('1l．', '11．')
    
    match = re.match(r'^\s*(\d+)[\.．、]', text)
    if match:
        return match.group(1)
    return None

def extract_smart(docx_path, source_name):
    doc = Document(docx_path)
    current_q_num = None
    images_by_q = {} # {q_num: [img_parts]}
    
    # We also keep track of "floating" images before first question
    images_by_q['pre'] = []

    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            text = block.text.strip()
            new_num = get_question_number(text)
            if new_num:
                current_q_num = new_num
                if current_q_num not in images_by_q:
                    images_by_q[current_q_num] = []
            
            # Extract images from this paragraph
            for run in block.runs:
                # Drawings
                drawings = run._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing')
                for drawing in drawings:
                    blips = drawing.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip')
                    for blip in blips:
                        embed = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                        if embed:
                            image_part = doc.part.related_parts[embed]
                            target = current_q_num if current_q_num else 'pre'
                            images_by_q[target].append(image_part)
                
                # Picts (older format)
                picts = run._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pict')
                for pict in picts:
                    imagedata = pict.findall('.//{urn:schemas-microsoft-com:vml}imagedata')
                    for idata in imagedata:
                         rId = idata.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                         if rId:
                            image_part = doc.part.related_parts[rId]
                            target = current_q_num if current_q_num else 'pre'
                            images_by_q[target].append(image_part)
        
        elif isinstance(block, Table):
            # If table contains images, associate with current_q_num
            # This is a bit recursive, but simplified for now:
            for cell in block._cells:
                # Minimal search inside cell
                # Note: docx doesn't make it easy to traverse cell runs deeply here 
                # but we can try basic search
                pass # Tables in Bio papers rarely have the question number inside them

    return images_by_q

def find_docx_file(source_name):
    candidates = []
    for root, dirs, files in os.walk(WORD_ROOT):
        for f in files:
            if not f.endswith('.docx') or f.startswith('~$'):
                continue
            name_no_ext = os.path.splitext(f)[0]
            if source_name in name_no_ext:
                 candidates.append(os.path.join(root, f))
    if not candidates: return None
    for c in candidates:
        if '空白卷' in c: return c
    return candidates[0]

def main():
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Get all unique sources
    sources = sorted(list(set(q.get('source', '') for q in data if q.get('source'))))
    
    total_extracted = 0
    
    # Filter for all sources
    target_sources = sources

    for source in target_sources:
        print(f"Processing {source}...")
        docx_path = find_docx_file(source)
        if not docx_path:
            print(f"  No docx for {source}")
            continue
            
        images_by_q = extract_smart(docx_path, source)
        
        # Save images
        for q_num, img_list in images_by_q.items():
            if q_num == 'pre': continue
            
            # Question ID is usually source-number
            q_id = f"{source}-{q_num}"
            
            if len(img_list) == 1:
                out_path = os.path.join(OUTPUT_DIR, f"{q_id}.png")
                with open(out_path, 'wb') as f:
                    f.write(img_list[0].blob)
                total_extracted += 1
            elif len(img_list) > 1:
                # Merge or just pick first? 
                # Biology usually has multiple panels (a, b, c) as separate images.
                # Ideally we want one image. For now, let's take the first or save all with suffix.
                # If we save with suffix, the UI needs to support it. 
                # Currently UI only supports one image.
                print(f"  [INFO] Multiple images ({len(img_list)}) for {q_id}. Saving first.")
                out_path = os.path.join(OUTPUT_DIR, f"{q_id}.png")
                with open(out_path, 'wb') as f:
                    f.write(img_list[0].blob)
                total_extracted += 1
                
    print(f"Done. Extracted {total_extracted} images.")

if __name__ == '__main__':
    main()
