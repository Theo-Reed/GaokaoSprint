import json
import re
import os

def normalize_math(text: str) -> str:
    """Normalize math shorthand into LaTeX and merge newlines."""
    if not text or not isinstance(text, str): return text
    
    # 1. Merge fragmented lines from PDF
    # We replace single newlines with space, but preserve double newlines
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    # Case 2: Strip multiple spaces
    text = re.sub(r' +', ' ', text)

    # 2. Fix common math symbols missing backslash
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
    return text.replace('$$', '$').replace('  ', ' ').strip()

def clean_json_data(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated_count = 0
    for q in data:
        if "content" in q:
            original = q["content"]
            q["content"] = normalize_math(original)
            if original != q["content"]:
                updated_count += 1
        
        if "options" in q and isinstance(q["options"], list):
            for opt in q["options"]:
                if isinstance(opt, dict) and "text" in opt:
                    opt["text"] = normalize_math(opt["text"])
        
        if "explanation" in q:
            q["explanation"] = normalize_math(q["explanation"])

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Updated {updated_count} questions in {file_path}")

if __name__ == "__main__":
    clean_json_data("/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/math/small_questions.json")
    clean_json_data("/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/math/questions.json")
