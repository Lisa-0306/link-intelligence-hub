import type { SourceType } from "@/lib/db/schema";
import type { ExtractedContent } from "./types";
import { extractTwitter } from "./twitter";
import { extractWebpage } from "./webpage";
import { extractWechatArticle } from "./wechatArticle";
import { extractWechatVideo } from "./wechatVideo";
import { extractYouTube } from "./youtube";

export async function extractContent(sourceType: SourceType, input: string): Promise<ExtractedContent> {
  if (sourceType === "youtube") return extractYouTube(input);
  if (sourceType === "twitter") return extractTwitter(input);
  if (sourceType === "wechat_article") return extractWechatArticle(input);
  if (sourceType === "wechat_video") return extractWechatVideo(input);
  if (sourceType === "webpage" || sourceType === "unknown_url") return extractWebpage(input);
  return { sourceType, contentText: input };
}
