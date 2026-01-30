import json
import os
import re

def normalize_brackets(text):
    return text.replace('(', '（').replace(')', '）')

def sync_data(json_path, image_dir):
    if not os.path.exists(json_path):
        # Silent skip if file doesn't exist (e.g. some subjects might not have big questions yet)
        return
    
    if not os.path.exists(image_dir):
        # Create dir if missing? Or just skip. User said "sync", assuming expectation is to link if possible.
        print(f"[{os.path.basename(json_path)}] Image directory not found: {image_dir}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    # Pre-fetch all files for fast lookup
    files_in_dir = set(os.listdir(image_dir))
    # Create a map of {normalized_name: real_name} to find bracket mismatches
    files_norm_map = {normalize_brackets(f): f for f in files_in_dir}

    updated_count = 0
    fixed_bracket_count = 0
    total_has_figure = 0
    
    # Track originally missing images (where has_figure was true but file missing)
    # This addresses the "check" requirement
    originally_missing = []

    for q in questions:
        q_id = q.get('id', '')
        source = q.get('source', '')
        q_num = q.get('question_number', '')
        was_true = q.get('has_figure', False)
        
        # Try different possible filenames based on how different subjects name their images
        candidates = []
        if q_id: candidates.append(f"{q_id}.png")
        if source and q_num: candidates.append(f"{source}-{q_num}.png")
        
        # Unique candidates preserving order
        unique_candidates = []
        for c in candidates:
            if c not in unique_candidates:
                unique_candidates.append(c)

        found = False
        target_filename = unique_candidates[0] if unique_candidates else None

        for expected_filename in unique_candidates:
            expected_norm = normalize_brackets(expected_filename)

            # 1. Exact match check
            if expected_filename in files_in_dir:
                found = True
                target_filename = expected_filename
                break
            
            # 2. Bracket mismatch check
            elif expected_norm in files_norm_map:
                actual_filename = files_norm_map[expected_norm]
                print(f"  [Fix] Renaming '{actual_filename}' -> '{expected_filename}'")
                
                old_path = os.path.join(image_dir, actual_filename)
                new_path = os.path.join(image_dir, expected_filename)
                
                try:
                    os.rename(old_path, new_path)
                    files_in_dir.remove(actual_filename)
                    files_in_dir.add(expected_filename)
                    files_norm_map[expected_norm] = expected_filename
                    found = True
                    target_filename = expected_filename
                    fixed_bracket_count += 1
                except OSError as e:
                    print(f"  [Error] Failed to rename file: {e}")
                break

        # 3. Update JSON state
        if found:
            q['has_figure'] = True
            total_has_figure += 1
        else:
            if was_true:
                originally_missing.append(expected_filename)
            q['has_figure'] = False
            
    # Write back changes
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"[{json_path.split('/')[-2]}] Processed {os.path.basename(json_path)}: {total_has_figure} images linked.")
    if fixed_bracket_count > 0:
        print(f"  - Fixed {fixed_bracket_count} bracket name mismatches")
    if originally_missing:
        # Limit output to avoid spam
        print(f"  - Warning: {len(originally_missing)} questions lost 'has_figure=true' due to missing files.")
        if len(originally_missing) < 5:
            print(f"    Missing: {originally_missing}")
        else:
             print(f"    Missing examples: {originally_missing[:3]}...")

def main():
    # Use absolute paths or relative to project root
    base_data = "next-app/src/data"
    base_public = "next-app/public"

    tasks = [
        # Math
        ("math/questions.json", "math-images"),
        ("math/small_questions.json", "math-images"),
        # Biology
        ("biology/questions.json", "biology-images"), 
        ("biology/small_questions.json", "biology-images"),
        # Physics
        ("physics/questions.json", "physics-images"),
        ("physics/small_questions.json", "physics-images"),
        # Chemistry
        ("chemistry/questions.json", "chemistry-images"),
        ("chemistry/small_questions.json", "chemistry-images"),
    ]

    print("--- Starting Sync & Check ---")
    current_dir = os.getcwd()
    # Check if we are in right dir
    if not os.path.exists("next-app"):
        print("Error: Run this script from the project root (gaokao/).")
        return

    for json_subpath, img_subpath in tasks:
        json_path = os.path.join(base_data, json_subpath)
        img_path = os.path.join(base_public, img_subpath)
        sync_data(json_path, img_path)
    print("--- Done ---")

if __name__ == "__main__":
    main()
