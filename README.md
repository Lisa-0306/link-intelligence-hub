# Link Intelligence Hub

一个可迁移的链接与内容情报工作台。你可以粘贴网页、YouTube、Twitter/X、微信链接、纯文本，或上传音频/视频文件；系统会识别类型，保存任务，抽取正文或保留 fallback 信息，并生成中文结构化摘要。

## Features

- Next.js + React + Tailwind CSS 工具型界面
- 左侧导航：工作台、任务、Prompt、设置
- SQLite 本地数据库
- 本地 `/storage` 文件存储，预留 Supabase Storage / S3 / Cloudflare R2 adapter
- Prompt 模板文件位于 `/prompts`
- OpenAI 摘要接口，未配置 Key 时自动生成占位摘要
- OpenAI Audio API 转写接口，未配置 Key 时保存文件并提示配置
- ResearchPipe 投研证据层：投研摘要会优先调用 RP，再把分级证据送入摘要流程
- 本地 backup / restore 脚本
- GitHub 同步准备，不使用 Docker

## Local Setup

```bash
cp .env.example .env
npm install
npm run db:init
npm run dev
```

打开 `http://localhost:3000`。

## Environment Variables

敏感信息只写入 `.env`，不要提交到 GitHub。

```bash
OPENAI_API_KEY=
DATABASE_URL=file:./data/app.sqlite
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./storage
BACKUP_PATH=./backups
GITHUB_TOKEN=
GITHUB_REPO=
NEXT_PUBLIC_APP_URL=http://localhost:3000
WECHAT_COOKIE=
WECHAT_USER_AGENT=

RESEARCHPIPE_BASE_URL=
RESEARCHPIPE_RPC_PATH=/rpc
RESEARCHPIPE_API_KEY=
```

Supabase / S3 / R2 变量已经在 `.env.example` 中预留。

### ResearchPipe

投研摘要模板会对公司、行业、政策、财务、一级市场、学术研究等输入优先调用 ResearchPipe。未配置 `RESEARCHPIPE_BASE_URL` 时，系统会自动回到原有正文抽取器。

本地 RP 网关需要接受 `POST ${RESEARCHPIPE_BASE_URL}${RESEARCHPIPE_RPC_PATH}`，请求体格式为：

```json
{
  "tool": "researchpipe_research",
  "args": {
    "input": "研究问题",
    "evidence_only": true
  }
}
```

当前会按输入内容自动选择：

- URL：`researchpipe_extract`
- 监管动态 / 处罚 / 新规：`get_regulatory_updates`
- 政策 / 监管 / 法规：`search_policy`
- 产业链 / 赛道全景：`get_supply_chain`
- 一级市场 / 融资：`get_deal_history`
- 财务、公司、行业、学术研究等综合问题：`researchpipe_research`

## Input Handling

### YouTube

MVP 已实现 YouTube 链接识别，并通过 oEmbed 尝试获取标题、作者、封面等基础信息。如果当前环境无法访问，任务仍会保存并给出 fallback。字幕优先抓取、音频提取和转写属于第二阶段。

### Twitter/X

MVP 已实现链接识别和任务保存。由于 Twitter/X 通常需要 cookie、API 或登录环境，当前先保留 provider adapter 入口，并提示可手动粘贴正文。

### WeChat

微信公众号文章会先尝试按普通网页抽取正文；如果遇到反爬限制，会保存链接并提示手动粘贴正文、上传截图或后续处理。

微信视频号/短视频会尝试抓取分享页标题、描述、封面、页面 ID，以及公开 HTML 中暴露的 `mp4` / `m3u8` 视频地址。视频号经常要求微信登录态，如果 Vercel 上解析不到内容，可以在环境变量中配置 `WECHAT_COOKIE` 和 `WECHAT_USER_AGENT` 后重新部署。仍然抓不到时，说明真实播放地址没有在分享页暴露，需要手动下载/上传视频文件，再走后端转写流程。

### Web Pages

普通网页会抓取标题、作者、发布时间和正文，并清理脚本、样式、导航、页脚等常见噪声。

### Audio / Video

支持上传 `mp3`、`wav`、`m4a`、`webm`、`mp4`、`mov`。音频会调用 OpenAI Audio API；视频音频提取是第二阶段 TODO。

## Prompt Templates

模板位于 `/prompts`：

- AI 日报
- 半导体日报
- 新能源日报
- Web3 日报
- 宏观新闻日报
- 投研摘要
- 会议纪要
- 项目介绍分析
- Twitter/X 信息提炼
- YouTube 视频总结

网页中的 Prompt 管理页支持查看、编辑、保存和复制。

## Backup

```bash
npm run backup
```

备份输出到 `/backups/backup-YYYYMMDD-HHmmss.zip`，包含 SQLite 数据库、prompt 模板和本地 storage 文件夹。

## Restore

```bash
npm run restore -- ./backups/backup-xxx.zip
```

恢复会把备份内容解压回项目目录。恢复前建议先停止开发服务器。

## Server Migration Guide

### Old Server

```bash
npm run backup
git add .
git commit -m "backup before migration"
git push
```

然后把生成的 backup zip 下载或上传到云端。

### New Server

```bash
git clone <repo-url>
cd link-intelligence-hub
cp .env.example .env
npm install
npm run db:init
npm run restore -- ./backups/backup-xxx.zip
npm run dev
```

注意：

- `.env` 需要手动重新填写
- API Key 不应该进 GitHub
- storage 原始文件默认不进 GitHub
- backup zip 可用于迁移历史任务、prompt、抓取正文、转写文本和摘要结果
- 后续可以接入 Supabase / S3 / R2 自动同步

## GitHub Sync

本项目已准备好 `.gitignore`，不会提交 `.env`、数据库、storage、backups、音视频文件和依赖目录。

如果你已经有 GitHub repo：

```bash
git remote add origin <repo-url>
git add .
git commit -m "initial link intelligence hub"
git branch -M main
git push -u origin main
```

如果还没有 repo，先在 GitHub 创建空仓库，再执行上面的命令。

## Completed MVP

- 首页输入框
- URL / 文本 / 文件类型识别
- 普通网页正文抓取
- YouTube 链接识别与 fallback
- Twitter/X、微信链接 fallback
- 音频/视频文件上传保存
- SQLite 任务保存
- 任务列表
- 任务详情页
- Prompt 模板文件与管理页
- OpenAI 摘要接口
- OpenAI 转写接口抽象
- 本地 storage adapter
- Supabase / S3 adapter 占位
- backup / restore 脚本
- `.env.example`
- `.gitignore`
- GitHub 同步准备

## TODO

- YouTube 字幕优先抓取
- YouTube 音频下载与转写
- Twitter/X API 或 cookie 抓取
- 微信公众号更稳的正文抽取
- 微信视频号 Cookie 提取指引和上传转写队列
- 视频文件音频提取
- Supabase / S3 / Cloudflare R2 云端备份
- 搜索、标签与批量导入
- 更完整的导出按钮和复制交互
