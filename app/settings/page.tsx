"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

type SettingsPayload = {
  env: Record<string, string | boolean>;
  settings: { key: string; value: string }[];
};

export default function SettingsPage() {
  const [data, setData] = useState<SettingsPayload | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <PageHeader title="设置" description="敏感配置请写入 .env，本页只显示运行状态和迁移配置入口。" />
      <div className="mx-auto max-w-4xl px-5 py-6">
        <div className="rounded-md border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold">环境变量状态</h2>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            {data
              ? Object.entries(data.env).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-border bg-background p-3">
                    <div className="text-xs text-muted-foreground">{key}</div>
                    <div className="mt-1 break-words">{String(value || "未配置")}</div>
                  </div>
                ))
              : "加载中..."}
          </div>
        </div>
        <div className="mt-4 rounded-md border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
          OpenAI API Key、GitHub Token、Supabase/S3 密钥必须保存在 .env 中，不要提交到 GitHub。
          本地数据库、storage 和 backups 已在 .gitignore 中排除。
        </div>
      </div>
    </div>
  );
}
