export interface QuizQuestion {
  id: string;
  question: string;
  expected: string | string[];
  explanation: string;
  categoryId: string;
}

// Expanded Exam Pool covering all nuances for the 12 Levels
// Max ~8 examples per level to ensure comprehensive coverage
export const EXAM_POOL: QuizQuestion[] = [
  
  // ==========================================
  // LEVEL 1: Tense & Voice (时态与语态)
  // Coverage: Future Perfect, Past Perfect, Present Perfect, Passive Voice
  // ==========================================
  { id: 'tv_1', categoryId: 'tense_voice', question: "By the end of this year, we ______ (learn) 2,000 English words.", expected: "will have learned", explanation: "by + 将来时间 -> 将来完成时 (will have done)。" },
  { id: 'tv_2', categoryId: 'tense_voice', question: "Since I came here, I ______ (meet) no one.", expected: "have met", explanation: "since + 过去时间 -> 现在完成时 (have done)。" },
  { id: 'tv_3', categoryId: 'tense_voice', question: "The book ______ (write) by Mo Yan in 1990.", expected: "was written", explanation: "明确过去时间 (1990) + 被动语态 -> 一般过去时被动 (was done)。" },
  { id: 'tv_4', categoryId: 'tense_voice', question: "When I arrived at the station, the train ______ (leave) already.", expected: "had left", explanation: "过去的过去 -> 过去完成时 (had done)。" },
  { id: 'tv_5', categoryId: 'tense_voice', question: "Look! The bridge ______ (repair) now.", expected: ["is being repaired"], explanation: "now表示正在进行 + 被动 -> 现在进行时的被动 (is being done)。" },
  { id: 'tv_6', categoryId: 'tense_voice', question: "If it ______ (rain) tomorrow, we will stay at home.", expected: "rains", explanation: "主将从现：条件状语从句用一般现在时表将来。" },
  { id: 'tv_7', categoryId: 'tense_voice', question: "I ______ (read) a book when he came in.", expected: "was reading", explanation: "过去某一动作正在进行 -> 过去进行时 (was doing)。" },
  { id: 'tv_8', categoryId: 'tense_voice', question: "Great changes ______ (take place) in our city in the last ten years.", expected: "have taken place", explanation: "in the last...years -> 现在完成时 (have done)。" },

  // ==========================================
  // LEVEL 2: Modals (情态动词)
  // Coverage: Deduction, Regret, Probability, Ability/Permission (Hard Mode)
  // ==========================================
  { id: 'md_1', categoryId: 'modals', question: "According to the school rules, no student ______ be allowed to enter the lab without permission.", expected: "shall", explanation: "Shall 用于第三人称表示条约、规定、法令等强制性规定。" },
  { id: 'md_2', categoryId: 'modals', question: "I bought a new ticket, but I ______ have done so because the old one was still valid.", expected: ["needn't", "need not"], explanation: "needn't have done = 本来不必做但做了。" },
  { id: 'md_3', categoryId: 'modals', question: "The letter was mailed three days ago, so it ______ (arrive) by now.", expected: "should have arrived", explanation: "should have done: 表示按理说应该已经发生（推测）。" },
  { id: 'md_4', categoryId: 'modals', question: "The road is unpaved. It ______ (rain) heavily last night.", expected: "must have rained", explanation: "must have done: 对过去情况的肯定推测。" },
  { id: 'md_5', categoryId: 'modals', question: "It is strange that he ______ say such a thing to his mother.", expected: "should", explanation: "Should 用在 It is strange/surprising/pity that... 中表示惊讶或情绪（竟然）。" },
  { id: 'md_6', categoryId: 'modals', question: "Even an experienced climber ______ get into trouble on this mountain.", expected: "can", explanation: "Can 表示理论上的可能性（“有时候可能会”），而非具体某次发生的可能性。" },
  { id: 'md_7', categoryId: 'modals', question: "The door ______ open no matter how hard I pushed.", expected: ["wouldn't", "would not"], explanation: "Would not 表示过去“总是不能/不愿/拒绝”（指由于物体特性而卡住）。" },
  { id: 'md_8', categoryId: 'modals', question: "I have told you the truth. Why ______ you not believe me?", expected: "must", explanation: "Must indicates insistence or an annoying habit (偏要/非得)。这里表示不满：为什么你非得不信我？" },

  // ==========================================
  // LEVEL 3: Non-Finite Basic (不定式与动名词)
  // Coverage: Subject, Object, Purpose, Result, Fixed Expressions
  // ==========================================
  { id: 'nfb_1', categoryId: 'nonfinite_basic', question: "It is no good ______ (argue) with him.", expected: "arguing", explanation: "It is no good doing sth = 做某事没用（动名词作主语）。" },
  { id: 'nfb_2', categoryId: 'nonfinite_basic', question: "I remember ______ (lock) the door, but it's open now!", expected: "locking", explanation: "remember doing = 记得曾经做过某事（已发生）。" },
  { id: 'nfb_3', categoryId: 'nonfinite_basic', question: "He stopped ______ (drink) water because he was thirsty.", expected: "to drink", explanation: "stop to do = 停下来去做某事（目的/不定式）。" },
  { id: 'nfb_4', categoryId: 'nonfinite_basic', question: "The teacher makes us ______ (study) hard.", expected: "study", explanation: "make sb do sth = 使某人做某事（省略to的不定式）。" },
  { id: 'nfb_5', categoryId: 'nonfinite_basic', question: "He is too young ______ (go) to school.", expected: "to go", explanation: "too...to... = 太...以至于不能...（不定式表结果/程度）。" },
  { id: 'nfb_6', categoryId: 'nonfinite_basic', question: "I look forward to ______ (see) you soon.", expected: "seeing", explanation: "look forward to doing sth (to是介词，后接动名词)。" },
  { id: 'nfb_7', categoryId: 'nonfinite_basic', question: "Do you mind my ______ (smoke) here?", expected: "smoking", explanation: "mind doing/sb's doing = 介意做某事。" },
  { id: 'nfb_8', categoryId: 'nonfinite_basic', question: "The boy meant ______ (play) a joke, but he hurt her.", expected: "to play", explanation: "mean to do = 打算做；mean doing = 意味着。" },

  // ==========================================
  // LEVEL 4: Non-Finite Advanced (分词)
  // Coverage: Present vs Past Participle, Attribute, Adverbial, With-Structure
  // ==========================================
  { id: 'nfa_1', categoryId: 'nonfinite_adv', question: "The glass ______ (break) by him is mine.", expected: "broken", explanation: "broken = 被打破的（过去分词作后置定语，表被动/完成）。" },
  { id: 'nfa_2', categoryId: 'nonfinite_adv', question: "______ (See) from the hill, the city looks beautiful.", expected: "Seen", explanation: "City与See是被动关系 -> Past Participle (Seen)。" },
  { id: 'nfa_3', categoryId: 'nonfinite_adv', question: "______ (Not, know) what to do, he cried.", expected: "Not knowing", explanation: "主语He与Know是主动关系 -> Present Participle (Not knowing)。" },
  { id: 'nfa_4', categoryId: 'nonfinite_adv', question: "The boy ______ (stand) there is my brother.", expected: "standing", explanation: "standing = 站着的（现在分词作后置定语，表主动/进行）。" },
  { id: 'nfa_5', categoryId: 'nonfinite_adv', question: "With the work ______ (finish), we went home.", expected: "finished", explanation: "with结构：work与finish是被动关系 -> finished。" },
  { id: 'nfa_6', categoryId: 'nonfinite_adv', question: "Generally ______ (speak), girls are more careful.", expected: "speaking", explanation: "Generally speaking = 一般来说（固定搭配，独立成分）。" },
  { id: 'nfa_7', categoryId: 'nonfinite_adv', question: "The news is ______ (excite).", expected: "exciting", explanation: "exciting = 令人兴奋的（修饰物）；excited = 感到兴奋的（修饰人）。" },
  { id: 'nfa_8', categoryId: 'nonfinite_adv', question: "There was a terrible noise ______ (follow) the sudden burst of light.", expected: "following", explanation: "noise与follow是主动关系（噪音伴随着光）-> following。" },

  // ==========================================
  // LEVEL 5: Attributive Clauses (定语从句)
  // Coverage: Prep+Rel, Relatives (which/who/that/whose/when/where/why)
  // ==========================================
  { id: 'att_1', categoryId: 'attributive', question: "The pen with ______ I write is broken.", expected: "which", explanation: "介词(with) + 指物 -> which。" },
  { id: 'att_2', categoryId: 'attributive', question: "The man to ______ I spoke is the boss.", expected: "whom", explanation: "介词(to) + 指人 -> whom。" },
  { id: 'att_3', categoryId: 'attributive', question: "I'll never forget the day ______ we met.", expected: ["when", "on which"], explanation: "先行词day（时间） + 从句完整 -> when 或 on which。" },
  { id: 'att_4', categoryId: 'attributive', question: "This is the reason ______ he came late.", expected: ["why", "for which"], explanation: "先行词reason（原因） + 从句完整 -> why 或 for which。" },
  { id: 'att_5', categoryId: 'attributive', question: "The student ______ father is a doctor stands there.", expected: "whose", explanation: "student's father -> 所属关系用 whose。" },
  { id: 'att_6', categoryId: 'attributive', question: "He has two sons, both of ______ are doctors.", expected: "whom", explanation: "介词of + 指人（且在非限制性从句中） -> whom。" },
  { id: 'att_7', categoryId: 'attributive', question: "This is the factory ______ I visited last year.", expected: ["that", "which", ""], explanation: "visit缺宾语 -> that/which/省略。" },
  { id: 'att_8', categoryId: 'attributive', question: "This is the factory ______ I worked last year.", expected: ["where", "in which"], explanation: "work不缺宾语（地点状语） -> where / in which。" },

  // ==========================================
  // LEVEL 6: Noun Clauses (名词性从句)
  // Coverage: Subject, Object, Predicative, Appositive (That vs What vs Whether)
  // ==========================================
  { id: 'nc_1', categoryId: 'noun_clauses', question: "______ he needs is money.", expected: "What", explanation: "主语从句，且从句中needs缺宾语 -> What。" },
  { id: 'nc_2', categoryId: 'noun_clauses', question: "The fact ______ he lied is plain.", expected: "that", explanation: "同位语从句，解释fact，从句结构完整，不充当成分 -> that（不可省）。" },
  { id: 'nc_3', categoryId: 'noun_clauses', question: "I don't know ______ or not he will come.", expected: "whether", explanation: "宾语从句，搭配 or not -> 只能用 whether，不用 if。" },
  { id: 'nc_4', categoryId: 'noun_clauses', question: "The problem is ______ we can get there.", expected: "how", explanation: "表语从句，表示“如何” -> how。" },
  { id: 'nc_5', categoryId: 'noun_clauses', question: "That is ______ he refused my offer.", expected: "why", explanation: "That is why... = 那就是...的原因。" },
  { id: 'nc_6', categoryId: 'noun_clauses', question: "It is suggested ______ we (should) go there.", expected: "that", explanation: "It做形式主语，真正主语从句用 that 引导。" },
  { id: 'nc_7', categoryId: 'noun_clauses', question: "We doubt ______ he is honest.", expected: ["whether", "if"], explanation: "doubt在肯定句中，通常接 whether/if 表示怀疑。" },
  { id: 'nc_8', categoryId: 'noun_clauses', question: "There is no doubt ______ he is honest.", expected: "that", explanation: "no doubt (否定怀疑) -> 用 that 引导同位语从句。" },

  // ==========================================
  // LEVEL 7: Adverbial Clauses (状语从句)
  // Coverage: Time, Condition, Concession, Cause, Result
  // ==========================================
  { id: 'adv_1', categoryId: 'adverbial', question: "______ he is old, he runs fast.", expected: ["Although", "Though", "While"], explanation: "让步状语：虽然...但是...。" },
  { id: 'adv_2', categoryId: 'adverbial', question: "______ it rains tomorrow, we will cancel.", expected: "If", explanation: "条件状语：如果...。" },
  { id: 'adv_3', categoryId: 'adverbial', question: "I will wait ______ you finish.", expected: ["until", "till"], explanation: "时间状语：直到...。" },
  { id: 'adv_4', categoryId: 'adverbial', question: "Hard ______ he tried, he failed.", expected: ["as", "though"], explanation: "倒装让步：Adj + as/though + 主谓。" },
  { id: 'adv_5', categoryId: 'adverbial', question: "He speaks English so well ______ people think he is native.", expected: "that", explanation: "结果状语：so...that... (如此...以至于)。" },
  { id: 'adv_6', categoryId: 'adverbial', question: "Use the umbrella ______ you get wet.", expected: ["in case", "lest"], explanation: "目的/防备：in case (以免/万一)。" },
  { id: 'adv_7', categoryId: 'adverbial', question: "______ you are here, you'd better stay.", expected: ["Since", "Now that"], explanation: "原因状语：既然...。" },
  { id: 'adv_8', categoryId: 'adverbial', question: "It was not ______ midnight that he came back.", expected: "until", explanation: "not...until... 直到...才...。" },

  // ==========================================
  // LEVEL 8: Inversion (特殊句式：倒装)
  // Coverage: Partial Inversion (Negative, Only), Full Inversion (Here/There)
  // ==========================================
  { id: 'inv_1', categoryId: 'inversion', question: "Never ______ I seen such a thing.", expected: "have", explanation: "否定词(Never)置于句首 -> 部分倒装 (助动词提前)。" },
  { id: 'inv_2', categoryId: 'inversion', question: "Only in this way ______ you solve it.", expected: "can", explanation: "Only + 状语置于句首 -> 部分倒装。" },
  { id: 'inv_3', categoryId: 'inversion', question: "Here ______ (come) the bus!", expected: "comes", explanation: "方位词(Here)置于句首 + 名词主语 -> 全部倒装 (comes...bus)。" },
  { id: 'inv_4', categoryId: 'inversion', question: "So fast ______ he run that no one could catch him.", expected: "did", explanation: "So + adj/adv 位于句首 -> 部分倒装 (did...run)。" },
  { id: 'inv_5', categoryId: 'inversion', question: "Not only ______ he speak English, but also French.", expected: ["does", "can"], explanation: "Not only 置于句首 -> 部分倒装。" },
  { id: 'inv_6', categoryId: 'inversion', question: "Hardly had I arrived ______ the phone rang.", expected: "when", explanation: "Hardly...when... (刚一...就...)，Hardly部分倒装。" },
  { id: 'inv_7', categoryId: 'inversion', question: "Little ______ he know about the truth.", expected: ["did", "does"], explanation: "否定词(Little)置于句首 -> 部分倒装。" },
  { id: 'inv_8', categoryId: 'inversion', question: "Away ______ (fly) the bird.", expected: "flew", explanation: "方位副词(Away) + 动词 + 名词主语 -> 全部倒装。" },

  // ==========================================
  // LEVEL 9: Emphasis & It Structure (强调与It用法)
  // Coverage: It is...that, Formal Object, Formal Subject
  // ==========================================
  { id: 'emp_1', categoryId: 'emphasis_it', question: "It is in the park ______ I met her.", expected: "that", explanation: "强调句型：It is + 被强调部分 + that + 剩余部分。" },
  { id: 'emp_2', categoryId: 'emphasis_it', question: "I found ______ difficult to master English.", expected: "it", explanation: "形式宾语：find it adj to do。" },
  { id: 'emp_3', categoryId: 'emphasis_it', question: "Was ______ he that called you?", expected: "it", explanation: "强调句的一般疑问句：Was it ... that ...?" },
  { id: 'emp_4', categoryId: 'emphasis_it', question: "It is Tom ______ (who) is to blame.", expected: ["who", "that"], explanation: "强调人 (Tom) -> 可用 who 或 that。" },
  { id: 'emp_5', categoryId: 'emphasis_it', question: "It ______ (hit) me that I had forgotten the keys.", expected: "hit", explanation: "It hits sb that... (某人突然想起...)。句中有 had forgotten (过去完成时)，主句通常对应过去时。Hit 的过去式也是 hit。" },
  { id: 'emp_6', categoryId: 'emphasis_it', question: "It looks ______ it is going to rain.", expected: ["as if", "like"], explanation: "It looks as if... (看起来好像...)。" },
  { id: 'emp_7', categoryId: 'emphasis_it', question: "I make ______ a rule to get up early.", expected: "it", explanation: "make it a rule to do (把...定为规矩)。" },
  { id: 'emp_8', categoryId: 'emphasis_it', question: "It was not until yesterday ______ I knew the news.", expected: "that", explanation: "强调 not until 句型：It was not until ... that ..." },

  // ==========================================
  // LEVEL 10: Subjunctive Mood (虚拟语气)
  // Coverage: If conditionals, Wish, Would rather, Suggest/Order verbs
  // ==========================================
  { id: 'sub_1', categoryId: 'subjunctive', question: "If I ______ (be) a bird, I would fly.", expected: "were", explanation: "与现在事实相反 -> be动词用 were。" },
  { id: 'sub_2', categoryId: 'subjunctive', question: "I wish I ______ (know) the answer yesterday.", expected: "had known", explanation: "Wish后接虚拟：与过去事实相反 -> 过去完成时 (had done)。" },
  { id: 'sub_3', categoryId: 'subjunctive', question: "It is high time we ______ (go) home.", expected: ["went", "should go"], explanation: "It is high time did/should do (该是做...的时候了)。" },
  { id: 'sub_4', categoryId: 'subjunctive', question: "If there ______ (be) no water, fish could not live.", expected: ["were", "was"], explanation: "与现在事实相反的假设 -> be动词用 were/was。" },
  { id: 'sub_5', categoryId: 'subjunctive', question: "He suggested that we ______ (go) there at once.", expected: ["should go", "go"], explanation: "Suggest(建议)后的宾语从句 -> (should) + 动词原形。" },
  { id: 'sub_6', categoryId: 'subjunctive', question: "If he ______ (come) tomorrow, I would speak to him.", expected: ["were to come", "should come", "came"], explanation: "与将来事实相反 -> past tense / should / were to do。" },
  { id: 'sub_7', categoryId: 'subjunctive', question: "I would rather you ______ (come) tomorrow.", expected: "came", explanation: "Would rather + 从句：用过去式表示对将来的愿望。" },
  { id: 'sub_8', categoryId: 'subjunctive', question: "But for your help, I ______ (fail).", expected: ["would have failed", "could have failed"], explanation: "But for (要不是) -> 含蓄虚拟，与过去相反 -> would have done。" },

  // ==========================================
  // LEVEL 11: Adj/Adv/Art (形容词/副词/冠词)
  // Coverage: Comparison, Articles (a/an/the), Word Order
  // ==========================================
  { id: 'aaa_3', categoryId: 'adj_adv', question: "This is ______ most interesting book.", expected: ["a", "the"], explanation: "a most = very (一本非常...的书); the most = 最(最高级)。" },
  { id: 'aaa_9', categoryId: 'adj_adv', question: "Of the two sisters, Betty is ______ (rich) one.", expected: "the richer", explanation: "Of the two... -> Both determined and comparative (the + comparative)." },
  { id: 'aaa_10', categoryId: 'adj_adv', question: "He is ______ (lazy) than stupid.", expected: "more lazy", explanation: "Comparing two qualities of the same person: use 'more ... than ...' (not lazier)." },
  { id: 'aaa_11', categoryId: 'adj_adv', question: "I have never spent a ______ (pleasant) day.", expected: "more pleasant", explanation: "Negation + Comparative = Superlative meaning (never ... more ... = this is the most ...)." },
  { id: 'aaa_12', categoryId: 'adj_adv', question: "He speaks ______ (high) of the new teacher.", expected: "highly", explanation: "speak highly of = praise. 'High' refers to height, 'highly' means degree/opinion." },
  { id: 'aaa_13', categoryId: 'adj_adv', question: "The more you learn, the ______ (modest) you become.", expected: "more modest", explanation: "Double comparative: The more ..., the more ..." },
  { id: 'aaa_14', categoryId: 'adj_adv', question: "The climate here is like ______ (that) of Kunming.", expected: "that", explanation: "Comparison of equivalent nouns: use 'that' for singular, 'those' for plural." },
  { id: 'aaa_15', categoryId: 'adj_adv', question: "He was elected ______ monitor of the class.", expected: ["-", "/"], explanation: "Zero article for unique titles/positions (elected monitor). Type '-' for zero article." },

  // ==========================================
  // LEVEL 12: SV Agreement (主谓一致)
  // Coverage: Grammatical, Notional, Proximity rules
  // ==========================================
  { id: 'sva_3', categoryId: 'agreement', question: "Not only you but he ______ (be) wrong.", expected: "is", explanation: "就近原则：Not only...but also... (与 he 一致)。" },
  { id: 'sva_4', categoryId: 'agreement', question: "The police ______ (be) coming.", expected: ["are", "were"], explanation: "集合名词 (Police/People/Cattle) -> 复数谓语。" },
  { id: 'sva_5', categoryId: 'agreement', question: "The teacher as well as the students ______ (be) happy.", expected: ["is", "was"], explanation: "就远原则? No, A as well as B -> 与前面 A 一致 (teacher -> is)。" },
  { id: 'sva_6', categoryId: 'agreement', question: "Twenty years ______ (be) a long time.", expected: "is", explanation: "时间、距离、金钱作为整体 -> 单数谓语。" },
  { id: 'sva_7', categoryId: 'agreement', question: "The number of students ______ (be) increasing.", expected: "is", explanation: "The number of (数量) -> 单数。" },
  { id: 'sva_8', categoryId: 'agreement', question: "A number of students ______ (be) playing.", expected: ["are", "were"], explanation: "A number of (许多) -> 复数。" },

  // ==========================================
  // LEVEL 13: Phrasal Verbs & Collocations (固定搭配)
  // Coverage: Common高考 动词短语 & 介词搭配
  // ==========================================
  { id: 'pv_1', categoryId: 'phrasal_collo', question: "She looks forward to ______ (see) you soon.", expected: "seeing", explanation: "look forward to doing (to是介词，后接动名词)。" },
  { id: 'pv_2', categoryId: 'phrasal_collo', question: "He devoted his life to ______ (help) the poor.", expected: "helping", explanation: "devote ... to doing (to是介词)。" },
  { id: 'pv_3', categoryId: 'phrasal_collo', question: "Please pay attention to ______ (listen) carefully.", expected: "listening", explanation: "pay attention to doing。" },
  { id: 'pv_4', categoryId: 'phrasal_collo', question: "The fire ______ (break) out last night.", expected: "broke", explanation: "break out (爆发) 无被动，发生于过去 -> broke。" },
  { id: 'pv_5', categoryId: 'phrasal_collo', question: "Don't give up ______ (try) even if you fail.", expected: "trying", explanation: "give up doing (放弃做某事)。" },
  { id: 'pv_6', categoryId: 'phrasal_collo', question: "I can't put up with ______ (laugh) at.", expected: "being laughed", explanation: "put up with (忍受) + doing + be laughed at (被嘲笑)。" },
  { id: 'pv_7', categoryId: 'phrasal_collo', question: "This song reminds me ______ my childhood.", expected: "of", explanation: "remind sb of sth (使某人想起)。" },
  { id: 'pv_8', categoryId: 'phrasal_collo', question: "He was accused ______ stealing the money.", expected: "of", explanation: "accuse sb of sth (指控)。" },

  // ==========================================
  // LEVEL 14: Ultimate Challenge (终极考点: 语境与陷阱)
  // Coverage: Context Logic, Mixed Grammar points, Long sentences (>100 chars)
  // ==========================================
  { 
    id: 'ult_1', 
    categoryId: 'ultimate_context', 
    question: "Hardly had the exhausted hikers arrived at the mountain lodge hoping for a hot meal and a good sleep ______ a terrible thunderstorm broke out.", 
    expected: "when", 
    explanation: "Hardly...when... (一...就...)。Though the sentence is long, the core structure remains the inverted 'Hardly had... when...' pattern." 
  },
  { 
    id: 'ult_2', 
    categoryId: 'ultimate_context', 
    question: "It was not until the professor explained the complex theory three times in detail ______ the students finally understood why the experiment had failed.", 
    expected: ["that"], 
    explanation: "Emphasis Pattern: It was not until [long time adverbial] that ... 'that' is strictly required in emphasis structure. 'when' is incorrect here." 
  },
  { 
    id: 'ult_3', 
    categoryId: 'ultimate_context', 
    question: "______ (stand) on top of the ancient tower at sunset, and you will see the whole city bathed in golden light, presenting a view that is absolutely breathtaking.", 
    expected: ["Stand", "stand"], 
    explanation: "Pattern: Imperative (Stand...) + and + Future Tense (you will see...). The context implies a command/suggestion sequence." 
  },
  {
    id: 'ult_4',
    categoryId: 'ultimate_context',
    question: "______ (see) from the top of the hill, the city park looks like a gigantic green emerald embedded in the concrete jungle, offering a peaceful retreat for citizens.", 
    expected: ["Seen", "seen"],
    explanation: "Non-finite Verb: The logical subject is 'the city park'. The park is SEEN (passive relation). Context confirms it's a description." 
  },
  { 
    id: 'ult_5', 
    categoryId: 'ultimate_context', 
    question: "Mr. Black is strictly professional, but he remains one of the few professors who ______ (be) always willing to sacrifice their weekends to help students.", 
    expected: ["are"], 
    explanation: "Subject-Verb Agreement: 'one of + plural noun + who'. The antecedent is 'professors' (plural), so the verb is 'are'. 'is' is incorrect for strict grammar." 
  },
  { 
    id: 'ult_6', 
    categoryId: 'ultimate_context', 
    question: "Despite the massive renovation it has undergone recently, is this the same chemical factory ______ you visited with your sustainability research team last year?", 
    expected: ["that", "which", ""], 
    explanation: "Attributive Clause: Missing object for 'visited'. 'Research team' context is distraction. Antecedent is 'factory'." 
  },
  { 
    id: 'ult_7', 
    categoryId: 'ultimate_context', 
    question: "Looking at the modern layout, it is hard to believe that this is the very factory ______ my grandfather worked for forty years before he finally retired.", 
    expected: ["where", "in which"], 
    explanation: "Attributive Clause: Missing adverbial of place (worked IN the factory). 'When/Where' decision depends on the verb 'work' needing 'in'." 
  },
  { 
    id: 'ult_8', 
    categoryId: 'ultimate_context', 
    question: "Not only the enthusiastic students but also their usually strict professor ______ (be) shocked by the unexpected results of the experiment conducted yesterday.", 
    expected: "was", 
    explanation: "Agreement: 'Not only... but also...' follows the 'nearest' rule. The verb matches 'professor' (singular), ignoring the 'students'." 
  }
];
