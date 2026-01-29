import json

path = 'next-app/src/data/biology/small_questions.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

answers_map = {
    '2023年高考生物试卷（重庆）': {str(i): a for i, a in enumerate(['A', 'C', 'D', 'B', 'D', 'C', 'C', 'A', 'D', 'D', 'A', 'B', 'B', 'C', 'A'], 1)},
    '2023年高考生物试卷（福建）': {str(i): a for i, a in enumerate(list('DCACCDDBCDBABA'), 1)},
    '2023年高考生物试卷（辽宁）': {str(i): a for i, a in enumerate(['C', 'A', 'C', 'C', 'A', 'B', 'D', 'B', 'D', 'A', 'B', 'C', 'D', 'D', 'C', 'ABC', 'AD', 'A', 'BC', 'A'], 1)},
    '2023年高考生物试卷（河北）': {str(i): a for i, a in enumerate(['D', 'C', 'B', 'C', 'C', 'ABD', 'ABC'], 1)}
}

count = 0
for q in data:
    source = q.get('source')
    num = q.get('question_number')
    if source in answers_map and num in answers_map[source]:
        ans = answers_map[source][num]
        q['answer'] = ans
        if len(ans) > 1:
            q['type'] = 'multi_choice'
        count += 1

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Updated {count} questions.")
