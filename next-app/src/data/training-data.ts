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
  categoryId?: string; // Links to QuizPool category
}

export interface QuizQuestion {
  id: string;
  question: string; // The sentence with a blank as underscores
  expected: string; // The correct answer word
  explanation: string;
  categoryId: string; // 'attributive', 'gerund', 'non-predicate', etc.
}

// Map existing levels to Categories
export const ANALYSIS_LEVELS: SentenceData[] = [
  // --- LEVEL 1: 基础定语从句 (The "Which" Trap) ---
  {
    id: 1,
    text: "The experiment that the scientists conducted failed due to the temperature changes.",
    answerKey: { subject: [0, 1], verb: [6], object: [] },
    translation: "科学家们进行的那个实验因为温度变化而失败了。",
    difficulty: "Level 1",
    tags: ["Attributive Clause", "Subject Separation"],
    algorithm: ["1. Scan verbs...", "2. 'Conducted' follows 'that'...", "3. Eliminate clause...", "4. 'Failed' is Main Verb."],
    traps: { 5: "❌ 'Conducted' is inside the clause.", 11: "❌ 'Changes' is part of 'due to'." },
    categoryId: "attributive"
  },
  // --- LEVEL 2: 动名词作主语 (The "Ing" Trap) ---
  {
    id: 2,
    text: "Understanding the cultural differences helps tourists avoid embarrassing situations.",
    answerKey: { subject: [0, 1, 2, 3], verb: [4], object: [5] },
    translation: "理解文化差异有助于游客避免尴尬的处境。",
    difficulty: "Level 2",
    tags: ["Gerund Subject"],
    algorithm: ["1. 'Understanding' starts sentence...", "2. Is it Gerund? Yes.", "3. Main Verb is 'helps'."],
    traps: { 0: "ℹ️ Head of subject.", 6: "❌ 'Avoid' is object complement." },
    categoryId: "gerund"
  },
  // --- LEVEL 2: 从句套娃 (Noun Clause) ---
  {
    id: 3,
    text: "What matters is not what you say but what you do.",
    answerKey: { subject: [0, 1], verb: [2], object: [3, 4, 5, 6, 7, 8, 9, 10] },
    translation: "重要的不是你说什么，而是你做什么。",
    difficulty: "Level 2",
    tags: ["Noun Clause"],
    algorithm: ["1. 'What matters' is subject clause.", "2. 'Is' is link verb."],
    traps: { 1: "❌ Verb inside subject clause." },
    categoryId: "noun_clause"
  },
  // --- LEVEL 3: 非谓语 (Past Participle) ---
  {
    id: 4,
    text: "The question discussed at the meeting yesterday was very important.",
    answerKey: { subject: [0, 1], verb: [7], object: [8, 9] },
    translation: "昨天会议上讨论的那个问题非常重要。",
    difficulty: "Level 3",
    tags: ["Past Participle"],
    algorithm: ["1. 'Question' is discussed (passive).", "2. 'Discussed' is modifier.", "3. 'Was' is main verb."],
    traps: { 2: "❌ 'Discussed' is a modifier here." },
    categoryId: "non_predicate"
  },
  // --- LEVEL 3: 伴随状语 (Present Participle) ---
  {
    id: 5,
    text: "Walking down the street, I saw a friend of mine.",
    answerKey: { subject: [4], verb: [5], object: [6, 7, 8, 9] },
    translation: "走在街上时，我看见了我的一位朋友。",
    difficulty: "Level 3",
    tags: ["Adverbial Phrase"],
    algorithm: ["1. 'Walking...' is background action.", "2. Subject is 'I'."],
    traps: { 0: "❌ Modifier, not subject." },
    categoryId: "non_predicate"
  },
  // --- BOSS FIGHT: 同位语从句 ---
  {
    id: 6,
    text: "The fact that he failed the exam surprised us all.",
    answerKey: { subject: [0, 1], verb: [7], object: [8, 9] },
    translation: "他考试不及格的这个事实让我们都很吃惊。",
    difficulty: "Boss Fight",
    tags: ["Appositive Clause"],
    algorithm: ["1. 'Fact' + 'that' = Appositive.", "2. 'Surprised' is main verb."],
    traps: { 4: "❌ Verb inside clause." },
    categoryId: "noun_clause"
  },
  // --- BOSS FIGHT: 倒装句 ---
  {
    id: 7,
    text: "Only by working hard can you achieve your goal.",
    answerKey: { subject: [5], verb: [4, 6], object: [7, 8] },
    translation: "只有努力工作，你才能实现目标。",
    difficulty: "Boss Fight",
    tags: ["Inversion"],
    algorithm: ["1. Only + Adverbial -> Partial Inversion.", "2. 'Can' moves before subject."],
    traps: { 4: "⚠️ Standard inversion." },
    categoryId: "inversion"
  },
  // --- BOSS FIGHT: 介词+Which ---
  {
    id: 8,
    text: "The house in which he lives stands on a hill.",
    answerKey: { subject: [0, 1], verb: [6], object: [] },
    translation: "他住的那座房子位于小山上。",
    difficulty: "Boss Fight",
    tags: ["Attributive Clause"],
    algorithm: ["1. 'In which' = Relative Clause.", "2. 'Stands' is main verb."],
    traps: { 5: "❌ Verb inside clause." },
    categoryId: "attributive"
  },
  // --- LEVEL 4: 虚拟语气 ---
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
  // --- LEVEL 4: 强调句 ---
  {
    id: 10,
    text: "It was in the library that I met the professor yesterday.",
    answerKey: { subject: [0], verb: [1], object: [] },
    translation: "正是昨天在图书馆，我遇见了那位教授。",
    difficulty: "Level 3",
    tags: ["Emphasis"],
    algorithm: ["1. It is...that structure.", "2. Remaining sentence is complete."],
    traps: { 5: "⚠️ 'That' is part of emphasis frame." },
    categoryId: "emphasis"
  },
  // --- BOSS: 形式宾语 ---
  {
    id: 11,
    text: "I found it difficult to finish the work on time.",
    answerKey: { subject: [0], verb: [1], object: [2] },
    translation: "我发现按时完成这项工作很难。",
    difficulty: "Boss Fight",
    tags: ["Formal Object"],
    algorithm: ["1. 'It' is placeholder object.", "2. Real object is infinitive."],
    traps: { 2: "⚠️ Formal Object." },
    categoryId: "it_usage"
  },
  // --- BOSS: 主谓一致 ---
  {
    id: 12,
    text: "The teacher as well as the students was excited about the trip.",
    answerKey: { subject: [0, 1], verb: [7], object: [] },
    translation: "老师和学生们都对这次旅行感到兴奋。",
    difficulty: "Boss Fight",
    tags: ["Agreement"],
    algorithm: ["1. 'A as well as B' -> Agrees with A.", "2. 'Teacher' is singular."],
    traps: { 6: "❌ 'Students' is plural but ignored." },
    categoryId: "agreement"
  }
];

