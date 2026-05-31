"use client";

import { useEffect, useState } from "react";
import { Clipboard, Save } from "lucide-react";
import { PageHeader } from "@/components/ui";
import type { PromptTemplate } from "@/lib/prompts";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const active = prompts.find((prompt) => prompt.id === activeId);

  async function load() {
    const res = await fetch("/api/prompts");
    const data = await res.json();
    setPrompts(data.prompts);
    setActiveId((current) => current || data.prompts[0]?.id || "");
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!active) return;
    await fetch("/api/prompts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: active.id, content: active.content })
    });
    await load();
  }

  return (
    <div>
      <PageHeader title="Prompt 管理" description="查看、编辑、复制和保存模板文件。" />
      <div className="grid gap-4 px-5 py-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-md border border-border bg-card">
          {prompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => setActiveId(prompt.id)}
              className={`block w-full border-b border-border px-4 py-3 text-left text-sm last:border-b-0 ${
                activeId === prompt.id ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              {prompt.name}
            </button>
          ))}
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          {active ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{active.name}</h2>
                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    onClick={() => navigator.clipboard.writeText(active.content)}
                  >
                    <Clipboard className="h-4 w-4" />
                    复制
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                    onClick={save}
                  >
                    <Save className="h-4 w-4" />
                    保存
                  </button>
                </div>
              </div>
              <textarea
                value={active.content}
                onChange={(event) =>
                  setPrompts((items) =>
                    items.map((item) =>
                      item.id === active.id ? { ...item, content: event.target.value } : item
                    )
                  )
                }
                className="min-h-[640px] w-full resize-y rounded-md border border-border bg-background p-3 text-sm leading-6"
              />
            </>
          ) : (
            <div className="text-sm text-muted-foreground">暂无模板</div>
          )}
        </div>
      </div>
    </div>
  );
}
