import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  trendPct,
  sublabel,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trendPct?: number;
  sublabel?: string;
}) {
  return (
    <div className="bg-base-card border border-base-border rounded-xl p-4 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-base-muted">{label}</span>
        <Icon size={16} className="text-base-muted" strokeWidth={2} />
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {(trendPct !== undefined || sublabel) && (
        <div className="mt-1.5 flex items-center gap-1 text-xs">
          {trendPct !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                trendPct >= 0 ? "text-status-completed" : "text-status-cancelled"
              }`}
            >
              {trendPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trendPct)}%
            </span>
          )}
          <span className="text-base-muted">{sublabel || "vs last period"}</span>
        </div>
      )}
    </div>
  );
}
