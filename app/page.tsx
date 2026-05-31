"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileAudio, LinkIcon, Loader2, Send, Upload } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/ui";
import type { Task } from "@/lib/db/schema";
import type { PromptTemplate } from "@/lib/prompts";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [promptTemplate, setPromptTemplate] = useState("investment_summary");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [taskRes, promptRes] = await Promise.all([fetch("/api/tasks"), fetch("/api/prompts")]);
    setTasks((await taskRes.json()).tasks);
    setPrompts((await promptRes.json()).prompts);
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 3500);
    return () => clearInterval(timer);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData();
    form.set("input", input);
    form.set("promptTemplate", promptTemplate);
    if (file) form.set("file", file);
    const res = await fetch("/api/tasks", { method: "POST", body: form });
    setBusy(false);
    if (res.ok) {
      setInput("");
      setFile(null);
      await load();
    } else {
      alert((await res.json()).error ?? "提交失败");
    }
  }

  return (
    <div>
      <PageHeader title="工作台" description="输入链接、正文，或上传音频/视频，系统会自动识别并生成结构化摘要。" />
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
            <Link href="/tasks" className="text-sm text-primary">
              查看全部
            </Link>
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-card">
            {tasks.slice(0, 8).map((task) => (
              <Link
                href={`/tasks/${task.id}`}
                key={task.id}
                className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-muted/60"
              >
                <span className="truncate">{task.title || task.input || task.id}</span>
                <span className="text-muted-foreground">{task.sourceType}</span>
                <StatusPill value={task.status} />
              </Link>
            ))}
            {!tasks.length ? <div className="px-4 py-8 text-sm text-muted-foreground">暂无任务</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
