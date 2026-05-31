import { notFound } from "next/navigation";
import { PageHeader, StatusPill } from "@/components/ui";
import { getTask } from "@/lib/db";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <div className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
        {children || "暂无"}
      </div>
    </section>
  );
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) notFound();

  return (
    <div>
      <PageHeader title={task.title || "任务详情"} description={task.originalUrl || task.input} />
      <div className="grid gap-4 px-5 py-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-md border border-border bg-card p-4 xl:col-span-2">
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">类型</div>
              <div>{task.sourceType}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">状态</div>
              <div className="mt-1">
                <StatusPill value={task.status} />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">作者</div>
              <div>{task.author || "暂无"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">发布时间</div>
              <div>{task.publishedAt || "暂无"}</div>
            </div>
          </div>
          {task.error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{task.error}</p> : null}
        </section>
        <Block title="原始输入">{task.input}</Block>
        <Block title="抓取正文">{task.contentText}</Block>
        <Block title="转写全文">{task.transcript}</Block>
        <Block title="摘要 Markdown">{task.summaryMarkdown}</Block>
        <Block title="摘要 JSON">{task.summaryJson}</Block>
        <Block title="导出">
          {JSON.stringify(task, null, 2)}
        </Block>
      </div>
    </div>
  );
}
