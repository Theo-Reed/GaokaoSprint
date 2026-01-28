import json
import re
import os

target_file = "/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/math/small_questions.json"

def fix_text(text):
    if not isinstance(text, str): return text
    
    # 1. Brutal newline removal - replace with space
    text = text.replace('\n', ' ').replace('\r', '')
    
    # 2. Fix \frac{pi}{...} -> \frac{\pi}{...}
    # We look for "frac{" followed by chars, then "pi" then "}"
    # This is hard with regex because of nested braces.
    # Simplified approach: Fix word "pi" anywhere if it's likely math
    
    # 3. Fix unescaped pi/sin/cos
    # Note: JSON loading already handled the double-backslash decoding.
    # 'text' here has single backslashes for commands, e.g. "\sin".
    
    # Check if we have unescaped pi
    # Regex: pi not preceded by \
    text = re.sub(r'(?<!\\)\bpi\b', r'\\pi', text)
    
    # Check for sin/cos/tan
    for func in ['sin', 'cos', 'tan', 'ln', 'log']:
        text = re.sub(r'(?<!\\)\b' + func + r'\b', r'\\' + func, text)
        
    # Check for missing $ around obvious math
    # If we have \frac but no $, wrap it?
    # This is dangerous if we double wrap.
    # Let's trust sanitizeMath for wrapping, but ensure content is good.
    
    return text

def run():
    with open(target_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    count = 0
    ids_to_fix = [
        "2017年高考数学试卷（理）（新课标Ⅰ）-9",
        "2023年高考数学试卷（新课标Ⅰ卷）-15"
    ]
    
    for q in data:
        # Global fix for all questions
        changed = False
        
        if "content" in q:
            orig = q["content"]
            fixed = fix_text(orig)
            if orig != fixed:
                q["content"] = fixed
                changed = True
                
        if "options" in q and isinstance(q["options"], list):
            for opt in q["options"]:
                if "text" in opt:
                    orig = opt["text"]
                    fixed = fix_text(orig)
                    if orig != fixed:
                        opt["text"] = fixed
                        changed = True
        
        if changed:
            count += 1
            if q["id"] in ids_to_fix:
                print(f"Fixed targeted question {q['id']}")

    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Total updated: {count}")

if __name__ == "__main__":
    run()
