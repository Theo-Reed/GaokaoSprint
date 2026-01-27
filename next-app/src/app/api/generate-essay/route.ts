
import { NextResponse } from 'next/server';

const GEN_PROMPT_NO_SCAFFOLD = `You are a senior Gaokao English grading expert with years of experience.
Task: Write a perfect, FULL-SCORE (满分) model essay for students based on the provided topic.

Output Format:
Return the COMPLETE essay text only.
Do NOT wrap the output in markdown code blocks. Just the raw text.

Constraints:
1. WORD COUNT: 100-110 words.
2. STRUCTURE:
   - Paragraph 1 (Opening): Concise hook/purpose (20-25 words).
   - Paragraph 2 (Middle): Logical, detail-rich core (60-70 words).
   - Paragraph 3 (Closing): Concise summary/sign-off (15-20 words).
3. STYLE:
   - Middle Paragraph: Use diverse grammatical structures (non-finite verbs, relative clauses, inversions, etc.).
4. FORMATTING:
   - Standard 3-paragraph essay structure.
   - No blank lines between sentences within a paragraph. 
   - No markdown bolding/headings.
   - The Sign-off should be on a new line at the very end.
5. LEVEL: Absolute top-tier star candidate.`;

const GEN_PROMPT_WITH_SCAFFOLD = `You are a senior Gaokao English grading expert with years of experience.
Task: Write a perfect, FULL-SCORE (满分) model essay for students by FILLING IN the content between the provided "Scaffold Start" and "Scaffold End".

Output Format:
Return the COMPLETE essay text only. It must combine: [Scaffold Start Content] + [Your Generated Content] + [Scaffold End Content].
CRITICAL: DO NOT include the text labels "Scaffold Start:" or "Scaffold End:" in your output. Just the essay text itself.
Do NOT wrap the output in markdown code blocks. Just the raw text.

Constraints for [Your Generated Content] ONLY:
1. WORD COUNT: 100-110 words. (The Scaffolds do NOT count towards this limit).
2. STRUCTURE:
   - Paragraph 1 (Opening): Concise hook/purpose (20-25 words).
   - Paragraph 2 (Middle): Logical, detail-rich core (60-70 words).
   - Paragraph 3 (Closing): Concise summary/sign-off (15-20 words).
3. STYLE:
   - Middle Paragraph: Use diverse grammatical structures (non-finite verbs, relative clauses, inversions, etc.).
   - Tone: Must flow seamlessly from the Scaffold Start and into the Scaffold End.
4. FORMATTING:
   - Combine [Scaffold Start] + [Body] + [Scaffold End] into a standard 3-paragraph essay structure.
   - MANDATORY: Ensure there are clearly visible LINE BREAKS between Paragraph 1, Paragraph 2, and Paragraph 3.
   - CRITICAL EXCEPTION: If [Scaffold Start] is a sentence (not a "Dear X" salutation), Paragraph 1 text must continue on the SAME LINE. DO NOT add a newline after Scaffold Start.
   - No markdown bolding/headings.
   - The Sign-off should be on a new line at the very end.
5. LEVEL: Absolute top-tier star candidate.`;

const GPT_GEN_PROMPT_WITH_SCAFFOLD = `You are a senior Gaokao English grading expert.
Task: Write a perfect, FULL-SCORE (满分) model essay by connecting [Scaffold Start] and [Scaffold End].

Output Format:
Return the COMPLETE essay text only.
Do NOT wrap the output in markdown code blocks.

Detailed Rules:
1. SCAFFOLD HANDLING:
   - Check [Scaffold Start]. 
   - Rule A: If it is a Salutation (e.g., "Dear Tom,", "Dear Sir/Madam,"), you MUST add a newline after it before starting the first paragraph.
   - Rule B: If it is a Sentence Opening (e.g., "I am writing to...", "The chart shows..."), you MUST continue writing on the EXACT SAME LINE.

2. PARAGRAPH STRUCTURE:
   - The body MUST have 3 separate paragraphs.
   - You MUST insert an empty line between each paragraph.
   - Paragraph 1 (Opening): ~20-25 words.
   - Paragraph 2 (Middle): ~60-70 words.
   - Paragraph 3 (Closing): ~15-20 words.
   - The [Scaffold Start] counts as the beginning of Paragraph 1 (if Rule B applies) or stands alone (if Rule A applies).

3. SIGN-OFF:
   - The [Scaffold End] (Sign-off) MUST be on its own line at the very bottom.

4. CONTENT:
   - Word count target for YOUR generated part: 100-110 words.
   - Use sophisticated vocabulary and Grammar (non-finite verbs, clauses).
`;

