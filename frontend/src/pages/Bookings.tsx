import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, ClipboardList, ArrowUpDown } from "lucide-react";
import { api } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { TableSkeleton, EmptyState, ErrorState } from "../components/States";
import { BookingDrawer } from "../components/BookingDrawer";

const STATUS_OPTIONS = ["", "PENDING", "ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function Bookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Keep in sync if the URL's ?search= changes after the page has already
  // mounted (e.g. the header search is used again while already here).
  useEffect(() => {
    const fromUrl = searchParams.get("search") || "";
    if (fromUrl !== search) {
      setSearch(fromUrl);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["bookings", page, search, status, sortBy, sortOrder],
    queryFn: async () =>
      (
        await api.get("/bookings", {
          params: { page, limit: 15, search: search || undefined, status: status || undefined, sortBy, sortOrder },
        })
      ).data,
  });

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  const cols = [
    { key: "code", label: "Booking" },
    { key: "customer", label: "Customer", sortable: true },
    { key: "vehicle", label: "Vehicle" },
    { key: "service", label: "Service" },
    { key: "mechanic", label: "Mechanic" },
    { key: "status", label: "Status", sortable: true },
    { key: "amount", label: "Amount", sortable: true },
    { key: "date", label: "Date", sortable: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-muted" />
          <input
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              setSearch(val);
              setPage(1);
              setSearchParams(val ? { search: val } : {}, { replace: true });
            }}
            placeholder="Search by ID, customer, vehicle..."
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
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <ErrorState message="Couldn't load bookings." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : data.data.length === 0 ? (
        <div className="bg-base-card border border-base-border rounded-xl">
          <EmptyState
            icon={ClipboardList}
            title="No bookings found"
            description="Try changing your filters or search query."
          />
        </div>
      ) : (
        <div className="bg-base-card border border-base-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-border text-left">
                  {cols.map((c) => (
                    <th key={c.key} className="px-4 py-3 font-medium text-xs text-base-muted whitespace-nowrap">
                      {c.sortable ? (
                        <button
                          onClick={() => toggleSort(c.key === "customer" ? "customer" : c.key === "amount" ? "amount" : c.key === "status" ? "status" : "date")}
                          className="inline-flex items-center gap-1 hover:text-base-text"
                        >
                          {c.label} <ArrowUpDown size={11} />
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((b: any) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    className="border-b border-base-border last:border-0 hover:bg-base-bg cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{b.code}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{b.customerName}</td>
                    <td className="px-4 py-3 text-base-muted whitespace-nowrap">
                      {b.make} {b.model}
                      <div className="font-mono text-xs">{b.regNumber}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{b.serviceName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{b.mechanicName || <span className="text-base-muted">Unassigned</span>}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{formatINR(b.amount)}</td>
                    <td className="px-4 py-3 text-base-muted whitespace-nowrap">{formatDate(b.scheduledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-base-border text-xs text-base-muted">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} bookings
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-md border border-base-border disabled:opacity-40 hover:bg-base-bg"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-md border border-base-border disabled:opacity-40 hover:bg-base-bg"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedId && <BookingDrawer bookingId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
