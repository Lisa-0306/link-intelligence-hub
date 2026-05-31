import type { Metadata } from "next";
import Link from "next/link";
import { Archive, FileText, Home, Settings, SquarePen } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Link Intelligence Hub",
  description: "Capture, transcribe, summarize, and migrate link intelligence."
};

const nav = [
  { href: "/", label: "工作台", icon: Home },
  { href: "/tasks", label: "任务", icon: Archive },
  { href: "/prompts", label: "Prompts", icon: SquarePen },
  { href: "/settings", label: "设置", icon: Settings }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-border bg-card px-4 py-5 md:block">
            <Link href="/" className="mb-8 flex items-center gap-3">
              <FileText className="h-7 w-7 text-primary" />
              <div>
                <div className="text-sm font-semibold">Link Intelligence</div>
                <div className="text-xs text-muted-foreground">Hub</div>
              </div>
            </Link>
            <nav className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
