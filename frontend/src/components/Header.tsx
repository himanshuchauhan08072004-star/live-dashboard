import { useState } from "react";
import { Menu, Search, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useLive } from "../context/LiveContext";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const { connected } = useLive();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["notifications", "header"],
    queryFn: async () => (await api.get("/notifications")).data,
    refetchInterval: 15000,
  });

  function runSearch() {
    const term = search.trim();
    if (!term) return;
    navigate(`/bookings?search=${encodeURIComponent(term)}`);
  }

  return (
    <header className="h-16 border-b border-base-border bg-base-card flex items-center justify-between px-4 md:px-6 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button className="md:hidden text-base-muted" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <h1 className="text-[15px] font-semibold truncate">{title}</h1>
      </div>

      <div className="hidden sm:flex items-center flex-1 max-w-sm">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
            placeholder="Search bookings, customers... (Enter)"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-base-border bg-base-bg focus:bg-base-card focus:border-accent transition-colors outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-base-muted">
          <span
            className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-status-completed animate-pulse" : "bg-base-muted"}`}
          />
          {connected ? "Live" : "Offline"}
        </div>
        <ThemeToggle className="hidden sm:inline-flex" />
        <Link to="/notifications" className="relative text-base-muted hover:text-base-text">
          <Bell size={18} />
          {data?.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
              {data.unreadCount > 9 ? "9+" : data.unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