const GPT_GEN_PROMPT_NO_SCAFFOLD = `You are a senior Gaokao English grading expert.
Task: Write a perfect, FULL-SCORE (满分) model essay based on the provided topic.

Output Format:
Return the COMPLETE essay text only.
Do NOT wrap the output in markdown code blocks.

Detailed Rules:
1. IF LETTER/EMAIL:
   - Start with "Dear X," (on its own line).
   - Add an empty line.
   - Begin Paragraph 1.

2. BODY STRUCTURE (Strictly 3 Paragraphs):
   - The body MUST consist of exactly 3 distinct paragraphs separated by empty lines.
   - Paragraph 1 (Opening): Purpose of writing / Opening hook (approx. 20-25 words).
   - [INSERT EMPTY LINE]
   - Paragraph 2 (Middle): Main details, reasons, or events (approx. 60-70 words).
   - [INSERT EMPTY LINE]
   - Paragraph 3 (Closing): Concluding marks / Call to action (approx. 15-20 words).

3. SIGN-OFF:
   - Add an empty line after Paragraph 3.
   - Write the sign-off (e.g., "Yours, Li Hua") on its own line.

4. CONTENT:
   - Total Word count: 100-110 words.
   - Use sophisticated vocabulary and grammar.
`;

const DEEPSEEK_GEN_PROMPT_NO_SCAFFOLD = `你是一位拥有多年阅卷经验的高考英语阅卷专家。
任务：根据题目要求，为学生撰写一篇完美的、满分（Full-Score）范文。

输出格式：
只返回文章正文。不要用 markdown 代码块包裹输出。

详细排版规则（CRITICAL）：
1. 称呼（Salutation）：如果是书信格式，**称呼（如 "Dear Chris,"）必须独占一行**。称呼后面必须换行，不能直接接正文！
2. 正文结构：
   - 严格分3个自然段（开头、中间、结尾）。
   - 段落之间必须有空行分隔。
3. 落款（Sign-off）：必须独占最后一行。
4. 段落内部：严禁换行。

内容限制：
1. 字数：100-110词。
2. 结构权重：
   - 第一段：引入/目的（20-25词）。
   - 第二段：核心细节（60-70词）。
   - 第三段：总结（15-20词）。
3. 水平：绝对顶尖的满分考生水平。`;

const DEEPSEEK_GEN_PROMPT_WITH_SCAFFOLD = `你是一位拥有多年阅卷经验的高考英语阅卷专家。
任务：为学生撰写一篇完美的、满分（Full-Score）范文，通过填充提供的“开头辅助（Scaffold Start）”和“结尾辅助（Scaffold End）”之间的内容。

输出格式：
必须返回合并后的完整文本：即 [开头辅助内容] + [你生成的内容] + [结尾辅助内容]。
⚠️警告：你必须在返回的文本开头原样包含 [Scaffold Start] 的内容，绝不能省略！
关键：输出中严禁包含 "Scaffold Start:" 等标签。
不要用 markdown 代码块包裹输出。

对 [你生成的内容] 的限制（仅针对中间部分）：
1. 字数：100-110词。（辅助的头尾不计入此限制）。
2. 结构：
   - 第一段（开头）：简洁的引入/目的（约20-25词）。注意：必须紧接 [开头辅助] 且不换行。[开头辅助] 不计入这20-25词。
   - 第二段（中间）：逻辑严密、细节丰富的核心段落（约60-70词）。
   - 第三段（结尾）：简洁的总结/落款（约15-20词）。
3. 格式：
   - 必须将 [开头辅助] 与后续内容自然拼接。
     * **如果 [开头辅助] 是信件开头称呼（如 "Dear..."），必须先换行，再写正文第一段！**
     * **如果 [开头辅助] 是个句子（或句子片段），你的内容必须接在同一行，严禁换行！**
   - 全文正文严格限制为3个自然段，且段落之间必须有清晰的空行。
   - 段落内部严禁换行。
   - 落款应单独成行。
4. 风格：
   - 中间段落：使用多样的语法结构（非谓语动词、定语从句、倒装等）。
   - 语调：必须与给定的开头和结尾无缝衔接。
5. 水平：绝对顶尖的满分考生水平。`;

