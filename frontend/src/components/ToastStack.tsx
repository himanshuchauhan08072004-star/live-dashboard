import { CheckCircle2, X } from "lucide-react";
import { useLive } from "../context/LiveContext";

export function ToastStack() {
  const { toasts, dismissToast } = useLive();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-base-card border border-base-border shadow-card rounded-lg px-4 py-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2"
        >
          <CheckCircle2 size={16} className="text-status-completed mt-0.5 shrink-0" />
          <p className="text-sm flex-1">{t.message}</p>
          <button onClick={() => dismissToast(t.id)} className="text-base-muted hover:text-base-text shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
