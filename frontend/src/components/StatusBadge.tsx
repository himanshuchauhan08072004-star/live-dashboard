const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PENDING: { label: "Pending", dot: "bg-status-pending", bg: "bg-violet-50", text: "text-violet-700" },
  ASSIGNED: { label: "Assigned", dot: "bg-status-assigned", bg: "bg-blue-50", text: "text-blue-700" },
  ON_THE_WAY: { label: "On the way", dot: "bg-status-otw", bg: "bg-sky-50", text: "text-sky-700" },
  IN_PROGRESS: { label: "In progress", dot: "bg-status-progress", bg: "bg-orange-50", text: "text-orange-700" },
  COMPLETED: { label: "Completed", dot: "bg-status-completed", bg: "bg-green-50", text: "text-green-700" },
  CANCELLED: { label: "Cancelled", dot: "bg-status-cancelled", bg: "bg-red-50", text: "text-red-700" },
  AVAILABLE: { label: "Available", dot: "bg-status-completed", bg: "bg-green-50", text: "text-green-700" },
  BUSY: { label: "Busy", dot: "bg-status-progress", bg: "bg-orange-50", text: "text-orange-700" },
  OFFLINE: { label: "Offline", dot: "bg-base-muted", bg: "bg-gray-100", text: "text-gray-600" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
