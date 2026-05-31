import { extractWebpage } from "./webpage";
import type { ExtractedContent } from "./types";

export async function extractWechatArticle(url: string): Promise<ExtractedContent> {
  try {
    const content = await extractWebpage(url);
    return { ...content, sourceType: "wechat_article" };
  } catch (error) {
    return {
      sourceType: "wechat_article",
      originalUrl: url,
      contentText:
        "WeChat article link saved. If anti-scraping blocks extraction, paste the article body manually or upload screenshots/files.",
      metadata: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}
