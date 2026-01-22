export interface SentenceData {
  id: number;
  text: string;
  answerKey: {
    subject: number[];
    verb: number[];
    object: number[];
  };
  translation: string;
  difficulty: 'Level 1' | 'Level 2' | 'Level 3' | 'Boss Fight';
  tags?: string[];
  algorithm: string[];
  traps: Record<number, string>;
  tips?: string;
  categoryId?: string;
}

// 12 Levels = Structured Syntax Analysis Training
export const ANALYSIS_LEVELS: SentenceData[] = [
  // L1: Tense & Voice (Future Perfect)
  {
    id: 1,
    text: "By the time you return next month, I will have finished the project.",
    answerKey: { subject: [7], verb: [8, 9, 10], object: [11, 12] },
    translation: "到你下个月回来时，我将已经完成了这个项目。",
    difficulty: "Level 1",
    tags: ["Time & Voice", "Future Perfect"],
    algorithm: ["1. 'By the time' + present -> Main clause uses Future Perfect.", "2. 'will have finished' is the predicate."],
    traps: { 4: "🚫 'return' is in the adverbial clause." },
    categoryId: "tense_voice"
  },
  // L2: Modals (Must have done)
  {
    id: 2,
    text: "The ground is wet; it must have rained last night.",
    answerKey: { subject: [5], verb: [6, 7, 8], object: [] },
    translation: "地是湿的；昨晚一定下雨了。",
    difficulty: "Level 1",
    tags: ["Modal Verbs", "Deduction"],
    algorithm: ["1. 'must have done' indicates strong positive deduction about the past.", "2. 'rained' is the main action."],
    traps: { 2: "❌ 'wet' is an adjective (predicative)." },
    categoryId: "modals"
  },
  // L3: Non-Finite (Gerund/Infinitive)
  {
    id: 3,
    text: "It is no use crying over spilt milk.",
    answerKey: { subject: [0], verb: [1, 2, 3], object: [] },
    translation: "覆水难收 (为打翻的牛奶哭泣是没用的)。",
    difficulty: "Level 2",
    tags: ["Non-finite", "Gerund"],
    algorithm: ["1. 'It' is formal subject.", "2. 'Crying...' is the real subject (Gerund)."],
    traps: { 4: "ℹ️ 'Crying' is the real subject here." },
    categoryId: "nonfinite_basic"
  },
  // L4: Non-Finite (Participle Modifiers)
  {
    id: 4,
    text: "The questions discussed at the meeting were very important.",
    answerKey: { subject: [0, 1], verb: [6], object: [7, 8] },
    translation: "会议上讨论的那些问题非常重要。",
    difficulty: "Level 2",
    tags: ["Non-finite", "Past Participle"],
    algorithm: ["1. 'Discussed' is a past participle modifier.", "2. 'Were' is the main verb."],
    traps: { 2: "❌ 'Discussed' is not the main predicate here." },
    categoryId: "nonfinite_adv"
  },
  // L5: Attributive Clauses (Prep + Rel)
  {
    id: 5,
    text: "The house in which he lives covers a large area.",
    answerKey: { subject: [0, 1], verb: [6], object: [7, 8, 9] },
    translation: "他住的那座房子占地面积很大。",
    difficulty: "Level 3",
    tags: ["Attributive", "Prep+Which"],
    algorithm: ["1. 'in which' leads the attributive clause.", "2. 'covers' is the main verb for 'house'."],
    traps: { 5: "❌ 'lives' is inside the clause." },
    categoryId: "attributive"
  },
  // L6: Noun Clauses (What clause)
  {
    id: 6,
    text: "What matters most is not what you say but what you do.",
    answerKey: { subject: [0, 1, 2], verb: [3], object: [4, 5, 6, 7, 8, 9, 10, 11] },
    translation: "最重要的不是之后说什么，而是你做什么。",
    difficulty: "Level 3",
    tags: ["Noun Clause", "Subject Clause"],
    algorithm: ["1. 'What matters most' is the subject clause.", "2. 'is' is the linking verb."],
    traps: { 1: "❌ 'matters' is the verb of the subject clause." },
    categoryId: "noun_clauses"
  },
  // L7: Adverbial Clauses (Condition)
  {
    id: 7,
    text: "Unless you work hard, you will never succeed.",
    answerKey: { subject: [5], verb: [6, 7, 8], object: [] },
    translation: "除非你努力工作，否则你绝不会成功。",
    difficulty: "Level 2",
    tags: ["Adverbial Clause", "Condition"],
    algorithm: ["1. 'Unless' starts a conditional clause.", "2. Main clause starts at 'you'."],
    traps: { 2: "❌ 'work' is in the subordinate clause." },
    categoryId: "adverbial"
  },
  // L8: Inversion (Only/Negative)
  {
    id: 8,
    text: "Not until he left did I realize the truth.",
    answerKey: { subject: [5], verb: [6, 7], object: [8, 9] },
    translation: "直到他离开，我才意识到真相。",
    difficulty: "Boss Fight",
    tags: ["Inversion", "Special Structure"],
    algorithm: ["1. 'Not until' at start -> Partial Inversion.", "2. Aux 'did' placed before Subject 'I'."],
    traps: { 6: "ℹ️ 'did' is the auxiliary verb part of predicate." },
    categoryId: "inversion"
  },
  // L9: Emphasis & It Structure
  {
    id: 9,
    text: "It is due to his effort that we solved the problem.",
    answerKey: { subject: [5], verb: [6], object: [7, 8] },
    translation: "正是由于他的努力，我们才解决了这个问题。",
    difficulty: "Level 3",
    tags: ["Emphasis", "It is...that"],
    algorithm: ["1. Emphasis on 'due to his effort'.", "2. Real sentence: We solved problem due to..."],
    traps: { 0: "❌ 'It' is empty in emphasis pattern." },
    categoryId: "emphasis_it"
  },
  // L10: Subjunctive Mood
  {
    id: 10,
    text: "If I were to relive my life, I would do things differently.",
    answerKey: { subject: [7], verb: [8, 9], object: [10] },
    translation: "如果我能重活一次，我会换种做法。",
    difficulty: "Boss Fight",
    tags: ["Subjunctive", "Hypothesis"],
    algorithm: ["1. 'were to' -> Future hypothetical.", "2. Main clause uses 'would do'."],
    traps: { 10: "❌ 'differently' is adverb." },
    categoryId: "subjunctive"
  },
  // L11: Adj/Adv Comparison
  {
    id: 11,
    text: "The more books you read, the broadly you will think.",
    answerKey: { subject: [5], verb: [6, 7], object: [] },
    translation: "读的书越多，思考得越宽广。",
    difficulty: "Level 2",
    tags: ["Adjectives", "The more...the more"],
    algorithm: ["1. 'The more...the more...' structure.", "2. Subject-verb order in second half is normal."],
    traps: { 1: "❌ 'more' modifies books." },
    categoryId: "adj_adv"
  },
  // L12: Subject-Verb Agreement
  {
    id: 12,
    text: "The teacher as well as the students was excited.",
    answerKey: { subject: [0, 1], verb: [7], object: [] },
    translation: "老师和学生们都很兴奋。",
    difficulty: "Level 2",
    tags: ["SV Agreement"],
    algorithm: ["1. 'as well as' phrases don't change number.", "2. 'teacher' is singular -> 'was'."],
    traps: { 6: "❌ 'students' is nearest but ignored." },
    categoryId: "agreement"
  },
  // L13: Phrasal Verbs & Collocations (固定搭配)
  {
    id: 13,
    text: "He looks forward to visiting the Great Wall.",
    answerKey: { subject: [0], verb: [1, 2, 3], object: [4, 5, 6, 7] },
    translation: "他期待着参观长城。",
    difficulty: "Level 2",
    tags: ["Phrasal Verbs", "Gerund"],
    algorithm: ["1. Identify verb phrase 'looks forward to'.", "2. 'to' is preposition here, followed by V-ing."],
    traps: { 4: "❌ 'visit' (Root form is wrong because 'to' is prep)." },
    categoryId: "phrasal_collo"
  },
  // L14: Ultimate Challenge (终极长难句 & 上下文)
  {
    id: 14,
    text: "Had he known what was to happen during the expedition to the Antarctic, he would never have left his warm home, let alone engaged in such a dangerous adventure.",
    // Words breakdown:
    // 0:Had 1:he 2:known 3:what 4:was 5:to 6:happen 7:during 8:the 9:expedition 10:to 11:the 12:Antarctic,
    // 13:he(S) 14:would 15:never 16:have 17:left(V) 18:his 19:warm 20:home,(O) ...
    answerKey: { subject: [13], verb: [14, 15, 16, 17], object: [18, 19, 20] },
    translation: "如果他知道南极探险期间会发生什么，他绝不会离开温暖的家，更不用说参与这样危险的冒险了。",
    difficulty: "Level 3",
    tags: ["Virtual Mood", "Inversion", "Noun Clause"],
    algorithm: ["1. 'Had he known' = If he had known (Virtual Past Perfect).", "2. Main clause uses 'would have done' for past hypothesis."],
    traps: { 0: "❌ Looks like a question but is inverted condition." },
    categoryId: "ultimate_context"
  }
];
