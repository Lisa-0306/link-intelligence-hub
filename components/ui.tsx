import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function PageHeader({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="border-b border-border bg-card px-5 py-4">
      <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </header>
  );
}

export function StatusPill({ value }: { value: string }) {
  const tone =
    value === "completed"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : value === "failed"
        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
        : "bg-muted text-muted-foreground";

  return <span className={cn("rounded px-2 py-1 text-xs font-medium", tone)}>{value}</span>;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-foreground">{children}</label>;
}
