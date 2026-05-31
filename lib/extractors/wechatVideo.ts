import type { ExtractedContent } from "./types";

export async function extractWechatVideo(url: string): Promise<ExtractedContent> {
  return {
    sourceType: "wechat_video",
    originalUrl: url,
    contentText:
      "WeChat video link saved. Direct video extraction is reserved for a provider adapter; upload the video file for transcription in the MVP."
  };
}
