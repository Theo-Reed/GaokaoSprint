import os
import json
import re
from pypdf import PdfReader

def extract_answers_from_pdf(pdf_path, source_name):
    print(f"Extracting answers from {pdf_path}...")
    try:
        reader = PdfReader(pdf_path)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n"
        
        results = {}
        # New strategy: support multiple tags used in different paper versions
        # 【答案】 is standard for some, 故选： and 故答案为： for others
        results = {}
        
        # We'll use a regex to find any of these tags
        tag_pattern = r'【答案】|故选：|故答案为：'
        matches = list(re.finditer(tag_pattern, full_text))
        
        for m in matches:
            pos = m.start()
            tag = m.group()
            
            lookback_start = max(0, pos - 2000)
            lookback_text = full_text[lookback_start:pos]
            
            # Question headers usually start at the beginning of a line or after a marker
            # format like "1. " or "1．" or sometimes just "1 " or "1\n"
            # We want the LAST one before the answer tag.
            # Try specific patterns first (with dot or parenthesis)
            num_matches = list(re.finditer(r'(?:^|\n|　)(\d+)[\.．（]', lookback_text))
            if not num_matches:
                # Fallback for older or weirdly formatted papers where it's just a number on its own line
                num_matches = list(re.finditer(r'(?:^|\n|　)(\d+)\s*[\n\r]', lookback_text))
            
            if num_matches:
                q_num = num_matches[-1].group(1)
                
                # Answer extraction
                # Increase window to handle longer answers or weird formatting
                text_after_tag = full_text[pos + len(tag):pos + len(tag) + 300]
                
                # Check for choice first
                # We look at the very beginning of the cleaned text
                clean_after = text_after_tag.strip()
                
                # Choice matching: A-D followed by something that clearly ends the answer
                choice_match = re.match(r'^([A-D]+)(?:\s+|【解析】|．|\n|$)', clean_after)
                if choice_match:
                    ans = choice_match.group(1)
                    if q_num not in results:
                        results[q_num] = list(ans) if len(ans) > 1 else ans
                else:
                    # Fill-in answer extraction
                    # Take everything until next delimiter or double newline
                    fill_in_match = re.search(r'^(.*?)(?=【解析】|【分析】|【解答】|\n\s*\d+[\.．]|\n\n|．|$)', clean_after, re.DOTALL)
                    if fill_in_match:
                        ans = fill_in_match.group(1).strip()
                        if ans and q_num not in results:
                            # Extra cleanup
                            ans = ans.replace('$', '').strip()
                            if ans: # Avoid empty strings
                                results[q_num] = ans
            
            # pos = full_text.find(tag, pos + len(tag)) -- handled by finditer now

        print(f"  Found {len(results)} answers for {source_name}")
        # Debug: list found numbers
        if results:
            nums = sorted([int(k) for k in results.keys()])
            print(f"  Numbers: {nums}")
            
        return results

    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
        return {}

