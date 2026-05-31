import * as cheerio from "cheerio";
import type { ExtractedContent } from "./types";

export async function extractWebpage(url: string): Promise<ExtractedContent> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "LinkIntelligenceHub/0.1 (+local MVP)"
    }
  });
  if (!res.ok) {
    throw new Error(`Fetch failed with HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer, aside, noscript, iframe").remove();

  const title =
    $("meta[property='og:title']").attr("content") ||
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    null;
  const author =
    $("meta[name='author']").attr("content") ||
    $("meta[property='article:author']").attr("content") ||
    null;
  const publishedAt =
    $("meta[property='article:published_time']").attr("content") ||
    $("time").first().attr("datetime") ||
    null;

  const candidates = ["article", "main", "[role='main']", "body"];
  const contentText =
    candidates
      .map((selector) => $(selector).first().text().replace(/\s+/g, " ").trim())
      .sort((a, b) => b.length - a.length)[0]
      ?.slice(0, 120000) ?? "";

  return {
    sourceType: "webpage",
    title,
    author,
    publishedAt,
    originalUrl: url,
    contentText
  };
}
