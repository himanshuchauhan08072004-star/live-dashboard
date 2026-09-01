import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { api } from "../lib/api";
import { EmptyState, ErrorState } from "../components/States";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications")).data,
  });

  const markAllRead = useMutation({
    mutationFn: async () => api.patch("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isError) return <ErrorState message="Couldn't load notifications." onRetry={() => refetch()} />;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => markAllRead.mutate()}
          disabled={!data?.unreadCount}
          className="text-xs font-medium text-accent hover:text-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-base-card border border-base-border rounded-xl shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-base-border/40 rounded animate-pulse" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
        ) : (
          <div className="divide-y divide-base-border">
            {data.data.map((n: any) => (
              <div key={n.id} className={`flex items-start gap-3 px-4 py-3.5 ${!n.read ? "bg-accent-soft/40" : ""}`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-accent" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{n.message}</p>
                  <span className="text-xs text-base-muted">{timeAgo(n.createdAt)}</span>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    className="text-base-muted hover:text-accent shrink-0"
                    title="Mark as read"
                  >
                    <Check size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
