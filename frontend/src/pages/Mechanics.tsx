import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Wrench, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState, ErrorState } from "../components/States";
import { MechanicDrawer } from "../components/MechanicDrawer";

const STATUS_OPTIONS = ["AVAILABLE", "ASSIGNED", "ON_THE_WAY", "BUSY", "OFFLINE"];

export function Mechanics() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mechanics", page, search, status],
    queryFn: async () =>
      (await api.get("/mechanics", { params: { page, limit: 12, search: search || undefined, status: status || undefined } })).data,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search mechanics..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-base-border bg-base-card focus:border-accent outline-none transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm rounded-lg border border-base-border bg-base-card focus:border-accent outline-none"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <ErrorState message="Couldn't load mechanics." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-base-border/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <div className="bg-base-card border border-base-border rounded-xl">
          <EmptyState icon={Wrench} title="No mechanics found" description="Try changing your filters." />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.data.map((m: any) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className="text-left bg-base-card border border-base-border rounded-xl p-4 shadow-card hover:border-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-soft text-accent-dark flex items-center justify-center font-semibold text-sm">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{m.name}</div>
                      <div className="flex items-center gap-1 text-xs text-base-muted">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {m.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className="text-xs text-base-muted">
                  {m.jobsCompleted} jobs completed
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between px-1 text-xs text-base-muted">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} mechanics
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-md border border-base-border disabled:opacity-40 hover:bg-base-bg bg-base-card">
                <ChevronLeft size={14} />
              </button>
              <button disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-md border border-base-border disabled:opacity-40 hover:bg-base-bg bg-base-card">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {selectedId && <MechanicDrawer mechanicId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