def update_json_with_answers(answers_map, target_json):
    """
    answers_map: { source_name: { q_num: answer } }
    """
    if not os.path.exists(target_json):
        print(f"Error: {target_json} not found.")
        return

    with open(target_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated_count = 0
    for q in data:
        source = q.get("source")
        q_num = q.get("question_number")
        
        if source in answers_map and q_num in answers_map[source]:
            new_ans = answers_map[source][q_num]
            # Update answer for all small question types
            q["answer"] = new_ans
            updated_count += 1

    with open(target_json, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully updated {updated_count} answers in {target_json}")

if __name__ == "__main__":
    target_json = "/Users/yeatom/VSCodeProjects/gaokao/next-app/src/data/math/small_questions.json"
    
    tasks = [
        # 2021
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（文）（全国乙卷）（新课标Ⅰ）（解析卷）.pdf", "2021年高考数学试卷（文）（全国乙卷）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（文）（全国甲卷）（解析卷）.pdf", "2021年高考数学试卷（文）（全国甲卷）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（新高考Ⅰ卷）（解析卷）.pdf", "2021年高考数学试卷（新高考Ⅰ卷）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（新高考Ⅱ卷）（解析卷）.pdf", "2021年高考数学试卷（新高考Ⅱ卷）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（理）（全国乙卷）（新课标Ⅰ）（解析卷）.pdf", "2021年高考数学试卷（理）（全国乙卷）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2021·高考数学真题/2021年高考数学试卷（理）（全国甲卷）（解析卷）.pdf", "2021年高考数学试卷（理）（全国甲卷）"),
        # 2020
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（文）（新课标Ⅰ）（解析卷）.pdf", "2020年高考数学试卷（文）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（文）（新课标Ⅱ）（解析卷）.pdf", "2020年高考数学试卷（文）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（文）（新课标Ⅲ）（解析卷）.pdf", "2020年高考数学试卷（文）（新课标Ⅲ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（新高考Ⅰ卷）（山东）（解析卷）.pdf", "2020年高考数学试卷（新高考Ⅰ卷）（山东）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（新高考Ⅱ卷）（海南）（解析卷）.pdf", "2020年高考数学试卷（新高考Ⅱ卷）（海南）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（理）（新课标Ⅰ）（解析卷）.pdf", "2020年高考数学试卷（理）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（理）（新课标Ⅱ）（解析卷）.pdf", "2020年高考数学试卷（理）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2020·高考数学真题/2020年高考数学试卷（理）（新课标Ⅲ）（解析卷）.pdf", "2020年高考数学试卷（理）（新课标Ⅲ）"),
        # 2019
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（文）（新课标Ⅰ）（解析卷）.pdf", "2019年高考数学试卷（文）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（文）（新课标Ⅱ）（解析卷）.pdf", "2019年高考数学试卷（文）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（文）（新课标Ⅲ）（解析卷）.pdf", "2019年高考数学试卷（文）（新课标Ⅲ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（理）（新课标Ⅰ）（解析卷）.pdf", "2019年高考数学试卷（理）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（理）（新课标Ⅱ）（解析卷）.pdf", "2019年高考数学试卷（理）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2019·高考数学真题/2019年高考数学试卷（理）（新课标Ⅲ）（解析卷）.pdf", "2019年高考数学试卷（理）（新课标Ⅲ）"),
        # 2018
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（文）（新课标Ⅰ）（解析卷）.pdf", "2018年高考数学试卷（文）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（文）（新课标Ⅱ）（解析卷）.pdf", "2018年高考数学试卷（文）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（文）（新课标Ⅲ）（解析卷）.pdf", "2018年高考数学试卷（文）（新课标Ⅲ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（理）（新课标Ⅰ）（解析卷）.pdf", "2018年高考数学试卷（理）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（理）（新课标Ⅱ）（解析卷）.pdf", "2018年高考数学试卷（理）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2018·高考数学真题/2018年高考数学试卷（理）（新课标Ⅲ）（解析卷）.pdf", "2018年高考数学试卷（理）（新课标Ⅲ）"),
        # 2017
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（文）（新课标Ⅰ）（解析卷）.pdf", "2017年高考数学试卷（文）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（文）（新课标Ⅱ）（解析卷）.pdf", "2017年高考数学试卷（文）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（文）（新课标Ⅲ）（解析卷）.pdf", "2017年高考数学试卷（文）（新课标Ⅲ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（理）（新课标Ⅰ）（解析卷）.pdf", "2017年高考数学试卷（理）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（理）（新课标Ⅱ）（解析卷）.pdf", "2017年高考数学试卷（理）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2017·高考数学真题/2017年高考数学试卷（理）（新课标Ⅲ）（解析卷）.pdf", "2017年高考数学试卷（理）（新课标Ⅲ）"),
        # 2016
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（文）（新课标Ⅰ）（解析卷）.pdf", "2016年高考数学试卷（文）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（文）（新课标Ⅱ）（解析卷）.pdf", "2016年高考数学试卷（文）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（文）（新课标Ⅲ）（解析卷）.pdf", "2016年高考数学试卷（文）（新课标Ⅲ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（理）（新课标Ⅰ）（解析卷）.pdf", "2016年高考数学试卷（理）（新课标Ⅰ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（理）（新课标Ⅱ）（解析卷）.pdf", "2016年高考数学试卷（理）（新课标Ⅱ）"),
        ("/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math/2016·高考数学真题/2016年高考数学试卷（理）（新课标Ⅲ）（解析卷）.pdf", "2016年高考数学试卷（理）（新课标Ⅲ）"),
    ]
    
    all_answers = {}
    for pdf_path, source in tasks:
        if os.path.exists(pdf_path):
            ans = extract_answers_from_pdf(pdf_path, source)
            if ans:
                all_answers[source] = ans
        else:
            print(f"Skip missing: {pdf_path}")
            
    if all_answers:
        update_json_with_answers(all_answers, target_json)
