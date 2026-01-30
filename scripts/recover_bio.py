import re
import json

cache_file = './next-app/.next/dev/server/chunks/ssr/next-app_src_data_biology_small_questions_json_779b2c0b._.js'
output_file = './next-app/src/data/biology/small_questions.json'

with open(cache_file, 'r', encoding='utf-8') as f:
    content = f.read()

def fix_mojibake(obj):
    if isinstance(obj, str):
        try:
            # The double encoding fix:
            # Current string is "2025 å¹´" (UTF-8 bytes of Latin-1 representations of UTF-8 bytes)
            # We encode to Latin-1 to get the original raw bytes, then decode as UTF-8.
            return obj.encode('latin-1').decode('utf-8')
        except:
            return obj
    elif isinstance(obj, list):
        return [fix_mojibake(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: fix_mojibake(v) for k, v in obj.items()}
    return obj

with open(cache_file, 'rb') as f:
    content_bytes = f.read()

# Look for the string inside JSON.parse("...")
start_marker = b'JSON.parse("'
end_marker = b'")'
start_idx = content_bytes.find(start_marker) + len(start_marker)
end_idx = content_bytes.rfind(end_marker)

if start_idx > len(start_marker) - 1 and end_idx > start_idx:
    json_escaped_bytes = content_bytes[start_idx:end_idx]
    
    # First decode the JS string literal sequence.
    # It contains \ escapes.
    json_str = json_escaped_bytes.decode('utf-8')
    
    try:
        # Unescape the JS string to get the content
        actual_json_str = json.loads('"' + json_str + '"')
        data = json.loads(actual_json_str)
        
        # Now fix the mojibake in the data
        data = fix_mojibake(data)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Successfully recovered {len(data)} biology questions with mojibake fix.")
    except Exception as e:
        print(f"Error parsing JSON: {e}")
else:
    print("Could not find JSON pattern in cache file.")
