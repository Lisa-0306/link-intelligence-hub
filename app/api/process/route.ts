import { NextResponse } from "next/server";
import { detectInputType, isUrl } from "@/lib/detectors/detectInputType";
import { extractContent } from "@/lib/extractors";
import type { ExtractedContent } from "@/lib/extractors/types";
import { getPromptTemplate } from "@/lib/prompts";
import { summarizationProvider } from "@/lib/summarization";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    input?: string;
    promptTemplate?: string | null;
  };
  const input = body.input?.trim();
  if (!input) {
    return NextResponse.json({ error: "Input is required." }, { status: 400 });
  }

  const sourceType = detectInputType(input);
  const extracted: ExtractedContent =
    sourceType === "text"
      ? { sourceType, contentText: input, originalUrl: null }
      : await extractContent(sourceType, input);

  const title = extracted.title ?? (isUrl(input) ? input : input.slice(0, 90));
  const text = extracted.contentText || input;
  const promptTemplate = await getPromptTemplate(body.promptTemplate);
  const summary = await summarizationProvider.summarize({
    title,
    text,
    promptTemplate
  });

  return NextResponse.json({
    task: {
      id: crypto.randomUUID(),
      input,
      sourceType,
      status: "completed",
      title,
      author: extracted.author ?? null,
      publishedAt: extracted.publishedAt ?? null,
      originalUrl: extracted.originalUrl ?? (isUrl(input) ? input : null),
      contentText: text,
      transcript: sourceType === "youtube" ? text : null,
      summaryJson: JSON.stringify(summary, null, 2),
      summaryMarkdown: summary.markdown,
      promptTemplate: body.promptTemplate ?? null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
}
