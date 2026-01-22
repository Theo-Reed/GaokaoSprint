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

export interface QuizQuestion {
  id: string;
  question: string;
  expected: string;
  explanation: string;
  categoryId: string;
}

// 12 Levels = 12 Distinct Knowledge Points
export const ANALYSIS_LEVELS: SentenceData[] = [
  // L1: Attributive Clause (General)
  {
    id: 1,
    text: "The experiment that the scientists conducted failed due to the temperature changes.",
    answerKey: { subject: [0, 1], verb: [6], object: [] },
    translation: "科学家们进行的那个实验因为温度变化而失败了。",
    difficulty: "Level 1",
    tags: ["Attributive Clause"],
    algorithm: ["1. Scan verbs...", "2. 'Conducted' follows 'that'...", "3. 'Failed' is Main Verb."],
    traps: { 5: "❌ 'Conducted' is inside the clause." },
    categoryId: "attributive_general"
  },
  // L2: Gerund Subject
  {
    id: 2,
    text: "Understanding the cultural differences helps tourists avoid embarrassing situations.",
    answerKey: { subject: [0, 1, 2, 3], verb: [4], object: [5] },
    translation: "理解文化差异有助于游客避免尴尬的处境。",
    difficulty: "Level 2",
    tags: ["Gerund Subject"],
    algorithm: ["1. 'Understanding' starts sentence -> Gerund Subject.", "2. Main Verb is 'helps'."],
    traps: { 6: "❌ 'Avoid' is object complement." },
    categoryId: "gerund_subject"
  },
  // L3: Noun Clause (Subject Clause)
  {
    id: 3,
    text: "What matters is not what you say but what you do.",
    answerKey: { subject: [0, 1], verb: [2], object: [3, 4, 5, 6, 7, 8, 9, 10] },
    translation: "重要的不是你说什么，而是你做什么。",
    difficulty: "Level 2",
    tags: ["Noun Clause"],
    algorithm: ["1. 'What matters' is subject clause.", "2. 'Is' is link verb."],
    traps: { 1: "❌ Verb inside subject clause." },
    categoryId: "noun_clause_subject"
  },
  // L4: Past Participle (Modifier)
  {
    id: 4,
    text: "The question discussed at the meeting yesterday was very important.",
    answerKey: { subject: [0, 1], verb: [7], object: [8, 9] },
    translation: "昨天会议上讨论的那个问题非常重要。",
    difficulty: "Level 3",
    tags: ["Past Participle"],
    algorithm: ["1. 'Discussed' is passive modifier.", "2. 'Was' is main verb."],
    traps: { 2: "❌ 'Discussed' is a modifier here." },
    categoryId: "past_participle"
  },
  // L5: Present Participle (Adverbial)
  {
    id: 5,
    text: "Walking down the street, I saw a friend of mine.",
    answerKey: { subject: [4], verb: [5], object: [6, 7, 8, 9] },
    translation: "走在街上时，我看见了我的一位朋友。",
    difficulty: "Level 3",
    tags: ["Present Participle"],
    algorithm: ["1. 'Walking...' is adverbial.", "2. Subject is 'I'."],
    traps: { 0: "❌ Modifier, not subject." },
    categoryId: "present_participle"
  },
  // L6: Appositive Clause
  {
    id: 6,
    text: "The fact that he failed the exam surprised us all.",
    answerKey: { subject: [0, 1], verb: [7], object: [8, 9] },
    translation: "他考试不及格的这个事实让我们都很吃惊。",
    difficulty: "Boss Fight",
    tags: ["Appositive Clause"],
    algorithm: ["1. 'Fact' + 'that' = Appositive.", "2. 'Surprised' is main verb."],
    traps: { 4: "❌ Verb inside clause." },
    categoryId: "appositive_clause"
  },
  // L7: Inversion
  {
    id: 7,
    text: "Only by working hard can you achieve your goal.",
    answerKey: { subject: [5], verb: [4, 6], object: [7, 8] },
    translation: "只有努力工作，你才能实现目标。",
    difficulty: "Boss Fight",
    tags: ["Inversion"],
    algorithm: ["1. Only + Adverbial -> Inversion.", "2. 'Can' moves before subject."],
    traps: { 4: "⚠️ Standard inversion." },
    categoryId: "inversion"
  },
  // L8: Attributive with Preposition
  {
    id: 8,
    text: "The house in which he lives stands on a hill.",
    answerKey: { subject: [0, 1], verb: [6], object: [] },
    translation: "他住的那座房子位于小山上。",
    difficulty: "Boss Fight",
    tags: ["Attributive + Prep"],
    algorithm: ["1. 'In which' starts clause.", "2. 'Stands' is main verb."],
    traps: { 5: "❌ Verb inside clause." },
    categoryId: "attributive_prep"
  },
  // L9: Subjunctive Mood
  {
    id: 9,
    text: "If I were you, I would seize the opportunity without hesitation.",
    answerKey: { subject: [4], verb: [5, 6], object: [7, 8] },
    translation: "如果我是你，我会毫不犹豫地抓住这个机会。",
    difficulty: "Level 3",
    tags: ["Subjunctive"],
    algorithm: ["1. 'If' + 'were' -> Subjunctive.", "2. 'Would seize' is main verb."],
    traps: { 2: "ℹ️ 'Were' is subjunctive be." },
    categoryId: "subjunctive"
  },
  // L10: Emphasis
  {
    id: 10,
    text: "It was in the library that I met the professor yesterday.",
    answerKey: { subject: [0], verb: [1], object: [] },
    translation: "正是昨天在图书馆，我遇见了那位教授。",
    difficulty: "Level 3",
    tags: ["Emphasis"],
    algorithm: ["1. It is...that structure.", "2. Emphasis on location."],
    traps: { 5: "⚠️ 'That' is part of emphasis frame." },
    categoryId: "emphasis"
  },
  // L11: Formal Object (It)
  {
    id: 11,
    text: "I found it difficult to finish the work on time.",
    answerKey: { subject: [0], verb: [1], object: [2] },
    translation: "我发现按时完成这项工作很难。",
    difficulty: "Boss Fight",
    tags: ["Formal Object"],
    algorithm: ["1. 'It' is placeholder object.", "2. Real object is infinitive."],
    traps: { 2: "⚠️ Formal Object." },
    categoryId: "formal_object"
  },
  // L12: Subject-Verb Agreement
  {
    id: 12,
    text: "The teacher as well as the students was excited about the trip.",
    answerKey: { subject: [0, 1], verb: [7], object: [] },
    translation: "老师和学生们都对这次旅行感到兴奋。",
    difficulty: "Boss Fight",
    tags: ["Agreement"],
    algorithm: ["1. 'A as well as B' -> Agrees with A.", "2. 'Teacher' is singular."],
    traps: { 6: "❌ 'Students' is plural but ignored." },
    categoryId: "sv_agreement"
  }
];

