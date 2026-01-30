import json
import os

JSON_PATH = 'next-app/src/data/biology/small_questions.json'

def repair_flags():
    if not os.path.exists(JSON_PATH):
        print("File not found.")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    repaired = 0
    keywords = ['如图', '下图', '图中', '图1', '图2', '图3', '系谱图', '示意图', '曲线图', '流程图', '结构图', '模式图', '柱形图']
    for q in data:
        content = q.get('content', '')
        # Also check options for image references though rare in biology
        all_text = content + "".join([opt.get('text', '') for opt in q.get('options', [])])
        
        should_have = False
        for kw in keywords:
            if kw in all_text:
                should_have = True
                break
        
        if should_have and not q.get('has_figure'):
            q['has_figure'] = True
            repaired += 1
    
    if repaired > 0:
        with open(JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Repaired {repaired} flags in {JSON_PATH}")
    else:
        print("No flags needed repair.")

if __name__ == '__main__':
    repair_flags()
