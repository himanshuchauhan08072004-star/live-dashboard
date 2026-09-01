import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "../lib/api";

interface Toast {
  id: string;
  message: string;
}

interface LiveContextValue {
  connected: boolean;
  toasts: Toast[];
  dismissToast: (id: string) => void;
}

const LiveContext = createContext<LiveContextValue | null>(null);

export function LiveProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const queryClient = useQueryClient();

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("vsod_token");
    if (!token) return;

    const socket: Socket = io(API_BASE, { transports: ["websocket", "polling"] });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("booking.status_changed", () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["mechanics"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    });

    socket.on("notification.created", (payload: { id: string; message: string }) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      const toastId = payload.id || Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id: toastId, message: payload.message }]);
      setTimeout(() => dismissToast(toastId), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, dismissToast]);

  return (
    <LiveContext.Provider value={{ connected, toasts, dismissToast }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be used within LiveProvider");
  return ctx;
}