// 12 Quiz Categories matching the 12 Levels
export const EXAM_POOL: QuizQuestion[] = [
  
  // 1. Attributive General (that/which/who/whose)
  { id: 'att_1', categoryId: 'attributive_general', question: "The book ______ cover is broken is mine.", expected: "whose", explanation: "先行词book与cover是所属关系 (book's cover)。" },
  { id: 'att_2', categoryId: 'attributive_general', question: "He is the man ______ helped me.", expected: "who", explanation: "先行词man是指人，做主语。" },
  { id: 'att_3', categoryId: 'attributive_general', question: "The car ______ bought yesterday is fast.", expected: "which", explanation: "先行词car指物，可以用which/that。" },
  { id: 'att_4', categoryId: 'attributive_general', question: "I remember the day ______ we met.", expected: "when", explanation: "先行词day指时间，从句完整，用when。" },

  // 2. Gerund Subject (Doing...)
  { id: 'ger_1', categoryId: 'gerund_subject', question: "______ (Swim) is good for health.", expected: "Swimming", explanation: "动名词作主语，谓语用单数。" },
  { id: 'ger_2', categoryId: 'gerund_subject', question: "______ (Read) aloud helps pronunciation.", expected: "Reading", explanation: "动名词作主语。" },
  { id: 'ger_3', categoryId: 'gerund_subject', question: "It is no use ______ (cry) over spilt milk.", expected: "crying", explanation: "It is no use doing sth." },
  { id: 'ger_4', categoryId: 'gerund_subject', question: "Your ______ (come) late made him angry.", expected: "coming", explanation: "动名词复合结构 (Your coming)。" },

  // 3. Noun Clause - Subject/Object (What/That...)
  { id: 'nc_1', categoryId: 'noun_clause_subject', question: "______ he said is true.", expected: "What", explanation: "从句缺宾语(said what)，主句缺主语，用What。" },
  { id: 'nc_2', categoryId: 'noun_clause_subject', question: "______ the earth goes round the sun is a fact.", expected: "That", explanation: "主语从句结构完整，不缺成分，但That不可省。" },
  { id: 'nc_3', categoryId: 'noun_clause_subject', question: "It is unknown ______ he will come.", expected: "whether", explanation: "It做形式主语，真正主语从句表'是否'。" },
  { id: 'nc_4', categoryId: 'noun_clause_subject', question: "______ we need is time.", expected: "What", explanation: "need缺宾语，用What。" },

  // 4. Past Participle (Modifier/Passive)
  { id: 'pp_1', categoryId: 'past_participle', question: "The cup ______ (break) by him was expensive.", expected: "broken", explanation: "过去分词作后置定语，表被动。" },
  { id: 'pp_2', categoryId: 'past_participle', question: "______ (Compare) with him, I am lucky.", expected: "Compared", explanation: "过去分词作状语，I与Compare是被动关系。" },
  { id: 'pp_3', categoryId: 'past_participle', question: "Is this the book ______ (write) by Lu Xun?", expected: "written", explanation: "过去分词作定语。" },
  { id: 'pp_4', categoryId: 'past_participle', question: "The city, ______ (locate) in the north, is cold.", expected: "located", explanation: "be located in, 过去分词作非限制性定语/状语。" },

  // 5. Present Participle (Active/Adverbial)
  { id: 'prp_1', categoryId: 'present_participle', question: "______ (Hear) the noise, he jumped up.", expected: "Hearing", explanation: "主动动作，一...就...。" },
  { id: 'prp_2', categoryId: 'present_participle', question: "The girl ______ (stand) there is my sister.", expected: "standing", explanation: "现在分词作后置定语，表主动进行。" },
  { id: 'prp_3', categoryId: 'present_participle', question: "He sat there, ______ (wait) for the bus.", expected: "waiting", explanation: "伴随状语，主动。" },
  { id: 'prp_4', categoryId: 'present_participle', question: "Time ______ (permit), we will go.", expected: "permitting", explanation: "独立主格结构，Time与permit是主动关系。" },

  // 6. Appositive Clause (Fact/News that...)
  { id: 'app_1', categoryId: 'appositive_clause', question: "The news ______ our team won is true.", expected: "that", explanation: "同位语从句，解释news，结构完整，用that。" },
  { id: 'app_2', categoryId: 'appositive_clause', question: "He expressed the hope ______ he would visit China.", expected: "that", explanation: "解释hope的内容。" },
  { id: 'app_3', categoryId: 'appositive_clause', question: "There is no doubt ______ he is honest.", expected: "that", explanation: "no doubt后接that从句。" },
  { id: 'app_4', categoryId: 'appositive_clause', question: "I define the idea ______ money is everything.", expected: "that", explanation: "同位语从句解释idea。" },

  // 7. Inversion (Only/Never...)
  { id: 'inv_1', categoryId: 'inversion', question: "Never ______ (will) I give up.", expected: "will", explanation: "Never置于句首，部分倒装。" },
  { id: 'inv_2', categoryId: 'inversion', question: "Only then ______ (did) I realize my mistake.", expected: "did", explanation: "Only+状语置于句首，部分倒装。" },
  { id: 'inv_3', categoryId: 'inversion', question: "Hardly had I arrived ______ the phone rang.", expected: "when", explanation: "Hardly...when..." },
  { id: 'inv_4', categoryId: 'inversion', question: "Down ______ (jump) the cat.", expected: "jumped", explanation: "方位副词置于句首，全部倒装。" },

  // 8. Attributive + Preposition (in which...)
  { id: 'attp_1', categoryId: 'attributive_prep', question: "The room in ______ I live is small.", expected: "which", explanation: "介词in后指物用which。" },
  { id: 'attp_2', categoryId: 'attributive_prep', question: "The person with ______ I talked is nice.", expected: "whom", explanation: "介词with后指人用whom。" },
  { id: 'attp_3', categoryId: 'attributive_prep', question: "The reason for ______ he was late is clear.", expected: "which", explanation: "for which = why。" },
  { id: 'attp_4', categoryId: 'attributive_prep', question: "This is the pen with ______ he writes.", expected: "which", explanation: "Tool case: write with the pen." },

  // 9. Subjunctive Mood (If...were...)
  { id: 'sub_1', categoryId: 'subjunctive', question: "If I ______ (know) his number, I would call him.", expected: "knew", explanation: "对现在情况的虚拟，从句用过去式。" },
  { id: 'sub_2', categoryId: 'subjunctive', question: "He looks as if he ______ (be) ill.", expected: "were", explanation: "as if后接虚拟。" },
  { id: 'sub_3', categoryId: 'subjunctive', question: "I wish I ______ (go) to the party yesterday.", expected: "had gone", explanation: "对过去情况的虚拟 (had done)。" },
  { id: 'sub_4', categoryId: 'subjunctive', question: "If it ______ (rain) tomorrow, we would stay home.", expected: "should rain", explanation: "对将来的虚拟 (should do/were to do)。" },

  // 10. Emphasis (It is...that...)
  { id: 'emp_1', categoryId: 'emphasis', question: "It was yesterday ______ I met him.", expected: "that", explanation: "强调时间状语。" },
  { id: 'emp_2', categoryId: 'emphasis', question: "It is Tom ______ broke the window.", expected: "who", explanation: "强调人，可以用who或that。" },
  { id: 'emp_3', categoryId: 'emphasis', question: "Was it at school ______ you saw her?", expected: "that", explanation: "强调句疑问形式。" },
  { id: 'emp_4', categoryId: 'emphasis', question: "It was not until 9pm ______ he came back.", expected: "that", explanation: "强调not until结构。" },

  // 11. Formal Object (it)
  { id: 'fo_1', categoryId: 'formal_object', question: "I find ______ hard to learn Math.", expected: "it", explanation: "find it adj to do." },
  { id: 'fo_2', categoryId: 'formal_object', question: "He thinks ______ necessary to wait.", expected: "it", explanation: "think it adj to do." },
  { id: 'fo_3', categoryId: 'formal_object', question: "They made ______ clear that they would go.", expected: "it", explanation: "make it clear that..." },
  { id: 'fo_4', categoryId: 'formal_object', question: "I feel ______ a honor to be here.", expected: "it", explanation: "feel it a noun to do." },

  // 12. Subject-Verb Agreement
  { id: 'sva_1', categoryId: 'sv_agreement', question: "The teacher, with his students, ______ (is) coming.", expected: "is", explanation: "with连接主语，谓语看前面的主语。" },
  { id: 'sva_2', categoryId: 'sv_agreement', question: "Either you or he ______ (be) right.", expected: "is", explanation: "Either...or... 就近原则 (he is)。" },
  { id: 'sva_3', categoryId: 'sv_agreement', question: "Two hours ______ (be) enough.", expected: "is", explanation: "时间金钱距离看作整体，单数。" },
  { id: 'sva_4', categoryId: 'sv_agreement', question: "Not only I but also he ______ (like) soccer.", expected: "likes", explanation: "Not only...but also... 就近原则 (he likes)。" },
];
