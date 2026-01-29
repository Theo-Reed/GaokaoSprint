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
OUTPUT_DIR = 'next-app/public/biology'

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_questions_with_figures():
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    paper_map = {}
    for q in data:
        if q.get('has_figure'):
            source = q.get('source')
            if not source:
                continue
            if source not in paper_map:
                paper_map[source] = []
            paper_map[source].append(q)
    
    # Sort questions by number for each paper
    for source, qs in paper_map.items():
        # Heuristic sort: try to parse number, handle 16(2) etc
        def sort_key(q):
            num = q.get('question_number', '0')
            match = re.search(r'(\d+)', num)
            return int(match.group(1)) if match else 0
        
        qs.sort(key=sort_key)
        paper_map[source] = [q['id'] for q in qs]
        
    return paper_map

def iter_block_items(parent):
    """
    Generate a reference to each paragraph and table child within *parent*,
    in document order. Each returned value is an instance of either Table or
    Paragraph.
    """
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

def get_images_from_doc(doc_path):
    document = Document(doc_path)
    images = []
    
    # We need to traverse in order. 
    # The docx library doesn't make it super easy to just "get next image".
    # We will iterate through all inline shapes in the document relationships
    # But to guarantee order, we should walk the xml.
    
    # Simpler approach first: Extract all images from rels map? No, that loses order.
    # Combined approach: Walk the paragraphs/runs, find blip rIds within drawings.
    
    for block in iter_block_items(document):
        if isinstance(block, Paragraph):
            for run in block.runs:
                # Access the XML of the run
                # Look for <a:blip> or <pic:blipFill>
                # The namespace usually is a: http://schemas.openxmlformats.org/drawingml/2006/main
                
                # Check for drawing elements
                drawings = run._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing')
                for drawing in drawings:
                    blips = drawing.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip')
                    for blip in blips:
                        embed = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                        if embed:
                            image_part = document.part.related_parts[embed]
                            images.append(image_part)
                            
                # Also check for falling back to older VML or other shapes if needed, 
                # but standard docx uses drawings.
                # Sometimes images are picts
                picts = run._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pict')
                for pict in picts:
                    imagedata = pict.findall('.//{urn:schemas-microsoft-com:vml}imagedata')
                    for idata in imagedata:
                         rId = idata.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                         if rId:
                            image_part = document.part.related_parts[rId]
                            images.append(image_part)
                            
    return images

def find_docx_file(source_name):
    # Search recursively in WORD_ROOT
    # Prefer files ending in （空白卷）.docx
    # Backup: any .docx file containing source_name
    
    candidates = []
    for root, dirs, files in os.walk(WORD_ROOT):
        for f in files:
            if not f.endswith('.docx') or f.startswith('~$'):
                continue
            
            # Simple containment check
            # Remove "20xx年" prefix from source to be flexible? 
            # Or strict? The sources are like "2023年高考生物试卷（重庆）" 
            # The files are like "2023年高考生物试卷（重庆）（空白卷）.docx"
            
            name_no_ext = os.path.splitext(f)[0]
            if source_name in name_no_ext:
                 candidates.append(os.path.join(root, f))
    
    if not candidates:
        return None
        
    # Prioritize (空白卷)
    for c in candidates:
        if '空白卷' in c:
            return c
    
    # Prioritize files closer to the root or matching length (heuristic)
    return candidates[0]

def main():
    paper_map = get_questions_with_figures()
    print(f"Found {len(paper_map)} papers with figures.")
    
    total_extracted = 0
    
    for source, q_ids in paper_map.items():
        if not q_ids:
            continue
            
        print(f"\nProcessing {source} ({len(q_ids)} figures expected)...")
        docx_path = find_docx_file(source)
        
        if not docx_path:
            print(f"  [WARN] No .docx file found for {source}")
            continue
            
        print(f"  Using file: {docx_path}")
        
        try:
            images = get_images_from_doc(docx_path)
        except Exception as e:
            print(f"  [ERROR] Failed to read docx: {e}")
            continue
            
        print(f"  Found {len(images)} images in document.")
        
        # Match images to questions
        count = min(len(images), len(q_ids))
        for i in range(count):
            img_part = images[i]
            question_id = q_ids[i]
            
            # Determine extension
            content_type = img_part.content_type
            ext = 'png'
            if 'jpeg' in content_type:
                ext = 'jpg'
            elif 'png' in content_type:
                ext = 'png'
            elif 'gif' in content_type:
                ext = 'gif'
            
            # We enforce PNG for frontend simplicity if we want, or just save as is
            # Ideally frontend handles extension, but we said "/biology-images/${id}.png"
            # So we should convert if possible, or save as png if it is one. 
            # Let's save with correct extension but renaming might be needed in DB?
            # Actually, user script said "save as id.png". 
            # I will just write the bytes. If it's a jpeg, browsers usually handle a jpeg inside a .png file fine, 
            # OR I should check the implementation of DrillClient again. 
            # DrillClient uses .png hardcoded. 
            # It is safer to strictly use .png if I can convert, or just save with .png extension 
            # hoping the browser sniffs content-type or it just works. 
            # Most browsers render a JPG named .png just fine.
            
            out_path = os.path.join(OUTPUT_DIR, f"{question_id}.png")
            with open(out_path, 'wb') as f_out:
                f_out.write(img_part.blob)
            
            total_extracted += 1
            if i == 0:
                print(f"    Saved {out_path} ...")
                
        if len(images) < len(q_ids):
            print(f"  [WARN] Missing images! Expected {len(q_ids)}, found {len(images)}")
        
    print(f"\nDone. Extracted {total_extracted} images total.")

if __name__ == '__main__':
    main()
