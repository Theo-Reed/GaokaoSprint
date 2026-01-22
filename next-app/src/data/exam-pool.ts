export interface QuizQuestion {
  id: string;
  question: string;
  expected: string | string[];
  explanationCN: string;
  explanationEN: string;
  categoryId: string;
}

// Expanded Exam Pool covering all nuances for the 12 Levels
// Max ~8 examples per level to ensure comprehensive coverage
export const EXAM_POOL: QuizQuestion[] = [
  
  // ==========================================
  // LEVEL 1: Tense & Voice (时态与语态)
  // Coverage: Future Perfect, Past Perfect, Present Perfect, Passive Voice
  // ==========================================
  { id: "tv_1", categoryId: "tense_voice", question: "By the end of this year, we ______ (learn) 2,000 English words.", expected: "will have learned", explanationCN: "by + 将来时间 -> 将来完成时 (will have done)。", explanationEN: "The phrase \"by + future time\" indicates the Future Perfect Tense (will have done)." },
  { id: "tv_2", categoryId: "tense_voice", question: "Since I came here, I ______ (meet) no one.", expected: "have met", explanationCN: "since + 过去时间 -> 现在完成时 (have done)。", explanationEN: "\"Since + past point in time\" requires the Present Perfect Tense (have done)." },
  { id: "tv_3", categoryId: "tense_voice", question: "The book ______ (write) by Mo Yan in 1990.", expected: "was written", explanationCN: "明确过去时间 (1990) + 被动语态 -> 一般过去时被动 (was done)。", explanationEN: "Specific past time (1990) + passive voice indication (\"by Mo Yan\") -> Past Simple Passive (was written)." },
  { id: "tv_4", categoryId: "tense_voice", question: "When I arrived at the station, the train ______ (leave) already.", expected: "had left", explanationCN: "过去的过去 -> 过去完成时 (had done)。", explanationEN: "The action happened before another past action (\"arrived\") -> Past Perfect Tense (had left)." },
  { id: "tv_5", categoryId: "tense_voice", question: "Look! The bridge ______ (repair) now.", expected: ["is being repaired"], explanationCN: "now表示正在进行 + 被动 -> 现在进行时的被动 (is being done)。", explanationEN: "\"Look! ... now\" indicates Present Continuous Tense. The bridge receives the action -> Passive (is being repaired)." },
  { id: "tv_6", categoryId: "tense_voice", question: "If it ______ (rain) tomorrow, we will stay at home.", expected: "rains", explanationCN: "主将从现：条件状语从句用一般现在时表将来。", explanationEN: "In conditional clauses (If...), use Simple Present to refer to the future when the main clause is in future tense." },
  { id: "tv_7", categoryId: "tense_voice", question: "I ______ (read) a book when he came in.", expected: "was reading", explanationCN: "过去某一动作正在进行 -> 过去进行时 (was doing)。", explanationEN: "An action defined as \"in progress\" at a specific past moment (\"when he came in\") -> Past Continuous (was reading)." },
  { id: "tv_8", categoryId: "tense_voice", question: "Great changes ______ (take place) in our city in the last ten years.", expected: "have taken place", explanationCN: "in the last...years -> 现在完成时 (have done)。", explanationEN: "\"In the last ... years\" connects the past to the present -> Present Perfect Tense (have taken place)." },

  // ==========================================
  // LEVEL 2: Modals (情态动词)
  // Coverage: Deduction, Regret, Probability, Ability/Permission (Hard Mode)
  // ==========================================
  { id: "md_1", categoryId: "modals", question: "According to the school rules, no student ______ be allowed to enter the lab without permission.", expected: "shall", explanationCN: "Shall 用于第三人称表示条约、规定、法令等强制性规定。", explanationEN: "\"Shall\" is used with the third person to indicate formal rules, regulations, or laws." },
  { id: "md_2", categoryId: "modals", question: "I bought a new ticket, but I ______ have done so because the old one was still valid.", expected: ["needn\u0027t", "need not"], explanationCN: "needn\u0027t have done = 本来不必做但做了。", explanationEN: "\"needn\u0027t have done\" means the action was performed but was subsequently found to be unnecessary." },
  { id: "md_3", categoryId: "modals", question: "The letter was mailed three days ago, so it ______ (arrive) by now.", expected: "should have arrived", explanationCN: "should have done: 表示按理说应该已经发生（推测）。", explanationEN: "\"should have done\" expresses a logical deduction about the past (it is reasonable to expect it happened)." },
  { id: "md_4", categoryId: "modals", question: "The road is unpaved. It ______ (rain) heavily last night.", expected: "must have rained", explanationCN: "must have done: 对过去情况的肯定推测。", explanationEN: "\"must have done\" expresses strong certainty or logical conclusion about a past event." },
  { id: "md_5", categoryId: "modals", question: "It is strange that he ______ say such a thing to his mother.", expected: "should", explanationCN: "Should 用在 It is strange/surprising/pity that... 中表示惊讶或情绪（竟然）。", explanationEN: "In \"It is strange that...\" clauses, \"should\" is used to express inspection, surprise, or emotion." },
  { id: "md_6", categoryId: "modals", question: "Even an experienced climber ______ get into trouble on this mountain.", expected: "can", explanationCN: "Can 表示理论上的可能性（“有时候可能会”），而非具体某次发生的可能性。", explanationEN: "\"Can\" expresses theoretical possibility (it is possible for this to happen to anyone), as opposed to specific ability." },
  { id: "md_7", categoryId: "modals", question: "The door ______ open no matter how hard I pushed.", expected: ["wouldn\u0027t", "would not"], explanationCN: "Would not 表示过去“总是不能/不愿/拒绝”（指由于物体特性而卡住）。", explanationEN: "\"Would not\" in the past tense can describe a refusal or inability due to the nature of an object (the door refused to open)." },
  { id: "md_8", categoryId: "modals", question: "I have told you the truth. Why ______ you not believe me?", expected: "must", explanationCN: "Must 表示偏执或令人烦恼的习惯（偏要/非得）。这里表示不满：为什么你非得不信我？", explanationEN: "\"Must\" is used here to express annoyance at someone\u0027s persistence or obstinacy (Why do you insist on not believing me?)." },

  // ==========================================
  // LEVEL 3: Non-Finite Basic (不定式与动名词)
  // Coverage: Subject, Object, Purpose, Result, Fixed Expressions
  // ==========================================
  { id: "nfb_1", categoryId: "nonfinite_basic", question: "It is no good ______ (argue) with him.", expected: "arguing", explanationCN: "It is no good doing sth = 做某事没用（动名词作主语）。", explanationEN: "\"It is no good doing sth\" is a fixed idiomatic expression requiring the gerund." },
  { id: "nfb_2", categoryId: "nonfinite_basic", question: "I remember ______ (lock) the door, but it\u0027s open now!", expected: "locking", explanationCN: "remember doing = 记得曾经做过某事（已发生）。", explanationEN: "\"remember doing\" means recalling an action that has already been performed." },
  { id: "nfb_3", categoryId: "nonfinite_basic", question: "He stopped ______ (drink) water because he was thirsty.", expected: "to drink", explanationCN: "stop to do = 停下来去做某事（目的/不定式）。", explanationEN: "\"stop to do\" means ceasing the current activity in order to do something else (Infinitive of Purpose)." },
  { id: "nfb_4", categoryId: "nonfinite_basic", question: "The teacher makes us ______ (study) hard.", expected: "study", explanationCN: "make sb do sth = 使某人做某事（省略to的不定式）。", explanationEN: "The causative verb \"make\" is followed by the bare infinitive (without \"to\")." },
  { id: "nfb_5", categoryId: "nonfinite_basic", question: "He is too young ______ (go) to school.", expected: "to go", explanationCN: "too...to... = 太...以至于不能...（不定式表结果/程度）。", explanationEN: "The structure \"too ... to ...\" expresses a negative result (so young that he cannot go)." },
  { id: "nfb_6", categoryId: "nonfinite_basic", question: "I look forward to ______ (see) you soon.", expected: "seeing", explanationCN: "look forward to doing sth (to是介词，后接动名词)。", explanationEN: "\"look forward to\" ends in the preposition \"to\", which requires a gerund object (-ing form)." },
  { id: "nfb_7", categoryId: "nonfinite_basic", question: "Do you mind my ______ (smoke) here?", expected: "smoking", explanationCN: "mind doing/sb\u0027s doing = 介意做某事。", explanationEN: "\"mind\" is followed by a gerund. \"my smoking\" is the gerund with a possessive subject." },
  { id: "nfb_8", categoryId: "nonfinite_basic", question: "The boy meant ______ (play) a joke, but he hurt her.", expected: "to play", explanationCN: "mean to do = 打算做；mean doing = 意味着。", explanationEN: "\"mean to do\" implies intention (intended to play), whereas \"mean doing\" implies consequence." },

  // ==========================================
  // LEVEL 4: Non-Finite Advanced (分词)
  // Coverage: Present vs Past Participle, Attribute, Adverbial, With-Structure
  // ==========================================
  { id: "nfa_1", categoryId: "nonfinite_adv", question: "The glass ______ (break) by him is mine.", expected: "broken", explanationCN: "broken = 被打破的（过去分词作后置定语，表被动/完成）。", explanationEN: "\"broken\" (Past Participle) functions as an adjective modifying \"glass\", indicating a passive/completed state." },
  { id: "nfa_2", categoryId: "nonfinite_adv", question: "______ (See) from the hill, the city looks beautiful.", expected: "Seen", explanationCN: "City与See是被动关系 -> Past Participle (Seen)。", explanationEN: "The logical subject \"the city\" is seen (Passive relation), so the Past Participle \"Seen\" is used." },
  { id: "nfa_3", categoryId: "nonfinite_adv", question: "______ (Not, know) what to do, he cried.", expected: "Not knowing", explanationCN: "主语He与Know是主动关系 -> Present Participle (Not knowing)。", explanationEN: "The subject \"he\" is the one knowing (Active relation), so the Present Participle \"knowing\" is used." },
  { id: "nfa_4", categoryId: "nonfinite_adv", question: "The boy ______ (stand) there is my brother.", expected: "standing", explanationCN: "standing = 站着的（现在分词作后置定语，表主动/进行）。", explanationEN: "\"standing\" (Present Participle) modifies \"the boy\" and indicates an active, ongoing state." },
  { id: "nfa_5", categoryId: "nonfinite_adv", question: "With the work ______ (finish), we went home.", expected: "finished", explanationCN: "with结构：work与finish是被动关系 -> finished。", explanationEN: "In the \"with\" structure, the relation between \"work\" and \"finish\" is passive, requiring the Past Participle." },
  { id: "nfa_6", categoryId: "nonfinite_adv", question: "Generally ______ (speak), girls are more careful.", expected: "speaking", explanationCN: "Generally speaking = 一般来说（固定搭配，独立成分）。", explanationEN: "\"Generally speaking\" is a fixed parenthetical expression used to introduce a general statement." },
  { id: "nfa_7", categoryId: "nonfinite_adv", question: "The news is ______ (excite).", expected: "exciting", explanationCN: "exciting = 令人兴奋的（修饰物）；excited = 感到兴奋的（修饰人）。", explanationEN: "\"exciting\" describes the characteristic of the news; \"excited\" would describe a person\u0027s feeling." },
  { id: "nfa_8", categoryId: "nonfinite_adv", question: "There was a terrible noise ______ (follow) the sudden burst of light.", expected: "following", explanationCN: "noise与follow是主动关系（噪音伴随着光）-> following。", explanationEN: "The noise followed the light (Active relation), so the Present Participle \"following\" is used." },

  // ==========================================
  // LEVEL 5: Attributive Clauses (定语从句)
  // Coverage: Prep+Rel, Relatives (which/who/that/whose/when/where/why)
  // ==========================================
  { id: "att_1", categoryId: "attributive", question: "The pen with ______ I write is broken.", expected: "which", explanationCN: "介词(with) + 指物 -> which。", explanationEN: "When a preposition (with) precedes a relative pronoun referring to a thing (pen), \"which\" must be used." },
  { id: "att_2", categoryId: "attributive", question: "The man to ______ I spoke is the boss.", expected: "whom", explanationCN: "介词(to) + 指人 -> whom。", explanationEN: "When a preposition (to) precedes a relative pronoun referring to a person (man), \"whom\" must be used." },
  { id: "att_3", categoryId: "attributive", question: "I\u0027ll never forget the day ______ we met.", expected: ["when", "on which"], explanationCN: "先行词day（时间） + 从句完整 -> when 或 on which。", explanationEN: "The antecedent is a time (day) and the clause is complete, so the relative adverb \"when\" (or \"on which\") is used." },
  { id: "att_4", categoryId: "attributive", question: "This is the reason ______ he came late.", expected: ["why", "for which"], explanationCN: "先行词reason（原因） + 从句完整 -> why 或 for which。", explanationEN: "The antecedent is \"reason\" and the clause is complete, so the relative adverb \"why\" (or \"for which\") is used." },
  { id: "att_5", categoryId: "attributive", question: "The student ______ father is a doctor stands there.", expected: "whose", explanationCN: "student\u0027s father -> 所属关系用 whose。", explanationEN: "\"whose\" indicates possession or relationship (the student\u0027s father)." },
  { id: "att_6", categoryId: "attributive", question: "He has two sons, both of ______ are doctors.", expected: "whom", explanationCN: "介词of + 指人（且在非限制性从句中） -> whom。", explanationEN: "In a non-restrictive clause with a quantifier (both of), \"whom\" is used to refer to people." },
  { id: "att_7", categoryId: "attributive", question: "This is the factory ______ I visited last year.", expected: ["that", "which", ""], explanationCN: "visit缺宾语 -> that/which/省略。", explanationEN: "\"visit\" is a transitive verb needing an object, so \"that\", \"which\", or zero relative pronoun is correct." },
  { id: "att_8", categoryId: "attributive", question: "This is the factory ______ I worked last year.", expected: ["where", "in which"], explanationCN: "work不缺宾语（地点状语） -> where / in which。", explanationEN: "\"work\" is intransitive here (implying 'work IN the factory'), so the relative adverb \"where\" (or \"in which\") is required." },

  // ==========================================
  // LEVEL 6: Noun Clauses (名词性从句)
  // Coverage: Subject, Object, Predicative, Appositive (That vs What vs Whether)
  // ==========================================
  { id: "nc_1", categoryId: "noun_clauses", question: "______ he needs is money.", expected: "What", explanationCN: "主语从句，且从句中needs缺宾语 -> What。", explanationEN: "This is a subject clause. \"What\" serves as the object of \"needs\" within the clause." },
  { id: "nc_2", categoryId: "noun_clauses", question: "The fact ______ he lied is plain.", expected: "that", explanationCN: "同位语从句，解释fact，从句结构完整，不充当成分 -> that（不可省）。", explanationEN: "This is an appositive clause explaining \"the fact\". Since the clause is structurally complete, \"that\" is used." },
  { id: "nc_3", categoryId: "noun_clauses", question: "I don\u0027t know ______ or not he will come.", expected: "whether", explanationCN: "宾语从句，搭配 or not -> 只能用 whether，不用 if。", explanationEN: "When \"or not\" is immediately following the conjunction, \"whether\" must be used, not \"if\"." },
  { id: "nc_4", categoryId: "noun_clauses", question: "The problem is ______ we can get there.", expected: "how", explanationCN: "表语从句，表示“如何” -> how。", explanationEN: "This is a predicative clause. Context implies the method/way, so \"how\" is the correct connector." },
  { id: "nc_5", categoryId: "noun_clauses", question: "That is ______ he refused my offer.", expected: "why", explanationCN: "That is why... = 那就是...的原因。", explanationEN: "\"That is why...\" is a standard structure used to introduce a reason/explanation." },
  { id: "nc_6", categoryId: "noun_clauses", question: "It is suggested ______ we (should) go there.", expected: "that", explanationCN: "It做形式主语，真正主语从句用 that 引导。", explanationEN: "\"It\" is the formal subject. The real subject is the clause starting with \"that\"." },
  { id: "nc_7", categoryId: "noun_clauses", question: "We doubt ______ he is honest.", expected: ["whether", "if"], explanationCN: "doubt在肯定句中，通常接 whether/if 表示怀疑。", explanationEN: "In affirmative sentences, \"doubt\" is followed by \"whether\" or \"if\" to express uncertainty." },
  { id: "nc_8", categoryId: "noun_clauses", question: "There is no doubt ______ he is honest.", expected: "that", explanationCN: "no doubt (否定怀疑) -> 用 that 引导同位语从句。", explanationEN: "\"There is no doubt\" indicates certainty, so it is followed by \"that\"." },

  // ==========================================
  // LEVEL 7: Adverbial Clauses (状语从句)
  // Coverage: Time, Condition, Concession, Cause, Result
  // ==========================================
  { id: "adv_1", categoryId: "adverbial", question: "______ he is old, he runs fast.", expected: ["Although", "Though", "While"], explanationCN: "让步状语：虽然...但是...。", explanationEN: "Concession clause: \"Although\" or \"Though\" (meaning 'even if') fits the context." },
  { id: "adv_2", categoryId: "adverbial", question: "______ it rains tomorrow, we will cancel.", expected: "If", explanationCN: "条件状语：如果...。", explanationEN: "Conditional clause: \"If\" introduces the condition for cancelling." },
  { id: "adv_3", categoryId: "adverbial", question: "I will wait ______ you finish.", expected: ["until", "till"], explanationCN: "时间状语：直到...。", explanationEN: "Time clause: \"Until\" or \"Till\" indicates the duration up to a specific point." },
  { id: "adv_4", categoryId: "adverbial", question: "Hard ______ he tried, he failed.", expected: ["as", "though"], explanationCN: "倒装让步：Adj + as/though + 主谓。", explanationEN: "Inverted concession pattern: Adjective + as/though + Subject + Verb ("Hard as he tried")." },
  { id: "adv_5", categoryId: "adverbial", question: "He speaks English so well ______ people think he is native.", expected: "that", explanationCN: "结果状语：so...that... (如此...以至于)。", explanationEN: "Result clause: \"so ... that ...\" expresses cause and consequence." },
  { id: "adv_6", categoryId: "adverbial", question: "Use the umbrella ______ you get wet.", expected: ["in case", "lest"], explanationCN: "目的/防备：in case (以免/万一)。", explanationEN: "Purpose/Precaution: \"in case\" means \"so that ... will not happen\"." },
  { id: "adv_7", categoryId: "adverbial", question: "______ you are here, you\u0027d better stay.", expected: ["Since", "Now that"], explanationCN: "原因状语：既然...。", explanationEN: "Reason clause: \"Since\" or \"Now that\" means \"considering the fact that\"." },
  { id: "adv_8", categoryId: "adverbial", question: "It was not ______ midnight that he came back.", expected: "until", explanationCN: "not...until... 直到...才...。", explanationEN: "Time/Emphasis: \"It was not until ... that ...\" emphasizes the event happened only after midnight." },

  // ==========================================
  // LEVEL 8: Inversion (特殊句式：倒装)
  // Coverage: Partial Inversion (Negative, Only), Full Inversion (Here/There)
  // ==========================================
  { id: "inv_1", categoryId: "inversion", question: "Never ______ I seen such a thing.", expected: "have", explanationCN: "否定词(Never)置于句首 -> 部分倒装 (助动词提前)。", explanationEN: "Negative word (Never) at the start requires Partial Inversion (Auxiliary verb \"have\" before subject)." },
  { id: "inv_2", categoryId: "inversion", question: "Only in this way ______ you solve it.", expected: "can", explanationCN: "Only + 状语置于句首 -> 部分倒装。", explanationEN: "\"Only\" + modifier at the start requires Partial Inversion (Auxiliary \"can\" before subject)." },
  { id: "inv_3", categoryId: "inversion", question: "Here ______ (come) the bus!", expected: "comes", explanationCN: "方位词(Here)置于句首 + 名词主语 -> 全部倒装 (comes...bus)。", explanationEN: "Directional word (Here) at the start with a noun subject requires Full Inversion (Verb matches subject syntax)." },
  { id: "inv_4", categoryId: "inversion", question: "So fast ______ he run that no one could catch him.", expected: "did", explanationCN: "So + adj/adv 位于句首 -> 部分倒装 (did...run)。", explanationEN: "\"So\" + adj/adv at the start requires Partial Inversion (Auxiliary \"did\" inserted)." },
  { id: "inv_5", categoryId: "inversion", question: "Not only ______ he speak English, but also French.", expected: ["does", "can"], explanationCN: "Not only 置于句首 -> 部分倒装。", explanationEN: "\"Not only\" at the start requires Partial Inversion (Auxiliary \"does\" or \"can\")." },
  { id: "inv_6", categoryId: "inversion", question: "Hardly had I arrived ______ the phone rang.", expected: "when", explanationCN: "Hardly...when... (刚一...就...)，Hardly部分倒装。", explanationEN: "The \"Hardly ... when ...\" pattern requires inversion after \"Hardly\" and uses \"when\" for the second clause." },
  { id: "inv_7", categoryId: "inversion", question: "Little ______ he know about the truth.", expected: ["did", "does"], explanationCN: "否定词(Little)置于句首 -> 部分倒装。", explanationEN: "Negative word (Little) at the start requires Partial Inversion." },
  { id: "inv_8", categoryId: "inversion", question: "Away ______ (fly) the bird.", expected: "flew", explanationCN: "方位副词(Away) + 动词 + 名词主语 -> 全部倒装。", explanationEN: "Directional adverb (Away) at the start requires Full Inversion for emphasis." },

  // ==========================================
  // LEVEL 9: Emphasis & It Structure (强调与It用法)
  // Coverage: It is...that, Formal Object, Formal Subject
  // ==========================================
  { id: "emp_1", categoryId: "emphasis_it", question: "It is in the park ______ I met her.", expected: "that", explanationCN: "强调句型：It is + 被强调部分 + that + 剩余部分。", explanationEN: "Emphasis/Cleft Sentence: \"It is ... that ...\" highlights \"in the park\"." },
  { id: "emp_2", categoryId: "emphasis_it", question: "I found ______ difficult to master English.", expected: "it", explanationCN: "形式宾语：find it adj to do。", explanationEN: "Formal Object: \"it\" acts as a placeholder for the infinitive phrase \"to master English\"." },
  { id: "emp_3", categoryId: "emphasis_it", question: "Was ______ he that called you?", expected: "it", explanationCN: "强调句的一般疑问句：Was it ... that ...?", explanationEN: "Interrogative form of the Emphasis Pattern: \"Was it ... that ...?\"" },
  { id: "emp_4", categoryId: "emphasis_it", question: "It is Tom ______ (who) is to blame.", expected: ["who", "that"], explanationCN: "强调人 (Tom) -> 可用 who 或 that。", explanationEN: "When emphasizing a person (Tom), both \"that\" and \"who\" are acceptable connectors." },
  { id: "emp_5", categoryId: "emphasis_it", question: "It ______ (hit) me that I had forgotten the keys.", expected: "hit", explanationCN: "It hits sb that... (某人突然想起...)。句中有 had forgotten (过去完成时)，主句通常对应过去时。Hit 的过去式也是 hit。", explanationEN: "\"It hit me that...\" is an idiom meaning \"I suddenly realized\". Past context requires \"hit\" (past tense)." },
  { id: "emp_6", categoryId: "emphasis_it", question: "It looks ______ it is going to rain.", expected: ["as if", "like"], explanationCN: "It looks as if... (看起来好像...)。", explanationEN: "\"It looks as if...\" (or casual \"like\") is a standard structure describing an apparent situation." },
  { id: "emp_7", categoryId: "emphasis_it", question: "I make ______ a rule to get up early.", expected: "it", explanationCN: "make it a rule to do (把...定为规矩)。", explanationEN: "\"make it a rule\" uses \"it\" as a formal object anticipating the infinitive \"to get up early\"." },
  { id: "emp_8", categoryId: "emphasis_it", question: "It was not until yesterday ______ I knew the news.", expected: "that", explanationCN: "强调 not until 句型：It was not until ... that ...", explanationEN: "Emphasized \"not until\" structure always uses \"that\" as the connector." },

  // ==========================================
  // LEVEL 10: Subjunctive Mood (虚拟语气)
  // Coverage: If conditionals, Wish, Would rather, Suggest/Order verbs
  // ==========================================
  { id: "sub_1", categoryId: "subjunctive", question: "If I ______ (be) a bird, I would fly.", expected: "were", explanationCN: "与现在事实相反 -> be动词用 were。", explanationEN: "Condition contrary to present fact -> use \"were\" for all persons in subjunctive mood." },
  { id: "sub_2", categoryId: "subjunctive", question: "I wish I ______ (know) the answer yesterday.", expected: "had known", explanationCN: "Wish后接虚拟：与过去事实相反 -> 过去完成时 (had done)。", explanationEN: "\"Wish\" followed by a past contrary condition requires Past Perfect Tense (had known)." },
  { id: "sub_3", categoryId: "subjunctive", question: "It is high time we ______ (go) home.", expected: ["went", "should go"], explanationCN: "It is high time did/should do (该是做...的时候了)。", explanationEN: "\"It is high time\" is followed by Past Simple or \"should + verb\"." },
  { id: "sub_4", categoryId: "subjunctive", question: "If there ______ (be) no water, fish could not live.", expected: ["were", "was"], explanationCN: "与现在事实相反的假设 -> be动词用 were/was。", explanationEN: "Hypothetical condition contrary to present reality -> use \"were\"." },
  { id: "sub_5", categoryId: "subjunctive", question: "He suggested that we ______ (go) there at once.", expected: ["should go", "go"], explanationCN: "Suggest(建议)后的宾语从句 -> (should) + 动词原形。", explanationEN: "\"Suggest\" (meaning advise) triggers the command subjunctive: (should) + bare infinitive." },
  { id: "sub_6", categoryId: "subjunctive", question: "If he ______ (come) tomorrow, I would speak to him.", expected: ["were to come", "should come", "came"], explanationCN: "与将来事实相反 -> past tense / should / were to do。", explanationEN: "Hypothetical future condition -> \"were to come\", \"should come\", or past tense \"came\"." },
  { id: "sub_7", categoryId: "subjunctive", question: "I would rather you ______ (come) tomorrow.", expected: "came", explanationCN: "Would rather + 从句：用过去式表示对将来的愿望。", explanationEN: "\"Would rather\" + clause uses Past Tense to express a preference for the future." },
  { id: "sub_8", categoryId: "subjunctive", question: "But for your help, I ______ (fail).", expected: ["would have failed", "could have failed"], explanationCN: "But for (要不是) -> 含蓄虚拟，与过去相反 -> would have done。", explanationEN: "\"But for\" implies a conditional contrary to past fact (If it hadn\u0027t been for your help), so \"would have failed\" is used." },

  // ==========================================
  // LEVEL 11: Adj/Adv/Art (形容词/副词/冠词)
  // Coverage: Comparison, Articles (a/an/the), Word Order
  // ==========================================
  { id: "aaa_3", categoryId: "adj_adv", question: "This is ______ most interesting book.", expected: ["a", "the"], explanationCN: "a most = very (一本非常...的书); the most = 最(最高级)。", explanationEN: "\"a most\" means \"a very\"; \"the most\" is the superlative form. Both are grammatically possible here depending on context." },
  { id: "aaa_9", categoryId: "adj_adv", question: "Of the two sisters, Betty is ______ (rich) one.", expected: "the richer", explanationCN: "Of the two... -> 特指且比较级 (the + comparative)。", explanationEN: "\"Of the two\" specifies a pair, making the comparison specific, so \"the\" + comparative is used." },
  { id: "aaa_10", categoryId: "adj_adv", question: "He is ______ (lazy) than stupid.", expected: "more lazy", explanationCN: "同一人两种特性的比较用 \u0027more ... than ...\u0027 而非 -er form。", explanationEN: "When comparing two qualities within the same person, use \"more ... than ...\" (not lazier)." },
  { id: "aaa_11", categoryId: "adj_adv", question: "I have never spent a ______ (pleasant) day.", expected: "more pleasant", explanationCN: "否定词 + 比较级 = 最高级含义 (never ... more ... = now is the most ...)。", explanationEN: "Negative + Comparative expresses a Superlative meaning (I have never... more... implies this is the most...)." },
  { id: "aaa_12", categoryId: "adj_adv", question: "He speaks ______ (high) of the new teacher.", expected: "highly", explanationCN: "speak highly of = 高度评价 (high表高度，highly表程度)。", explanationEN: "\"speak highly of\" is a fixed phrase meaning to praise. \"Highly\" refers to degree/opinion, not physical height." },
  { id: "aaa_13", categoryId: "adj_adv", question: "The more you learn, the ______ (modest) you become.", expected: "more modest", explanationCN: "双重比较级：The more ..., the more ... (越...就越...)", explanationEN: "The \"The more ..., the more ...\" parallel structure requires the comparative form \"more modest\"." },
  { id: "aaa_14", categoryId: "adj_adv", question: "The climate here is like ______ (that) of Kunming.", expected: "that", explanationCN: "比较对象需一致：单数用that替代，复数用those。", explanationEN: "\"that\" is used to replace the singular noun \"climate\" to ensure logical comparison." },
  { id: "aaa_15", categoryId: "adj_adv", question: "He was elected ______ monitor of the class.", expected: ["-", "/"], explanationCN: "独一无二的职位作主语补语/同位语时省略冠词。", explanationEN: "No article is used before unique titles/positions (elected monitor). Use \"-\" or \"/\" for zero article." },

  // ==========================================
  // LEVEL 12: SV Agreement (主谓一致)
  // Coverage: Grammatical, Notional, Proximity rules
  // ==========================================
  { id: "sva_3", categoryId: "agreement", question: "Not only you but he ______ (be) wrong.", expected: "is", explanationCN: "就近原则：Not only...but also... (与 he 一致)。", explanationEN: "Proximity Rule: \"Not only ... but also ...\" verbs agree with the nearest subject (he)." },
  { id: "sva_4", categoryId: "agreement", question: "The police ______ (be) coming.", expected: ["are", "were"], explanationCN: "集合名词 (Police/People/Cattle) -> 复数谓语。", explanationEN: "Collective nouns like \"police\" are always grammatically plural." },
  { id: "sva_5", categoryId: "agreement", question: "The teacher as well as the students ______ (be) happy.", expected: ["is", "was"], explanationCN: "A as well as B -> 与前面 A 一致 (teacher -> is)。", explanationEN: "\"A as well as B\" structure dictates that the verb agrees with the first subject (A)." },
  { id: "sva_6", categoryId: "agreement", question: "Twenty years ______ (be) a long time.", expected: "is", explanationCN: "时间、距离、金钱作为整体 -> 单数谓语。", explanationEN: "Time, distance, and money, when viewed as a single unit or amount, take a singular verb." },
  { id: "sva_7", categoryId: "agreement", question: "The number of students ______ (be) increasing.", expected: "is", explanationCN: "The number of (数量) -> 单数。", explanationEN: "\"The number of\" refers to the count itself, which is singular." },
  { id: "sva_8", categoryId: "agreement", question: "A number of students ______ (be) playing.", expected: ["are", "were"], explanationCN: "A number of (许多) -> 复数。", explanationEN: "\"A number of\" is a quantifier meaning \"many\", so it requires a plural verb." },

  // ==========================================
  // LEVEL 13: Phrasal Verbs & Collocations (固定搭配)
  // Coverage: Common高考 动词短语 & 介词搭配
  // ==========================================
  { id: "pv_1", categoryId: "phrasal_collo", question: "She looks forward to ______ (see) you soon.", expected: "seeing", explanationCN: "look forward to doing (to是介词，后接动名词)。", explanationEN: "\"look forward to\" ends in the preposition \"to\", requiring a gerund (-ing form)." },
  { id: "pv_2", categoryId: "phrasal_collo", question: "He devoted his life to ______ (help) the poor.", expected: "helping", explanationCN: "devote ... to doing (to是介词)。", explanationEN: "\"devote ... to\" ends in the preposition \"to\", so the verb following it must be a gerund." },
  { id: "pv_3", categoryId: "phrasal_collo", question: "Please pay attention to ______ (listen) carefully.", expected: "listening", explanationCN: "pay attention to doing (注意做某事)。", explanationEN: "\"pay attention to\" ends in the preposition \"to\", requiring a gerund." },
  { id: "pv_4", categoryId: "phrasal_collo", question: "The fire ______ (break) out last night.", expected: "broke", explanationCN: "break out (爆发) 无被动，发生于过去 -> broke。", explanationEN: "\"break out\" usually occurs in the past tense here. It is intransitive and has no passive form." },
  { id: "pv_5", categoryId: "phrasal_collo", question: "Don\u0027t give up ______ (try) even if you fail.", expected: "trying", explanationCN: "give up doing (放弃做某事)。", explanationEN: "\"give up\" is a phrasal verb followed by a gerund." },
  { id: "pv_6", categoryId: "phrasal_collo", question: "I can\u0027t put up with ______ (laugh) at.", expected: "being laughed", explanationCN: "put up with (忍受) + doing + be laughed at (被嘲笑)。", explanationEN: "\"put up with\" requires a gerund. The context implies passive voice (\"being laughed at\")." },
  { id: "pv_7", categoryId: "phrasal_collo", question: "This song reminds me ______ my childhood.", expected: "of", explanationCN: "remind sb of sth (使某人想起)。", explanationEN: "\"remind someone of something\" is the correct prepositional collocation." },
  { id: "pv_8", categoryId: "phrasal_collo", question: "He was accused ______ stealing the money.", expected: "of", explanationCN: "accuse sb of sth (指控)。", explanationEN: "\"accuse someone of something\" is the correct prepositional collocation." },

  // ==========================================
  // LEVEL 14: Ultimate Challenge (终极考点: 语境与陷阱)
  // Coverage: Context Logic, Mixed Grammar points, Long sentences (>100 chars)
  // ==========================================
  { 
    id: "ult_1", 
    categoryId: "ultimate_context", 
    question: "Hardly had the exhausted hikers arrived at the mountain lodge hoping for a hot meal and a good sleep ______ a terrible thunderstorm broke out.", 
    expected: "when", 
    explanationCN: "Hardly...when... (一...就...)。倒装结构与长句结合。", 
    explanationEN: "\"Hardly ... when ...\" pattern. Despite the length of the sentence, the structure demands \"when\" to introduce the second event." 
  },
  { 
    id: "ult_2", 
    categoryId: "ultimate_context", 
    question: "It was not until the professor explained the complex theory three times in detail ______ the students finally understood why the experiment had failed.", 
    expected: ["that"], 
    explanationCN: "强调句型：It was not until ... that ...。必须用that。", 
    explanationEN: "Emphasis Pattern: \"It was not until ... that ...\". \"That\" is strictly required to complete the emphasis structure." 
  },
  { 
    id: "ult_3", 
    categoryId: "ultimate_context", 
    question: "______ (stand) on top of the ancient tower at sunset, and you will see the whole city bathed in golden light, presenting a view that is absolutely breathtaking.", 
    expected: ["Stand", "stand"], 
    explanationCN: "祈使句 + and + 将来时 (Stand..., and you will...)。", 
    explanationEN: "Imperative + and + Future Tense pattern. The command \"Stand...\" leads to the result \"and you will see...\"." 
  },
  {
    id: "ult_4",
    categoryId: "ultimate_context",
    question: "______ (see) from the top of the hill, the city park looks like a gigantic green emerald embedded in the concrete jungle, offering a peaceful retreat for citizens.", 
    expected: ["Seen", "seen"],
    explanationCN: "非谓语动词：从山顶被看(Seen)，主语是公园。", 
    explanationEN: "Non-finite Verb: The logical subject \"the city park\" is SEEN (passive relation), so the Past Participle is required." 
  },
  { 
    id: "ult_5", 
    categoryId: "ultimate_context", 
    question: "Mr. Black is strictly professional, but he remains one of the few professors who ______ (be) always willing to sacrifice their weekends to help students.", 
    expected: ["are"], 
    explanationCN: "主谓一致：one of + 复数名词 + 定语从句 -> 动词用复数(are)。", 
    explanationEN: "Subject-Verb Agreement: In \"one of + plural noun + who\", the relative clause refers to the plural group (\"professors\"), so the verb is plural (\"are\")." 
  },
  { 
    id: "ult_6", 
    categoryId: "ultimate_context", 
    question: "Despite the massive renovation it has undergone recently, is this the same chemical factory ______ you visited with your sustainability research team last year?", 
    expected: ["that", "which", ""], 
    explanationCN: "定语从句：缺宾语(visited ...)。先行词是factory。", 
    explanationEN: "Attributive Clause: \"visited\" needs an object. The antecedent \"factory\" is the object, so \"that\" or \"which\" (or omission) is used." 
  },
  { 
    id: "ult_7", 
    categoryId: "ultimate_context", 
    question: "Looking at the modern layout, it is hard to believe that this is the very factory ______ my grandfather worked for forty years before he finally retired.", 
    expected: ["where", "in which"], 
    explanationCN: "定语从句：缺地点状语(worked IN ...)。需用 where 或 in which。", 
    explanationEN: "Attributive Clause: \"work\" is intransitive. The sense is \"worked IN the factory\", so the relative adverb \"where\" or \"in which\" is required." 
  },
  { 
    id: "ult_8", 
    categoryId: "ultimate_context", 
    question: "Not only the enthusiastic students but also their usually strict professor ______ (be) shocked by the unexpected results of the experiment conducted yesterday.", 
    expected: "was", 
    explanationCN: "主谓一致：Not only...but also... 遵循就近原则(professor -> was)。", 
    explanationEN: "Agreement: \"Not only... but also...\" follows the \"nearest subject\" rule. The verb agrees with \"professor\" (singular), ignoring \"students\"." 
  }
];
