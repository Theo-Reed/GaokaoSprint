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
  quiz?: {
    question: string; // Text with underscores
    expected: string; // Correct answer strings to match (case insensitive usually)
    explanation: string;
  };
}

export const TRAINING_LEVELS: SentenceData[] = [
  // --- LEVEL 1: 基础定语从句 (The "Which" Trap) ---
  {
    id: 1,
    text: "The experiment that the scientists conducted failed due to the temperature changes.",
    answerKey: {
      subject: [0, 1], // The experiment
      verb: [6],       // failed
      object: []       // Intransitive
    },
    translation: "科学家们进行的那个实验因为温度变化而失败了。",
    difficulty: "Level 1",
    tags: ["Attributive Clause", "Subject Separation"],
    algorithm: [
      "1. Scan verbs: 'conducted' (5), 'failed' (6).",
      "2. 'Conducted' follows 'that'. In most cases, v. after 'that' is part of a clause.",
      "3. Eliminate the clause [that...conducted].",
      "4. What's left? 'The experiment ... failed'.",
      "5. 'Failed' is the Main Verb."
    ],
    traps: {
      5: "❌ TRAP: 'Conducted' is inside the 'that...' clause (Attributive). It serves 'scientists', not 'experiment'.",
      11: "❌ 'Changes' is part of the 'due to' phrase (Adverbial), not the Object."
    },
    quiz: {
      question: "The experiment that the scientists ______ (conduct) failed due to the temperature changes.",
      expected: "conducted",
      explanation: "此处 conduct 是定语从句中的谓语，描述过去发生的动作，故用过去式 conducted。"
    }
  },

  // --- LEVEL 2: 动名词作主语 (The "Ing" Trap) ---
  {
    id: 2,
    text: "Understanding the cultural differences helps tourists avoid embarrassing situations.",
    answerKey: {
      subject: [0, 1, 2, 3], // Understanding the cultural differences
      verb: [4],             // helps
      object: [5]            // tourists (Strict S-V-O: 'avoid...' is Object Complement)
    },
    translation: "理解文化差异有助于游客避免尴尬的处境。",
    difficulty: "Level 2",
    tags: ["Gerund Subject", "Double Verb"],
    algorithm: [
      "1. Scan verbs: 'helps' (4), 'avoid' (6).",
      "2. 'Understanding' starts the sentence. Is it a verb? No, it's a Gerund Phrase acting as Subject.",
      "3. Check 'avoid': 'Help sb (to) do sth'. It's an infinitive complement.",
      "4. Main Verb is 'helps'."
    ],
    traps: {
      0: "ℹ️ 'Understanding' is the Head of the Subject, but the full subject includes '...differences'.",
      6: "❌ 'Avoid' is what tourists DO. It's an Object Complement, not main verb.",
      8: "❌ 'Situations' is the object of 'avoid'."
    },
    quiz: {
      question: "________ (Understand) the cultural differences helps tourists avoid embarrassing situations.",
      expected: "Understanding",
      explanation: "句首作主语，且表示抽象动作，使用动名词形式 Understanding。"
    }
  },

  // --- LEVEL 2: 从句套娃 (The "What" Clause) ---
  {
    id: 3,
    text: "What matters is not what you say but what you do.",
    answerKey: {
      subject: [0, 1], // What matters
      verb: [2],       // is
      object: [3, 4, 5, 6, 7, 8, 9, 10] // Predicative (treated as O slot for simplicity)
    },
    translation: "重要的不是你说什么，而是你做什么。",
    difficulty: "Level 2",
    tags: ["Noun Clause", "Subject Clause"],
    algorithm: [
      "1. 'What matters' is a clause acting as a Noun (Subject).",
      "2. 'Is' is the Link Verb connecting subject and predicative.",
      "3. The rest is the Predicative (content)."
    ],
    traps: {
      1: "❌ 'Matters' is the verb inside the subject clause.",
      6: "❌ 'Say' is inside the predicative clause."
    },
    quiz: {
      question: "______ matters is not what you say but what you do.",
      expected: "What",
      explanation: "引导主语从句，且在从句中作主语（指代'事情'），用 What。"
    }
  },

  // --- LEVEL 3: 非谓语干扰 (Past Participle Interruption) - GAOKAO CLASSIC ---
  {
    id: 4,
    text: "The question discussed at the meeting yesterday was very important.",
    answerKey: {
      subject: [0, 1], // The question
      verb: [7],       // was (Index 7)
      object: [8, 9]   // very important (Predicative)
    },
    translation: "昨天会议上讨论的那个问题非常重要。",
    difficulty: "Level 3",
    tags: ["Past Participle", "Passive Sense"],
    algorithm: [
      "1. Scan verbs: 'discussed' (2), 'was' (7).",
      "2. Check 'discussed': Did the 'question' discuss something? No, it IS discussed.",
      "3. So 'discussed...' is a Passive Modifier (Past Participle phrase). Discard it.",
      "4. 'Was' is the real Main Verb."
    ],
    traps: {
      2: "❌ TRAP: 'Discussed' looks like a past tense verb, but here it means 'which was discussed' (Modifier).",
      6: "❌ 'Yesterday' modifies the meeting/discussion, not the main sentence."
    },
    quiz: {
      question: "The question ________ (discuss) at the meeting yesterday was very important.",
      expected: "discussed",
      explanation: "问题是被讨论，且动作已发生，用过去分词 discussed 作后置定语。"
    }
  },

  // --- LEVEL 3: "Ing" 伴随状语 (Present Participle Adverbial) ---
  {
    id: 5,
    text: "Walking down the street, I saw a friend of mine.",
    answerKey: {
      subject: [4], // I
      verb: [5],    // saw
      object: [6, 7, 8, 9] // a friend of mine
    },
    translation: "走在街上时，我看见了我的一位朋友。",
    difficulty: "Level 3",
    tags: ["Adverbial Phrase", "Logic Subject"],
    algorithm: [
      "1. Sentence starts with 'Walking' + comma.",
      "2. This is an Adverbial Phrase (Background action).",
      "3. Look after the comma: 'I'. This is the Subject.",
      "4. 'Saw' is the Main Verb."
    ],
    traps: {
      0: "❌ 'Walking' is a modifier (Adverbial), not the subject. The subject must be 'I'.",
      3: "❌ The comma usually separates the modifier from the main sentence.",
      9: "✅ 'Mine' is part of the object phrase."
    },
    quiz: {
      question: "_______ (Walk) down the street, I saw a friend of mine.",
      expected: "Walking",
      explanation: "主语 I 和 Walk 是主动关系，且作为背景动作，用现在分词 Walking 作状语。"
    }
  },

  // --- BOSS FIGHT: 同位语从句 + 抽象名词 (Appositive Clause) ---
  {
    id: 6,
    text: "The fact that he failed the exam surprised us all.",
    answerKey: {
      subject: [0, 1], // The fact
      verb: [7],       // surprised (Index 7)
      object: [8, 9]   // us all
    },
    translation: "他考试不及格的这个事实让我们都很吃惊。",
    difficulty: "Boss Fight",
    tags: ["Appositive Clause", "Abstract Noun"],
    algorithm: [
      "1. 'Fact' is an abstract noun. 'That' following it usually introduces an Appositive Clause.",
      "2. [that he failed the exam] explains the content of 'fact'. It's a package.",
      "3. Ignore the package. 'The fact ... surprised ...'.",
      "4. 'Surprised' is the Main Verb."
    ],
    traps: {
      4: "❌ 'Failed' is the verb inside the 'that' clause.",
      6: "❌ 'Exam' is the object of 'failed', not the main object."
    },
    quiz: {
      question: "The fact ______ he failed the exam surprised us all.",
      expected: "that",
      explanation: "引导同位语从句解释 Fact 的具体内容，从句不缺成分，用 that。"
    }
  },

  // --- BOSS FIGHT: 倒装句 (Inversion with Only) ---
  {
    id: 7,
    text: "Only by working hard can you achieve your goal.",
    answerKey: {
      subject: [5],    // you
      verb: [4, 6],    // can achieve (Modal + Main)
      object: [7, 8]   // your goal
    },
    translation: "只有努力工作，你才能实现目标。",
    difficulty: "Boss Fight",
    tags: ["Inversion", "Modal Verb"],
    algorithm: [
      "1. Sentence starts with 'Only' + preposition ('by').",
      "2. Rule: 'Only + Adverbial' at start -> Partial Inversion.",
      "3. The auxiliary 'can' moves BEFORE the subject.",
      "4. Restore order: 'You can achieve...'. Subject is 'you'."
    ],
    traps: {
      2: "❌ 'Working' is object of preposition 'by'.",
      4: "⚠️ 'Can' is part of the verb group, but moved forward. Don't miss 'achieve'!"
    },
    quiz: {
      question: "Only by working hard _____ you achieve your goal.",
      expected: "can",
      explanation: "Only + 状语位于句首，主句要用部分倒装，情态动词 can 提到主语 you 之前。"
    }
  },

  // --- BOSS FIGHT: 介词+Which定语从句 (Prep + Which) ---
  {
    id: 8,
    text: "The house in which he lives stands on a hill.",
    answerKey: {
      subject: [0, 1], // The house
      verb: [6],       // stands
      object: []       // Intransitive (followed by adverbial)
    },
    translation: "他住的那座房子位于小山上。",
    difficulty: "Boss Fight",
    tags: ["Attributive Clause", "Preposition"],
    algorithm: [
      "1. 'in which' signals a Relative Clause where the preposition moved up.",
      "2. [in which he lives] modifies 'house'. Discard it.",
      "3. 'The house ... stands ...'.",
      "4. 'Stands' is the Main Verb."
    ],
    traps: {
      5: "❌ 'Lives' is the verb for 'he' inside the clause.",
      9: "❌ 'Hill' is part of the location phrase 'on a hill'."
    },
    quiz: {
      question: "The house ______ which he lives stands on a hill.",
      expected: "in",
      explanation: "还原从句：He lives in the house. in 提到关系代词 which 之前。"
    }
  },

  // --- LEVEL 4: 虚拟语气 (Subjunctive Mood) ---
  {
    id: 9,
    text: "If I were you, I would seize the opportunity without hesitation.",
    answerKey: {
      subject: [4],    // I (Second 'I', Index 4)
      verb: [5, 6],    // would seize (Index 5, 6)
      object: [7, 8]   // the opportunity (Index 7, 8)
    },
    translation: "如果我是你，我会毫不犹豫地抓住这个机会。",
    difficulty: "Level 3",
    tags: ["Subjunctive", "Conditional"],
    algorithm: [
      "1. Starts with 'If'. Check verbs: 'were' (past), 'would seize' (would + do).",
      "2. This signals contrary to present reality -> Subjunctive Mood.",
      "3. Main clause is 'I would seize...'.",
      "4. 'Without hesitation' is adverbial."
    ],
    traps: {
      2: "ℹ️ 'were': In subjunctive mood, 'be' verb is always 'were'. This is the predicate of the IF clause.",
      5: "⚠️ 'Would' is essential here. Don't use 'will' or simple past alone."
    },
    quiz: {
      question: "If I _____ (be) you, I would seize the opportunity.",
      expected: "were",
      explanation: "虚拟语气中，与现在事实相反的假设，be 动词统一用 were。"
    }
  },

  // --- LEVEL 4: 强调句 (Emphasis) ---
  {
    id: 10,
    text: "It was in the library that I met the professor yesterday.",
    answerKey: {
      subject: [0],    // It (Emphasis structure dummy)
      verb: [1],       // was
      object: []       // no object for 'was', it's a link verb structure
    },
    translation: "正是昨天在图书馆，我遇见了那位教授。",
    difficulty: "Level 3",
    tags: ["Emphasis", "It is...that"],
    algorithm: [
      "1. Pattern: 'It is/was ... that ...'.",
      "2. Test: Remove 'It was' and 'that'. -> 'In the library I met the professor yesterday.'",
      "3. The remaining sentence is complete and logical.",
      "4. Therefore, it is an Emphasis Sentence, emphasizing 'in the library'."
    ],
    traps: {
      5: "⚠️ 'That' here is NOT a relative pronoun. It's part of the emphasis frame.",
    },
    tips: "Logic Check: If you can delete 'It be...that' and the sentence still works, it's Emphasis.",
    quiz: {
      question: "It was in the library ______ I met the professor yesterday.",
      expected: "that",
      explanation: "强调句型 It was ... that ...，去掉后句子完整，故填 that。"
    }
  },

  // --- BOSS FIGHT: 形式宾语 (It as Formal Object) ---
  {
    id: 11,
    text: "I found it difficult to finish the work on time.",
    answerKey: {
      subject: [0],    // I
      verb: [1],       // found
      object: [2]      // it (Formal Object)
    },
    translation: "我发现按时完成这项工作很难。",
    difficulty: "Boss Fight",
    tags: ["Formal Object", "Infinitive"],
    algorithm: [
      "1. S-V-O-C Pattern: I (S) found (V) it (O) difficult (C).",
      "2. 'It' is empty. It points backwards to the real object.",
      "3. Real Object is 'to finish the work'.",
      "4. Don't treat 'difficult' as object. It's an adjective describing the task."
    ],
    traps: {
      2: "⚠️ 'It' is the Formal Object (Place holder).",
      4: "✅ 'To finish...' is the Real Object."
    },
    quiz: {
      question: "I found _____ difficult to finish the work on time.",
      expected: "it",
      explanation: "find/think/make + it + adj + to do sth. it 作形式宾语。"
    }
  },

  // --- BOSS FIGHT: 主谓一致 (Subject-Verb Agreement) ---
  {
    id: 12,
    text: "The teacher as well as the students was excited about the trip.",
    answerKey: {
      subject: [0, 1], // The teacher
      verb: [7],       // was (Index 7)
      object: []       // excited (Predicative)
    },
    translation: "老师和学生们都对这次旅行感到兴奋。",
    difficulty: "Boss Fight",
    tags: ["Agreement", "Logic Subject"],
    algorithm: [
      "1. Subject complex: 'The teacher as well as the students'.",
      "2. Rule: 'A as well as B', the verb agrees with A (the head).",
      "3. Head is 'The teacher' (Singular).",
      "4. So verb is 'was', not 'were' (despite 'students' being closer)."
    ],
    traps: {
      6: "❌ 'Students' is closer to the verb, but it is NOT the core subject here.",
      7: "⚠️ 'Was' agrees with 'Teacher'."
    },
    quiz: {
      question: "The teacher as well as the students ______ (be) excited about the trip.",
      expected: "was",
      explanation: "Subject + as well as + ... 谓语动词采取“就远原则”，与前面的 The teacher 保持一致。"
    }
  }
];
