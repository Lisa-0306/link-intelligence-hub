import type { ExtractedContent } from "./types";

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\u0026/g, "&")
    .trim();
}

function matchMeta(html: string, name: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return null;
}

function findVideoUrls(html: string) {
  const urls = new Set<string>();
  const decoded = decodeHtml(html);
  const patterns = [
    /https?:\\?\/\\?\/[^"'<>\\\s]+?\.(?:mp4|m3u8)(?:\?[^"'<>\\\s]*)?/gi,
    /"(?:url|video_url|play_url|cover_url)"\s*:\s*"([^"]+)"/gi
  ];

  for (const pattern of patterns) {
    for (const match of decoded.matchAll(pattern)) {
      const raw = match[1] || match[0];
      const normalized = decodeHtml(raw).replace(/\\\//g, "/");
      if (/^https?:\/\//.test(normalized)) urls.add(normalized);
    }
  }
  return [...urls];
}

function needsCookie(html: string) {
  return /请在微信客户端打开|环境异常|登录|验证|captcha|access denied|forbidden/i.test(html);
}

export async function extractWechatVideo(url: string): Promise<ExtractedContent> {
  const cookie = process.env.WECHAT_COOKIE;
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.49",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      ...(cookie ? { cookie } : {})
    }
  });

  const html = await res.text();
  const title =
    matchMeta(html, "og:title") ||
    matchMeta(html, "twitter:title") ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ||
    null;
  const description =
    matchMeta(html, "og:description") ||
    matchMeta(html, "description") ||
    matchMeta(html, "twitter:description");
  const cover = matchMeta(html, "og:image") || matchMeta(html, "twitter:image");
  const videoUrls = findVideoUrls(html);
  const blocked = !res.ok || needsCookie(html);

  if (videoUrls.length > 0 || title || description) {
    const content = [
      title ? `标题：${title}` : null,
      description ? `描述：${description}` : null,
      videoUrls.length ? `候选视频地址：\n${videoUrls.map((item) => `- ${item}`).join("\n")}` : null,
      !videoUrls.length
        ? "未在公开 HTML 中找到可直接下载的视频地址；如果这是视频号链接，通常需要 WECHAT_COOKIE 或手动上传视频文件后转写。"
        : null
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      sourceType: "wechat_video",
      title,
      originalUrl: url,
      contentText: content,
      metadata: {
        httpStatus: res.status,
        finalUrl: res.url,
        cover,
        videoUrls,
        usedCookie: Boolean(cookie),
        blocked
      }
    };
  }

  return {
    sourceType: "wechat_video",
    originalUrl: url,
    contentText:
      "已识别微信视频链接，但当前页面没有暴露可解析的视频信息。微信视频号通常需要登录态 Cookie；请在 Vercel 环境变量配置 WECHAT_COOKIE，或先手动下载/上传视频文件再转写。",
    metadata: {
      httpStatus: res.status,
      finalUrl: res.url,
      usedCookie: Boolean(cookie),
      blocked
    }
  };
}
