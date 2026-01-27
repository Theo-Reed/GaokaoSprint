
import { NextResponse } from 'next/server';

const GEMINI_PROMPT = `You are a senior Gaokao English grading expert.
Grading Tiers (for 15-point scale):
- 5th Tier (13-15): Covers all points, clear/reasonable; Diverse and accurate vocab/syntax; Minor errors due to complexity allowed; Tight and meaningful cohesion.
- 4th Tier (10-12): Covers all points, relatively clear; Relatively diverse and accurate; Minor errors not affecting understanding; Relatively tight cohesion.
- 3rd Tier (7-9): Major points covered, some unclear; Vocab/syntax meets basic needs; Errors present but don't hinder understanding; Simple/basic cohesion.

Specific Dimension Instruction (Dimension 4 - Cohesion):
It's NOT about how advanced the connectors are. It's about LOGIC. Can the sentences be linked correctly? Is the entire passage coherent?

JSON structure:
{
  "score": number,
  "suggestions": [
    "Content analysis...",
    "Vocabulary analysis...",
    "Syntax analysis...",
    "Cohesion/Logic analysis..."
  ],
  "summary": "Explicitly state deduction reasons based on the Tier criteria above..."
}
Requirements:
- Response in Chinese. 4 suggestions (60-80 words each).
- Summary (60-80 words) MUST focus on "Why Deducted" (为什么扣分).
- Raw JSON only. NO titles.`;

const GPT_PROMPT = `You are an elite Gaokao English examiner (GPT-4o version).
Follow these Grading Tiers (15-point basis):
- 5th Tier (13-15): Complete coverage, sophisticated/accurate; Tight internal logic and cohesion.
- 4th Tier (10-12): Complete coverage, relatively accurate/diverse; Relatively coherent logic.
- 3rd Tier (7-9): Main points covered, meets basic requirements; Some errors, simple cohesion.

Cohesion Logic (Suggestion 4):
Focus on the logic and flow of ideas, NOT just advanced transition words. Check if the sentences link naturally and if the writing is coherent.

JSON structure:
{
  "score": number,
  "suggestions": [
    "Content analysis...",
    "Vocabulary analysis...",
    "Syntax analysis...",
    "Logic/Cohesion analysis..."
  ],
  "summary": "Explain point deductions strictly based on the grading tiers..."
}
Requirements:
- Response in Chinese. 4 suggestions (60-80 words each).
- Summary (60-80 words) MUST detail exactly why points were lost.
- Raw JSON only. NO titles.`;

const DEEPSEEK_PROMPT = `你是一位顶尖高考英语阅卷专家。请严格执行以下分档标准：

各档次给分要求 (以15分为准)：
- 第五档 (13-15分)：覆盖所有内容点，表达清楚合理；词汇语法多样准确；极少数语言错误（因尝试复杂结构所致）；有效地使用语句连接手段，结构紧凑。
- 第四档 (10-12分)：覆盖所有内容点，表达比较清楚；词汇语法比较多样准确；少数语言错误不影响理解；有效地使用了语句间连接手段，全文结构比较紧凑。
- 第三档 (7-9分)：覆盖主要内容点，少数表达不清楚；词汇语法满足基本要求；有一些语言错误但不影响理解；应用简单的连接手段，结构/意义基本连贯。

连贯性逻辑 (第四项建议)：
重要的不是连接词有多高级，而是逻辑。要看表述的东西能否正确地连起来，全文是否连贯。

JSON 结构：
{
  "score": 数字,
  "suggestions": [
    "内容要点点评...",
    "词汇点评...",
    "句式点评...",
    "逻辑连贯点评..."
  ],
  "summary": "必须基于上述档次要求，明确说明扣分原因。"
}
要求：
- 中文回答。4条建议（每条60-80字）。
- Summary (60-80字) 必须明确解答“为什么扣分”。
- 只返回 JSON，不要标题前缀。`;

