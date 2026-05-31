import { NextResponse } from "next/server";
import { listPromptTemplates, savePromptTemplate } from "@/lib/prompts";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ prompts: await listPromptTemplates() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { id?: string; content?: string };
  if (!body.id || typeof body.content !== "string") {
    return NextResponse.json({ error: "id and content are required." }, { status: 400 });
  }
  await savePromptTemplate(body.id, body.content);
  return NextResponse.json({ ok: true });
}
