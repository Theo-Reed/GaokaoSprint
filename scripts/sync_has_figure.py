import json
import os

def update_has_figure(json_path, image_dir):
    if not os.path.exists(json_path):
        print(f"Skipping {json_path} - not found")
        return
    
    with open(json_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # Get all image filenames in the directory
    if os.path.exists(image_dir):
        image_files = set(os.listdir(image_dir))
    else:
        image_files = set()
        print(f"Warning: directory {image_dir} not found")

    updated_count = 0
    for q in questions:
        source = q.get('source', '')
        q_num = q.get('question_number', '')
        # Pattern: Source-Number.png
        expected_name = f"{source}-{q_num}.png"
        
        # Check if file exists in the directory
        if expected_name in image_files:
            q['has_figure'] = True
            updated_count += 1
        else:
            q['has_figure'] = False
            
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    print(f"Updated {json_path}: {updated_count} questions marked with has_figure=true")

# Paths
base_data = "/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data"
base_public = "/Users/yeatom/VSCodeProjects/gaokao/next-app/public"

update_has_figure(f"{base_data}/math/questions.json", f"{base_public}/math-images")
update_has_figure(f"{base_data}/biology/small_questions.json", f"{base_public}/biology-images")
update_has_figure(f"{base_data}/physics/small_questions.json", f"{base_public}/physics-images")
update_has_figure(f"{base_data}/chemistry/small_questions.json", f"{base_public}/chemistry-images")
