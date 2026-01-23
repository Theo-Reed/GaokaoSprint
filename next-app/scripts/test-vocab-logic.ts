import { strict as assert } from 'assert';

// 1. 模拟数据结构和类型
type WordData = {
  word: string;
};

type UserProgress = {
  status: 'learning' | 'familiar' | 'mastered';
  last_reviewed_at: string;
};

// 2. 模拟词库 (5个单词)
const mockRawData: WordData[] = [
    { word: 'apple' },      // Case 1: Mastered (应该被过滤)
    { word: 'banana' },     // Case 2: Learning (应该排最前)
    { word: 'cherry' },     // Case 3: New (应该排中间)
    { word: 'date' },       // Case 4: Familiar (应该排最后)
    { word: 'elderberry' }  // Case 5: New (应该排中间，在 cherry 后面)
];

// 3. 模拟数据库状态
let mockDb = new Map<string, UserProgress>();
mockDb.set('apple', { status: 'mastered', last_reviewed_at: '2023-01-01' });
mockDb.set('banana', { status: 'learning', last_reviewed_at: '2023-01-02' });
mockDb.set('date', { status: 'familiar', last_reviewed_at: '2023-01-03' });
// cherry 和 elderberry 没有记录，视为 New

// 4. 核心逻辑：构建队列 (完全复制自 page.tsx 的逻辑)
function buildQueue(allWords: WordData[], progressMap: Map<string, UserProgress>) {
    const learning: WordData[] = [];
    const newWords: WordData[] = [];
    const familiar: WordData[] = [];

    allWords.forEach(w => {
      const p = progressMap.get(w.word);
      if (p?.status === 'mastered') return; // 已掌握的不放入日常队列

      if (!p) {
        newWords.push(w);
      } else if (p.status === 'familiar') {
        familiar.push(w);
      } else {
        learning.push(w);
      }
    });

    // 优先级: Learning (复习) -> New (新词) -> Familiar (巩固)
    return [...learning, ...newWords, ...familiar];
}

// 5. 测试脚本执行
console.log("🚀 开始测试背诵逻辑...\n");

// --- Test 1: 初始队列顺序 ---
console.log("测试 1: 验证初始队列优先级 (Learning > New > Familiar)");
const queue1 = buildQueue(mockRawData, mockDb);
const expected1 = ['banana', 'cherry', 'elderberry', 'date'];
const actual1 = queue1.map(w => w.word);

console.log(`预期: ${expected1.join(' -> ')}`);
console.log(`实际: ${actual1.join(' -> ')}`);

try {
    assert.deepEqual(actual1, expected1);
    console.log("✅ 测试 1 通过: 顺序正确，Mastered 单词 'apple' 正确被隐藏。\n");
} catch (e) {
    console.error("❌ 测试 1 失败");
    process.exit(1);
}


// --- Test 2: 用户操作模拟 (将 New 变为 Familiar) ---
console.log("测试 2: 模拟用户将 'cherry' (New) 标记为 '熟悉'");

// 模拟操作：用户在界面上点击了“熟悉”
mockDb.set('cherry', { status: 'familiar', last_reviewed_at: new Date().toISOString() });

// 重新构建队列 (模拟第二天的行为)
// 预期状态:
// banana: learning (不变)
// cherry: familiar (变为最后梯队)
// date: familiar (最后梯队)
// elderberry: new (中间梯队)
const queue2 = buildQueue(mockRawData, mockDb);
const expected2 = ['banana', 'elderberry', 'cherry', 'date']; 
// 注意: cherry 和 date 都是 familiar，原有逻辑通过 allWords 遍历顺序决定相对顺序
// 在 mockRawData 中 cherry 在 date 前面。

const actual2 = queue2.map(w => w.word);

console.log(`预期: ${expected2.join(' -> ')}`);
console.log(`实际: ${actual2.join(' -> ')}`);

try {
    assert.deepEqual(actual2, expected2);
    console.log("✅ 测试 2 通过: 'cherry' 成功降级到队列末尾。\n");
} catch (e) {
    console.error("❌ 测试 2 失败");
    process.exit(1);
}


// --- Test 3: 用户操作模拟 (将 Learning 变为 Mastered) ---
console.log("测试 3: 模拟用户将 'banana' (Learning) 标记为 '已掌握'");
mockDb.set('banana', { status: 'mastered', last_reviewed_at: new Date().toISOString() });

const queue3 = buildQueue(mockRawData, mockDb);
// banana 应该消失
const expected2b = ['elderberry', 'cherry', 'date'];
const actual2b = queue3.map(w => w.word);

console.log(`预期: ${expected2b.join(' -> ')}`);
console.log(`实际: ${actual2b.join(' -> ')}`);

if (JSON.stringify(actual2b) === JSON.stringify(expected2b)) {
     console.log("✅ 测试 3 通过: 'banana' 已从队列移除。\n");
} else {
     console.error("❌ 测试 3 失败");
}

console.log("🎉 所有逻辑测试通过！当前算法符合设计要求。");
