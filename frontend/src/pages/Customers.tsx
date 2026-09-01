import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { api } from "../lib/api";
import { TableSkeleton, EmptyState, ErrorState } from "../components/States";
import { CustomerDrawer } from "../components/CustomerDrawer";

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function formatDate(iso: string) {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export function Customers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("totalSpent");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["customers", page, search, sortBy, sortOrder],
    queryFn: async () =>
      (await api.get("/customers", { params: { page, limit: 15, search: search || undefined, sortBy, sortOrder } })).data,
  });

  function toggleSort(field: string) {
    if (sortBy === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-muted" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search customers..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-base-border bg-base-card focus:border-accent outline-none transition-colors"
        />
      </div>

      {isError ? (
        <ErrorState message="Couldn't load customers." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : data.data.length === 0 ? (
        <div className="bg-base-card border border-base-border rounded-xl">
          <EmptyState icon={Users} title="No customers found" description="Try a different search." />
        </div>
      ) : (
        <div className="bg-base-card border border-base-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-border text-left">
                  <th className="px-4 py-3 font-medium text-xs text-base-muted">
                    <button onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 hover:text-base-text">
                      Name <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium text-xs text-base-muted">Contact</th>
                  <th className="px-4 py-3 font-medium text-xs text-base-muted">
                    <button onClick={() => toggleSort("totalBookings")} className="inline-flex items-center gap-1 hover:text-base-text">
                      Bookings <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium text-xs text-base-muted">
                    <button onClick={() => toggleSort("totalSpent")} className="inline-flex items-center gap-1 hover:text-base-text">
                      Total spent <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium text-xs text-base-muted">Last booking</th>
                  <th className="px-4 py-3 font-medium text-xs text-base-muted">
                    <button onClick={() => toggleSort("customerSince")} className="inline-flex items-center gap-1 hover:text-base-text">
                      Customer since <ArrowUpDown size={11} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((c: any) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="border-b border-base-border last:border-0 hover:bg-base-bg cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{c.name}</td>
                    <td className="px-4 py-3 text-base-muted whitespace-nowrap">
                      {c.email}
                      <div>{c.phone}</div>
                    </td>
                    <td className="px-4 py-3">{c.totalBookings}</td>
                    <td className="px-4 py-3 font-medium">{formatINR(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-base-muted whitespace-nowrap">{formatDate(c.lastBooking)}</td>
                    <td className="px-4 py-3 text-base-muted whitespace-nowrap">{formatDate(c.customerSince)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-base-border text-xs text-base-muted">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} customers
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-md border border-base-border disabled:opacity-40 hover:bg-base-bg">
                <ChevronLeft size={14} />
              </button>
              <button disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-md border border-base-border disabled:opacity-40 hover:bg-base-bg">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedId && <CustomerDrawer customerId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
