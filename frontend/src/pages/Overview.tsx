import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  CalendarClock,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  Wrench,
  UserPlus,
} from "lucide-react";
import { api } from "../lib/api";
import { KpiCard } from "../components/KpiCard";
import { KpiSkeleton, ErrorState, EmptyState } from "../components/States";
import { StatusBadge } from "../components/StatusBadge";
import { Link } from "react-router-dom";

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Overview() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard")).data,
    refetchInterval: 20000,
  });

  if (isError) {
    return <ErrorState message="Couldn't load the dashboard." onRetry={() => refetch()} />;
  }

  const k = data?.kpis;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading || !k ? (
          Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard label="Total Bookings" value={k.totalBookings.toLocaleString()} icon={ClipboardList} sublabel="all time" />
            <KpiCard label="Today's Bookings" value={k.todaysBookings.toLocaleString()} icon={CalendarClock} sublabel="scheduled today" />
            <KpiCard label="Completed" value={k.completedBookings.toLocaleString()} icon={CheckCircle2} sublabel="all time" />
            <KpiCard label="Pending" value={k.pendingBookings.toLocaleString()} icon={Clock} sublabel="awaiting assignment" />
            <KpiCard label="Cancelled" value={k.cancelledBookings.toLocaleString()} icon={XCircle} sublabel="all time" />
            <KpiCard label="Revenue" value={formatINR(k.totalRevenue)} icon={IndianRupee} trendPct={k.revenueTrendPct} />
            <KpiCard label="Active Mechanics" value={k.activeMechanics.toLocaleString()} icon={Wrench} sublabel="on duty" />
            <KpiCard label="New Customers" value={k.newCustomers30d.toLocaleString()} icon={UserPlus} sublabel="last 30 days" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-base-card border border-base-border rounded-xl shadow-card">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-base-border">
            <h2 className="text-sm font-semibold">Live operations</h2>
            <Link to="/bookings" className="text-xs font-medium text-accent hover:text-accent-dark">
              View all
            </Link>
          </div>
          <div className="divide-y divide-base-border max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-base-border/50 rounded animate-pulse" />
                ))}
              </div>
            ) : data.liveOps.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No active bookings"
                description="Everything is quiet right now. New bookings will appear here as they come in."
              />
            ) : (
              data.liveOps.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between px-4 py-3 hover:bg-base-bg transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-base-muted">{b.code}</span>
                      <span className="text-sm font-medium truncate">{b.customerName}</span>
                    </div>
                    <div className="text-xs text-base-muted mt-0.5">
                      {b.serviceName} {b.mechanicName ? `· ${b.mechanicName}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={b.status} />
                    <span className="text-[11px] text-base-muted">{timeAgo(b.updatedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-base-card border border-base-border rounded-xl shadow-card">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-base-border">
            <h2 className="text-sm font-semibold">Recently completed</h2>
          </div>
          <div className="divide-y divide-base-border max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-base-border/50 rounded animate-pulse" />
                ))}
              </div>
            ) : data.recentlyCompleted.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No completed jobs yet"
                description="Completed bookings will show up here."
              />
            ) : (
              data.recentlyCompleted.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between px-4 py-3 hover:bg-base-bg transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-base-muted">{b.code}</span>
                      <span className="text-sm font-medium truncate">{b.customerName}</span>
                    </div>
                    <div className="text-xs text-base-muted mt-0.5">{b.mechanicName || "Unassigned"}</div>
                  </div>
                  <span className="text-[11px] text-base-muted shrink-0">{timeAgo(b.updatedAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
