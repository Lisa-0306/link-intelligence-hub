import type { SourceType } from "@/lib/db/schema";

export type ExtractedContent = {
  sourceType: SourceType;
  title?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  originalUrl?: string | null;
  contentText?: string | null;
  metadata?: Record<string, unknown>;
};
