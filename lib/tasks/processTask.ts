import { getTask, updateTask } from "@/lib/db";
import { extractContent } from "@/lib/extractors";
import { getPromptTemplate } from "@/lib/prompts";
import { summarizationProvider } from "@/lib/summarization";
import { transcriptionProvider } from "@/lib/transcription";

export async function processTask(id: string) {
  const task = getTask(id);
  if (!task) throw new Error("Task not found");

  try {
    if (task.sourceType === "audio_file" || task.sourceType === "video_file") {
      updateTask(id, { status: "transcribing" });
      const transcript = task.filePath
        ? await transcriptionProvider.transcribe(task.filePath)
        : "No file path was stored.";
      updateTask(id, { transcript, contentText: transcript });
    } else if (task.sourceType === "text") {
      updateTask(id, { contentText: task.input });
    } else {
      updateTask(id, { status: "fetching" });
      const extracted = await extractContent(task.sourceType, task.input);
      updateTask(id, {
        title: extracted.title ?? null,
        author: extracted.author ?? null,
        publishedAt: extracted.publishedAt ?? null,
        originalUrl: extracted.originalUrl ?? task.originalUrl,
        contentText: extracted.contentText ?? null
      });
    }

    const fresh = getTask(id);
    const text = fresh?.contentText || fresh?.transcript || fresh?.input || "";
    updateTask(id, { status: "summarizing" });
    const promptTemplate = await getPromptTemplate(fresh?.promptTemplate);
    const summary = await summarizationProvider.summarize({
      title: fresh?.title,
      text,
      promptTemplate
    });
    updateTask(id, {
      status: "completed",
      summaryJson: JSON.stringify(summary, null, 2),
      summaryMarkdown: summary.markdown
    });
  } catch (error) {
    updateTask(id, {
      status: "failed",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
