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

function decodeLoose(value: string) {
  let current = decodeHtml(value).replace(/\\\//g, "/");
  for (let index = 0; index < 3; index += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
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
  const decoded = decodeLoose(html);
  const patterns = [
    /https?:\\?\/\\?\/[^"'<>\\\s]+?\.(?:mp4|m3u8)(?:\?[^"'<>\\\s]*)?/gi,
    /"(?:url|video_url|play_url|cover_url|media_url|full_url|cdn_url)"\s*:\s*"([^"]+)"/gi,
    /(?:url|video_url|play_url|media_url|full_url|cdn_url)=([^&"'<>\\\s]+)/gi
  ];

  for (const pattern of patterns) {
    for (const match of decoded.matchAll(pattern)) {
      const raw = match[1] || match[0];
      const normalized = decodeLoose(raw);
      if (/^https?:\/\//.test(normalized)) urls.add(normalized);
    }
  }
  return [...urls];
}

function findTextSignal(html: string, keys: string[]) {
  const decoded = decodeLoose(html);
  for (const key of keys) {
    const patterns = [
      new RegExp(`"${key}"\\s*:\\s*"([^"]{1,500})"`, "i"),
      new RegExp(`${key}=([^&"'<>]{1,500})`, "i")
    ];
    for (const pattern of patterns) {
      const match = decoded.match(pattern);
      if (match?.[1]) return decodeLoose(match[1]).replace(/\s+/g, " ").trim();
    }
  }
  return null;
}

function findObjectIds(inputUrl: string, html: string) {
  const decoded = decodeLoose(`${inputUrl}\n${html}`);
  const ids = new Set<string>();
  const patterns = [
    /(?:object_id|objectId|feed_id|feedId|exportid|export_id|vid|mid|__biz)=([^&"'<>\\\s]+)/gi,
    /"(?:object_id|objectId|feed_id|feedId|exportid|export_id|vid|mid|__biz)"\s*:\s*"([^"]+)"/gi
  ];
  for (const pattern of patterns) {
    for (const match of decoded.matchAll(pattern)) {
      if (match[1]) ids.add(decodeLoose(match[1]));
    }
  }
  return [...ids].filter(Boolean);
}

function needsCookie(html: string) {
  return /请在微信客户端打开|环境异常|登录|验证|captcha|access denied|forbidden|请使用微信|WeChat/i.test(html);
}

export async function extractWechatVideo(url: string): Promise<ExtractedContent> {
  const cookie = process.env.WECHAT_COOKIE;
  const userAgent =
    process.env.WECHAT_USER_AGENT ||
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.49";
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": userAgent,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      referer: "https://channels.weixin.qq.com/",
      ...(cookie ? { cookie } : {})
    }
  });

  const html = await res.text();
  const decodedHtml = decodeLoose(html);
  const title =
    matchMeta(html, "og:title") ||
    matchMeta(html, "twitter:title") ||
    findTextSignal(html, ["title", "nickname", "finderNickname", "objectDesc"]) ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ||
    null;
  const description =
    matchMeta(html, "og:description") ||
    matchMeta(html, "description") ||
    matchMeta(html, "twitter:description") ||
    findTextSignal(html, ["desc", "description", "objectDesc", "media_desc"]);
  const cover =
    matchMeta(html, "og:image") ||
    matchMeta(html, "twitter:image") ||
    findTextSignal(html, ["coverUrl", "cover_url", "thumbUrl", "thumb_url"]);
  const videoUrls = findVideoUrls(html);
  const objectIds = findObjectIds(url, html);
  const blocked = !res.ok || needsCookie(html);
  const htmlLooksEmpty =
    decodedHtml.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").trim().length < 80;

  if (videoUrls.length > 0 || title || description || objectIds.length > 0) {
    const content = [
      title ? `标题：${title}` : null,
      description ? `描述：${description}` : null,
      videoUrls.length ? `候选视频地址：\n${videoUrls.map((item) => `- ${item}`).join("\n")}` : null,
      objectIds.length ? `页面识别 ID：\n${objectIds.map((item) => `- ${item}`).join("\n")}` : null,
      !videoUrls.length
        ? "未在公开 HTML 中找到可直接下载的视频地址。视频号页面通常只给登录态接口返回真实播放地址；请在 Vercel 配置 WECHAT_COOKIE 和 WECHAT_USER_AGENT 后重试。"
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
        objectIds,
        usedCookie: Boolean(cookie),
        usedCustomUserAgent: Boolean(process.env.WECHAT_USER_AGENT),
        blocked,
        htmlLooksEmpty,
        htmlLength: html.length
      }
    };
  }

  return {
    sourceType: "wechat_video",
    originalUrl: url,
    contentText:
      "已识别微信视频链接，但当前页面没有暴露标题、描述或视频地址。微信视频号真实播放地址通常需要微信登录态接口；请在 Vercel 环境变量配置 WECHAT_COOKIE 和 WECHAT_USER_AGENT 后重新部署，或把视频文件上传到后端转写流程。",
    metadata: {
      httpStatus: res.status,
      finalUrl: res.url,
      usedCookie: Boolean(cookie),
      usedCustomUserAgent: Boolean(process.env.WECHAT_USER_AGENT),
      blocked,
      htmlLooksEmpty,
      htmlLength: html.length
    }
  };
}
