import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  delta,
  icon,
  hint,
  tone = "neutral",
  className,
  delayMs,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  icon?: ReactNode;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "destructive";
  className?: string;
  /** Quando informado, o card entra com fade-in-up atrasado (cascata/stagger). */
  delayMs?: number;
}) {
  const up = (delta ?? 0) >= 0;
  const toneText =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div
      style={delayMs !== undefined ? { animationDelay: `${delayMs}ms` } : undefined}
      className={cn(
        "group rounded-xl border border-border bg-card p-4 transition-[border-color,transform] duration-200 ease-out hover:border-foreground/20 motion-safe:hover:-translate-y-px",
        delayMs !== undefined && "fade-in-up",
        className,
      )}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{label}</span>
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn("tabular text-2xl font-semibold tracking-tight", toneText)}>
          {value}
        </span>
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
              up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card transition-colors duration-200 ease-out hover:border-foreground/15",
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-medium">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

/** Mapa de status → tom semântico discreto (grayscale + success/warning/destructive). */
const STATUS_TONE: Record<string, string> = {
  // pedidos
  Novo: "bg-muted text-foreground",
  novo: "bg-muted text-foreground",
  Separação: "bg-warning/12 text-warning",
  separacao: "bg-warning/12 text-warning",
  Expedição: "bg-foreground/10 text-foreground",
  expedicao: "bg-foreground/10 text-foreground",
  Entregue: "bg-success/12 text-success",
  entregue: "bg-success/12 text-success",
  Cancelado: "bg-destructive/12 text-destructive",
  cancelado: "bg-destructive/12 text-destructive",
  // financeiro
  Pago: "bg-success/12 text-success",
  pago: "bg-success/12 text-success",
  Pendente: "bg-warning/12 text-warning",
  pendente: "bg-warning/12 text-warning",
  Atrasado: "bg-destructive/12 text-destructive",
  atrasado: "bg-destructive/12 text-destructive",
  Vencido: "bg-destructive/12 text-destructive",
  // agenda
  Concluído: "bg-success/12 text-success",
  concluido: "bg-success/12 text-success",
  // campanhas
  ativa: "bg-success/12 text-success",
  pausada: "bg-warning/12 text-warning",
  rascunho: "bg-muted text-muted-foreground",
  finalizada: "bg-foreground/10 text-foreground",
  // curva ABC / tags
  A: "bg-success/12 text-success",
  B: "bg-warning/12 text-warning",
  C: "bg-muted text-muted-foreground",
  VIP: "bg-foreground/10 text-foreground",
  Atacado: "bg-muted text-foreground",
  Varejo: "bg-muted text-muted-foreground",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        STATUS_TONE[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {status}
    </span>
  );
}

/** Skeleton com shimmer (transform-only, respeita prefers-reduced-motion). */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted/60", className)}>
      <div className="shimmer absolute inset-0" />
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      <div className="flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Shimmer key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 py-1.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Shimmer key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <Shimmer className="h-3 w-20" />
          <Shimmer className="mt-3 h-6 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return <Shimmer className={cn("h-64 w-full", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 py-12 text-center",
        className,
      )}
    >
      <div className="grid h-10 w-10 place-items-center rounded-full border border-border bg-muted/40 text-muted-foreground">
        {icon ?? <Inbox className="h-4 w-4" />}
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  from,
  to,
  total,
  onPage,
  label = "registros",
}: {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
  label?: string;
}) {
  if (total === 0) return null;
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <div className="mt-3 flex flex-col items-center justify-between gap-3 border-t border-border pt-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        {from}–{to} de {total} {label}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="sm"
              className="h-7 min-w-7 px-2 text-xs tabular-nums"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
