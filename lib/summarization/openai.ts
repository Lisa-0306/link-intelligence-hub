import OpenAI from "openai";
import type { SummaryResult } from "./index";

function fallbackSummary(text: string, title?: string | null): SummaryResult {
  const clipped = text.trim().replace(/\s+/g, " ").slice(0, 600);
  const oneLine = clipped
    ? `${title ? `${title}: ` : ""}${clipped.slice(0, 120)}${clipped.length > 120 ? "..." : ""}`
    : "暂无可总结内容。";
  const markdown = [
    `# ${title || "Untitled"}`,
    "",
    `## 一句话总结`,
    oneLine,
    "",
    "## 详细摘要",
    clipped || "OpenAI API Key 未配置，当前仅保存原始内容。",
    "",
    "## 关键观点",
    "- 待 OpenAI 摘要生成",
    "",
    "## 时间轴",
    "- 暂无",
    "",
    "## 投研价值",
    "待进一步判断。",
    "",
    "## 风险提示",
    "- 请核对原文来源与时效性。"
  ].join("\n");

  return {
    oneLine,
    detailed: clipped,
    keyPoints: ["待 OpenAI 摘要生成"],
    timeline: [],
    facts: [],
    investmentValue: "待进一步判断。",
    risks: ["请核对原文来源与时效性。"],
    followUps: [],
    markdown
  };
}

export async function summarizeWithOpenAI(input: {
  title?: string | null;
  text: string;
  promptTemplate?: string | null;
}): Promise<SummaryResult> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackSummary(input.text, input.title);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You summarize Chinese and English source material into Chinese structured research notes. Return valid JSON only."
      },
      {
        role: "user",
        content: [
          input.promptTemplate ? `Prompt template:\n${input.promptTemplate}` : "",
          `Title: ${input.title ?? "Untitled"}`,
          "Return JSON with keys: oneLine, detailed, keyPoints, timeline, facts, investmentValue, risks, followUps, markdown.",
          `Source text:\n${input.text.slice(0, 50000)}`
        ].join("\n\n")
      }
    ]
  });

  const raw = completion.choices[0]?.message.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<SummaryResult>;
  const merged = {
    ...fallbackSummary(input.text, input.title),
    ...parsed
  };
  return {
    ...merged,
    keyPoints: Array.isArray(merged.keyPoints) ? merged.keyPoints : [],
    timeline: Array.isArray(merged.timeline) ? merged.timeline : [],
    facts: Array.isArray(merged.facts) ? merged.facts : [],
    risks: Array.isArray(merged.risks) ? merged.risks : [],
    followUps: Array.isArray(merged.followUps) ? merged.followUps : []
  };
}
