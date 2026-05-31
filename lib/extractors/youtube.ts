import type { ExtractedContent } from "./types";

function extractVideoId(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
  if (url.searchParams.get("v")) return url.searchParams.get("v");
  const shorts = url.pathname.match(/\/shorts\/([^/?]+)/);
  if (shorts) return shorts[1];
  const embed = url.pathname.match(/\/embed\/([^/?]+)/);
  if (embed) return embed[1];
  return null;
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(xml: string, key: string) {
  const match = xml.match(new RegExp(`${key}="([^"]+)"`));
  return match?.[1] ? decodeXml(match[1]) : null;
}

async function fetchTranscript(videoId: string) {
  const listUrl = new URL("https://video.google.com/timedtext");
  listUrl.searchParams.set("type", "list");
  listUrl.searchParams.set("v", videoId);

  const listRes = await fetch(listUrl, {
    headers: { "user-agent": "Mozilla/5.0 LinkIntelligenceHub/0.1" }
  });
  const listXml = await listRes.text();
  const tracks = [...listXml.matchAll(/<track\s+([^>]+)>/g)].map((match) => ({
    langCode: attr(match[1], "lang_code"),
    name: attr(match[1], "name"),
    langOriginal: attr(match[1], "lang_original")
  }));
  const selected =
    tracks.find((track) => track.langCode?.startsWith("zh")) ||
    tracks.find((track) => track.langCode?.startsWith("en")) ||
    tracks[0];

  if (!selected?.langCode) return null;

  const transcriptUrl = new URL("https://video.google.com/timedtext");
  transcriptUrl.searchParams.set("v", videoId);
  transcriptUrl.searchParams.set("lang", selected.langCode);
  if (selected.name) transcriptUrl.searchParams.set("name", selected.name);

  const transcriptRes = await fetch(transcriptUrl, {
    headers: { "user-agent": "Mozilla/5.0 LinkIntelligenceHub/0.1" }
  });
  const transcriptXml = await transcriptRes.text();
  const transcript = [...transcriptXml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
    .map((match) => decodeXml(match[1]))
    .filter(Boolean)
    .join("\n");

  return transcript
    ? {
        transcript,
        language: selected.langOriginal || selected.langCode,
        availableTracks: tracks
      }
    : null;
}

export async function extractYouTube(url: string): Promise<ExtractedContent> {
  const videoId = extractVideoId(url);
  const oembed = new URL("https://www.youtube.com/oembed");
  oembed.searchParams.set("url", url);
  oembed.searchParams.set("format", "json");

  let title: string | null = null;
  let author: string | null = null;
  let thumbnailUrl: string | undefined;

  try {
    const res = await fetch(oembed);
    if (!res.ok) throw new Error(`YouTube oEmbed HTTP ${res.status}`);
    const data = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
    title = data.title ?? null;
    author = data.author_name ?? null;
    thumbnailUrl = data.thumbnail_url;
  } catch {
    // Metadata is useful but not required for transcript extraction.
  }

  if (videoId) {
    const transcript = await fetchTranscript(videoId);
    if (transcript?.transcript) {
      return {
        sourceType: "youtube",
        title,
        author,
        originalUrl: url,
        contentText: transcript.transcript,
        metadata: {
          videoId,
          thumbnailUrl,
          transcriptLanguage: transcript.language,
          availableTracks: transcript.availableTracks
        }
      };
    }
  }

  return {
    sourceType: "youtube",
    title,
    author,
    originalUrl: url,
    contentText:
      "YouTube metadata captured, but no public captions were available. Audio transcription requires a backend downloader/transcription provider.",
    metadata: { videoId, thumbnailUrl }
  };
}
