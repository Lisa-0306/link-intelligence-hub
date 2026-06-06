"use client";

import { useEffect, useState } from "react";
import { FileAudio, LinkIcon, Loader2, Send, Upload } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/ui";
import type { SourceType, TaskStatus } from "@/lib/db/schema";
import type { PromptTemplate } from "@/lib/prompts";

type WebTask = {
  id: string;
  input: string;
  sourceType: SourceType;
  status: TaskStatus;
  title: string | null;
  author: string | null;
  publishedAt: string | null;
  originalUrl: string | null;
  contentText: string | null;
  transcript: string | null;
  summaryJson: string | null;
  summaryMarkdown: string | null;
  promptTemplate: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

const storageKey = "link-intelligence-hub-web-tasks";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [promptTemplate, setPromptTemplate] = useState("investment_summary");
  const [tasks, setTasks] = useState<WebTask[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeTask, setActiveTask] = useState<WebTask | null>(null);

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as WebTask[];
    setTasks(storedTasks);
    fetch("/api/prompts")
      .then((res) => res.json())
      .then((data) => setPrompts(data.prompts));
  }, []);

  function saveTasks(nextTasks: WebTask[]) {
    localStorage.setItem(storageKey, JSON.stringify(nextTasks));
    setTasks(nextTasks);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (file) {
      alert("在线版暂不上传音视频文件。YouTube/网页/纯文本可以直接处理；音视频转写需要后续接入对象存储和转写队列。");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/process", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input, promptTemplate })
    });
    setBusy(false);
    if (res.ok) {
      const data = (await res.json()) as { task: WebTask };
      const nextTasks = [data.task, ...tasks.filter((task) => task.id !== data.task.id)];
      saveTasks(nextTasks);
      setActiveTask(data.task);
      setInput("");
      setFile(null);
    } else {
      alert((await res.json()).error ?? "提交失败");
    }
  }

  return (
    <div>
      <PageHeader title="工作台" description="输入链接或正文，在线后端会识别、抽取并生成结构化摘要。" />
      <div className="mx-auto max-w-6xl px-5 py-6">
        <form onSubmit={submit} className="space-y-4 rounded-md border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LinkIcon className="h-4 w-4 text-primary" />
            任意输入
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴 YouTube / X / 微信 / 网页链接，或直接粘贴一段文本..."
            className="min-h-40 w-full resize-y rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
          />
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <input
                type="file"
                accept="audio/*,video/*"
                className="min-w-0 flex-1 text-sm"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <select
              value={promptTemplate}
              onChange={(event) => setPromptTemplate(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {prompts.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-w-32 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              开始处理
            </button>
          </div>
          {file ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileAudio className="h-3.5 w-3.5" />
              已选择：{file.name}
            </p>
          ) : null}
        </form>

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">最近任务</h2>
            <span className="text-sm text-muted-foreground">保存在当前浏览器</span>
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-card">
            {tasks.slice(0, 8).map((task) => (
              <button
                type="button"
                onClick={() => setActiveTask(task)}
                key={task.id}
                className="grid w-full grid-cols-[1fr_auto_auto] gap-4 border-b border-border px-4 py-3 text-left text-sm last:border-b-0 hover:bg-muted/60"
              >
                <span className="truncate">{task.title || task.input || task.id}</span>
                <span className="text-muted-foreground">{task.sourceType}</span>
                <StatusPill value={task.status} />
              </button>
            ))}
            {!tasks.length ? <div className="px-4 py-8 text-sm text-muted-foreground">暂无任务</div> : null}
          </div>
        </section>

        {activeTask ? (
          <section className="mt-7 grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="m-0 text-base font-semibold">摘要</h2>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(activeTask.summaryMarkdown ?? "")}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                >
                  复制
                </button>
              </div>
              <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                {activeTask.summaryMarkdown}
              </pre>
            </div>
            <div className="rounded-md border border-border bg-card p-4">
              <h2 className="mb-3 text-base font-semibold">正文 / 字幕</h2>
              <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                {activeTask.contentText || activeTask.transcript || activeTask.input}
              </pre>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
