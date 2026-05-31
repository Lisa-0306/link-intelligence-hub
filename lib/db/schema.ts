export type TaskStatus =
  | "pending"
  | "fetching"
  | "transcribing"
  | "summarizing"
  | "completed"
  | "failed";

export type SourceType =
  | "youtube"
  | "twitter"
  | "wechat_article"
  | "wechat_video"
  | "webpage"
  | "audio_file"
  | "video_file"
  | "text"
  | "unknown_url";

export type Task = {
  id: string;
  input: string;
  sourceType: SourceType;
  status: TaskStatus;
  title: string | null;
  author: string | null;
  publishedAt: string | null;
  originalUrl: string | null;
  filePath: string | null;
  contentText: string | null;
  transcript: string | null;
  summaryJson: string | null;
  summaryMarkdown: string | null;
  promptTemplate: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export const schemaSql = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  input TEXT NOT NULL,
  sourceType TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  title TEXT,
  author TEXT,
  publishedAt TEXT,
  originalUrl TEXT,
  filePath TEXT,
  contentText TEXT,
  transcript TEXT,
  summaryJson TEXT,
  summaryMarkdown TEXT,
  promptTemplate TEXT,
  error TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`;
