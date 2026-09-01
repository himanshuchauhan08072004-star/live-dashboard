import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { api } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function CustomerDrawer({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => (await api.get(`/customers/${customerId}`)).data,
  });

  const c = data?.customer;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-base-card h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-base-border shrink-0">
          <h2 className="font-semibold text-sm">Customer profile</h2>
          <button onClick={onClose} className="text-base-muted hover:text-base-text">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading || !c ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-5 bg-base-border/50 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="font-semibold text-base">{c.name}</div>
                <div className="text-sm text-base-muted">{c.email}</div>
                <div className="text-sm text-base-muted">{c.phone}</div>
                <div className="text-sm text-base-muted mt-1">{c.address}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-base-bg rounded-lg p-3">
                  <div className="text-xs text-base-muted mb-1">Total bookings</div>
                  <div className="text-lg font-semibold">{data.summary.totalBookings}</div>
                </div>
                <div className="bg-base-bg rounded-lg p-3">
                  <div className="text-xs text-base-muted mb-1">Total spent</div>
                  <div className="text-lg font-semibold">{formatINR(data.summary.totalSpent)}</div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-base-muted mb-2">Vehicles</h3>
                <div className="space-y-1.5">
                  {data.vehicles.map((v: any) => (
                    <div key={v.id} className="text-sm flex justify-between border-b border-base-border pb-1.5 last:border-0">
                      <span>{v.make} {v.model}</span>
                      <span className="font-mono text-xs text-base-muted">{v.regNumber}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-base-muted mb-2">Booking history</h3>
                <div className="space-y-2">
                  {data.bookings.slice(0, 15).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between text-sm border-b border-base-border pb-2 last:border-0">
                      <div>
                        <div className="font-mono text-xs text-base-muted">{b.code}</div>
                        <div>{b.serviceName}</div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={b.status} />
                        <div className="text-xs text-base-muted mt-1">{formatDate(b.scheduledAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
