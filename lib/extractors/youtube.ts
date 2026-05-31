import type { ExtractedContent } from "./types";

export async function extractYouTube(url: string): Promise<ExtractedContent> {
  const oembed = new URL("https://www.youtube.com/oembed");
  oembed.searchParams.set("url", url);
  oembed.searchParams.set("format", "json");

  try {
    const res = await fetch(oembed);
    if (!res.ok) throw new Error(`YouTube oEmbed HTTP ${res.status}`);
    const data = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
    return {
      sourceType: "youtube",
      title: data.title ?? null,
      author: data.author_name ?? null,
      originalUrl: url,
      contentText:
        "YouTube metadata captured. Subtitle download and audio transcription are reserved for stage 2.",
      metadata: { thumbnailUrl: data.thumbnail_url }
    };
  } catch (error) {
    return {
      sourceType: "youtube",
      originalUrl: url,
      contentText:
        "YouTube link saved. Metadata/subtitle fetch failed in this environment; stage 2 can add subtitle or audio extraction.",
      metadata: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}