const CLAUDE_PROMPT = `You are a senior Gaokao English specialist (Claude-3.7).
Grading Framework:
- Tier 5 (13-15): Fully achieved; diversity in language; tight logical coherence.
- Tier 4 (10-12): Achieved; relatively diverse and tight; minor errors for complexity.
- Tier 3 (7-9): Basically achieved; meets requirements; minor errors, simple cohesion.

Cohesion Instruction (Suggestion 4):
Prioritize LOGIC and overall flow over the mere presence of "advanced" connectors. Assess how well sentences link together to form a whole.

JSON structure:
{
  "score": number,
  "suggestions": [
    "Content...",
    "Vocab...",
    "Syntax...",
    "Logic/Cohesion..."
  ],
  "summary": "Deduction breakdown based on Tier standards..."
}
Requirements:
- Response in Chinese.
- 4 suggestions (60-80 words each) + Summary (60-80 words).
- Summary MUST explicitly address "Why points were deducted".
- STRICTLY VALID JSON ONLY. Do not use Markdown backticks. Start with {. End with }.`;

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
        temperature: 0.3,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return `Error: ${response.status} - ${errorData.error?.message || response.statusText}`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "Error: Empty response";
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
}

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
        generationConfig: { temperature: 0.3 }
      }),
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Error: No response";
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Grading API is active" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, answer, type, model: targetModel } = body;

    if (!topic || !answer) {
      return NextResponse.json({ error: "Missing topic or answer" }, { status: 400 });
    }

    const userPrompt = `Topic: ${topic}
Student's Answer: ${answer}
Type: ${type === 'small' ? 'Small Composition (Max 15 points)' : 'Story Continuation (Max 25 points)'}
Please grade this strictly based on the Gaokao grading standards provided in the system instructions.`;

    // Get keys from process.env
    const UNIFIED_API_KEY = process.env.UNIFIED_API_KEY;
    const DEEPSEEKER_API_KEY = process.env.DEEPSEEKER_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Dispatch based on targetModel if provided
    if (targetModel) {
      let result = "";
      const system = targetModel === 'gemini' ? GEMINI_PROMPT : 
                     targetModel === 'gpt' ? GPT_PROMPT :
                     targetModel === 'deepseek' ? DEEPSEEK_PROMPT : CLAUDE_PROMPT;

      switch (targetModel) {
        case 'gemini':
          result = await callGemini(GEMINI_API_KEY || "", "gemini-2.5-flash", system, userPrompt);
          break;
        case 'gpt':
          result = await callOpenAIStyle("https://www.yunqiaoai.top/v1/chat/completions", UNIFIED_API_KEY || "", "gpt-4o", system, userPrompt);
          break;
        case 'deepseek':
          result = await callOpenAIStyle("https://api.deepseek.com/v1/chat/completions", DEEPSEEKER_API_KEY || "", "deepseek-reasoner", system, userPrompt);
          break;
        case 'claude':
          result = await callOpenAIStyle("https://www.yunqiaoai.top/v1/chat/completions", UNIFIED_API_KEY || "", "claude-3-7-sonnet-20250219", system, userPrompt);
          break;
        default:
          return NextResponse.json({ error: "Invalid model" }, { status: 400 });
      }
      return NextResponse.json({ [targetModel]: result });
    }

    // Default behavior: call all in parallel
    const results = await Promise.allSettled([
      callGemini(GEMINI_API_KEY || "", "gemini-2.5-flash", GEMINI_PROMPT, userPrompt),
      callOpenAIStyle("https://www.yunqiaoai.top/v1/chat/completions", UNIFIED_API_KEY || "", "gpt-4o", GPT_PROMPT, userPrompt),
      callOpenAIStyle("https://api.deepseek.com/v1/chat/completions", DEEPSEEKER_API_KEY || "", "deepseek-reasoner", DEEPSEEK_PROMPT, userPrompt),
      callOpenAIStyle("https://www.yunqiaoai.top/v1/chat/completions", UNIFIED_API_KEY || "", "claude-3-7-sonnet-20250219", CLAUDE_PROMPT, userPrompt),
    ]);

    const output = {
      gemini: results[0].status === 'fulfilled' ? results[0].value : 'Error',
      gpt: results[1].status === 'fulfilled' ? results[1].value : 'Error',
      deepseek: results[2].status === 'fulfilled' ? results[2].value : 'Error',
      claude: results[3].status === 'fulfilled' ? results[3].value : 'Error',
    };

    return NextResponse.json(output);
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
