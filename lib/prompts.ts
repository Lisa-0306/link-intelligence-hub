import fs from "node:fs/promises";
import path from "node:path";

export type PromptTemplate = {
  id: string;
  name: string;
  content: string;
};

const promptNames: Record<string, string> = {
  ai_daily: "AI 日报模板",
  semiconductor_daily: "半导体日报模板",
  new_energy_daily: "新能源日报模板",
  web3_daily: "Web3 日报模板",
  macro_daily: "宏观新闻日报模板",
  investment_summary: "投研摘要模板",
  meeting_notes: "会议纪要模板",
  project_analysis: "项目介绍分析模板",
  twitter_summary: "Twitter/X 信息提炼模板",
  youtube_summary: "YouTube 视频总结模板"
};

export function promptPath(id: string) {
  const safe = id.replace(/[^a-z0-9_-]/gi, "");
  return path.resolve(process.cwd(), "prompts", `${safe}.md`);
}

export async function listPromptTemplates(): Promise<PromptTemplate[]> {
  const folder = path.resolve(process.cwd(), "prompts");
  await fs.mkdir(folder, { recursive: true });
  const files = (await fs.readdir(folder)).filter((file) => file.endsWith(".md"));
  return Promise.all(
    files.sort().map(async (file) => {
      const id = file.replace(/\.md$/, "");
      return {
        id,
        name: promptNames[id] ?? id,
        content: await fs.readFile(path.join(folder, file), "utf8")
      };
    })
  );
}

export async function getPromptTemplate(id?: string | null) {
  if (!id) return null;
  try {
    return await fs.readFile(promptPath(id), "utf8");
  } catch {
    return null;
  }
}

export async function savePromptTemplate(id: string, content: string) {
  await fs.mkdir(path.resolve(process.cwd(), "prompts"), { recursive: true });
  await fs.writeFile(promptPath(id), content, "utf8");
}
