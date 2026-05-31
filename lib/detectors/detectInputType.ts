import type { SourceType } from "@/lib/db/schema";

const audioExtensions = /\.(mp3|wav|m4a|webm)$/i;
const videoExtensions = /\.(mp4|mov|webm)$/i;

export function isUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function detectInputType(input: string, fileName?: string): SourceType {
  if (fileName) {
    if (audioExtensions.test(fileName)) return "audio_file";
    if (videoExtensions.test(fileName)) return "video_file";
  }

  const value = input.trim();
  if (!isUrl(value)) return "text";

  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const full = `${host}${url.pathname}`.toLowerCase();

  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host === "x.com" || host.endsWith(".x.com") || host.includes("twitter.com")) return "twitter";
  if (host.includes("mp.weixin.qq.com")) return "wechat_article";
  if (full.includes("channels.weixin.qq.com") || full.includes("weixin.qq.com")) return "wechat_video";
  if (audioExtensions.test(url.pathname)) return "audio_file";
  if (videoExtensions.test(url.pathname)) return "video_file";

  return "webpage";
}