async function callGemini(apiKey: string, model: string, system: string, user: string) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `System Instruction: ${system}\n\nUser Request: ${user}` }]
        }],
        generationConfig: { temperature: 0.7 }
      }),
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Error: No response";
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
}

async function callOpenAIStyle(apiUrl: string, apiKey: string, model: string, system: string, user: string) {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "Error: Empty response";
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
}

export async function POST(req: Request) {
  try {
    const { topic, type, model: targetModel, gradingStandards, scaffoldStart, scaffoldEnd } = await req.json();
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const UNIFIED_API_KEY = process.env.UNIFIED_API_KEY;
    const DEEPSEEKER_API_KEY = process.env.DEEPSEEKER_API_KEY;

    const hasScaffold = !!scaffoldStart || !!scaffoldEnd;

    const userPromptContent = hasScaffold ? `Target Grading Standards: ${gradingStandards}
Topic context: ${topic}
Composition Type: ${type === 'small' ? 'Small Composition' : 'Story Continuation'}

MANDATORY SCAFFOLDS (Must be included verbatim in output):
Scaffold Start: "${scaffoldStart || ''}"
Scaffold End: "${scaffoldEnd || ''}"

Instruction: Generate the middle content connecting these scaffolds perfectly.` : `Target Grading Standards: ${gradingStandards}
Topic context: ${topic}
Composition Type: ${type === 'small' ? 'Small Composition' : 'Story Continuation'}

Instruction: Generate a perfect essay matching the requirements exactly.`;

    let essay = "";
    let systemPrompt = "";

    if (targetModel === 'deepseek') {
        systemPrompt = hasScaffold ? DEEPSEEK_GEN_PROMPT_WITH_SCAFFOLD : DEEPSEEK_GEN_PROMPT_NO_SCAFFOLD;
    } else if (targetModel === 'gpt') {
        systemPrompt = hasScaffold ? GPT_GEN_PROMPT_WITH_SCAFFOLD : GPT_GEN_PROMPT_NO_SCAFFOLD;
    } else {
        systemPrompt = hasScaffold ? GEN_PROMPT_WITH_SCAFFOLD : GEN_PROMPT_NO_SCAFFOLD;
    }
    
    switch (targetModel) {
      case 'gemini':
        essay = await callGemini(GEMINI_API_KEY || "", "gemini-2.5-pro", systemPrompt, userPromptContent);
        break;
      case 'gpt':
        essay = await callOpenAIStyle("https://www.yunqiaoai.top/v1/chat/completions", UNIFIED_API_KEY || "", "gpt-4o", systemPrompt, userPromptContent);
        break;
      case 'deepseek':
        essay = await callOpenAIStyle("https://api.deepseek.com/v1/chat/completions", DEEPSEEKER_API_KEY || "", "deepseek-reasoner", systemPrompt, userPromptContent);
        break;
      case 'claude':
        essay = await callOpenAIStyle("https://www.yunqiaoai.top/v1/chat/completions", UNIFIED_API_KEY || "", "claude-3-7-sonnet-20250219", systemPrompt, userPromptContent);
        break;
      default:
        return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    return NextResponse.json({ essay });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
