import { NextRequest, NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/db";
import { detectInputType, isUrl } from "@/lib/detectors/detectInputType";
import { getStorageAdapter } from "@/lib/storage";
import { processTask } from "@/lib/tasks/processTask";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ tasks: listTasks() });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const input = String(form.get("input") ?? "").trim();
  const promptTemplate = String(form.get("promptTemplate") ?? "") || null;
  const file = form.get("file");

  if (!input && !(file instanceof File && file.size > 0)) {
    return NextResponse.json({ error: "Input or file is required." }, { status: 400 });
  }

  let filePath: string | null = null;
  let sourceType = detectInputType(input);
  const originalUrl = isUrl(input) ? input : null;

  if (file instanceof File && file.size > 0) {
    const storage = await getStorageAdapter();
    const saved = await storage.saveFile(file.name, Buffer.from(await file.arrayBuffer()));
    filePath = saved.path;
    sourceType = detectInputType(input, file.name);
  }

  const task = createTask({
    input: input || filePath || "",
    sourceType,
    originalUrl,
    filePath,
    promptTemplate
  });

  processTask(task.id).catch((error) => {
    console.error("Task processing failed", error);
  });

  return NextResponse.json({ task }, { status: 201 });
}
