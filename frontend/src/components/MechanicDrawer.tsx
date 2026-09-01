import { useQuery } from "@tanstack/react-query";
import { X, Star } from "lucide-react";
import { api } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function MechanicDrawer({ mechanicId, onClose }: { mechanicId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["mechanic", mechanicId],
    queryFn: async () => (await api.get(`/mechanics/${mechanicId}`)).data,
  });

  const m = data?.mechanic;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-base-card h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-base-border shrink-0">
          <h2 className="font-semibold text-sm">Mechanic profile</h2>
          <button onClick={onClose} className="text-base-muted hover:text-base-text">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading || !m ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-5 bg-base-border/50 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent-soft text-accent-dark flex items-center justify-center font-semibold">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{m.name}</div>
                  <div className="flex items-center gap-1 text-xs text-base-muted">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {m.rating.toFixed(1)} · {m.phone}
                  </div>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={m.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-base-bg rounded-lg p-3">
                  <div className="text-xs text-base-muted mb-1">Jobs completed</div>
                  <div className="text-lg font-semibold">{m.jobsCompleted}</div>
                </div>
                <div className="bg-base-bg rounded-lg p-3">
                  <div className="text-xs text-base-muted mb-1">Rating</div>
                  <div className="text-lg font-semibold">{m.rating.toFixed(1)}</div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-base-muted mb-2">Recent bookings</h3>
                {data.recentBookings.length === 0 ? (
                  <p className="text-sm text-base-muted">No bookings assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {data.recentBookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between text-sm border-b border-base-border pb-2 last:border-0">
                        <div>
                          <div className="font-mono text-xs text-base-muted">{b.code}</div>
                          <div>{b.customerName}</div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={b.status} />
                          <div className="text-xs text-base-muted mt-1">{formatDate(b.scheduledAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