export const EXAM_POOL: QuizQuestion[] = [
  // --- Attributive Clauses ---
  { id: 'att_1', categoryId: 'attributive', question: "The experiment that the scientists ______ (conduct) failed.", expected: "conducted", explanation: "定语从句谓语，描述过去动作。" },
  { id: 'att_2', categoryId: 'attributive', question: "The man ______ (stand) there is my teacher.", expected: "standing", explanation: "现在分词作后置定语（The man who is standing）。" },
  { id: 'att_3', categoryId: 'attributive', question: "I visited the factory ______ my father worked 20 years ago.", expected: "where", explanation: "先行词是地点，且从句结构完整，用where。" },
  { id: 'att_4', categoryId: 'attributive', question: "This is the only book ______ captures my imagination.", expected: "that", explanation: "先行词有only修饰，关系代词只能用that。" },
  { id: 'att_5', categoryId: 'attributive', question: "The detailed plan, about ______ I spoke to you yesterday, is ready.", expected: "which", explanation: "介词后接指物的关系代词，用which。" },
  { id: 'att_6', categoryId: 'attributive', question: "He is the very man ______ I am looking for.", expected: "that", explanation: "先行词有the very修饰，习惯用that。" },
  { id: 'att_7', categoryId: 'attributive', question: "The reason ______ he was late is unknown.", expected: "why", explanation: "reason做先行词，从句不缺成分，用why。" },
  { id: 'att_8', categoryId: 'attributive', question: "All ______ glitters is not gold.", expected: "that", explanation: "先行词是不定代词all，关系代词用that。" },

  // --- Gerunds & Infinitives ---
  { id: 'ger_1', categoryId: 'gerund', question: "________ (Understand) the rules is crucial.", expected: "Understanding", explanation: "动名词作主语。" },
  { id: 'ger_2', categoryId: 'gerund', question: "He devoted his life to ______ (help) the poor.", expected: "helping", explanation: "devote to中的to is 介词，后接ing。" },
  { id: 'ger_3', categoryId: 'gerund', question: "I regret ______ (tell) you that you failed.", expected: "to tell", explanation: "regret to tell (遗憾地告知) vs regret telling (后悔做了)。" },
  { id: 'ger_4', categoryId: 'gerund', question: "The book is worth ______ (read).", expected: "reading", explanation: "be worth doing sth. (某事值得被做，主动表被动)。" },
  { id: 'ger_5', categoryId: 'gerund', question: "Stop ______ (talk) and listen to me.", expected: "talking", explanation: "stop doing (停止正在做的事)。" },
  { id: 'ger_6', categoryId: 'gerund', question: "It is no use ______ (argue) with him.", expected: "arguing", explanation: "It is no use doing sth. 固定句型。" },
  { id: 'ger_7', categoryId: 'gerund', question: "We look forward to ______ (see) you soon.", expected: "seeing", explanation: "look forward to 中的 to 是介词。" },
  { id: 'ger_8', categoryId: 'gerund', question: "Instead of ______ (stay) at home, he went out.", expected: "staying", explanation: "Instead of + doing (介词后接动名词)。" },

  // --- Noun Clauses ---
  { id: 'nc_1', categoryId: 'noun_clause', question: "______ matters is what you do.", expected: "What", explanation: "主语从句缺少主语。" },
  { id: 'nc_2', categoryId: 'noun_clause', question: "The news ______ our team won excited everyone.", expected: "that", explanation: "同位语从句，解释news内容，结构完整，用that。" },
  { id: 'nc_3', categoryId: 'noun_clause', question: "I don't know ______ he will come or not.", expected: "whether", explanation: "whether...or not 固定搭配。" },
  { id: 'nc_4', categoryId: 'noun_clause', question: "That is ______ we disagree.", expected: "where", explanation: "表语从句，表示'...的地方/点'。" },
  { id: 'nc_5', categoryId: 'noun_clause', question: "It depends on ______ you can finish it.", expected: "whether", explanation: "介词后一般接whether不接if。" },
  { id: 'nc_6', categoryId: 'noun_clause', question: "The problem is ______ we can get enough money.", expected: "how", explanation: "表语从句，根据语义选择 '如何'。" },
  { id: 'nc_7', categoryId: 'noun_clause', question: "It is uncertain ______ team will win.", expected: "which", explanation: "主语从句，表示 '哪一个'。" },
  { id: 'nc_8', categoryId: 'noun_clause', question: "______ he said turned out to be true.", expected: "What", explanation: "主语从句中做said的宾语。" },

  // --- Non-Predicates (Past/Present Participle) ---
  { id: 'np_1', categoryId: 'non_predicate', question: "The question ______ (discuss) yesterday was hard.", expected: "discussed", explanation: "过去分词作定语，表示被动。" },
  { id: 'np_2', categoryId: 'non_predicate', question: "______ (Walk) down the street, I saw him.", expected: "Walking", explanation: "现在分词作状语，主语I与Walk是主动关系。" },
  { id: 'np_3', categoryId: 'non_predicate', question: "______ (Give) more time, I could have done better.", expected: "Given", explanation: "过去分词作状语，表示被给时间 (If I were given...)。" },
  { id: 'np_4', categoryId: 'non_predicate', question: "He sat there, ______ (read) a book.", expected: "reading", explanation: "伴随状语，主动。" },
  { id: 'np_5', categoryId: 'non_predicate', question: "The glass ______ (break) by the boy is mine.", expected: "broken", explanation: "过去分词短语作后置定语。" },
  { id: 'np_6', categoryId: 'non_predicate', question: "______ (Hear) the news, she burst into tears.", expected: "Hearing", explanation: "时间状语，一...就...，主动关系。" },
  { id: 'np_7', categoryId: 'non_predicate', question: "The bridge ______ (build) now will be finished soon.", expected: "being built", explanation: "现在分词的被动语态作定语，表示正在被建设。" },
  { id: 'np_8', categoryId: 'non_predicate', question: "To be honest, ______ (speak) of exams makes me nervous.", expected: "speaking", explanation: "Generally speaking, frankly speaking 等固定用法。" },

  // --- Inversion ---
  { id: 'inv_1', categoryId: 'inversion', question: "Only by working hard ______ (can) you succeed.", expected: "can", explanation: "Only+状语位于句首，部分倒装。" },
  { id: 'inv_2', categoryId: 'inversion', question: "Never ______ (have) I seen such a movie.", expected: "have", explanation: "否定词放句首，部分倒装。" },
  { id: 'inv_3', categoryId: 'inversion', question: "So fast ______ (do) he run that I couldn't catch him.", expected: "did", explanation: "So + adj/adv 位于句首，部分倒装。" },
  { id: 'inv_4', categoryId: 'inversion', question: "Not until yesterday ______ (do) I know the truth.", expected: "did", explanation: "Not until... 位于句首，主句倒装。" },
  { id: 'inv_5', categoryId: 'inversion', question: "Here ______ (come) the bus.", expected: "comes", explanation: "Here位于句首，全部倒装 (主语为名词)。" },
  { id: 'inv_6', categoryId: 'inversion', question: "Hardly had we arrived ______ it began to rain.", expected: "when", explanation: "Hardly...when... 固定搭配。" },
  { id: 'inv_7', categoryId: 'inversion', question: "Seldom ______ (do) he go to the cinema.", expected: "does", explanation: "Seldom否定副词置于句首，部分倒装。" },
  { id: 'inv_8', categoryId: 'inversion', question: "In the bushes ______ (lie) a tiger.", expected: "lay", explanation: "地点状语置于句首，全部倒装。" },

  // --- Subjunctive Mood ---
  { id: 'sub_1', categoryId: 'subjunctive', question: "If I ______ (be) you, I would go.", expected: "were", explanation: "虚拟语气是对现在的假设，be用were。" },
  { id: 'sub_2', categoryId: 'subjunctive', question: "I wish I ______ (know) the answer now.", expected: "knew", explanation: "wish后接从句，对现在虚拟用过去式。" },
  { id: 'sub_3', categoryId: 'subjunctive', question: "It is high time we ______ (go) home.", expected: "went", explanation: "It is high time... 用过去式 (did) 或 shoud do。" },
  { id: 'sub_4', categoryId: 'subjunctive', question: "Without your help, I ______ (can not) have succeeded.", expected: "could not", explanation: "含蓄虚拟条件句，对过去虚拟 (could have done)。" },
  { id: 'sub_5', categoryId: 'subjunctive', question: "He talks as if he ______ (be) a boss.", expected: "were", explanation: "as if 后接虚拟语气。" },
  { id: 'sub_6', categoryId: 'subjunctive', question: "If it ______ (rain) tomorrow, the match would be cancelled.", expected: "should rain", explanation: "对将来的虚拟：should do / were to do / did。" },
  { id: 'sub_7', categoryId: 'subjunctive', question: "I suggest that he ______ (go) at once.", expected: "go", explanation: "Suggest hinter clause uses (should) + do." },
  { id: 'sub_8', categoryId: 'subjunctive', question: "Would you rather I ______ (leave) now?", expected: "left", explanation: "would rather + 过去式 (虚拟)。" },

  // --- Emphasis ---
  { id: 'emp_1', categoryId: 'emphasis', question: "It was usually in the library ______ he studied.", expected: "that", explanation: "强调句型 It was...that..." },
  { id: 'emp_2', categoryId: 'emphasis', question: "It is NOT money ______ brings happiness.", expected: "that", explanation: "强调句型强调主语 money。" },
  { id: 'emp_3', categoryId: 'emphasis', question: "Was it yesterday ______ you arrived?", expected: "that", explanation: "强调句的一般疑问句形式。" },
  { id: 'emp_4', categoryId: 'emphasis', question: "Who was it ______ broke the window?", expected: "that", explanation: "强调句的特殊疑问句形式。" },
  { id: 'emp_5', categoryId: 'emphasis', question: "It was because of the rain ______ we stopped.", expected: "that", explanation: "强调原因状语。" },
  { id: 'emp_6', categoryId: 'emphasis', question: "It is this book ______ I want to buy.", expected: "that", explanation: "Basic emphasis structure." },
  { id: 'emp_7', categoryId: 'emphasis', question: "When was it ______ you met him?", expected: "that", explanation: "Question word + was it + that..." },
  { id: 'emp_8', categoryId: 'emphasis', question: "It was not until midnight ______ he came back.", expected: "that", explanation: "Emphasis on 'not until...'." },

  // --- It Usage (Formal) ---
  { id: 'it_1', categoryId: 'it_usage', question: "I found ______ hard to finish the work.", expected: "it", explanation: "it 作形式宾语。" },
  { id: 'it_2', categoryId: 'it_usage', question: "______ is no use crying over spilt milk.", expected: "It", explanation: "It is no use doing sth." },
  { id: 'it_3', categoryId: 'it_usage', question: "He made ______ clear that he objected.", expected: "it", explanation: "make it + adj + that clause。" },
  { id: 'it_4', categoryId: 'it_usage', question: "I feel ______ my duty to help you.", expected: "it", explanation: "feel it + n + to do sth。" },
  { id: 'it_5', categoryId: 'it_usage', question: "Does ______ matter if I am late?", expected: "it", explanation: "it 作形式主语。" },
  { id: 'it_6', categoryId: 'it_usage', question: "I think ______ necessary to learn English.", expected: "it", explanation: "think it + adj + to do sth." },
  { id: 'it_7', categoryId: 'it_usage', question: "______ takes two hours to fly there.", expected: "It", explanation: "It takes time..." },
  { id: 'it_8', categoryId: 'it_usage', question: "He found ______ strange that she didn't come.", expected: "it", explanation: "found it + adj + that clause." },

  // --- Agreement ---
  { id: 'agr_1', categoryId: 'agreement', question: "The teacher as well as the students ______ (be) here.", expected: "is", explanation: "as well as 就远原则，谓语随 teacher。" },
  { id: 'agr_2', categoryId: 'agreement', question: "Neither you nor I ______ (be) wrong.", expected: "am", explanation: "Neither...nor... 就近原则，谓语随 I。" },
  { id: 'agr_3', categoryId: 'agreement', question: "The number of students ______ (be) increasing.", expected: "is", explanation: "The number of... 表示...的数量，谓语单数。" },
  { id: 'agr_4', categoryId: 'agreement', question: "A number of students ______ (be) playing.", expected: "are", explanation: "A number of... 表示许多，谓语复数。" },
  { id: 'agr_5', categoryId: 'agreement', question: "Either he or she ______ (have) the key.", expected: "has", explanation: "Either...or... 就近原则。" },
  { id: 'agr_6', categoryId: 'agreement', question: "Thirty years ______ (be) a long time.", expected: "is", explanation: "Time/distance/money viewed as a unit -> singular." },
  { id: 'agr_7', categoryId: 'agreement', question: "The rich ______ (be) not always happy.", expected: "are", explanation: "The + adj (group of people) -> plural." },
  { id: 'agr_8', categoryId: 'agreement', question: "Each of the boys ______ (have) an apple.", expected: "has", explanation: "Each of... -> singular." }
];
