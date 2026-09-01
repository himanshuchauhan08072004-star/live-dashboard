import { type LucideIcon, RefreshCw } from "lucide-react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-base-border/60 rounded ${className}`} />;
}

export function KpiSkeleton() {
  return (
    <div className="bg-base-card border border-base-border rounded-xl p-4">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-7 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-base-card border border-base-border rounded-xl overflow-hidden">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3.5 border-b border-base-border last:border-0">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className={`h-4 ${c === 0 ? "w-24" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-base-bg flex items-center justify-center mb-3">
        <Icon size={20} className="text-base-muted" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-sm text-base-muted max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
        <RefreshCw size={18} className="text-red-600" />
      </div>
      <h3 className="text-sm font-semibold mb-1">Something went wrong</h3>
      <p className="text-sm text-base-muted max-w-xs mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-dark transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
