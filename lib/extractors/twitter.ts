import type { ExtractedContent } from "./types";

export async function extractTwitter(url: string): Promise<ExtractedContent> {
  return {
    sourceType: "twitter",
    originalUrl: url,
    contentText:
      "Twitter/X link saved. Direct extraction may require cookies, an API, or manually pasted text. This task is ready for a later provider adapter."
  };
}
