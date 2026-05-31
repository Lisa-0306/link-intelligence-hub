import Link from "next/link";
import { PageHeader, StatusPill } from "@/components/ui";
import { listTasks } from "@/lib/db";

export default function TasksPage() {
  const tasks = listTasks();
  return (
    <div>
      <PageHeader title="任务列表" description="查看所有抓取、转写、摘要任务的状态。" />
      <div className="px-5 py-6">
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <div className="grid grid-cols-[1.4fr_.7fr_.6fr_.8fr_.6fr_.6fr] gap-4 border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
            <span>标题</span>
            <span>类型</span>
            <span>状态</span>
            <span>创建时间</span>
            <span>转写</span>
            <span>摘要</span>
          </div>
          {tasks.map((task) => (
            <Link
              href={`/tasks/${task.id}`}
              key={task.id}
              className="grid grid-cols-[1.4fr_.7fr_.6fr_.8fr_.6fr_.6fr] gap-4 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-muted/60"
            >
              <span className="truncate">{task.title || task.input || task.id}</span>
              <span className="text-muted-foreground">{task.sourceType}</span>
              <StatusPill value={task.status} />
              <span className="text-muted-foreground">{new Date(task.createdAt).toLocaleString()}</span>
              <span>{task.transcript ? "是" : "否"}</span>
              <span>{task.summaryMarkdown ? "是" : "否"}</span>
            </Link>
          ))}
          {!tasks.length ? <div className="px-4 py-8 text-sm text-muted-foreground">暂无任务</div> : null}
        </div>
      </div>
    </div>
  );
}
