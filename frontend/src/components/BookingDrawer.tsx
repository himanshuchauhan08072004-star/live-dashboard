import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Check, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { useState } from "react";

const TIMELINE = ["PENDING", "ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED"];
const TIMELINE_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  ON_THE_WAY: "Mechanic on the way",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};
const NEXT_STATUS: Record<string, string> = {
  PENDING: "ASSIGNED",
  ASSIGNED: "ON_THE_WAY",
  ON_THE_WAY: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function BookingDrawer({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => (await api.get(`/bookings/${bookingId}`)).data,
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => (await api.patch(`/bookings/${bookingId}/status`, { status })).data,
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Couldn't update the booking status.");
    },
  });

  const b = data?.booking;
  const currentIdx = b ? TIMELINE.indexOf(b.status) : -1;
  const isCancelled = b?.status === "CANCELLED";
  const nextStatus = b ? NEXT_STATUS[b.status] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-base-card h-full shadow-xl flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between px-5 h-16 border-b border-base-border shrink-0">
          <h2 className="font-semibold text-sm">Booking details</h2>
          <button onClick={onClose} className="text-base-muted hover:text-base-text">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading || !b ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-5 bg-base-border/50 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-base-muted mb-1">{b.code}</div>
                  <div className="text-lg font-semibold">{formatINR(b.amount)}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>

              {!isCancelled && (
                <div>
                  <ol className="space-y-3">
                    {TIMELINE.map((step, idx) => {
                      const reached = currentIdx >= idx;
                      return (
                        <li key={step} className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              reached ? "bg-accent text-white" : "bg-base-border text-transparent"
                            }`}
                          >
                            {reached && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className={`text-sm ${reached ? "font-medium" : "text-base-muted"}`}>
                            {TIMELINE_LABELS[step]}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              <div className="border-t border-base-border pt-4 space-y-3 text-sm">
                <Row label="Customer" value={b.customerName} />
                <Row label="Contact" value={b.customerPhone} />
                <Row label="Vehicle" value={`${b.make} ${b.model}`} />
                <Row label="Registration" value={<span className="font-mono">{b.regNumber}</span>} />
                <Row label="Service" value={b.serviceName} />
                <Row label="Mechanic" value={b.mechanicName || "Unassigned"} />
                <Row label="Address" value={b.address} />
                <Row label="Scheduled" value={formatDateTime(b.scheduledAt)} />
                <Row label="Created" value={formatDateTime(b.createdAt)} />
                {b.notes && <Row label="Notes" value={b.notes} />}
              </div>

              {error && <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

              {!isCancelled && (b.status === "COMPLETED" ? null : (
                <div className="flex gap-2 pt-2">
                  {nextStatus && (
                    <button
                      onClick={() => statusMutation.mutate(nextStatus)}
                      disabled={statusMutation.isPending}
                      className="flex-1 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                    >
                      {statusMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                      Move to {TIMELINE_LABELS[nextStatus]}
                    </button>
                  )}
                  <button
                    onClick={() => statusMutation.mutate("CANCELLED")}
                    disabled={statusMutation.isPending}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-base-border text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-base-muted">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
