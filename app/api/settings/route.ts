import { NextResponse } from "next/server";
import { listSettings, setSetting } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    env: {
      openaiApiKey: Boolean(process.env.OPENAI_API_KEY),
      databaseUrl: process.env.DATABASE_URL ?? "file:./data/app.sqlite",
      storageProvider: process.env.STORAGE_PROVIDER ?? "local",
      localStoragePath: process.env.LOCAL_STORAGE_PATH ?? "./storage",
      backupPath: process.env.BACKUP_PATH ?? "./backups",
      githubRepo: process.env.GITHUB_REPO ?? ""
    },
    settings: listSettings()
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { key?: string; value?: string };
  if (!body.key || typeof body.value !== "string") {
    return NextResponse.json({ error: "key and value are required." }, { status: 400 });
  }
  setSetting(body.key, body.value);
  return NextResponse.json({ ok: true });
}
