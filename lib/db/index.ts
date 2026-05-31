import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { schemaSql, type SourceType, type Task, type TaskStatus } from "./schema";

let db: Database.Database | null = null;

function resolveDbPath() {
  const url = process.env.DATABASE_URL ?? "file:./data/app.sqlite";
  return url.startsWith("file:") ? url.slice(5) : url;
}

export function getDb() {
  if (!db) {
    const dbPath = path.resolve(process.cwd(), resolveDbPath());
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.exec(schemaSql);
  }
  return db;
}

export function createTask(input: {
  input: string;
  sourceType: SourceType;
  originalUrl?: string | null;
  filePath?: string | null;
  promptTemplate?: string | null;
}) {
  const now = new Date().toISOString();
  const task: Task = {
    id: crypto.randomUUID(),
    input: input.input,
    sourceType: input.sourceType,
    status: "pending",
    title: null,
    author: null,
    publishedAt: null,
    originalUrl: input.originalUrl ?? null,
    filePath: input.filePath ?? null,
    contentText: null,
    transcript: null,
    summaryJson: null,
    summaryMarkdown: null,
    promptTemplate: input.promptTemplate ?? null,
    error: null,
    createdAt: now,
    updatedAt: now
  };

  getDb()
    .prepare(
      `INSERT INTO tasks (
        id, input, sourceType, status, title, author, publishedAt, originalUrl, filePath,
        contentText, transcript, summaryJson, summaryMarkdown, promptTemplate, error, createdAt, updatedAt
      ) VALUES (
        @id, @input, @sourceType, @status, @title, @author, @publishedAt, @originalUrl, @filePath,
        @contentText, @transcript, @summaryJson, @summaryMarkdown, @promptTemplate, @error, @createdAt, @updatedAt
      )`
    )
    .run(task);

  return task;
}

export function listTasks() {
  return getDb()
    .prepare("SELECT * FROM tasks ORDER BY createdAt DESC")
    .all() as Task[];
}

export function getTask(id: string) {
  return getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined;
}

export function updateTask(id: string, patch: Partial<Task> & { status?: TaskStatus }) {
  const entries = Object.entries({ ...patch, updatedAt: new Date().toISOString() }).filter(
    ([key]) => key !== "id"
  );
  if (!entries.length) return getTask(id);
  const setSql = entries.map(([key]) => `${key} = @${key}`).join(", ");
  getDb()
    .prepare(`UPDATE tasks SET ${setSql} WHERE id = @id`)
    .run({ id, ...Object.fromEntries(entries) });
  return getTask(id);
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value, updatedAt)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`
    )
    .run(key, value, new Date().toISOString());
}

export function listSettings() {
  return getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
}
